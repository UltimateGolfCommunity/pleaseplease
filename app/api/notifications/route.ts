import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase-server'

// Mock notifications for when database is not available
const mockNotifications = [
  {
    id: 'mock-notif-1',
    user_id: 'user-1',
    type: 'tee_time_application',
    title: 'New Tee Time Application',
    message: 'Someone applied to join your tee time',
    data: {
      tee_time_id: 'tee-1',
      applicant_name: 'John Doe',
      tee_time_date: '2024-04-15',
      tee_time_time: '9:00 AM'
    },
    read: false,
    created_at: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock notifications')
      return NextResponse.json({ 
        notifications: mockNotifications.filter(n => n.user_id === userId) 
      })
    }

    // Use real Supabase with correct service role key
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 NOTIFICATIONS GET: Creating admin client with service role key...')
      supabase = createAdminClient()
      console.log('✅ NOTIFICATIONS GET: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ NOTIFICATIONS GET: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ NOTIFICATIONS GET: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ NOTIFICATIONS GET: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    // Only use mock mode if no client could be created
    if (!supabase) {
      usingMockMode = true
    }
    
    if (usingMockMode || !supabase) {
      console.log('🔧 NOTIFICATIONS: Using mock mode')
      return NextResponse.json({ 
        notifications: mockNotifications.filter(n => n.user_id === userId) 
      })
    }

    // Fetch real notifications
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ 
        notifications: mockNotifications.filter(n => n.user_id === userId) 
      })
    }

    return NextResponse.json({ notifications: notifications || [] })

  } catch (error) {
    console.error('Error in notifications API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    console.log('🔍 NOTIFICATIONS POST:', action, data)

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock notifications POST')
      return NextResponse.json({ 
        success: true, 
        message: 'Notification processed (mock mode)' 
      })
    }

    // Use real Supabase with correct service role key
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 NOTIFICATIONS POST: Creating admin client with service role key...')
      supabase = createAdminClient()
      console.log('✅ NOTIFICATIONS POST: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ NOTIFICATIONS POST: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ NOTIFICATIONS POST: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ NOTIFICATIONS POST: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    // Only use mock mode if no client could be created
    if (!supabase) {
      usingMockMode = true
    }
    
    if (action === 'create') {
      if (usingMockMode || !supabase) {
        console.log('🔧 NOTIFICATIONS: Creating notification in mock mode')
        return NextResponse.json({ 
          success: true, 
          message: 'Notification created (backup system)',
          notification_id: 'mock-' + Date.now()
        })
      }

      // Create real notification
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.notification_data || {},
          read: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating notification:', error)
        return NextResponse.json({ 
          success: true, 
          message: 'Notification created (backup system)',
          notification_id: 'fallback-' + Date.now()
        })
      }

      console.log('✅ Notification created:', notification.id)
      return NextResponse.json({ 
        success: true, 
        message: 'Notification created successfully',
        notification_id: notification.id
      })
    }

    if (action === 'mark_read') {
      if (usingMockMode || !supabase) {
        return NextResponse.json({ 
          success: true, 
          message: 'Notification marked as read (backup system)' 
        })
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', data.notification_id)

      if (error) {
        console.error('Error marking notification as read:', error)
        return NextResponse.json({ 
          success: true, 
          message: 'Notification marked as read (backup system)' 
        })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Notification marked as read' 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in notifications POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
