import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type PublicUser = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
  header_image_url?: string | null
  location?: string | null
  handicap?: number | null
  bio?: string | null
  home_course?: string | null
  home_club?: string | null
  linkedin?: string | null
  linkedin_url?: string | null
}

type ActivityItem = {
  id: string
  activity_type: string
  title: string
  description?: string | null
  created_at: string
}

type ConnectionStatusResponse = {
  success: boolean
  status: 'none' | 'pending' | 'incoming_pending' | 'connected'
}

type UserCard = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
  location?: string | null
  handicap?: number | null
}

type ConnectionRecord = {
  id: string
  requester_id?: string
  recipient_id?: string
  requester?: UserCard | null
  recipient?: UserCard | null
}

type ConnectionsPayload = {
  success: boolean
  connections: ConnectionRecord[]
}

type RatingSummary = {
  success?: boolean
  average: number | null
  count: number
  viewerRating: number | null
}

function formatName(user?: UserCard | PublicUser | null) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'UGC Golfer'
}

function formatActivityLabel(activity: ActivityItem) {
  switch (activity.activity_type) {
    case 'tee_time_created':
      return 'Posted a tee time'
    case 'tee_time_updated':
      return 'Updated a tee time'
    case 'round_logged':
      return 'Logged a round'
    case 'profile_updated':
      return 'Updated profile details'
    case 'group_joined':
      return 'Joined a group'
    default:
      return activity.title || 'Recent activity'
  }
}

function formatRelativeTime(value?: string) {
  if (!value) return 'Just now'
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diff < hour) {
    return `${Math.max(1, Math.round(diff / (60 * 1000)))}m ago`
  }

  if (diff < day) {
    return `${Math.round(diff / hour)}h ago`
  }

  return `${Math.round(diff / day)}d ago`
}

export default function PublicUserScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [status, setStatus] = useState<ConnectionStatusResponse['status']>('none')
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    average: null,
    count: 0,
    viewerRating: null
  })

  const displayName = useMemo(() => formatName(profile), [profile])
  const homeCourse = profile?.home_course || profile?.home_club || 'Home course not added'
  const linkedinUrl = profile?.linkedin_url || profile?.linkedin || ''

  const connectedGolfers = useMemo(() => {
    if (!id) return []

    return connections
      .map((connection) => (connection.requester_id === id ? connection.recipient : connection.requester))
      .filter(Boolean) as UserCard[]
  }, [connections, id])

  const loadUser = useCallback(async () => {
    if (!id) return

    try {
      const [profileResponse, statusResponse, ratingResponse, connectionsResponse] = await Promise.all([
        apiGet<PublicUser>(`/api/users?id=${encodeURIComponent(id)}`),
        user?.id
          ? apiGet<ConnectionStatusResponse>(
              `/api/users?action=status&id=${encodeURIComponent(id)}&viewer_id=${encodeURIComponent(user.id)}`
            )
          : Promise.resolve({ success: true, status: 'none' as const }),
        apiGet<RatingSummary>(
          `/api/users?action=rating&id=${encodeURIComponent(id)}${user?.id ? `&viewer_id=${encodeURIComponent(user.id)}` : ''}`
        ).catch(() => ({
          average: null,
          count: 0,
          viewerRating: null
        })),
        apiGet<ConnectionsPayload>(`/api/users?action=connections&id=${encodeURIComponent(id)}`).catch(() => ({
          success: true,
          connections: []
        }))
      ])

      setProfile(profileResponse)
      setStatus(statusResponse.status)
      setRatingSummary(ratingResponse)
      setConnections(connectionsResponse.connections || [])

      if (statusResponse.status === 'connected') {
        const activityResponse = await apiGet<{ success: boolean; activities: ActivityItem[] }>(
          `/api/activities?user_id=${encodeURIComponent(id)}&limit=6`
        ).catch(() => ({ success: true, activities: [] }))

        setActivities(activityResponse.activities || [])
      } else {
        setActivities([])
      }
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    if (id) {
      setBusy(true)
      loadUser()
    }
  }, [id, loadUser])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleConnect = async () => {
    if (!user?.id || !id) return

    setConnecting(true)
    try {
      await apiPost('/api/users', {
        action: 'connect',
        user_id: user.id,
        connected_user_id: id
      })
      await loadUser()
      Alert.alert('Connection sent', 'This golfer can now accept your request.')
    } catch (error) {
      Alert.alert('Unable to connect', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const handleRate = async (stars: number) => {
    if (!user?.id || !id) return

    setRatingBusy(true)
    try {
      const response = await apiPost<RatingSummary>('/api/users', {
        action: 'rate',
        rated_user_id: id,
        rater_user_id: user.id,
        stars
      })
      setRatingSummary(response)
      Alert.alert('Rating saved', `You gave ${displayName} ${stars} star${stars === 1 ? '' : 's'}.`)
    } catch (error) {
      Alert.alert('Unable to rate golfer', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setRatingBusy(false)
    }
  }

  const actionLabel =
    status === 'connected'
      ? 'Connected'
      : status === 'pending'
        ? 'Request Sent'
      : status === 'incoming_pending'
        ? 'Accept on web for now'
        : 'Add Connection'

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadUser()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader showBack />

        <View style={styles.heroCard}>
          <View style={styles.coverShell}>
            {profile?.header_image_url ? (
              <Image source={{ uri: profile.header_image_url }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverFallback}>
                <Text style={styles.coverFallbackText}>Golfer profile</Text>
              </View>
            )}
            <View style={styles.coverOverlay} />
            {status === 'connected' ? (
              <Pressable onPress={() => router.push(`/messages/${id}`)} style={styles.messageIconButton}>
                <Ionicons color={palette.text} name="mail-outline" size={20} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.avatarWrap}>
            <Avatar label={displayName} size={108} uri={profile?.avatar_url} />
          </View>

          <View style={styles.identityStack}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.homeCourse}>{homeCourse}</Text>
            <Text style={styles.metaLine}>
              {profile?.location || 'Location not added'} • Handicap {profile?.handicap ?? 'N/A'} •{' '}
              {connectedGolfers.length} Connections
            </Text>
            <View style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Ionicons color={palette.gold} name="star" size={16} />
                <Text style={styles.ratingBadgeText}>
                  {ratingSummary.average ? ratingSummary.average.toFixed(1) : 'New'}
                </Text>
              </View>
              <Text style={styles.ratingText}>
                {ratingSummary.count ? `${ratingSummary.count} golfer ratings` : 'Waiting on first rating'}
              </Text>
            </View>
            {linkedinUrl ? (
              <Pressable onPress={() => void Linking.openURL(linkedinUrl)} style={styles.linkedinChip}>
                <Ionicons color={palette.aqua} name="logo-linkedin" size={16} />
                <Text style={styles.linkedinText}>LinkedIn</Text>
              </Pressable>
            ) : null}
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>

          {status !== 'connected' ? (
            <View style={styles.actionRow}>
              <PrimaryButton
                disabled={status === 'pending' || status === 'incoming_pending'}
                label={actionLabel}
                loading={connecting}
                onPress={handleConnect}
              />
            </View>
          ) : null}

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((stars) => (
              <Pressable
                key={stars}
                disabled={ratingBusy}
                onPress={() => void handleRate(stars)}
                style={styles.starButton}
              >
                <Ionicons
                  color={stars <= (ratingSummary.viewerRating || 0) ? palette.gold : palette.textMuted}
                  name={stars <= (ratingSummary.viewerRating || 0) ? 'star' : 'star-outline'}
                  size={24}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Activity</Text>
          <Text style={styles.sectionTitle}>Recent golfer movement</Text>
          {status !== 'connected' ? (
            <Text style={styles.helper}>
              Connect with {displayName.split(' ')[0]} to unlock their activity feed. Their public profile details stay visible either way.
            </Text>
          ) : null}
          {status === 'connected' && busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {status === 'connected' && !busy && activities.length === 0 ? (
            <Text style={styles.helper}>No recent activity yet. Tee times, rounds, and profile updates will show here.</Text>
          ) : null}
          {status === 'connected'
            ? activities.map((activity) => (
                <View key={activity.id} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityCopy}>
                    <Text style={styles.activityTitle}>{formatActivityLabel(activity)}</Text>
                    {activity.description ? <Text style={styles.activityDescription}>{activity.description}</Text> : null}
                  </View>
                  <Text style={styles.activityTime}>{formatRelativeTime(activity.created_at)}</Text>
                </View>
              ))
            : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.bg,
    flex: 1
  },
  content: {
    gap: 20,
    padding: 20
  },
  heroCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 18
  },
  coverShell: {
    borderRadius: 22,
    height: 188,
    overflow: 'hidden',
    position: 'relative'
  },
  coverImage: {
    height: '100%',
    width: '100%'
  },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  coverFallbackText: {
    color: palette.textMuted,
    fontSize: 15,
    fontWeight: '600'
  },
  coverOverlay: {
    backgroundColor: 'rgba(3,10,8,0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  messageIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(3,10,8,0.42)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    top: 14,
    width: 42,
    zIndex: 2
  },
  avatarWrap: {
    alignSelf: 'center',
    borderColor: palette.card,
    borderRadius: 999,
    borderWidth: 6,
    marginTop: -58,
    zIndex: 2
  },
  identityStack: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  name: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center'
  },
  homeCourse: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center'
  },
  metaLine: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  ratingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  ratingBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.28)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  ratingBadgeText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  },
  ratingText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  linkedinChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.28)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  linkedinText: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
  },
  bio: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center'
  },
  actionRow: {
    marginTop: 16
  },
  starRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 14
  },
  starButton: {
    padding: 2
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  sectionEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  helper: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  activityRow: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12
  },
  activityDot: {
    backgroundColor: palette.aqua,
    borderRadius: 999,
    height: 8,
    marginTop: 7,
    width: 8
  },
  activityCopy: {
    flex: 1,
    gap: 2
  },
  activityTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20
  },
  activityDescription: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  activityTime: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 'auto'
  }
})
