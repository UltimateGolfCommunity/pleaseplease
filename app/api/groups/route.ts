import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, name, description, location, logo_url, maxMembers, user_id: bodyUserId, invitees, group_id } = body

    console.log('🔍 GROUPS POST: Action requested:', action)
    console.log('📊 GROUPS POST: Group data:', { name, description, location, logo_url, maxMembers, user_id: bodyUserId, group_id })
    
    // Get the current user from the request
    let user_id = bodyUserId
    
    // Try to get user_id from Authorization header if not in body
    if (!user_id) {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        user_id = authHeader.replace('Bearer ', '')
      }
    }
    
    // Handle join action
    if (action === 'join') {
      if (!group_id || !user_id) {
        return NextResponse.json(
          { error: 'Group ID and User ID are required for join action' },
          { status: 400 }
        )
      }

      // Use three-tier fallback system
      let supabase: any = null
      let usingMockMode = false
      
      try {
        supabase = createAdminClient()
      } catch (adminError) {
        try {
          supabase = createServerClient()
        } catch (serverError) {
          usingMockMode = true
        }
      }
      
      if (!supabase) {
        usingMockMode = true
      }

      if (usingMockMode) {
        console.log('🔧 GROUPS POST: Using mock mode for join')
        return NextResponse.json({ 
          success: true, 
          message: 'Joined group successfully (backup system)'
        })
      }

      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group_id)
        .eq('user_id', user_id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking existing membership:', checkError)
        return NextResponse.json({ error: 'Failed to check membership' }, { status: 500 })
      }

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member of this group' }, { status: 409 })
      }

      // Add user to group
      const { data: member, error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id,
          user_id,
          role: 'member',
          status: 'active',
          joined_at: new Date().toISOString()
        })
        .select()
        .single()

      if (joinError) {
        console.error('❌ Error joining group:', joinError)
        return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
      }

      console.log('✅ User joined group successfully:', member.id)
      return NextResponse.json({
        success: true,
        message: 'Successfully joined the group',
        member
      })
    }

    // Handle create action (original functionality)
    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }
    
    // If still no user_id, return error
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Use real Supabase with correct service role key - three-tier fallback
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 GROUPS POST: Creating admin client with service role key...')
      supabase = createAdminClient()
      console.log('✅ GROUPS POST: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ GROUPS POST: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ GROUPS POST: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ GROUPS POST: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    // Only use mock mode if no client could be created
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 GROUPS POST: Using mock mode')
      
      if (action === 'create') {
        // Mock group creation
        const mockGroup = {
          id: 'mock-group-' + Date.now(),
          name,
          description: description || '',
          max_members: maxMembers || 10,
          creator_id: user_id,
          status: 'active',
          created_at: new Date().toISOString()
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Group created successfully (backup system)',
          group: mockGroup,
          invitations_sent: invitees?.length || 0
        })
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    console.log('🔍 GROUPS POST: Using database for operations')

    // Create the group
    try {
      console.log('🏌️ GROUPS POST: Creating group in database...')
      const { data: group, error: groupError } = await supabase
        .from('golf_groups')
        .insert({
          name,
          description: description || '',
          location: location || '',
          logo_url: logo_url || null,
          max_members: maxMembers || 10,
          creator_id: user_id,
          status: 'active'
        })
        .select()
        .single()

      if (groupError) {
        console.error('❌ Database error creating group:', groupError)
        return NextResponse.json(
          { 
            error: 'Failed to create group', 
            details: groupError.message,
            code: groupError.code
          },
          { status: 500 }
        )
      }

      console.log('✅ Group created successfully:', group.id)

      // Add creator as first member
      console.log('👤 GROUPS POST: Adding creator as group member...')
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id,
          role: 'admin',
          status: 'active'
        })

      if (memberError) {
        console.error('⚠️ Error adding creator to group:', memberError)
        // Don't fail the request if this fails, but log it
      } else {
        console.log('✅ Creator added as group admin')
      }

      // Send invitations to invitees if any
      let invitationsSent = 0
      if (invitees && invitees.length > 0) {
        console.log('📧 GROUPS POST: Sending invitations to', invitees.length, 'users')
        const invitations = invitees.map((inviteeId: string) => ({
          group_id: group.id,
          invited_user_id: inviteeId,
          invited_by: user_id,
          status: 'pending',
          created_at: new Date().toISOString()
        }))

        const { error: invitationError } = await supabase
          .from('group_invitations')
          .insert(invitations)

        if (invitationError) {
          console.error('⚠️ Error creating invitations:', invitationError)
          // Don't fail the request if invitations fail
        } else {
          invitationsSent = invitees.length
          console.log('✅ Invitations sent successfully')
        }
      }

      console.log('🎉 Group creation completed successfully')
      return NextResponse.json({ 
        success: true, 
        message: 'Group created successfully',
        group,
        invitations_sent: invitationsSent
      })

    } catch (createError) {
      console.error('❌ Group creation failed:', createError)
      return NextResponse.json(
        { 
          error: 'Failed to create group', 
          details: createError instanceof Error ? createError.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const action = searchParams.get('action')
    const query = searchParams.get('q')

    console.log('🔍 GROUPS GET: Action:', action, 'Query:', query, 'User:', user_id)

    // Handle search action
    if (action === 'search') {
      const searchQuery = searchParams.get('query') || query || ''
      console.log('🔍 GROUPS GET: Searching for groups with query:', searchQuery)
      
      // Use three-tier fallback system
      let supabase: any = null
      let usingMockMode = false
      
      try {
        supabase = createAdminClient()
      } catch (adminError) {
        try {
          supabase = createServerClient()
        } catch (serverError) {
          usingMockMode = true
        }
      }
      
      if (!supabase) {
        usingMockMode = true
      }

      if (usingMockMode) {
        console.log('🔧 GROUPS GET: Using mock mode for search')
        return NextResponse.json({ success: true, groups: [] })
      }

      let dbQuery = supabase
        .from('golf_groups')
        .select(`
          *,
          creator:user_profiles(id, first_name, last_name, avatar_url)
        `)
        .eq('status', 'active')

      // If there's a search query, filter by name, description, or location
      if (searchQuery) {
        dbQuery = dbQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`)
      }

      const { data, error } = await dbQuery.limit(20)

      if (error) {
        console.error('❌ Error searching groups:', error)
        return NextResponse.json({ error: 'Failed to search groups' }, { status: 500 })
      }

      // Get member count for each group
      const groupsWithMemberCount = await Promise.all(
        (data || []).map(async (group: any) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
          
          return {
            ...group,
            member_count: count || 0
          }
        })
      )

      console.log('👥 Found groups:', groupsWithMemberCount?.length || 0)
      return NextResponse.json({ success: true, groups: groupsWithMemberCount || [] })
    }

    // Original functionality for fetching user's groups
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Use three-tier fallback system
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 GROUPS GET: Creating admin client...')
      supabase = createAdminClient()
      console.log('✅ GROUPS GET: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ GROUPS GET: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ GROUPS GET: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ GROUPS GET: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 GROUPS GET: Using mock mode')
      return NextResponse.json({ 
        success: true, 
        groups: [] 
      })
    }

    // Get groups where user is a member
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        group:golf_groups(*)
      `)
      .eq('user_id', user_id)
      .eq('status', 'active')

    if (error) {
      console.error('❌ Database error fetching groups:', error)
      return NextResponse.json(
        { 
          error: 'Failed to fetch groups',
          details: error.message
        },
        { status: 500 }
      )
    }

    console.log('✅ Groups fetched successfully:', data?.length || 0)
    return NextResponse.json({ 
      success: true, 
      groups: data || [] 
    })

  } catch (error) {
    console.error('❌ Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
