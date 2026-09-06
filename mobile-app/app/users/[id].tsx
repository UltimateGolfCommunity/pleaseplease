import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { Avatar } from '@/components/Avatar'
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

type MemberGroup = {
  id: string
  name: string
  logo_url?: string | null
  image_url?: string | null
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
  const [memberGroups, setMemberGroups] = useState<MemberGroup[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [rounds, setRounds] = useState<RoundRecord[]>([])
  const [activeTab, setActiveTab] = useState<'activity' | 'about'>('activity')
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false)
  const [coverLoadFailed, setCoverLoadFailed] = useState(false)
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    average: null,
    count: 0,
    viewerRating: null
  })

  const displayName = useMemo(() => formatName(profile), [profile])
  const homeCourse = profile?.home_course || profile?.home_club || 'Home course not added'
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
      const [profileResponse, statusResponse, ratingResponse, connectionsResponse, activityResponse, roundsResponse, groupsResponse] = await Promise.all([
        apiGet<PublicUser>(`/api/users?id=${encodeURIComponent(id)}`),
        user?.id
          ? apiGet<ConnectionStatusResponse>(
              `/api/users?action=status&id=${encodeURIComponent(id)}&viewer_id=${encodeURIComponent(user.id)}`
            ).catch(() => ({ success: true, status: 'none' as const }))
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
        })),
        apiGet<{ success: boolean; groups: MemberGroup[] }>(`/api/groups?user_id=${encodeURIComponent(id)}`).catch(() => ({
          success: true,
          groups: []
        }))
      ])

      setProfile(profileResponse)
      setStatus(statusResponse.status)
      setRatingSummary(ratingResponse)
      setConnections(connectionsResponse.connections || [])
      setActivities(activityResponse.activities || [])
      setRounds(roundsResponse.rounds || [])
      setMemberGroups(groupsResponse.groups || [])
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

  useEffect(() => {
    setAvatarLoadFailed(false)
    setCoverLoadFailed(false)
  }, [profile?.avatar_url, profile?.header_image_url])

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
        <View style={styles.heroCard}>
          <View style={styles.coverShell}>
            {profile?.header_image_url && !coverLoadFailed ? (
              <Image
                onError={() => setCoverLoadFailed(true)}
                source={{ uri: profile.header_image_url }}
                style={styles.coverImage}
              />
            ) : (
              <View style={styles.coverFallback}>
                <Ionicons color="rgba(246,231,186,0.8)" name="flag-outline" size={34} />
                <Text style={styles.coverFallbackText}>The golfer&apos;s clubhouse</Text>
              </View>
            )}
            <View style={styles.coverOverlay} />
            <View style={styles.coverActions}>
              <Pressable
                accessibilityLabel={status === 'connected' ? 'Connected' : 'Add connection'}
                disabled={connecting || status === 'connected' || status === 'pending' || status === 'incoming_pending'}
                onPress={handleConnect}
                style={[styles.coverActionButton, styles.connectionCoverButton, status === 'connected' && styles.connectionCoverButtonActive]}
              >
                <Ionicons
                  color={status === 'connected' ? '#e8c45b' : '#fffaf0'}
                  name={status === 'connected' ? 'checkmark-circle' : status === 'pending' ? 'time-outline' : 'person-add-outline'}
                  size={21}
                />
              </Pressable>
              <Pressable
                accessibilityLabel="Add to group"
                onPress={() => router.push('/groups')}
                style={styles.coverActionButton}
              >
                <Ionicons color="#fffaf0" name="people-outline" size={20} />
              </Pressable>
            </View>

            <View style={styles.coverIdentity}>
              <View style={styles.avatarWrap}>
                {profile?.avatar_url && !avatarLoadFailed ? (
                  <Image
                    onError={() => setAvatarLoadFailed(true)}
                    source={{ uri: profile.avatar_url }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Avatar label={displayName} size={92} />
                )}
              </View>
              <View style={styles.identityStack}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={styles.name}>{displayName}</Text>
                  {profile?.is_founder_verified ? <Ionicons color="#6ad5ef" name="checkmark-circle" size={19} /> : null}
                  {profile?.is_founder_verified ? <Ionicons color="#e8c45b" name="trophy" size={17} /> : null}
                </View>
                <Text numberOfLines={1} style={styles.homeCourse}>{homeCourse}</Text>
                <View style={styles.heroStats}>
                  <View style={styles.heroStat}><Text style={styles.heroStatLabel}>Handicap</Text><Text style={styles.heroStatValue}>{profile?.handicap ?? '--'}</Text></View>
                  <Pressable onPress={() => id && router.push(`/users/${id}/connections`)} style={styles.heroStat}><Text style={styles.heroStatLabel}>Connections</Text><Text style={styles.heroStatValue}>{connectedGolfers.length}</Text></Pressable>
                  <Pressable onPress={() => id && router.push(`/users/${id}/reviews`)} style={styles.heroStat}><Text style={styles.heroStatLabel}>Rating</Text><Text style={styles.heroStatValue}>{ratingSummary.average ? ratingSummary.average.toFixed(1) : '--'}</Text></Pressable>
                </View>
              </View>
            </View>
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
            <View style={styles.aboutProfilePanel}>
            {profile?.bio ? (
              <View style={styles.aboutBioCard}>
                <Text style={styles.aboutBioEyebrow}>Member&apos;s Note</Text>
                <Text style={styles.aboutBioText}>{profile.bio}</Text>
              </View>
            ) : null}
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
            <View style={styles.aboutGroupsSection}>
              <View style={styles.aboutSectionHeading}>
                <Ionicons color="#d8bd76" name="people-outline" size={16} />
                <Text style={styles.aboutSectionTitle}>Member Groups</Text>
              </View>
              {memberGroups.length ? (
                <View style={styles.memberGroupRow}>
                  {memberGroups.slice(0, 6).map((group) => (
                    <Pressable key={group.id} onPress={() => router.push(`/group/${group.id}`)} style={styles.memberGroupItem}>
                      {group.logo_url || group.image_url ? (
                        <Image source={{ uri: group.logo_url || group.image_url || '' }} style={styles.memberGroupLogo} />
                      ) : (
                        <View style={styles.memberGroupLogoFallback}><Text style={styles.memberGroupInitial}>{group.name.slice(0, 1)}</Text></View>
                      )}
                      <Text numberOfLines={1} style={styles.memberGroupName}>{group.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : <Text style={styles.helper}>No groups joined yet.</Text>}
            </View>
            <Text style={styles.aboutSectionTitle}>What&apos;s In The Bag</Text>
            <View style={styles.bagGrid}>
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
            </View>
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
    padding: 20,
    paddingBottom: 150
  },
  heroCard: {
    backgroundColor: '#183f30',
    borderColor: 'rgba(216,189,118,0.24)',
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 0
  },
  coverShell: {
    height: 286,
    overflow: 'hidden',
    position: 'relative'
  },
  coverImage: {
    height: '100%',
    width: '100%'
  },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: '#245640',
    gap: 8,
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  coverFallbackText: {
    color: '#f6e7ba',
    fontFamily: 'Georgia',
    fontSize: 16,
    fontWeight: '700'
  },
  coverOverlay: {
    backgroundColor: 'rgba(3,10,8,0.42)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  coverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 12,
    position: 'absolute',
    right: 12,
    top: 12
  },
  coverActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,18,12,0.52)',
    borderColor: 'rgba(255,250,240,0.22)',
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  connectionCoverButton: {
    backgroundColor: 'rgba(4,18,12,0.62)'
  },
  connectionCoverButtonActive: {
    backgroundColor: 'rgba(51,93,45,0.82)',
    borderColor: 'rgba(232,196,91,0.55)'
  },
  avatarWrap: {
    borderColor: '#f6e7ba',
    borderRadius: 999,
    borderWidth: 3,
    height: 92,
    overflow: 'hidden',
    width: 92
  },
  avatarImage: {
    height: '100%',
    width: '100%'
  },
  coverIdentity: {
    alignItems: 'center',
    bottom: 14,
    gap: 5,
    left: 16,
    position: 'absolute',
    right: 16
  },
  identityStack: {
    alignItems: 'center',
    gap: 3
  },
  name: {
    color: '#fffaf0',
    flexShrink: 1,
    fontFamily: 'Georgia',
    fontSize: 27,
    fontWeight: '700'
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5
  },
  homeCourse: {
    color: 'rgba(255,250,240,0.78)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  heroStats: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 5
  },
  heroStat: {
    backgroundColor: 'rgba(5,28,20,0.5)',
    borderColor: 'rgba(255,250,240,0.16)',
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 70,
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  heroStatLabel: {
    color: 'rgba(246,231,186,0.64)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
    textTransform: 'uppercase'
  },
  heroStatValue: {
    color: '#fffaf0',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1
  },
  actionRow: {
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
  aboutBioCard: {
    backgroundColor: 'rgba(7,39,28,0.58)',
    borderColor: 'rgba(216,189,118,0.32)',
    borderLeftWidth: 3,
    borderRadius: 18,
    borderWidth: 1,
    gap: 7,
    padding: 14
  },
  aboutBioEyebrow: {
    color: '#d8bd76',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase'
  },
  aboutBioText: {
    color: '#f5eedc',
    fontFamily: 'Georgia',
    fontSize: 15,
    lineHeight: 22
  },
  aboutProfilePanel: {
    backgroundColor: '#28634d',
    borderColor: 'rgba(216,189,118,0.24)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 12
  },
  aboutSectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7
  },
  aboutGroupsSection: {
    backgroundColor: 'rgba(7,39,28,0.3)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 19,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  memberGroupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9
  },
  memberGroupItem: {
    alignItems: 'center',
    gap: 5,
    maxWidth: 70,
    width: 70
  },
  memberGroupLogo: {
    borderColor: 'rgba(216,189,118,0.28)',
    borderRadius: 15,
    borderWidth: 1,
    height: 48,
    width: 48
  },
  memberGroupLogoFallback: {
    alignItems: 'center',
    backgroundColor: '#3b7e65',
    borderColor: 'rgba(216,189,118,0.28)',
    borderRadius: 15,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  memberGroupInitial: {
    color: '#f6e7ba',
    fontFamily: 'Georgia',
    fontSize: 19,
    fontWeight: '800'
  },
  memberGroupName: {
    color: '#fffaf0',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center'
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
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    borderWidth: 1,
    gap: 4,
    minWidth: '47%',
    padding: 14
  },
  bagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
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
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(255,255,255,0.15)',
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
