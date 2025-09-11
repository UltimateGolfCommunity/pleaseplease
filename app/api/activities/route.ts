import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for activities API')
      return NextResponse.json({ 
        success: true, 
        activities: [
          {
            id: '1',
            activity_type: 'profile_updated',
            title: 'Updated Profile',
            description: 'Updated personal information',
            created_at: new Date().toISOString(),
            metadata: {}
          },
          {
            id: '2',
            activity_type: 'tee_time_created',
            title: 'Created Tee Time',
            description: 'Created a new tee time at Pebble Beach',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            metadata: { course_name: 'Pebble Beach' }
          }
        ]
      })
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // First check if the user_activities table exists
    const { error: tableCheckError } = await supabase
      .from('user_activities')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      console.log('⚠️ user_activities table does not exist or is not accessible:', tableCheckError.message)
      return NextResponse.json({ 
        success: true, 
        activities: [],
        message: 'Activity tracking feature not yet available'
      })
    }

    // Get recent activities for the user
    const { data, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      activities: data || []
    })

  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      user_id, 
      activity_type, 
      title, 
      description, 
      related_id, 
      related_type, 
      metadata 
    } = body

    if (!user_id || !activity_type || !title) {
      return NextResponse.json(
        { error: 'user_id, activity_type, and title are required' },
        { status: 400 }
      )
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for activities API')
      return NextResponse.json({ 
        success: true, 
        message: 'Mock response - Supabase not configured' 
      })
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient()

    // Create the activity
    const { data, error } = await supabase
      .from('user_activities')
      .insert({
        user_id,
        activity_type,
        title,
        description: description || null,
        related_id: related_id || null,
        related_type: related_type || null,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      activity: data,
      message: 'Activity logged successfully' 
    })

  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
