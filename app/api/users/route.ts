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

async function getUserReviews(supabase: any, ratedUserId: string, viewerId?: string | null) {
  const { data, error } = await supabase
    .from('user_ratings')
    .select(
      `
        id,
        stars,
        review_text,
        created_at,
        updated_at,
        rater_user_id,
        user_profiles:rater_user_id (
          id,
          first_name,
          last_name,
          username,
          avatar_url
        )
      `
    )
    .eq('rated_user_id', ratedUserId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('❌ User reviews fetch error:', error)
    return {
      reviews: [],
      viewerReview: null
    }
  }

  const reviews = (data || []).map((review: any) => ({
    id: review.id,
    stars: review.stars,
    review_text: review.review_text || '',
    created_at: review.created_at,
    updated_at: review.updated_at,
    rater_user_id: review.rater_user_id,
    user_profiles: review.user_profiles
  }))

  return {
    reviews,
    viewerReview: viewerId ? reviews.find((review: any) => review.rater_user_id === viewerId) || null : null
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

function normalizeLocationParts(location?: string | null) {
  const raw = (location || '').trim()
  if (!raw) return []

  return Array.from(
    new Set(
      raw
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .flatMap((part) => [part, ...part.split(/\s+/).filter(Boolean)])
        .map((part) => part.toLowerCase())
        .filter((part) => part.length >= 3)
    )
  ).slice(0, 6)
}

async function getRecommendedConnections(supabase: any, userId: string) {
  const { data: existingEdges, error: existingEdgesError } = await supabase
    .from('user_connections')
    .select('requester_id, recipient_id, status')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)

  if (existingEdgesError) {
    console.error('❌ Recommended connections base fetch error:', existingEdgesError)
    return []
  }

  const excludedIds = new Set<string>([userId])
  const acceptedConnectionIds = new Set<string>()

  for (const edge of existingEdges || []) {
    const counterpart = edge.requester_id === userId ? edge.recipient_id : edge.requester_id
    if (!counterpart) continue
    excludedIds.add(counterpart)
    if (edge.status === 'accepted') {
      acceptedConnectionIds.add(counterpart)
    }
  }

  if (!acceptedConnectionIds.size) {
    return []
  }

  const acceptedIds = Array.from(acceptedConnectionIds)
  const orFilters = acceptedIds.flatMap((id) => [`requester_id.eq.${id}`, `recipient_id.eq.${id}`]).join(',')

  const { data: mutualEdges, error: mutualEdgesError } = await supabase
    .from('user_connections')
    .select('requester_id, recipient_id, status')
    .eq('status', 'accepted')
    .or(orFilters)

  if (mutualEdgesError) {
    console.error('❌ Recommended connections mutual fetch error:', mutualEdgesError)
    return []
  }

  const mutualMap = new Map<string, Set<string>>()

  for (const edge of mutualEdges || []) {
    const left = edge.requester_id
    const right = edge.recipient_id
    if (!left || !right) continue

    if (acceptedConnectionIds.has(left) && !excludedIds.has(right)) {
      const set = mutualMap.get(right) || new Set<string>()
      set.add(left)
      mutualMap.set(right, set)
    }

    if (acceptedConnectionIds.has(right) && !excludedIds.has(left)) {
      const set = mutualMap.get(left) || new Set<string>()
      set.add(right)
      mutualMap.set(left, set)
    }
  }

  const candidateIds = Array.from(mutualMap.keys())
  const founderVerifiedIds = await getFounderVerifiedIds(supabase)
  const baseProfileSelect =
    'id, first_name, last_name, username, avatar_url, location, handicap, bio, total_points, connections_count, tee_times_count'

  if (candidateIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select(baseProfileSelect)
      .in('id', candidateIds)
      .limit(12)

    if (profilesError) {
      console.error('❌ Recommended connections profile fetch error:', profilesError)
      return []
    }

    return (profiles || [])
      .map((profile: any) => {
        const mutualIds = Array.from(mutualMap.get(profile.id) || [])
        return {
          ...profile,
          mutual_connection_count: mutualIds.length,
          mutual_connection_ids: mutualIds,
          is_founder_verified: founderVerifiedIds.has(profile.id)
        }
      })
      .sort((left: any, right: any) => {
        if ((right.mutual_connection_count || 0) !== (left.mutual_connection_count || 0)) {
          return (right.mutual_connection_count || 0) - (left.mutual_connection_count || 0)
        }

        return (right.connections_count || 0) - (left.connections_count || 0)
      })
      .slice(0, 8)
  }

  const { data: viewerProfile } = await supabase
    .from('user_profiles')
    .select('location')
    .eq('id', userId)
    .maybeSingle()

  const locationParts = normalizeLocationParts(viewerProfile?.location)

  let fallbackProfiles: any[] = []

  if (locationParts.length) {
    const orFilters = locationParts.map((part) => `location.ilike.%${part}%`).join(',')
    const { data: locationMatches, error: locationError } = await supabase
      .from('user_profiles')
      .select(baseProfileSelect)
      .or(orFilters)
      .limit(20)

    if (!locationError) {
      fallbackProfiles = locationMatches || []
    }
  }

  if (!fallbackProfiles.length) {
    const { data: broadMatches, error: broadError } = await supabase
      .from('user_profiles')
      .select(baseProfileSelect)
      .order('connections_count', { ascending: false })
      .limit(20)

    if (broadError) {
      console.error('❌ Recommended connections fallback fetch error:', broadError)
      return []
    }

    fallbackProfiles = broadMatches || []
  }

  return fallbackProfiles
    .filter((profile: any) => profile?.id && !excludedIds.has(profile.id))
    .map((profile: any) => {
      const profileLocation = (profile.location || '').toLowerCase()
      const locationScore = locationParts.reduce((score, part) => {
        if (!profileLocation) return score
        if (profileLocation === part) return score + 6
        if (profileLocation.startsWith(part)) return score + 5
        if (profileLocation.includes(part)) return score + 3
        return score
      }, 0)

      return {
        ...profile,
        mutual_connection_count: 0,
        mutual_connection_ids: [],
        location_match_score: locationScore,
        is_founder_verified: founderVerifiedIds.has(profile.id)
      }
    })
    .sort((left: any, right: any) => {
      if ((right.location_match_score || 0) !== (left.location_match_score || 0)) {
        return (right.location_match_score || 0) - (left.location_match_score || 0)
      }

      return (right.connections_count || 0) - (left.connections_count || 0)
    })
    .slice(0, 8)
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

    if (action === 'reviews' && userId) {
      const viewerId = searchParams.get('viewer_id')
      const [summary, reviewsPayload] = await Promise.all([
        getRatingSummary(supabase, userId, viewerId),
        getUserReviews(supabase, userId, viewerId)
      ])

      return NextResponse.json({
        success: true,
        ...summary,
        reviews: reviewsPayload.reviews,
        viewerReview: reviewsPayload.viewerReview
      })
    }

    if (action === 'recommended' && userId) {
      const users = await getRecommendedConnections(supabase, userId)

      return NextResponse.json({
        success: true,
        users
      })
    }
    
    // Handle user search (both 'search' and 'q' parameters)
    if (search || searchQuery) {
      const query = (search || searchQuery || '').trim()
      console.log('🔍 Searching for users with query:', query)

      const tokens = query
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .slice(0, 4)

      const searchTerms = Array.from(new Set([query, ...tokens])).filter(Boolean)
      const orFilters = searchTerms.flatMap((term) => [
        `first_name.ilike.%${term}%`,
        `last_name.ilike.%${term}%`,
        `username.ilike.%${term}%`,
        `location.ilike.%${term}%`
      ])

      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, username, avatar_url, location, handicap, bio, total_points, connections_count, tee_times_count')
        .or(orFilters.join(','))
        .limit(40)

      if (error) {
        console.error('❌ Search error:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Search failed', 
          details: error.message 
        }, { status: 500 })
      }

      const founderVerifiedIds = await getFounderVerifiedIds(supabase)
      const normalizedQuery = query.toLowerCase()

      const rankedUsers = (data || [])
        .map((profile: any) => {
          const firstName = (profile.first_name || '').toLowerCase()
          const lastName = (profile.last_name || '').toLowerCase()
          const username = (profile.username || '').toLowerCase()
          const location = (profile.location || '').toLowerCase()
          const fullName = `${firstName} ${lastName}`.trim()

          let score = 0

          if (fullName.startsWith(normalizedQuery)) score += 10
          if (username.startsWith(normalizedQuery)) score += 9
          if (firstName.startsWith(normalizedQuery)) score += 8
          if (lastName.startsWith(normalizedQuery)) score += 8
          if (fullName.includes(normalizedQuery)) score += 6
          if (username.includes(normalizedQuery)) score += 5
          if (location.includes(normalizedQuery)) score += 2

          for (const token of tokens) {
            const lowered = token.toLowerCase()
            if (firstName.startsWith(lowered) || lastName.startsWith(lowered)) score += 4
            if (username.startsWith(lowered)) score += 3
            if (fullName.includes(lowered)) score += 2
          }

          return {
            ...profile,
            score
          }
        })
        .sort((left: any, right: any) => right.score - left.score || (left.first_name || '').localeCompare(right.first_name || ''))
        .slice(0, 20)

      console.log('👥 Found users:', data?.length || 0)
      return NextResponse.json({
        success: true,
        users: rankedUsers.map((profile: any) => ({
          ...profile,
          score: undefined,
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
        const { rated_user_id, rater_user_id, stars, review_text } = data

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

        const normalizedReviewText =
          typeof review_text === 'string' ? review_text.trim().slice(0, 600) : ''

        const { error: upsertError } = await supabase
          .from('user_ratings')
          .upsert(
            {
              rated_user_id,
              rater_user_id,
              stars: normalizedStars,
              review_text: normalizedReviewText || null,
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

        await logUserActivity(supabase, {
          userId: rater_user_id,
          activityType: 'golfer_review_left',
          title: 'Left a golfer review',
          description: normalizedReviewText
            ? `Shared a ${normalizedStars}-star review`
            : `Left a ${normalizedStars}-star rating`,
          relatedId: rated_user_id,
          metadata: {
            rated_user_id,
            stars: normalizedStars
          }
        })

        const [summary, reviewsPayload] = await Promise.all([
          getRatingSummary(supabase, rated_user_id, rater_user_id),
          getUserReviews(supabase, rated_user_id, rater_user_id)
        ])

        return NextResponse.json({
          success: true,
          message: 'Rating saved successfully',
          ...summary,
          reviews: reviewsPayload.reviews,
          viewerReview: reviewsPayload.viewerReview
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
