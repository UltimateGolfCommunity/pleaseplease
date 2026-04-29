import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

function normalizeActivityDate(activity: any) {
  return new Date(activity?.created_at || activity?.updated_at || 0).getTime()
}

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function buildSyntheticTeeTimeActivity(teeTime: any) {
  return {
    id: `synthetic-tee-time-${teeTime.id}`,
    user_id: teeTime.creator_id,
    activity_type: 'tee_time_created',
    title: 'Posted a tee time',
    description: `Booked ${teeTime.course_name || 'a new round'} for ${teeTime.tee_time_date || 'an upcoming date'}`,
    related_id: teeTime.id,
    related_type: 'tee_time',
    metadata: {
      course_name: teeTime.course_name || 'Unnamed Course',
      location: teeTime.course_location || teeTime.location || '',
      tee_time_date: teeTime.tee_time_date || null,
      tee_time_time: teeTime.tee_time_time || null,
      visibility_scope: teeTime.visibility_scope || teeTime.visibility || 'public'
    },
    created_at: teeTime.created_at || teeTime.updated_at || new Date().toISOString(),
    updated_at: teeTime.updated_at || teeTime.created_at || new Date().toISOString(),
    like_count: 0,
    liked_by_user: false,
    comment_count: 0
  }
}

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

    const enrichActivityInteractions = async (activities: any[]) => {
      const activityIds = (activities || []).map((activity: any) => activity.id).filter(isUuid)

      if (!activityIds.length) {
        return activities || []
      }

      const [likesResult, commentsResult] = await Promise.all([
        supabase
          .from('activity_likes')
          .select('activity_id, user_id')
          .in('activity_id', activityIds),
        supabase
          .from('activity_comments')
          .select('activity_id, id')
          .in('activity_id', activityIds)
      ])

      const likeSummary = new Map<string, { count: number; liked: boolean }>()
      const commentCounts = new Map<string, number>()

      if (!likesResult.error) {
        ;(likesResult.data || []).forEach((like: any) => {
          const summary = likeSummary.get(like.activity_id) || { count: 0, liked: false }
          summary.count += 1
          summary.liked = summary.liked || like.user_id === user_id
          likeSummary.set(like.activity_id, summary)
        })
      }

      if (!commentsResult.error) {
        ;(commentsResult.data || []).forEach((comment: any) => {
          commentCounts.set(comment.activity_id, (commentCounts.get(comment.activity_id) || 0) + 1)
        })
      }

      return (activities || []).map((activity: any) => ({
        ...activity,
        like_count: likeSummary.get(activity.id)?.count || 0,
        liked_by_user: likeSummary.get(activity.id)?.liked || false,
        comment_count: commentCounts.get(activity.id) || 0
      }))
    }

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

      const feedUserIds = Array.from(new Set([user_id, ...connectionIds]))

      const { data: activities, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .in('user_id', feedUserIds)
        .in('activity_type', [
          'tee_time_created',
          'tee_time_updated',
          'round_logged',
          'photo_posted',
          'connection_added',
          'group_joined',
          'group_created',
          'group_board_post',
          'group_thread_reply'
        ])
        .order('created_at', { ascending: false })
        .limit(limit)

      if (activitiesError) {
        return NextResponse.json({ success: true, activities: [] })
      }

      const existingTeeTimeIds = new Set(
        (activities || [])
          .filter((activity: any) => activity.related_type === 'tee_time' && activity.related_id)
          .map((activity: any) => activity.related_id)
      )

      let syntheticTeeTimes: any[] = []

      const { data: teeTimes, error: teeTimesError } = await supabase
        .from('tee_times')
        .select('*')
        .in('creator_id', feedUserIds)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!teeTimesError) {
        syntheticTeeTimes = (teeTimes || [])
          .filter((teeTime: any) => teeTime?.id && !existingTeeTimeIds.has(teeTime.id))
          .map(buildSyntheticTeeTimeActivity)
      }

      const { data: actorProfiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, username, avatar_url')
        .in('id', feedUserIds)

      const actorMap = new Map((actorProfiles || []).map((profile: any) => [profile.id, profile]))

      const mergedActivities = [...(activities || []), ...syntheticTeeTimes]
        .sort((a: any, b: any) => normalizeActivityDate(b) - normalizeActivityDate(a))
        .slice(0, limit)

      return NextResponse.json({
        success: true,
        activities: await enrichActivityInteractions(mergedActivities.map((activity: any) => ({
          ...activity,
          actor: actorMap.get(activity.user_id) || null
        })))
      })
    }

    if (action === 'group_detail') {
      const groupId = searchParams.get('group_id')

      if (!groupId) {
        return NextResponse.json({ error: 'Group ID is required' }, { status: 400 })
      }

      const { data: activities, error: activitiesError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('related_type', 'group')
        .eq('related_id', groupId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (activitiesError) {
        return NextResponse.json({ success: true, activities: [] })
      }

      const actorIds = Array.from(new Set((activities || []).map((activity: any) => activity.user_id).filter(Boolean)))
      const { data: actorProfiles } = actorIds.length
        ? await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, username, avatar_url')
            .in('id', actorIds)
        : { data: [] }

      const actorMap = new Map((actorProfiles || []).map((profile: any) => [profile.id, profile]))

      return NextResponse.json({
        success: true,
        activities: await enrichActivityInteractions((activities || []).map((activity: any) => ({
          ...activity,
          actor: actorMap.get(activity.user_id) || null
        })))
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
          'group_details_updated',
          'group_member_role_updated',
          'group_board_post',
          'group_thread_reply',
          'tee_time_created'
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
        activities: await enrichActivityInteractions((activities || []).map((activity: any) => ({
          ...activity,
          actor: actorMap.get(activity.user_id) || null,
          group: groupMap.get(activity.related_id) || null
        })))
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
      activities: await enrichActivityInteractions(data || [])
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
    const action = body?.action || 'create'
    const { 
      user_id, 
      activity_type, 
      title, 
      description, 
      related_id, 
      related_type, 
      metadata,
      activity_id
    } = body

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

    if (action === 'update') {
      if (!activity_id || !user_id) {
        return NextResponse.json(
          { error: 'activity_id and user_id are required' },
          { status: 400 }
        )
      }

      const { data: existingActivity, error: existingError } = await supabase
        .from('user_activities')
        .select('*')
        .eq('id', activity_id)
        .eq('user_id', user_id)
        .single()

      if (existingError || !existingActivity) {
        return NextResponse.json(
          { error: 'Activity not found or not editable' },
          { status: 404 }
        )
      }

      const nextMetadata = {
        ...(existingActivity.metadata || {}),
        ...(metadata || {})
      }

      const { data, error } = await supabase
        .from('user_activities')
        .update({
          title: title || existingActivity.title,
          description: description ?? existingActivity.description ?? null,
          metadata: nextMetadata
        })
        .eq('id', activity_id)
        .eq('user_id', user_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating activity:', error)
        return NextResponse.json(
          { error: 'Failed to update activity' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        activity: data,
        message: 'Activity updated successfully'
      })
    }

    if (!user_id || !activity_type || !title) {
      return NextResponse.json(
        { error: 'user_id, activity_type, and title are required' },
        { status: 400 }
      )
    }

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
