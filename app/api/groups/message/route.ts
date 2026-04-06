import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()

function isMissingColumnError(error: any, columnName: string) {
  const message = `${error?.message || ''} ${error?.details || ''}`.toLowerCase()
  return message.includes(columnName.toLowerCase()) && (
    message.includes('column') ||
    message.includes('schema cache') ||
    message.includes('could not find')
  )
}

function normalizeMessages(messages: any[]) {
  return (messages || []).map((message) => ({
    ...message,
    message_content: message.message_content ?? message.message ?? '',
    created_at: message.created_at ?? message.sent_at ?? new Date().toISOString(),
    user_profiles: message.user_profiles || message.sender || null,
    parent_message_id: message.parent_message_id ?? null,
    like_count: message.like_count ?? 0,
    liked_by_user: message.liked_by_user ?? false
  }))
}

function buildThread(messages: any[]) {
  const normalizedMessages = normalizeMessages(messages)
  const repliesByParent = new Map<string, any[]>()
  const topLevelMessages: any[] = []

  normalizedMessages.forEach((message) => {
    if (message.parent_message_id) {
      const replies = repliesByParent.get(message.parent_message_id) || []
      replies.push(message)
      repliesByParent.set(message.parent_message_id, replies)
    } else {
      topLevelMessages.push(message)
    }
  })

  return topLevelMessages.map((message) => ({
    ...message,
    replies: (repliesByParent.get(message.id) || []).sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }))
}

async function fetchGroupMessages(groupId: string, userId: string) {
  let messages: any[] | null = null
  let error: any = null

  const primaryResult = await supabase
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
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })

  messages = primaryResult.data
  error = primaryResult.error

  if (error) {
    const fallbackResult = await supabase
      .from('group_messages')
      .select(`
        *,
        user_profiles!group_messages_sender_id_fkey (
          id,
          first_name,
          last_name,
          username,
          avatar_url
        )
      `)
      .eq('group_id', groupId)
      .order('sent_at', { ascending: true })

    messages = fallbackResult.data
    error = fallbackResult.error
  }

  if (error) {
    throw error
  }

  let likes: any[] = []
  const likesResult = await supabase
    .from('group_message_likes')
    .select('group_message_id, user_id')
    .in('group_message_id', (messages || []).map((message: any) => message.id))

  if (!likesResult.error) {
    likes = likesResult.data || []
  } else if (!isMissingColumnError(likesResult.error, 'group_message_likes')) {
    console.error('Error fetching group message likes:', likesResult.error)
  }

  const likeSummary = likes.reduce((acc: Record<string, { count: number; likedByUser: boolean }>, like: any) => {
    if (!acc[like.group_message_id]) {
      acc[like.group_message_id] = { count: 0, likedByUser: false }
    }

    acc[like.group_message_id].count += 1
    if (like.user_id === userId) {
      acc[like.group_message_id].likedByUser = true
    }

    return acc
  }, {})

  const enrichedMessages = (messages || []).map((message: any) => ({
    ...message,
    like_count: likeSummary[message.id]?.count || 0,
    liked_by_user: likeSummary[message.id]?.likedByUser || false
  }))

  return buildThread(enrichedMessages)
}

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

    const messages = await fetchGroupMessages(group_id, user_id)

    return NextResponse.json({ 
      success: true, 
      messages
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
    const { action = 'post', group_id, user_id, message, parent_message_id, message_id } = await request.json()
    
    if (!group_id || !user_id) {
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

    if (action === 'like') {
      if (!message_id) {
        return NextResponse.json({ error: 'message_id is required' }, { status: 400 })
      }

      const { error } = await supabase
        .from('group_message_likes')
        .insert({
          group_message_id: message_id,
          user_id
        })

      if (error && !error.message?.includes('duplicate key value')) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to like message' }, { status: 500 })
      }

      const messages = await fetchGroupMessages(group_id, user_id)
      return NextResponse.json({ success: true, messages })
    }

    if (action === 'unlike') {
      if (!message_id) {
        return NextResponse.json({ error: 'message_id is required' }, { status: 400 })
      }

      const { error } = await supabase
        .from('group_message_likes')
        .delete()
        .eq('group_message_id', message_id)
        .eq('user_id', user_id)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to unlike message' }, { status: 500 })
      }

      const messages = await fetchGroupMessages(group_id, user_id)
      return NextResponse.json({ success: true, messages })
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    let data: any = null
    let error: any = null

    const primaryInsert = await supabase
      .from('group_messages')
      .insert({
        group_id,
        sender_id: user_id,
        message_content: message,
        parent_message_id: parent_message_id || null
      })
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
      .single()

    data = primaryInsert.data
    error = primaryInsert.error

    if (error) {
      const fallbackInsert = await supabase
        .from('group_messages')
        .insert({
          group_id,
          sender_id: user_id,
          message
        })
        .select(`
          *,
          user_profiles!group_messages_sender_id_fkey (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .single()

      data = fallbackInsert.data
      error = fallbackInsert.error
    }

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

    const messages = await fetchGroupMessages(group_id, user_id)

    return NextResponse.json({
      success: true, 
      message: normalizeMessages([data])[0],
      messages
    })

  } catch (error) {
    console.error('Error sending group message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
