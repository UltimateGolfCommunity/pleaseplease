import { mobileSupabase } from '@/lib/supabase'
import { apiGet } from '@/lib/api'

export type NetworkFeedActivity = {
  id: string
  activity_type?: string
  user_id?: string
  title?: string
  description?: string
  related_id?: string | null
  related_type?: string | null
  created_at?: string
  updated_at?: string
  metadata?: Record<string, unknown>
  like_count?: number
  comment_count?: number
  liked_by_user?: boolean
  actor?: {
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
  } | null
  related_user?: {
    id?: string
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
  } | null
  likes?: {
    user_id?: string
    user_profiles?: {
      id?: string
      first_name?: string | null
      last_name?: string | null
      username?: string | null
      avatar_url?: string | null
    } | null
  }[]
  comments?: {
    id: string
    activity_id?: string
    comment?: string
    created_at?: string
    user_id?: string
    user_profiles?: {
      id?: string
      first_name?: string | null
      last_name?: string | null
      username?: string | null
      avatar_url?: string | null
    } | null
  }[]
  tee_time?: {
    id: string
    current_players?: number
    max_players?: number
    join_mode?: 'request' | 'auto'
    accepted_players?: {
      id?: string
      first_name?: string | null
      last_name?: string | null
      username?: string | null
      avatar_url?: string | null
    }[]
  } | null
}

// Home is the golf feed: rounds, shared photos, and tee times. Profile and
// network updates remain visible on the golfer's own profile instead.
const FEED_ACTIVITY_TYPES = ['tee_time_created', 'round_logged', 'photo_posted']

export async function fetchNetworkFeed(userId: string, limit = 20): Promise<NetworkFeedActivity[]> {
  // Use the server feed first so connection visibility is evaluated with the
  // same accepted-connection rules as the backend, regardless of mobile RLS.
  try {
    const response = await apiGet<{ success: boolean; activities: NetworkFeedActivity[] }>(
      `/api/activities?action=feed&user_id=${encodeURIComponent(userId)}&limit=${limit}`
    )
    return (response.activities || []).filter((activity) =>
      FEED_ACTIVITY_TYPES.includes(activity.activity_type || '')
    )
  } catch {
    // Fall back to the direct query below while offline or during a server outage.
  }

  const { data: connections, error: connectionsError } = await mobileSupabase
    .from('user_connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq('status', 'accepted')

  if (connectionsError) {
    throw new Error(connectionsError.message || 'Unable to load connections for the feed.')
  }

  const connectionIds = Array.from(
    new Set(
      (connections || []).map((connection: any) =>
        connection.requester_id === userId ? connection.recipient_id : connection.requester_id
      )
    )
  )

  const feedUserIds = Array.from(new Set([userId, ...connectionIds]))

  const { data: activities, error: activitiesError } = await mobileSupabase
    .from('user_activities')
    .select('id, user_id, activity_type, title, description, related_id, related_type, metadata, created_at, updated_at')
    .in('user_id', feedUserIds)
    .in('activity_type', FEED_ACTIVITY_TYPES)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (activitiesError) {
    throw new Error(activitiesError.message || 'Unable to load feed activity.')
  }

  const { data: actorProfiles, error: actorError } = await mobileSupabase
    .from('user_profiles')
    .select('id, first_name, last_name, username, avatar_url')
    .in('id', feedUserIds)

  if (actorError) {
    throw new Error(actorError.message || 'Unable to load feed golfers.')
  }

  const activityIds = (activities || []).map((activity: any) => activity.id).filter(Boolean)
  const connectedUserIds = (activities || [])
    .map((activity: any) =>
      typeof activity?.metadata?.connected_user_id === 'string' ? activity.metadata.connected_user_id : null
    )
    .filter(Boolean)
  const teeTimeIds = (activities || [])
    .filter((activity: any) => activity.related_type === 'tee_time' && activity.related_id)
    .map((activity: any) => activity.related_id)

  let likes: {
    activity_id: string
    user_id: string
    user_profiles?: {
      id?: string
      first_name?: string | null
      last_name?: string | null
      username?: string | null
      avatar_url?: string | null
    } | null
  }[] = []
  let comments: {
    activity_id: string
    id: string
    comment?: string
    created_at?: string
    user_id?: string
    user_profiles?: {
      id?: string
      first_name?: string | null
      last_name?: string | null
      username?: string | null
      avatar_url?: string | null
    } | null
  }[] = []
  let relatedProfiles: {
    id: string
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
  }[] = []
  let teeTimes: {
    id: string
    accepted_players?: {
      id?: string
      first_name?: string | null
      last_name?: string | null
      username?: string | null
      avatar_url?: string | null
    }[]
  }[] = []

  if (activityIds.length) {
    const [likesResult, commentsResult, relatedProfilesResult, teeTimesResult, teeTimePlayersResult] = await Promise.all([
      mobileSupabase
        .from('activity_likes')
        .select(`
          activity_id,
          user_id,
          user_profiles:user_id (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .in('activity_id', activityIds),
      mobileSupabase
        .from('activity_comments')
        .select(`
          id,
          activity_id,
          comment,
          created_at,
          user_id,
          user_profiles:user_id (
            id,
            first_name,
            last_name,
            username,
            avatar_url
          )
        `)
        .in('activity_id', activityIds)
        .order('created_at', { ascending: false }),
      connectedUserIds.length
        ? mobileSupabase
            .from('user_profiles')
            .select('id, first_name, last_name, username, avatar_url')
            .in('id', connectedUserIds)
        : Promise.resolve({ data: [], error: null } as any),
      teeTimeIds.length
        ? mobileSupabase.from('tee_times').select('id, current_players, max_players, join_mode').in('id', teeTimeIds)
        : Promise.resolve({ data: [], error: null } as any),
      teeTimeIds.length
        ? mobileSupabase
            .from('tee_time_applications')
            .select(`
              tee_time_id,
              status,
              applicant:user_profiles!tee_time_applications_applicant_id_fkey(
                id,
                first_name,
                last_name,
                username,
                avatar_url
              )
            `)
            .in('tee_time_id', teeTimeIds)
            .in('status', ['approved', 'accepted'])
        : Promise.resolve({ data: [], error: null } as any)
    ])

    if (!likesResult.error) {
      likes = (likesResult.data || []).map((like: any) => ({
        ...like,
        user_profiles: Array.isArray(like.user_profiles) ? like.user_profiles[0] || null : like.user_profiles || null
      }))
    }

    if (!commentsResult.error) {
      comments = (commentsResult.data || []).map((comment: any) => ({
        ...comment,
        user_profiles: Array.isArray(comment.user_profiles)
          ? comment.user_profiles[0] || null
          : comment.user_profiles || null
      }))
    }

    if (!relatedProfilesResult.error) {
      relatedProfiles = relatedProfilesResult.data || []
    }

    if (!teeTimesResult.error) {
      const playersByTeeTime = new Map<string, any[]>()

      if (!teeTimePlayersResult.error) {
        ;(teeTimePlayersResult.data || []).forEach((application: any) => {
          if (!application.tee_time_id || !application.applicant) return
          const players = playersByTeeTime.get(application.tee_time_id) || []
          players.push(application.applicant)
          playersByTeeTime.set(application.tee_time_id, players)
        })
      }

      teeTimes = (teeTimesResult.data || []).map((teeTime: any) => ({
        ...teeTime,
        accepted_players: playersByTeeTime.get(teeTime.id) || []
      }))
    }
  }

  const actorMap = new Map((actorProfiles || []).map((profile: any) => [profile.id, profile]))
  const relatedProfileMap = new Map((relatedProfiles || []).map((profile: any) => [profile.id, profile]))
  const teeTimesMap = new Map((teeTimes || []).map((teeTime: any) => [teeTime.id, teeTime]))
  const likeSummary = new Map<string, { count: number; liked: boolean }>()
  const commentCounts = new Map<string, number>()
  const likesByActivity = new Map<string, typeof likes>()
  const commentsByActivity = new Map<string, typeof comments>()

  likes.forEach((like) => {
    const summary = likeSummary.get(like.activity_id) || { count: 0, liked: false }
    summary.count += 1
    summary.liked = summary.liked || like.user_id === userId
    likeSummary.set(like.activity_id, summary)

    const activityLikes = likesByActivity.get(like.activity_id) || []
    activityLikes.push(like)
    likesByActivity.set(like.activity_id, activityLikes)
  })

  comments.forEach((comment) => {
    commentCounts.set(comment.activity_id, (commentCounts.get(comment.activity_id) || 0) + 1)

    const activityComments = commentsByActivity.get(comment.activity_id) || []
    activityComments.push(comment)
    commentsByActivity.set(comment.activity_id, activityComments)
  })

  return (activities || []).map((activity: any) => ({
    ...activity,
    metadata: activity.metadata || {},
    actor: actorMap.get(activity.user_id) || null,
    related_user:
      typeof activity?.metadata?.connected_user_id === 'string'
        ? relatedProfileMap.get(activity.metadata.connected_user_id) || null
        : null,
    likes: likesByActivity.get(activity.id) || [],
    comments: commentsByActivity.get(activity.id) || [],
    tee_time:
      activity.related_type === 'tee_time' && typeof activity.related_id === 'string'
        ? teeTimesMap.get(activity.related_id) || null
        : null,
    like_count: likeSummary.get(activity.id)?.count || 0,
    liked_by_user: likeSummary.get(activity.id)?.liked || false,
    comment_count: commentCounts.get(activity.id) || 0
  }))
}
