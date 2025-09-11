import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const group_id = searchParams.get('group_id')
    const user_id = searchParams.get('user_id')
    
    if (!group_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 403 }
      )
    }

    // Fetch messages with sender information
    const { data: messages, error } = await supabase
      .from('group_messages')
      .select(`
        *,
        user_profiles (
          id,
          first_name,
          last_name,
          username,
          avatar_url
        )
      `)
      .eq('group_id', group_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      messages: messages || []
    })

  } catch (error) {
    console.error('Error fetching group messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { group_id, user_id, message } = await request.json()
    
    if (!group_id || !user_id || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group_id)
      .eq('user_id', user_id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'User is not a member of this group' },
        { status: 403 }
      )
    }

    // Insert message into group_messages table
    const { data, error } = await supabase
      .from('group_messages')
      .insert({
        group_id,
        sender_id: user_id,
        message_content: message
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Create notifications for other group members
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', group_id)
      .neq('user_id', user_id)

    if (!membersError && members) {
      for (const member of members) {
        await supabase.rpc('create_notification', {
          user_id_param: member.user_id,
          type_param: 'group_message',
          title_param: 'New Group Message',
          message_param: `New message in your group: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          related_id_param: group_id
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: data 
    })

  } catch (error) {
    console.error('Error sending group message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
