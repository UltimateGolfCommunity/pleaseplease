import { mobileSupabase } from '@/lib/supabase'

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
}

const FEED_ACTIVITY_TYPES = [
  'bag_updated',
  'profile_updated',
  'profile_photo_updated',
  'profile_cover_updated',
  'tee_time_created',
  'tee_time_updated',
  'round_logged',
  'photo_posted',
  'connection_added',
  'group_joined',
  'group_created',
  'group_board_post',
  'group_thread_reply'
]

export async function fetchNetworkFeed(userId: string, limit = 20): Promise<NetworkFeedActivity[]> {
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

  let likes: { activity_id: string; user_id: string }[] = []
  let comments: { activity_id: string; id: string }[] = []

  if (activityIds.length) {
    const [likesResult, commentsResult] = await Promise.all([
      mobileSupabase.from('activity_likes').select('activity_id, user_id').in('activity_id', activityIds),
      mobileSupabase.from('activity_comments').select('activity_id, id').in('activity_id', activityIds)
    ])

    if (!likesResult.error) {
      likes = likesResult.data || []
    }

    if (!commentsResult.error) {
      comments = commentsResult.data || []
    }
  }

  const actorMap = new Map((actorProfiles || []).map((profile: any) => [profile.id, profile]))
  const likeSummary = new Map<string, { count: number; liked: boolean }>()
  const commentCounts = new Map<string, number>()

  likes.forEach((like) => {
    const summary = likeSummary.get(like.activity_id) || { count: 0, liked: false }
    summary.count += 1
    summary.liked = summary.liked || like.user_id === userId
    likeSummary.set(like.activity_id, summary)
  })

  comments.forEach((comment) => {
    commentCounts.set(comment.activity_id, (commentCounts.get(comment.activity_id) || 0) + 1)
  })

  return (activities || []).map((activity: any) => ({
    ...activity,
    metadata: activity.metadata || {},
    actor: actorMap.get(activity.user_id) || null,
    like_count: likeSummary.get(activity.id)?.count || 0,
    liked_by_user: likeSummary.get(activity.id)?.liked || false,
    comment_count: commentCounts.get(activity.id) || 0
  }))
}
