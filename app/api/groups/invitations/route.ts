import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const group_id = searchParams.get('group_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for group invitations API')
      return NextResponse.json({ 
        success: true, 
        invitations: [] 
      })
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // First check if the group_invitations table exists
    const { error: tableCheckError } = await supabase
      .from('group_invitations')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.log('⚠️ group_invitations table does not exist or is not accessible:', tableCheckError.message)
      return NextResponse.json({ 
        success: true, 
        invitations: [],
        message: 'Group invitations feature not yet available'
      })
    }

    // Get invitations based on whether group_id is provided
    let query = supabase
      .from('group_invitations')
      .select(`
        *,
        group:golf_groups(*),
        inviter:user_profiles!group_invitations_invited_by_fkey(*),
        user_profiles!group_invitations_invited_user_id_fkey(*)
      `)

    if (group_id) {
      // Get invitations sent for a specific group
      query = query.eq('group_id', group_id)
    } else {
      // Get pending invitations for the user
      query = query.eq('invited_user_id', user_id).eq('status', 'pending')
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error:', error)
      // If table doesn't exist, return empty array instead of error
      if (error.message.includes('relation "group_invitations" does not exist')) {
        console.log('⚠️ group_invitations table does not exist, returning empty array')
        return NextResponse.json({ 
          success: true, 
          invitations: [] 
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      invitations: data || [] 
    })

  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, invitation_id, user_id, group_id, invited_user_id, message } = body

    // Handle creating new invitations
    if (action === 'create') {
      if (!group_id || !invited_user_id || !user_id) {
        return NextResponse.json(
          { error: 'group_id, invited_user_id, and user_id are required' },
          { status: 400 }
        )
      }

      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.log('Using mock data for group invitations API')
        return NextResponse.json({ 
          success: true, 
          message: 'Mock response - Supabase not configured' 
        })
      }

      // Use admin client to bypass RLS
      const supabase = createAdminClient()

      // Verify user is the group creator or a member
      const { data: group, error: groupError } = await supabase
        .from('golf_groups')
        .select('creator_id')
        .eq('id', group_id)
        .single()

      if (groupError || !group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        )
      }

      // Check if user is group creator or member
      const { data: membership, error: membershipError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group_id)
        .eq('user_id', user_id)
        .single()

      if (group.creator_id !== user_id && (membershipError || !membership)) {
        return NextResponse.json(
          { error: 'You are not authorized to invite members to this group' },
          { status: 403 }
        )
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', group_id)
        .eq('user_id', invited_user_id)
        .single()

      if (!memberCheckError && existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of this group' },
          { status: 400 }
        )
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation, error: invitationCheckError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('group_id', group_id)
        .eq('invited_user_id', invited_user_id)
        .eq('status', 'pending')
        .single()

      if (!invitationCheckError && existingInvitation) {
        return NextResponse.json(
          { error: 'User already has a pending invitation to this group' },
          { status: 400 }
        )
      }

      // Create the invitation
      const { data: invitation, error: createError } = await supabase
        .from('group_invitations')
        .insert({
          group_id,
          invited_user_id,
          invited_by: user_id,
          message: message || null,
          status: 'pending'
        })
        .select(`
          *,
          group:golf_groups(*),
          inviter:user_profiles!group_invitations_invited_by_fkey(*)
        `)
        .single()

      if (createError) {
        console.error('Error creating invitation:', createError)
        return NextResponse.json(
          { error: 'Failed to create invitation' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        invitation,
        message: 'Invitation sent successfully' 
      })
    }

    // Handle accepting/declining invitations
    if (!action || !invitation_id || !user_id) {
      return NextResponse.json(
        { error: 'Action, invitation_id, and user_id are required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for group invitations API')
      return NextResponse.json({ 
        success: true, 
        message: 'Mock response - Supabase not configured' 
      })
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    if (action === 'accept') {
      // Accept the invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('id', invitation_id)
        .eq('invited_user_id', user_id)
        .single()

      if (fetchError || !invitation) {
        return NextResponse.json(
          { error: 'Invitation not found' },
          { status: 404 }
        )
      }

      // Update invitation status to accepted
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation_id)

      if (updateError) {
        console.error('Error updating invitation:', updateError)
        return NextResponse.json(
          { error: 'Failed to accept invitation' },
          { status: 500 }
        )
      }

      // Add user to group members
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invitation.group_id,
          user_id: user_id,
          role: 'member',
          status: 'active'
        })

      if (memberError) {
        console.error('Error adding user to group:', memberError)
        return NextResponse.json(
          { error: 'Failed to join group' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Invitation accepted successfully' 
      })

    } else if (action === 'decline') {
      // Decline the invitation
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation_id)
        .eq('invited_user_id', user_id)

      if (updateError) {
        console.error('Error updating invitation:', updateError)
        return NextResponse.json(
          { error: 'Failed to decline invitation' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Invitation declined successfully' 
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept" or "decline"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error handling invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
