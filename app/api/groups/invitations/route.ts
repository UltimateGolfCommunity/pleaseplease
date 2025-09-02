import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

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

    // Get pending invitations for the user
    const { data, error } = await supabase
      .from('group_invitations')
      .select(`
        *,
        group:golf_groups(*),
        inviter:user_profiles!group_invitations_invited_by_fkey(*)
      `)
      .eq('invited_user_id', user_id)
      .eq('status', 'pending')

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
    const { action, invitation_id, user_id } = body

    if (!action || !invitation_id || !user_id) {
      return NextResponse.json(
        { error: 'Action, invitation_id, and user_id are required' },
        { status: 400 }
      )
    }

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
