import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

const connectionProfileFields = 'id, first_name, last_name, username, avatar_url, location, handicap, bio'

const connectionSelect = `
  *,
  requester:user_profiles!user_connections_requester_id_fkey(${connectionProfileFields}),
  recipient:user_profiles!user_connections_recipient_id_fkey(${connectionProfileFields})
`

async function logUserActivity(
  supabase: any,
  {
    userId,
    activityType,
    title,
    description,
    relatedId,
    metadata
  }: {
    userId?: string | null
    activityType: string
    title: string
    description?: string | null
    relatedId?: string | null
    metadata?: Record<string, unknown>
  }
) {
  if (!userId) return

  try {
    await supabase.from('user_activities').insert({
      user_id: userId,
      activity_type: activityType,
      title,
      description: description || null,
      related_id: relatedId || null,
      related_type: 'user',
      metadata: metadata || {}
    })
  } catch (error) {
    console.warn('⚠️ Unable to log user activity:', error)
  }
}

async function getRatingSummary(supabase: any, ratedUserId: string, viewerId?: string | null) {
  const { data: ratings, error } = await supabase
    .from('user_ratings')
    .select('stars, rater_user_id')
    .eq('rated_user_id', ratedUserId)

  if (error) {
    console.error('❌ Ratings fetch error:', error)
    return {
      average: null,
      count: 0,
      viewerRating: null
    }
  }

  const count = ratings?.length || 0
  const total = (ratings || []).reduce((sum: number, rating: any) => sum + (rating.stars || 0), 0)
  const average = count ? Number((total / count).toFixed(1)) : null
  const viewerRating =
    viewerId && ratings
      ? (ratings.find((rating: any) => rating.rater_user_id === viewerId)?.stars ?? null)
      : null

  return {
    average,
    count,
    viewerRating
  }
}

async function getFounderVerifiedIds(supabase: any) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    console.warn('⚠️ Unable to determine first 50 users:', error.message)
    return new Set<string>()
  }

  return new Set((data || []).map((profile: any) => profile.id))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const searchQuery = searchParams.get('q')
  const userId = searchParams.get('id')
  const action = searchParams.get('action')

  console.log('🔍 Users API called with:', { search, searchQuery, userId, action })

  try {
    const supabase = createAdminClient()
    
    // Handle connections fetch
    if (action === 'connections' && userId) {
      console.log('🔗 Fetching connections for user:', userId)
      
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select(connectionSelect)
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (error) {
        console.error('❌ Connections fetch error:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch connections', 
          details: error.message 
        }, { status: 500 })
      }

      console.log('✅ Found connections:', connections?.length || 0)
      return NextResponse.json({
        success: true,
        connections: connections || []
      })
    }

    if (action === 'requests' && userId) {
      console.log('🔗 Fetching pending requests for user:', userId)

      const { data: requests, error } = await supabase
        .from('user_connections')
        .select(connectionSelect)
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Requests fetch error:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch connection requests',
          details: error.message
        }, { status: 500 })
      }

      const incoming = (requests || []).filter((connection: any) => connection.recipient_id === userId)
      const outgoing = (requests || []).filter((connection: any) => connection.requester_id === userId)

      return NextResponse.json({
        success: true,
        incoming,
        outgoing
      })
    }

    if (action === 'status' && userId) {
      const viewerId = searchParams.get('viewer_id')

      if (!viewerId) {
        return NextResponse.json({ success: true, status: 'none' })
      }

      const { data: connection, error } = await supabase
        .from('user_connections')
        .select('*')
        .or(`and(requester_id.eq.${viewerId},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${viewerId})`)
        .maybeSingle()

      if (error) {
        console.error('❌ Status fetch error:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch connection status',
          details: error.message
        }, { status: 500 })
      }

      let status = 'none'

      if (connection?.status === 'accepted') {
        status = 'connected'
      } else if (connection?.status === 'pending') {
        status = connection.recipient_id === viewerId ? 'incoming_pending' : 'pending'
      }

      return NextResponse.json({
        success: true,
        status,
        connection: connection || null
      })
    }

    if (action === 'rating' && userId) {
      const viewerId = searchParams.get('viewer_id')
      const summary = await getRatingSummary(supabase, userId, viewerId)

      return NextResponse.json({
        success: true,
        ...summary
      })
    }
    
    // Handle user search (both 'search' and 'q' parameters)
    if (search || searchQuery) {
      const query = search || searchQuery
      console.log('🔍 Searching for users with query:', query)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, username, avatar_url, location, handicap, bio, total_points, connections_count, tee_times_count')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(20)

      if (error) {
        console.error('❌ Search error:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Search failed', 
          details: error.message 
        }, { status: 500 })
      }

      const founderVerifiedIds = await getFounderVerifiedIds(supabase)

      console.log('👥 Found users:', data?.length || 0)
      return NextResponse.json({
        success: true,
        users: (data || []).map((profile: any) => ({
          ...profile,
          is_founder_verified: founderVerifiedIds.has(profile.id)
        }))
      })
    }

    // Handle profile fetch
    if (userId) {
      console.log('🔍 Fetching profile for user:', userId)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Profile fetch error:', error)
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }

      const founderVerifiedIds = await getFounderVerifiedIds(supabase)

      return NextResponse.json({
        ...data,
        is_founder_verified: founderVerifiedIds.has(data.id)
      })
    }

    // Default: return all users (for testing)
    console.log('🔍 Returning all users from database')
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, username, avatar_url, location, handicap, bio, total_points, connections_count, tee_times_count')
      .limit(50)

    if (error) {
      console.error('❌ Error fetching users:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch users', 
        details: error.message 
      }, { status: 500 })
    }

    const founderVerifiedIds = await getFounderVerifiedIds(supabase)

    return NextResponse.json({
      success: true,
      users: (data || []).map((profile: any) => ({
        ...profile,
        is_founder_verified: founderVerifiedIds.has(profile.id)
      }))
    })

  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    console.log('🔍 USERS POST: Action requested:', action)

    try {
      const supabase = createAdminClient()

      if (action === 'search') {
        const { query } = data
        console.log('🔍 USERS POST: Database search for:', query)
        
        if (!query) {
          return NextResponse.json({ success: true, users: [] })
        }
        
        const { data: searchResults, error } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, username, avatar_url, location, handicap')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(20)

        if (error) {
          console.error('❌ Database search error:', error)
          return NextResponse.json({ 
            success: false,
            error: 'Search failed',
            details: error.message
          }, { status: 500 })
        }

        console.log('✅ USERS POST: Database search results:', searchResults?.length || 0)
        return NextResponse.json({ success: true, users: searchResults || [] })
      }

      if (action === 'connect') {
        console.log('🔗 USERS POST: Creating connection between:', data.user_id, 'and', data.connected_user_id)
        
        // First check if connection already exists
        const { data: existingConnection, error: checkError } = await supabase
          .from('user_connections')
          .select('*')
          .or(`and(requester_id.eq.${data.user_id},recipient_id.eq.${data.connected_user_id}),and(requester_id.eq.${data.connected_user_id},recipient_id.eq.${data.user_id})`)
          .maybeSingle()

        if (checkError) {
          console.error('❌ Error checking existing connection:', checkError)
          return NextResponse.json({ 
            error: 'Failed to check existing connection', 
            details: checkError.message 
          }, { status: 400 })
        }

        if (existingConnection) {
          console.log('⚠️ Connection already exists:', existingConnection)

          if (
            existingConnection.status === 'pending' &&
            existingConnection.requester_id === data.connected_user_id &&
            existingConnection.recipient_id === data.user_id
          ) {
            const { data: acceptedConnection, error: acceptError } = await supabase
              .from('user_connections')
              .update({ status: 'accepted' })
              .eq('id', existingConnection.id)
              .select()
              .single()

            if (acceptError) {
              return NextResponse.json({
                error: 'Failed to accept existing connection request',
                details: acceptError.message
              }, { status: 400 })
            }

            await Promise.all([
              logUserActivity(supabase, {
                userId: data.user_id,
                activityType: 'connection_added',
                title: 'Added a new connection',
                description: 'Accepted a golfer connection',
                relatedId: data.connected_user_id,
                metadata: {
                  connection_id: acceptedConnection.id,
                  connected_user_id: data.connected_user_id
                }
              }),
              logUserActivity(supabase, {
                userId: data.connected_user_id,
                activityType: 'connection_added',
                title: 'Added a new connection',
                description: 'Connected with another golfer',
                relatedId: data.user_id,
                metadata: {
                  connection_id: acceptedConnection.id,
                  connected_user_id: data.user_id
                }
              })
            ])

            return NextResponse.json({
              success: true,
              autoAccepted: true,
              message: 'Connection accepted successfully',
              connection: acceptedConnection
            })
          }

          return NextResponse.json({ 
            error: 'Connection already exists', 
            details: `Connection status: ${existingConnection.status}` 
          }, { status: 409 })
        }

        // Create new connection
        const { data: newConnection, error } = await supabase
          .from('user_connections')
          .insert({
            requester_id: data.user_id,
            recipient_id: data.connected_user_id,
            status: 'pending'
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Error creating connection:', error)
          return NextResponse.json({ 
            error: 'Failed to create connection', 
            details: error.message 
          }, { status: 400 })
        }

        console.log('✅ Connection created successfully:', newConnection.id)
        return NextResponse.json({ 
          success: true, 
          message: 'Connection request sent successfully',
          connection: newConnection
        })
      }

      if (action === 'respond_connection') {
        const { connection_id, user_id, response } = data

        if (!connection_id || !user_id || !response) {
          return NextResponse.json({
            error: 'connection_id, user_id, and response are required'
          }, { status: 400 })
        }

        const nextStatus = response === 'accept' ? 'accepted' : 'declined'

        const { data: connection, error: fetchError } = await supabase
          .from('user_connections')
          .select('*')
          .eq('id', connection_id)
          .eq('recipient_id', user_id)
          .maybeSingle()

        if (fetchError || !connection) {
          return NextResponse.json({
            error: 'Connection request not found'
          }, { status: 404 })
        }

        const { data: updatedConnection, error: updateError } = await supabase
          .from('user_connections')
          .update({ status: nextStatus })
          .eq('id', connection_id)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({
            error: 'Failed to update connection request',
            details: updateError.message
          }, { status: 400 })
        }

        if (response === 'accept') {
          await Promise.all([
            logUserActivity(supabase, {
              userId: user_id,
              activityType: 'connection_added',
              title: 'Added a new connection',
              description: 'Accepted a golfer connection',
              relatedId: connection.requester_id,
              metadata: {
                connection_id,
                connected_user_id: connection.requester_id
              }
            }),
            logUserActivity(supabase, {
              userId: connection.requester_id,
              activityType: 'connection_added',
              title: 'Added a new connection',
              description: 'Connected with another golfer',
              relatedId: user_id,
              metadata: {
                connection_id,
                connected_user_id: user_id
              }
            })
          ])
        }

        return NextResponse.json({
          success: true,
          message: response === 'accept' ? 'Connection accepted successfully' : 'Connection declined',
          connection: updatedConnection
        })
      }

      if (action === 'update_profile') {
        const { error } = await supabase
          .from('user_profiles')
          .update(data)
          .eq('id', data.id)

        if (error) throw error
        return NextResponse.json({ success: true, message: 'Profile updated successfully' })
      }

      if (action === 'rate') {
        const { rated_user_id, rater_user_id, stars } = data

        if (!rated_user_id || !rater_user_id || !stars) {
          return NextResponse.json({
            error: 'rated_user_id, rater_user_id, and stars are required'
          }, { status: 400 })
        }

        if (rated_user_id === rater_user_id) {
          return NextResponse.json({
            error: 'You cannot rate your own golfer profile'
          }, { status: 400 })
        }

        const normalizedStars = Number(stars)

        if (!Number.isFinite(normalizedStars) || normalizedStars < 1 || normalizedStars > 5) {
          return NextResponse.json({
            error: 'Stars must be between 1 and 5'
          }, { status: 400 })
        }

        const { error: upsertError } = await supabase
          .from('user_ratings')
          .upsert(
            {
              rated_user_id,
              rater_user_id,
              stars: normalizedStars,
              updated_at: new Date().toISOString()
            },
            {
              onConflict: 'rated_user_id,rater_user_id'
            }
          )

        if (upsertError) {
          return NextResponse.json({
            error: 'Failed to save golfer rating',
            details: upsertError.message
          }, { status: 500 })
        }

        const summary = await getRatingSummary(supabase, rated_user_id, rater_user_id)

        return NextResponse.json({
          success: true,
          message: 'Rating saved successfully',
          ...summary
        })
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (operationError) {
      console.error('❌ Operation failed:', operationError)
      return NextResponse.json({ 
        error: 'Operation failed', 
        details: operationError instanceof Error ? operationError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in users API POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
