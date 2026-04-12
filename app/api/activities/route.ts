import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')
    const limit = parseInt(searchParams.get('limit') || '10')
    const action = searchParams.get('action')

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

    if (action === 'feed') {
      const { data: connections, error: connectionsError } = await supabase
        .from('user_connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user_id},recipient_id.eq.${user_id}`)
        .eq('status', 'accepted')

      if (connectionsError) {
        return NextResponse.json({ success: true, activities: [] })
      }

      const connectionIds = Array.from(
        new Set(
          (connections || []).map((connection: any) =>
            connection.requester_id === user_id ? connection.recipient_id : connection.requester_id
          )
        )
      )

      if (connectionIds.length === 0) {
        return NextResponse.json({ success: true, activities: [] })
      }

      const { data: activities, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .in('user_id', connectionIds)
        .in('activity_type', ['tee_time_created', 'round_logged'])
        .order('created_at', { ascending: false })
        .limit(limit)

      if (activitiesError) {
        return NextResponse.json({ success: true, activities: [] })
      }

      const { data: actorProfiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, username, avatar_url')
        .in('id', connectionIds)

      const actorMap = new Map((actorProfiles || []).map((profile: any) => [profile.id, profile]))

      return NextResponse.json({
        success: true,
        activities: (activities || []).map((activity: any) => ({
          ...activity,
          actor: actorMap.get(activity.user_id) || null
        }))
      })
    }

    if (action === 'groups') {
      const { data: memberships, error: membershipsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user_id)
        .eq('status', 'active')

      if (membershipsError) {
        return NextResponse.json({ success: true, activities: [] })
      }

      const groupIds = Array.from(new Set((memberships || []).map((membership: any) => membership.group_id).filter(Boolean)))

      if (!groupIds.length) {
        return NextResponse.json({ success: true, activities: [] })
      }

      const { data: activities, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('related_type', 'group')
        .in('related_id', groupIds)
        .in('activity_type', [
          'group_created',
          'group_joined',
          'group_logo_updated',
          'group_cover_updated',
          'group_details_updated'
        ])
        .order('created_at', { ascending: false })
        .limit(limit)

      if (activitiesError) {
        return NextResponse.json({ success: true, activities: [] })
      }

      const actorIds = Array.from(
        new Set((activities || []).map((activity: any) => activity.user_id).filter(Boolean))
      )

      const { data: actorProfiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, username, avatar_url')
        .in('id', actorIds)

      const { data: groups } = await supabase
        .from('golf_groups')
        .select('id, name, location, logo_url, image_url')
        .in('id', groupIds)

      const actorMap = new Map((actorProfiles || []).map((profile: any) => [profile.id, profile]))
      const groupMap = new Map((groups || []).map((group: any) => [group.id, group]))

      return NextResponse.json({
        success: true,
        activities: (activities || []).map((activity: any) => ({
          ...activity,
          actor: actorMap.get(activity.user_id) || null,
          group: groupMap.get(activity.related_id) || null
        }))
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
