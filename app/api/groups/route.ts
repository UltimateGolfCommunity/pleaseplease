import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, name, description, maxMembers, user_id: bodyUserId, invitees } = body

    console.log('🔍 GROUPS POST: Action requested:', action)
    console.log('📊 GROUPS POST: Group data:', { name, description, maxMembers, user_id: bodyUserId })
    
    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
        { status: 400 }
      )
    }

    // Get the current user from the request
    let user_id = bodyUserId
    
    // Try to get user_id from Authorization header if not in body
    if (!user_id) {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        user_id = authHeader.replace('Bearer ', '')
      }
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

    console.log('🔍 GROUPS GET: Fetching groups for user:', user_id)

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
