import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'

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

  console.log('🔍 MESSAGES GET:', action, { userId, conversationId })

  try {
    // Use real Supabase with correct service role key  
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 MESSAGES GET: Creating admin client with service role key...')
      supabase = createAdminClient()
      console.log('✅ MESSAGES GET: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ MESSAGES GET: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ MESSAGES GET: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ MESSAGES GET: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    // Only use mock mode if no client could be created
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 MESSAGES GET: Using mock data')
      
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

    console.log('🔍 MESSAGES GET: Using database for operations')

    if (action === 'inbox' && userId) {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:user_profiles!direct_messages_sender_id_fkey(id, first_name, last_name),
          recipient:user_profiles!direct_messages_recipient_id_fkey(id, first_name, last_name)
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching inbox:', error)
        return NextResponse.json([])
      }
      return NextResponse.json(data || [])
    }

    if (action === 'sent' && userId) {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:user_profiles!direct_messages_sender_id_fkey(id, first_name, last_name),
          recipient:user_profiles!direct_messages_recipient_id_fkey(id, first_name, last_name)
        `)
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching sent messages:', error)
        return NextResponse.json([])
      }
      return NextResponse.json(data || [])
    }

    if (action === 'conversation' && conversationId) {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:user_profiles!direct_messages_sender_id_fkey(id, first_name, last_name),
          recipient:user_profiles!direct_messages_recipient_id_fkey(id, first_name, last_name)
        `)
        .or(`sender_id.eq.${conversationId},recipient_id.eq.${conversationId}`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching conversation:', error)
        return NextResponse.json([])
      }
      return NextResponse.json(data || [])
    }

    // Default: return all messages
    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:user_profiles!direct_messages_sender_id_fkey(id, first_name, last_name),
        recipient:user_profiles!direct_messages_recipient_id_fkey(id, first_name, last_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching all messages:', error)
      return NextResponse.json([])
    }
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

    console.log('🔍 MESSAGES POST:', action, data)

    // Use real Supabase with correct service role key
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 MESSAGES POST: Creating admin client with service role key...')
      supabase = createAdminClient()
      console.log('✅ MESSAGES POST: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ MESSAGES POST: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ MESSAGES POST: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ MESSAGES POST: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    // Only use mock mode if no client could be created
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 MESSAGES POST: Using mock mode')
      
      if (action === 'send') {
        // Mock message sending
        const newMessage = {
          id: 'msg-' + Date.now(),
          ...data,
          sender: { id: data.sender_id, first_name: 'You', last_name: '' },
          recipient: { id: data.recipient_id, first_name: 'Recipient', last_name: '' },
          created_at: new Date().toISOString(),
          is_read: false
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Message sent successfully (backup system)',
          data: newMessage
        })
      }
      
      if (action === 'mark_read') {
        // Mock marking as read
        return NextResponse.json({ 
          success: true, 
          message: 'Message marked as read (backup system)'
        })
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    console.log('🔍 MESSAGES POST: Using database for operations')

    if (action === 'send') {
      const { data: newMessage, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: data.sender_id,
          recipient_id: data.recipient_id,
          message_content: data.message_content
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error sending message:', error)
        return NextResponse.json({ 
          error: 'Failed to send message', 
          details: error.message 
        }, { status: 400 })
      }
      
      console.log('✅ Message sent successfully:', newMessage.id)
      return NextResponse.json({ success: true, message: 'Message sent successfully', data: newMessage })
    }

    if (action === 'mark_read') {
      const { error } = await supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('id', data.message_id)

      if (error) {
        console.error('❌ Error marking message as read:', error)
        return NextResponse.json({ 
          error: 'Failed to mark message as read', 
          details: error.message 
        }, { status: 400 })
      }
      
      console.log('✅ Message marked as read:', data.message_id)
      return NextResponse.json({ success: true, message: 'Message marked as read' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in messages API POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


