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
  bag_items?: Record<string, string | null> | null
  ace_details?: {
    course?: string | null
    date?: string | null
    hole?: string | null
  } | null
  is_founder_verified?: boolean
}

type ActivityItem = {
  id: string
  activity_type: string
  title: string
  description?: string | null
  created_at: string
  related_id?: string | null
  metadata?: Record<string, unknown>
}

type RoundRecord = {
  id: string
  course_name: string
  holes_played: number
  hole_scores: number[]
  total_score: number
  average_score_per_hole: number
  played_at: string
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

type BagItems = {
  driver?: string | null
  fairway_woods?: string | null
  hybrids?: string | null
  irons?: string | null
  wedges?: string | null
  putter?: string | null
  ball?: string | null
  shoes?: string | null
}

type AceDetails = {
  course?: string | null
  date?: string | null
  hole?: string | null
}

const bagFields: { key: keyof BagItems; label: string }[] = [
  { key: 'driver', label: 'Driver' },
  { key: 'fairway_woods', label: 'Fairway Woods' },
  { key: 'hybrids', label: 'Hybrids' },
  { key: 'irons', label: 'Irons' },
  { key: 'wedges', label: 'Wedges' },
  { key: 'putter', label: 'Putter' },
  { key: 'ball', label: 'Golf Ball' },
  { key: 'shoes', label: 'Golf Shoes' }
]

function normalizeBagItems(input: unknown): BagItems {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {}
  }

  const source = input as Record<string, unknown>

  return {
    driver: typeof source.driver === 'string' ? source.driver : '',
    fairway_woods: typeof source.fairway_woods === 'string' ? source.fairway_woods : '',
    hybrids: typeof source.hybrids === 'string' ? source.hybrids : '',
    irons: typeof source.irons === 'string' ? source.irons : '',
    wedges: typeof source.wedges === 'string' ? source.wedges : '',
    putter: typeof source.putter === 'string' ? source.putter : '',
    ball: typeof source.ball === 'string' ? source.ball : '',
    shoes: typeof source.shoes === 'string' ? source.shoes : ''
  }
}

function normalizeAceDetails(input: unknown): AceDetails | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null
  }

  const source = input as Record<string, unknown>
  const ace = {
    course: typeof source.course === 'string' ? source.course : '',
    date: typeof source.date === 'string' ? source.date : '',
    hole: typeof source.hole === 'string' ? source.hole : ''
  }

  return ace.course || ace.date || ace.hole ? ace : null
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
    case 'profile_photo_updated':
      return 'Updated profile photo'
    case 'profile_cover_updated':
      return 'Updated cover photo'
    case 'group_joined':
      return 'Joined a group'
    case 'group_created':
      return 'Created a group'
    case 'group_logo_updated':
      return 'Updated a group logo'
    case 'group_cover_updated':
      return 'Updated a group cover'
    case 'group_details_updated':
      return 'Updated group details'
    case 'group_member_role_updated':
      return 'Changed a group role'
    case 'group_board_post':
      return 'Posted in a group'
    case 'group_thread_reply':
      return 'Replied in a group thread'
    case 'tee_time_joined':
      return 'Joined a tee time'
    case 'connection_added':
      return 'Added a new connection'
    case 'bag_updated':
      return 'Updated what is in the bag'
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

function getActivityRoundId(activity: ActivityItem) {
  const metadataRoundId = typeof activity.metadata?.round_id === 'string' ? activity.metadata.round_id : null
  return metadataRoundId || activity.related_id || null
}

function getActivityRoundScore(activity: ActivityItem) {
  return typeof activity.metadata?.score === 'number' ? activity.metadata.score : null
}

function getActivityRoundCourse(activity: ActivityItem) {
  return typeof activity.metadata?.course_name === 'string' ? activity.metadata.course_name : null
}

function findRoundForActivity(activity: ActivityItem, rounds: RoundRecord[]) {
  const roundId = getActivityRoundId(activity)
  if (roundId) {
    const byId = rounds.find((round) => round.id === roundId)
    if (byId) return byId
  }

  const courseName = getActivityRoundCourse(activity)
  const score = getActivityRoundScore(activity)

  return rounds.find((round) => {
    const sameCourse = courseName ? round.course_name === courseName : true
    const sameScore = Number.isFinite(score as number) ? round.total_score === score : true
    return sameCourse && sameScore
  }) || null
}

function getAverageScoreAtCourse(round: RoundRecord, rounds: RoundRecord[]) {
  const sameCourseRounds = rounds.filter((item) => item.course_name === round.course_name)
  if (!sameCourseRounds.length) return round.total_score
  return sameCourseRounds.reduce((sum, item) => sum + item.total_score, 0) / sameCourseRounds.length
}

export default function PublicUserScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [status, setStatus] = useState<ConnectionStatusResponse['status']>('none')
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [rounds, setRounds] = useState<RoundRecord[]>([])
  const [activeTab, setActiveTab] = useState<'activity' | 'about'>('activity')
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    average: null,
    count: 0,
    viewerRating: null
  })

  const displayName = useMemo(() => formatName(profile), [profile])
  const homeCourse = profile?.home_course || profile?.home_club || 'Home course not added'
  const linkedinUrl = profile?.linkedin_url || profile?.linkedin || ''
  const bagItems = useMemo(() => normalizeBagItems(profile?.bag_items), [profile?.bag_items])
  const aceDetails = useMemo(() => normalizeAceDetails(profile?.ace_details), [profile?.ace_details])

  const connectedGolfers = useMemo(() => {
    if (!id) return []

    return connections
      .map((connection) => (connection.requester_id === id ? connection.recipient : connection.requester))
      .filter(Boolean) as UserCard[]
  }, [connections, id])

  const loadUser = useCallback(async () => {
    if (!id) return

    try {
      const [profileResponse, statusResponse, ratingResponse, connectionsResponse, activityResponse, roundsResponse] = await Promise.all([
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
        })),
        apiGet<{ success: boolean; activities: ActivityItem[] }>(
          `/api/activities?user_id=${encodeURIComponent(id)}&limit=12`
        ).catch(() => ({ success: true, activities: [] })),
        apiGet<{ success: boolean; rounds: RoundRecord[] }>(`/api/scores?user_id=${encodeURIComponent(id)}`).catch(() => ({
          success: true,
          rounds: []
        }))
      ])

      setProfile(profileResponse)
      setStatus(statusResponse.status)
      setRatingSummary(ratingResponse)
      setConnections(connectionsResponse.connections || [])
      setActivities(activityResponse.activities || [])
      setRounds(roundsResponse.rounds || [])
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
        <BrandHeader
          showBack
          largeLogo
          rightIconName="mail-outline"
          onRightPress={() => id && router.push(`/messages/${id}`)}
        />

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
          </View>

          <View style={styles.avatarWrap}>
            <Avatar label={displayName} size={108} uri={profile?.avatar_url} />
          </View>

          <View style={styles.identityStack}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
              {profile?.is_founder_verified ? (
                <Ionicons color={palette.emerald} name="checkmark-circle" size={22} style={styles.nameBadgeIcon} />
              ) : null}
            </View>
            <Text style={styles.homeCourse}>{homeCourse}</Text>
            <Pressable onPress={() => id && router.push(`/users/${id}/connections`)} style={styles.connectionsHeaderLink}>
              <Text style={styles.metaLine}>
              {profile?.location || 'Location not added'} • Handicap {profile?.handicap ?? 'N/A'} •{' '}
              {connectedGolfers.length} Connections
              </Text>
            </Pressable>
            <Pressable onPress={() => id && router.push(`/users/${id}/reviews`)} style={styles.ratingRow}>
              <View style={styles.ratingBadge}>
                <Ionicons color={palette.gold} name="star" size={16} />
                <Text style={styles.ratingBadgeText}>
                  {ratingSummary.average ? ratingSummary.average.toFixed(1) : 'New'}
                </Text>
              </View>
              <Text style={styles.ratingText}>
                {ratingSummary.count ? `${ratingSummary.count} golfer ratings` : 'Waiting on first rating'}
              </Text>
              <Ionicons color={palette.aqua} name="chevron-forward" size={16} />
            </Pressable>
            {linkedinUrl ? (
              <Pressable onPress={() => void Linking.openURL(linkedinUrl)} style={styles.linkedinChip}>
                <Ionicons color={palette.aqua} name="logo-linkedin" size={16} />
                <Text style={styles.linkedinText}>LinkedIn</Text>
              </Pressable>
            ) : null}
            {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          </View>

          <View style={styles.actionGrid}>
            <PrimaryButton
              disabled={status === 'connected' || status === 'pending' || status === 'incoming_pending'}
              label={actionLabel}
              loading={connecting}
              onPress={handleConnect}
            />
            <PrimaryButton
              label="Add to Group"
              variant="ghost"
              onPress={() => router.push('/groups')}
            />
          </View>

        </View>

        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setActiveTab('activity')}
            style={[styles.tabButton, activeTab === 'activity' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === 'activity' && styles.tabButtonTextActive]}>
              Activity
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('about')}
            style={[styles.tabButton, activeTab === 'about' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === 'about' && styles.tabButtonTextActive]}>
              About
            </Text>
          </Pressable>
        </View>

        {activeTab === 'activity' ? (
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>Activity</Text>
            <Text style={styles.sectionTitle}>{displayName.split(' ')[0]}&apos;s recent activity</Text>
            {busy ? <ActivityIndicator color={palette.aqua} /> : null}
            {!busy && activities.length === 0 ? (
              <Text style={styles.helper}>
                No recent activity yet. Profile edits, photo updates, rounds, groups, tee times, and connections will show here.
              </Text>
            ) : null}
            {activities.map((activity) => {
              const linkedRound = activity.activity_type === 'round_logged' ? findRoundForActivity(activity, rounds) : null
              const courseAverage = linkedRound ? getAverageScoreAtCourse(linkedRound, rounds) : null

              if (linkedRound) {
                return (
                  <Pressable
                    key={activity.id}
                    onPress={() => router.push(`/rounds/${linkedRound.id}`)}
                    style={styles.roundActivityCard}
                  >
                    <View style={styles.roundActivityHeader}>
                      <View style={styles.roundActivityCopy}>
                        <Text style={styles.roundActivityCourse}>{linkedRound.course_name}</Text>
                        <Text style={styles.roundActivityMeta}>
                          {formatRelativeTime(activity.created_at)} • {linkedRound.holes_played} holes
                        </Text>
                      </View>
                      <Text style={styles.roundActivityScore}>{linkedRound.total_score}</Text>
                    </View>
                    <View style={styles.roundActivityStats}>
                      <View style={styles.roundActivityPill}>
                        <Text style={styles.roundActivityPillLabel}>Handicap</Text>
                        <Text style={styles.roundActivityPillValue}>{profile?.handicap ?? '--'}</Text>
                      </View>
                      <View style={styles.roundActivityPill}>
                        <Text style={styles.roundActivityPillLabel}>Course Avg</Text>
                        <Text style={styles.roundActivityPillValue}>{courseAverage ? courseAverage.toFixed(1) : '--'}</Text>
                      </View>
                      <View style={styles.roundActivityPill}>
                        <Text style={styles.roundActivityPillLabel}>Avg / Hole</Text>
                        <Text style={styles.roundActivityPillValue}>{linkedRound.average_score_per_hole.toFixed(2)}</Text>
                      </View>
                    </View>
                  </Pressable>
                )
              }

              return (
                <View key={activity.id} style={styles.activityRow}>
                  <View style={styles.activityDot} />
                  <View style={styles.activityCopy}>
                    <Text style={styles.activityTitle}>{formatActivityLabel(activity)}</Text>
                    {activity.description ? <Text style={styles.activityDescription}>{activity.description}</Text> : null}
                  </View>
                  <Text style={styles.activityTime}>{formatRelativeTime(activity.created_at)}</Text>
                  <View style={styles.activityActions}>
                    <Text style={styles.activityActionText}>Like</Text>
                    <Text style={styles.activityActionText}>Comment</Text>
                  </View>
                </View>
              )
            })}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>About</Text>
            <Text style={styles.sectionTitle}>{displayName.split(' ')[0]}&apos;s golfer profile</Text>
            <View style={styles.aboutInfoGrid}>
              <View style={styles.aboutInfoCard}>
                <Text style={styles.aboutInfoLabel}>Home Course</Text>
                <Text style={styles.aboutInfoValue}>{homeCourse}</Text>
              </View>
              <View style={styles.aboutInfoCard}>
                <Text style={styles.aboutInfoLabel}>Location</Text>
                <Text style={styles.aboutInfoValue}>{profile?.location || 'Not added yet'}</Text>
              </View>
              <View style={styles.aboutInfoCard}>
                <Text style={styles.aboutInfoLabel}>Handicap</Text>
                <Text style={styles.aboutInfoValue}>{profile?.handicap ?? 'Not added yet'}</Text>
              </View>
              <View style={styles.aboutInfoCard}>
                <Text style={styles.aboutInfoLabel}>Rounds Logged</Text>
                <Text style={styles.aboutInfoValue}>{rounds.length || '0'}</Text>
              </View>
            </View>
            <View style={styles.aceCard}>
              <Text style={styles.aboutSectionTitle}>Hole In One</Text>
              {aceDetails ? (
                <View style={styles.aceDetailsRow}>
                  <View style={styles.acePill}>
                    <Text style={styles.acePillLabel}>Course</Text>
                    <Text style={styles.acePillValue}>{aceDetails.course || '--'}</Text>
                  </View>
                  <View style={styles.acePill}>
                    <Text style={styles.acePillLabel}>Hole</Text>
                    <Text style={styles.acePillValue}>{aceDetails.hole || '--'}</Text>
                  </View>
                  <View style={styles.acePill}>
                    <Text style={styles.acePillLabel}>When</Text>
                    <Text style={styles.acePillValue}>{aceDetails.date || '--'}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.helper}>No hole in one posted yet.</Text>
              )}
            </View>
            <Text style={styles.aboutSectionTitle}>What&apos;s In The Bag</Text>
            {bagFields.map((field) => {
              const value = bagItems[field.key]?.trim()
              return (
                <View key={field.key} style={styles.bagRow}>
                  <Text style={styles.bagLabel}>{field.label}</Text>
                  <Text style={styles.bagValue}>{value || 'Not added yet'}</Text>
                </View>
              )
            })}
          </View>
        )}
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
  nameRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 34,
    position: 'relative'
  },
  nameBadgeIcon: {
    position: 'absolute',
    right: 0
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
  connectionsHeaderLink: {
    alignItems: 'center'
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
  actionGrid: {
    gap: 10,
    marginTop: 16
  },
  tabRow: {
    backgroundColor: palette.bgElevated,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 6
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12
  },
  tabButtonActive: {
    backgroundColor: palette.card
  },
  tabButtonText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  tabButtonTextActive: {
    color: palette.text
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
  roundActivityCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  roundActivityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  roundActivityCopy: {
    flex: 1,
    gap: 2
  },
  roundActivityCourse: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700'
  },
  roundActivityMeta: {
    color: palette.textMuted,
    fontSize: 12
  },
  roundActivityScore: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800'
  },
  roundActivityStats: {
    flexDirection: 'row',
    gap: 8
  },
  roundActivityPill: {
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  roundActivityPillLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  roundActivityPillValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700'
  },
  activityRow: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    paddingBottom: 34,
    position: 'relative'
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
  },
  activityActions: {
    bottom: 10,
    flexDirection: 'row',
    gap: 12,
    position: 'absolute',
    right: 12
  },
  activityActionText: {
    color: palette.aqua,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  bagRow: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 14
  },
  bagLabel: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  bagValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20
  },
  aboutInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  aboutInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    minWidth: '47%',
    padding: 14
  },
  aboutInfoLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  aboutInfoValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20
  },
  aceCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.18)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 16
  },
  aboutSectionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800'
  },
  aceDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  acePill: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
    minWidth: '31%',
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  acePillLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase'
  },
  acePillValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18
  }
})
