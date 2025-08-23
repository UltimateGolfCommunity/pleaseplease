import { NextRequest, NextResponse } from 'next/server'

// Mock message data for development
const mockMessages = [
  {
    id: 'msg-1',
    sender: { id: 'user-1', first_name: 'John', last_name: 'Smith' },
    recipient: { id: 'user-2', first_name: 'Sarah', last_name: 'Johnson' },
    subject: 'Golf this weekend?',
    message_content: 'Hey Sarah! Are you free for a round this weekend?',
    timestamp: '2024-01-20T10:30:00Z',
    read: false,
    type: 'direct'
  },
  {
    id: 'msg-2',
    sender: { id: 'user-2', first_name: 'Sarah', last_name: 'Johnson' },
    recipient: { id: 'user-1', first_name: 'John', last_name: 'Smith' },
    subject: 'Re: Golf this weekend?',
    message_content: 'Absolutely! What time works for you?',
    timestamp: '2024-01-20T11:15:00Z',
    read: true,
    type: 'direct'
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const userId = searchParams.get('user_id')
  const conversationId = searchParams.get('conversation_id')

  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for messages API')
      
      if (action === 'inbox' && userId) {
        // Get user's inbox
        return NextResponse.json(mockMessages.filter(msg => msg.recipient.id === userId))
      }
      
      if (action === 'sent' && userId) {
        // Get user's sent messages
        return NextResponse.json(mockMessages.filter(msg => msg.sender.id === userId))
      }
      
      if (action === 'conversation' && conversationId) {
        // Get conversation messages
        return NextResponse.json(mockMessages.filter(msg => 
          msg.sender.id === conversationId || msg.recipient.id === conversationId
        ))
      }
      
      // Default: return all messages
      return NextResponse.json(mockMessages)
    }

    // Use real Supabase if configured
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    if (action === 'inbox' && userId) {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles(id, first_name, last_name),
          recipient:user_profiles(id, first_name, last_name)
        `)
        .eq('recipient_id', userId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    if (action === 'sent' && userId) {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles(id, first_name, last_name),
          recipient:user_profiles(id, first_name, last_name)
        `)
        .eq('sender_id', userId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    if (action === 'conversation' && conversationId) {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:user_profiles(id, first_name, last_name),
          recipient:user_profiles(id, first_name, last_name)
        `)
        .or(`sender_id.eq.${conversationId},recipient_id.eq.${conversationId}`)
        .order('timestamp', { ascending: true })

      if (error) throw error
      return NextResponse.json(data || [])
    }

    // Default: return all messages
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:user_profiles(id, first_name, last_name),
        recipient:user_profiles(id, first_name, last_name)
      `)
      .order('timestamp', { ascending: false })

    if (error) throw error
    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Error in messages API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for messages API POST')
      
      if (action === 'send') {
        // Mock message sending
        const newMessage = {
          id: 'msg-' + Date.now(),
          ...data,
          sender: { id: data.sender_id, first_name: 'You', last_name: '' },
          recipient: { id: data.recipient_id, first_name: 'Recipient', last_name: '' },
          timestamp: new Date().toISOString(),
          read: false,
          type: 'direct'
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Message sent successfully',
          message: newMessage
        })
      }
      
      if (action === 'mark_read') {
        // Mock marking as read
        return NextResponse.json({ 
          success: true, 
          message: 'Message marked as read'
        })
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Use real Supabase if configured
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    if (action === 'send') {
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          sender_id: data.sender_id,
          recipient_id: data.recipient_id,
          subject: data.subject,
          message_content: data.message_content,
          type: data.type || 'direct'
        })
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Message sent successfully', message: newMessage })
    }

    if (action === 'mark_read') {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', data.message_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Message marked as read' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in messages API POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to create Supabase client
function createClient(url: string, key: string) {
  // This would normally import and create a Supabase client
  // For now, return a mock object
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          order: (column: string, options: any) => Promise.resolve({ data: [], error: null })
        }),
        or: (filter: string) => ({
          order: (column: string, options: any) => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: (data: any) => Promise.resolve({ data: null, error: null }),
      update: (data: any) => Promise.resolve({ data: null, error: null })
    })
  }
}
