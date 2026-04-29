import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Clipboard,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { Avatar } from '@/components/Avatar'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiDelete, apiGet, apiPost } from '@/lib/api'
import { getShareableProfileLink, uploadImageToStorage } from '@/lib/supabase'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type BadgeRecord = {
  id: string
  badge?: {
    name?: string
  }
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

type RatingSummary = {
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

type CourseHoleAverage = {
  courseName: string
  rounds: number
  holes: {
    hole: number
    average: number
  }[]
}

type AceDetails = {
  course?: string | null
  date?: string | null
  hole?: string | null
}

const bagFields: { key: keyof BagItems; label: string; placeholder: string }[] = [
  { key: 'driver', label: 'Driver', placeholder: 'Qi10 LS 9.0' },
  { key: 'fairway_woods', label: 'Fairway Woods', placeholder: '3 wood / 5 wood setup' },
  { key: 'hybrids', label: 'Hybrids', placeholder: '3H / 4H' },
  { key: 'irons', label: 'Irons', placeholder: 'T100 4-PW' },
  { key: 'wedges', label: 'Wedges', placeholder: '50 / 54 / 58' },
  { key: 'putter', label: 'Putter', placeholder: 'Scotty Cameron Newport 2' },
  { key: 'ball', label: 'Golf Ball', placeholder: 'Pro V1x' },
  { key: 'shoes', label: 'Golf Shoes', placeholder: 'FootJoy Premiere / Nike Victory Tour' }
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

function formatBagFieldLabel(key: keyof BagItems | string) {
  switch (key) {
    case 'driver':
      return 'driver'
    case 'fairway_woods':
      return 'fairway woods'
    case 'hybrids':
      return 'hybrids'
    case 'irons':
      return 'irons'
    case 'wedges':
      return 'wedges'
    case 'putter':
      return 'putter'
    case 'ball':
      return 'golf ball'
    case 'shoes':
      return 'golf shoes'
    default:
      return String(key).replace(/_/g, ' ').toLowerCase()
  }
}

function buildBagUpdateSummary(previousBag: BagItems, nextBag: BagItems) {
  const allKeys = Array.from(
    new Set([...Object.keys(previousBag || {}), ...Object.keys(nextBag || {})])
  ) as (keyof BagItems)[]

  const changes = allKeys
    .map((key) => {
      const previousValue = (previousBag?.[key] || '').trim()
      const nextValue = (nextBag?.[key] || '').trim()

      if (previousValue === nextValue) return null

      return {
        key,
        label: formatBagFieldLabel(key),
        previous_value: previousValue,
        next_value: nextValue
      }
    })
    .filter(Boolean) as {
      key: keyof BagItems
      label: string
      previous_value: string
      next_value: string
    }[]

  return {
    changes,
    labels: changes.map((change) => change.label),
    description: changes.length
      ? `Updated ${changes.map((change) => change.label).join(', ')}`
      : 'Refreshed bag setup on the golfer profile'
  }
}

function formatActivityTime(value: string) {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diff < hour) {
    const minutes = Math.max(1, Math.round(diff / (60 * 1000)))
    return `${minutes}m ago`
  }

  if (diff < day) {
    return `${Math.round(diff / hour)}h ago`
  }

  return `${Math.round(diff / day)}d ago`
}

function getActivityLabel(activity: ActivityItem) {
  switch (activity.activity_type) {
    case 'tee_time_created':
      return 'Posted a tee time'
    case 'tee_time_updated':
      return 'Updated a tee time'
    case 'round_logged':
      return 'Logged a score'
    case 'profile_updated':
      return 'Updated profile'
    case 'profile_photo_updated':
      return 'Updated profile photo'
    case 'profile_cover_updated':
      return 'Updated cover photo'
    case 'tee_time_joined':
      return 'Joined a tee time'
    case 'connection_added':
      return 'Added a new connection'
    case 'bag_updated':
      return 'Updated what is in the bag'
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
    default:
      return activity.title || 'Recent activity'
  }
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

export default function ProfileTab() {
  const { loading, profile, refreshProfile, session, signOut, updateProfile, user } = useAuth()
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showBagModal, setShowBagModal] = useState(false)
  const [savingBag, setSavingBag] = useState(false)
  const [activeProfileTab, setActiveProfileTab] = useState<'activity' | 'about'>('activity')
  const [refreshing, setRefreshing] = useState(false)
  const [badges, setBadges] = useState<BadgeRecord[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [rounds, setRounds] = useState<RoundRecord[]>([])
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    average: null,
    count: 0,
    viewerRating: null
  })
  const [bagItems, setBagItems] = useState<BagItems>({})
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    location: '',
    handicap: '',
    home_course: '',
    ace_course: '',
    ace_date: '',
    ace_hole: ''
  })

  const shareLink = user?.id ? getShareableProfileLink(user.id) : ''
  const shareQrUrl = shareLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareLink)}`
    : ''
  const displayName = useMemo(() => {
    return (
      profile?.full_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      user?.email?.split('@')[0] ||
      'UGC Member'
    )
  }, [profile, user])

  const isVerified = !!session?.user?.email_confirmed_at
  const founderBadge = badges.find((badge) => badge.badge?.name === 'Founding Member')
  const aceDetails = useMemo(() => normalizeAceDetails(profile?.ace_details), [profile?.ace_details])
  const acceptedConnections = useMemo(() => {
    return connections
      .map((connection) =>
        connection.requester_id === user?.id ? connection.recipient : connection.requester
      )
      .filter(Boolean) as UserCard[]
  }, [connections, user?.id])
  const profileSummary = useMemo(() => {
    const bits = [
      profile?.home_course || profile?.home_club || null,
      profile?.location || null,
      profile?.handicap !== null && profile?.handicap !== undefined
        ? `Handicap ${profile.handicap}`
        : null,
      `${acceptedConnections.length} Connections`,
      ratingSummary.average ? `${ratingSummary.average.toFixed(1)}★` : null
    ].filter(Boolean)

    return bits.length ? bits.join(' • ') : 'Complete your golfer profile'
  }, [
    acceptedConnections.length,
    profile?.handicap,
    profile?.home_club,
    profile?.home_course,
    profile?.location,
    ratingSummary.average
  ])

  const scoreSummary = useMemo(() => {
    if (!rounds.length) {
      return {
        averageRound: null as number | null,
        bestRound: null as RoundRecord | null,
        totalRounds: 0
      }
    }

    const averageRound =
      rounds.reduce((sum, round) => sum + round.total_score, 0) / rounds.length
    const bestRound = [...rounds].sort((a, b) => a.total_score - b.total_score)[0]

    return {
      averageRound,
      bestRound,
      totalRounds: rounds.length
    }
  }, [rounds])

  const courseHoleAverages = useMemo<CourseHoleAverage[]>(() => {
    const byCourse = new Map<string, RoundRecord[]>()

    rounds.forEach((round) => {
      const courseName = round.course_name || 'Unknown course'
      const courseRounds = byCourse.get(courseName) || []
      courseRounds.push(round)
      byCourse.set(courseName, courseRounds)
    })

    return Array.from(byCourse.entries())
      .map(([courseName, courseRounds]) => {
        const maxHoles = Math.max(...courseRounds.map((round) => round.holes_played || round.hole_scores.length || 0))
        const holes = Array.from({ length: maxHoles }).map((_, index) => {
          const scores = courseRounds
            .map((round) => round.hole_scores?.[index])
            .filter((score): score is number => Number.isFinite(score))
          const average = scores.length
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0

          return {
            hole: index + 1,
            average
          }
        })

        return {
          courseName,
          rounds: courseRounds.length,
          holes
        }
      })
      .sort((a, b) => b.rounds - a.rounds)
  }, [rounds])

  const loadProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      await refreshProfile(user.id)
      const [userBadges, activityResponse, connectionResponse, ratingResponse, scoreResponse] = await Promise.all([
        apiGet<BadgeRecord[]>(`/api/badges?action=user_badges&user_id=${encodeURIComponent(user.id)}`),
        apiGet<{ success: boolean; activities: ActivityItem[] }>(
          `/api/activities?user_id=${encodeURIComponent(user.id)}&limit=6`
        ).catch(() => ({ success: true, activities: [] })),
        apiGet<{ success: boolean; connections: ConnectionRecord[] }>(
          `/api/users?action=connections&id=${encodeURIComponent(user.id)}`
        ).catch(() => ({ success: true, connections: [] })),
        apiGet<RatingSummary>(`/api/users?action=rating&id=${encodeURIComponent(user.id)}&viewer_id=${encodeURIComponent(user.id)}`)
          .catch(() => ({ average: null, count: 0, viewerRating: null })),
        apiGet<{ success: boolean; rounds: RoundRecord[] }>(`/api/scores?user_id=${encodeURIComponent(user.id)}`)
          .catch(() => ({ success: true, rounds: [] }))
      ])

      setBadges(userBadges || [])
      setActivities(activityResponse?.activities || [])
      setConnections(connectionResponse?.connections || [])
      setRatingSummary(ratingResponse)
      setRounds(scoreResponse.rounds || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [refreshProfile, user?.id])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      loadProfile()
    }
  }, [loadProfile, user?.id])

  useEffect(() => {
    const nextAce = normalizeAceDetails(profile?.ace_details)
    setForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      handicap: profile?.handicap?.toString() || '',
      home_course: profile?.home_course || profile?.home_club || '',
      ace_course: nextAce?.course || '',
      ace_date: nextAce?.date || '',
      ace_hole: nextAce?.hole || ''
    })
  }, [profile])

  useEffect(() => {
    setBagItems(normalizeBagItems(profile?.bag_items))
  }, [profile?.bag_items])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const nextHomeCourse = form.home_course.trim()
      const nextLocation = form.location.trim()
      const nextHandicap = form.handicap ? Number(form.handicap) : null
      const nextAceCourse = form.ace_course.trim()
      const nextAceDate = form.ace_date.trim()
      const nextAceHole = form.ace_hole.trim()
      const nextAceDetails =
        nextAceCourse || nextAceDate || nextAceHole
          ? {
              course: nextAceCourse,
              date: nextAceDate,
              hole: nextAceHole
            }
          : null
      const updatedFields: string[] = []

      if ((profile?.home_course || profile?.home_club || '') !== nextHomeCourse) {
        updatedFields.push('home course')
      }

      if ((profile?.location || '') !== nextLocation) {
        updatedFields.push('location')
      }

      if ((profile?.handicap ?? null) !== nextHandicap) {
        updatedFields.push('handicap')
      }

      if (
        (aceDetails?.course || '') !== nextAceCourse ||
        (aceDetails?.date || '') !== nextAceDate ||
        (aceDetails?.hole || '') !== nextAceHole
      ) {
        updatedFields.push('hole in one')
      }

      await updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        bio: form.bio.trim(),
        location: nextLocation,
        handicap: nextHandicap,
        home_course: nextHomeCourse,
        ace_details: nextAceDetails
      })

      if (user?.id) {
        await apiPost('/api/activities', {
          user_id: user.id,
          activity_type: 'profile_updated',
          title: updatedFields.length ? 'Updated golfer profile' : 'Saved golfer profile',
          description: updatedFields.length
            ? `Updated ${updatedFields.join(', ')}`
            : 'Saved profile changes from mobile',
          metadata: {
            fields_updated: updatedFields
          }
        }).catch(() => null)
      }

      setShowEditModal(false)
      Alert.alert('Profile saved', 'Your mobile profile details are updated.')
      await loadProfile()
    } catch (error) {
      Alert.alert('Unable to save profile', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePickImage = async (target: 'avatar' | 'cover') => {
    if (!user?.id) return
    const uploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
      const fileName =
        asset.fileName || `${target === 'avatar' ? 'avatar' : 'cover'}-${Date.now()}.jpg`
      const mimeType = asset.mimeType || 'image/jpeg'

      if (target === 'avatar') {
        setUploadingAvatar(true)
      } else {
        setUploadingCover(true)
      }

      try {
        const upload = await uploadImageToStorage({
          folder: target === 'avatar' ? 'avatars' : 'profile-covers',
          fileName,
          mimeType,
          uri: asset.uri
        })

        await updateProfile(
          target === 'avatar'
            ? {
                avatar_url: upload.publicUrl
              }
            : {
                header_image_url: upload.publicUrl
              }
        )

        Alert.alert(
          target === 'avatar' ? 'Profile photo updated' : 'Cover photo updated',
          target === 'avatar'
            ? 'Your golfer profile now has a new photo.'
            : 'Your profile header now has a new cover photo.'
        )
        await apiPost('/api/activities', {
          user_id: user.id,
          activity_type: target === 'avatar' ? 'profile_photo_updated' : 'profile_cover_updated',
          title: target === 'avatar' ? 'Updated profile photo' : 'Updated cover photo',
          description:
            target === 'avatar'
              ? 'Changed golfer profile photo'
              : 'Changed golfer profile cover photo',
          metadata: {
            target
          }
        }).catch(() => null)
        await loadProfile()
      } catch (error) {
        Alert.alert('Unable to update photo', error instanceof Error ? error.message : 'Please try again.')
      } finally {
        if (target === 'avatar') {
          setUploadingAvatar(false)
        } else {
          setUploadingCover(false)
        }
      }
    }

    const launchLibrary = async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo library access to choose a profile picture.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: target === 'avatar' ? [1, 1] : [16, 9],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      await uploadAsset(result.assets[0])
    }

    const launchCamera = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Camera access needed', 'Allow camera access to take a profile picture.')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: target === 'avatar' ? [1, 1] : [16, 9],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      await uploadAsset(result.assets[0])
    }

    Alert.alert(
      target === 'avatar' ? 'Update profile photo' : 'Update cover photo',
      target === 'avatar'
        ? 'Choose how you want to set your golfer photo.'
        : 'Choose how you want to set your profile cover photo.',
      [
      { text: 'Take Photo', onPress: () => void launchCamera() },
      { text: 'Choose From Library', onPress: () => void launchLibrary() },
      { style: 'cancel', text: 'Cancel' }
      ]
    )
  }

  const handleSaveBag = async () => {
    setSavingBag(true)

    try {
      const bagSummary = buildBagUpdateSummary(normalizeBagItems(profile?.bag_items), bagItems)

      await updateProfile({ bag_items: bagItems })
      await apiPost('/api/activities', {
        user_id: user?.id,
        activity_type: 'bag_updated',
        title: bagSummary.labels.length ? `Updated ${bagSummary.labels.join(', ')}` : 'Updated what is in the bag',
        description: bagSummary.description,
        metadata: {
          bag_categories: Object.entries(bagItems)
            .filter(([, value]) => value?.trim())
            .map(([key]) => key),
          bag_changes: bagSummary.changes
        }
      }).catch(() => null)
      setShowBagModal(false)
      Alert.alert('Bag updated', 'Your bag setup is now on your profile.')
      await loadProfile()
    } catch (error) {
      Alert.alert('Unable to save bag', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSavingBag(false)
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
              loadProfile()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader
          largeLogo
          leftIconName="qr-code-outline"
          onLeftPress={() => {
            setShowEditModal(false)
            setShowSettingsModal(false)
            setShowProfileMenu(false)
            setShowShareModal(true)
          }}
          rightIconName="ellipsis-horizontal"
          onRightPress={() => {
            setShowShareModal(false)
            setShowSettingsModal(false)
            setShowProfileMenu(true)
          }}
        />

        <View style={styles.headerCard}>
          <View style={styles.coverShell}>
            <View style={styles.coverGlow} />
            {profile?.header_image_url ? (
              <Image source={{ uri: profile.header_image_url }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverFallback}>
                <Text style={styles.coverFallbackText}>Add a profile cover photo</Text>
              </View>
            )}
          </View>
          <View style={styles.identityStack}>
            <View style={styles.avatarWrap}>
              <Avatar label={displayName} size={108} uri={profile?.avatar_url} />
            </View>
            <View style={styles.profileTopCopy}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{displayName}</Text>
                {founderBadge ? (
                  <Ionicons color={palette.gold} name="cafe" size={20} style={styles.crownIcon} />
                ) : null}
              </View>
              {isVerified ? (
                <View style={styles.badgeRow}>
                  <Text style={styles.verified}>Verified</Text>
                </View>
              ) : null}
              <Pressable onPress={() => router.push('/connections')} style={styles.infoRibbon}>
                <Text style={styles.headlineMeta}>{profileSummary}</Text>
              </Pressable>
              <View style={styles.ratingSummaryRow}>
                <View style={styles.ratingBadge}>
                  <Ionicons color={palette.gold} name="star" size={16} />
                  <Text style={styles.ratingBadgeText}>
                    {ratingSummary.average ? ratingSummary.average.toFixed(1) : 'New golfer'}
                  </Text>
                </View>
                <Text style={styles.ratingSummaryText}>
                  {ratingSummary.count ? `${ratingSummary.count} ratings` : 'Waiting on first rating'}
                </Text>
              </View>
              {profile?.bio ? (
                <View style={styles.bioCard}>
                  <Text style={styles.meta}>{profile.bio}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.profileTabRow}>
            <Pressable
              onPress={() => setActiveProfileTab('activity')}
              style={[styles.profileTab, activeProfileTab === 'activity' && styles.profileTabActive]}
            >
              <Text style={[styles.profileTabText, activeProfileTab === 'activity' && styles.profileTabTextActive]}>
                Activity
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveProfileTab('about')}
              style={[styles.profileTab, activeProfileTab === 'about' && styles.profileTabActive]}
            >
              <Text style={[styles.profileTabText, activeProfileTab === 'about' && styles.profileTabTextActive]}>
                About
              </Text>
            </Pressable>
          </View>
          {activeProfileTab === 'activity' ? (
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.infoTitle}>Activity</Text>
                <View style={styles.activityCountPill}>
                  <Text style={styles.activityCountText}>{activities.length}</Text>
                </View>
              </View>
              <View style={styles.scorePanel}>
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreLabel}>Rounds</Text>
                  <Text style={styles.scoreValue}>{scoreSummary.totalRounds || '--'}</Text>
                </View>
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreLabel}>Avg Score</Text>
                  <Text style={styles.scoreValue}>
                    {scoreSummary.averageRound ? scoreSummary.averageRound.toFixed(1) : '--'}
                  </Text>
                </View>
                <View style={styles.scoreStat}>
                  <Text style={styles.scoreLabel}>Best</Text>
                  <Text style={styles.scoreValue}>{scoreSummary.bestRound?.total_score || '--'}</Text>
                </View>
              </View>
              {courseHoleAverages.slice(0, 2).map((course) => (
                <View key={course.courseName} style={styles.courseAverageCard}>
                  <View style={styles.courseAverageHeader}>
                    <Text style={styles.courseAverageTitle}>{course.courseName}</Text>
                    <Text style={styles.courseAverageMeta}>{course.rounds} logged rounds</Text>
                  </View>
                  <View style={styles.holeAverageGrid}>
                    {course.holes.slice(0, 18).map((hole) => (
                      <View key={hole.hole} style={styles.holeAveragePill}>
                        <Text style={styles.holeAverageLabel}>H{hole.hole}</Text>
                        <Text style={styles.holeAverageValue}>{hole.average ? hole.average.toFixed(1) : '--'}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
              {busy ? <ActivityIndicator color={palette.aqua} /> : null}
              {!busy && activities.length === 0 ? (
                <Text style={styles.infoLine}>No profile activity yet. Tee times, rounds, photo changes, connections, and bag updates will show up here.</Text>
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
                            {formatActivityTime(activity.created_at)} • {linkedRound.holes_played} holes
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
                      <Text style={styles.activityTitle}>{getActivityLabel(activity)}</Text>
                      {activity.description ? <Text style={styles.activityDescription}>{activity.description}</Text> : null}
                    </View>
                    <Text style={styles.activityTime}>{formatActivityTime(activity.created_at)}</Text>
                  </View>
                )
              })}
            </View>
          ) : (
            <View style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <Text style={styles.infoTitle}>About</Text>
                <Pressable onPress={() => setShowBagModal(true)} style={styles.bagEditButton}>
                  <Ionicons color={palette.aqua} name="create-outline" size={16} />
                  <Text style={styles.bagEditText}>Edit</Text>
                </Pressable>
              </View>
              <View style={styles.aboutInfoGrid}>
                <View style={styles.aboutInfoCard}>
                  <Text style={styles.aboutInfoLabel}>Home Course</Text>
                  <Text style={styles.aboutInfoValue}>{profile?.home_course || profile?.home_club || 'Not added yet'}</Text>
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
                  <Text style={styles.aboutInfoValue}>{scoreSummary.totalRounds || '0'}</Text>
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
                  <Text style={styles.infoLine}>No ace logged yet.</Text>
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
        </View>

        <Modal
          animationType="fade"
          transparent
          visible={showProfileMenu}
          onRequestClose={() => setShowProfileMenu(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowProfileMenu(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.sectionEyebrow}>Profile</Text>
              <Text style={styles.infoTitle}>Manage your page</Text>
              <Text style={styles.infoLine}>
                Keep the profile header clean up top, and open the tools you need from this quick menu.
              </Text>
              <PrimaryButton
                label="Edit Profile"
                variant="ghost"
                onPress={() => {
                  setShowProfileMenu(false)
                  setShowShareModal(false)
                  setShowEditModal(true)
                }}
              />
              <PrimaryButton
                label="Settings"
                variant="ghost"
                onPress={() => {
                  setShowProfileMenu(false)
                  setShowShareModal(false)
                  setShowSettingsModal(true)
                }}
              />
              <PrimaryButton label="Close" variant="ghost" onPress={() => setShowProfileMenu(false)} />
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={showSettingsModal}
          onRequestClose={() => setShowSettingsModal(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowSettingsModal(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.sectionEyebrow}>Settings</Text>
              <Text style={styles.infoTitle}>Manage your account</Text>
              <Text style={styles.infoLine}>
                The profile page stays focused on your golfer identity here, and the rest of the account actions live in one clean place.
              </Text>
              <PrimaryButton
                label="Help & Support"
                variant="ghost"
                onPress={() => {
                  setShowSettingsModal(false)
                  router.push('/help')
                }}
              />
              <PrimaryButton
                label="Privacy Policy"
                variant="ghost"
                onPress={() => {
                  setShowSettingsModal(false)
                  void Linking.openURL('https://www.ultimategolfcommunity.com/privacy')
                }}
              />
              <PrimaryButton
                label="Scores"
                variant="ghost"
                onPress={() => {
                  setShowSettingsModal(false)
                  router.push('/scores')
                }}
              />
              <PrimaryButton
                label="Sign Out"
                variant="ghost"
                onPress={() => {
                  setShowSettingsModal(false)
                  void signOut()
                }}
              />
              <PrimaryButton
                label="Delete Account"
                variant="ghost"
                onPress={() => {
                  setShowSettingsModal(false)

                  if (!user?.id) return

                  Alert.alert(
                    'Delete account?',
                    'This permanently removes your account access from Ultimate Golf Community.',
                    [
                      { style: 'cancel', text: 'Cancel' },
                      {
                        style: 'destructive',
                        text: 'Delete',
                        onPress: async () => {
                          try {
                            await apiDelete('/api/account/delete', { user_id: user.id })
                            await signOut()
                          } catch (error) {
                            Alert.alert(
                              'Unable to delete account',
                              error instanceof Error ? error.message : 'Please try again.'
                            )
                          }
                        }
                      }
                    ]
                  )
                }}
              />
              <PrimaryButton label="Close" variant="ghost" onPress={() => setShowSettingsModal(false)} />
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={showBagModal}
          onRequestClose={() => setShowBagModal(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowBagModal(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.infoTitle}>What is in the bag</Text>
              <Text style={styles.infoLine}>
                Add the clubs and ball you actually game so your profile feels more like a real golfer card.
              </Text>
              {bagFields.map((field) => (
                <TextInput
                  key={field.key}
                  onChangeText={(value) =>
                    setBagItems((current) => ({
                      ...current,
                      [field.key]: value
                    }))
                  }
                  placeholder={field.placeholder}
                  placeholderTextColor={palette.textMuted}
                  style={styles.input}
                  value={bagItems[field.key] || ''}
                />
              ))}
              <PrimaryButton label="Save Bag" loading={savingBag} onPress={handleSaveBag} />
              <PrimaryButton label="Close" variant="ghost" onPress={() => setShowBagModal(false)} />
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={showShareModal}
          onRequestClose={() => setShowShareModal(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowShareModal(false)}>
            <Pressable style={[styles.modalCard, styles.shareModalCard]} onPress={() => {}}>
              <Text style={styles.sectionEyebrow}>Share</Text>
              <Text style={styles.infoTitle}>Invite with link or QR</Text>
              <Text style={styles.infoLine}>
                Share this link or let another golfer scan the code to jump straight into adding you.
              </Text>
              <View style={styles.qrCard}>
                <View style={styles.qrBadge}>
                  <Ionicons color={palette.aqua} name="qr-code-outline" size={16} />
                  <Text style={styles.qrBadgeText}>Scan to connect</Text>
                </View>
                {shareQrUrl ? <Image source={{ uri: shareQrUrl }} style={styles.qrImage} /> : null}
                <Text style={styles.qrHint}>Point your camera at the code or send the invite link below.</Text>
              </View>
              <View style={styles.shareLinkBox}>
                <Text style={styles.shareLinkLabel}>Invite link</Text>
                <Text selectable numberOfLines={2} style={styles.shareLinkText}>
                  {shareLink}
                </Text>
              </View>
              <View style={styles.shareActionRow}>
                <Pressable
                  onPress={() => {
                    Clipboard.setString(shareLink)
                    Alert.alert('Copied', 'Invite link copied to your clipboard.')
                  }}
                  style={styles.shareActionButton}
                >
                  <Ionicons color={palette.text} name="copy-outline" size={18} />
                  <Text style={styles.shareActionText}>Copy Link</Text>
                </Pressable>
                <Pressable
                  onPress={() => Share.share({ message: shareLink, url: shareLink })}
                  style={[styles.shareActionButton, styles.shareActionButtonPrimary]}
                >
                  <Ionicons color={palette.bg} name="share-social-outline" size={18} />
                  <Text style={[styles.shareActionText, styles.shareActionTextPrimary]}>Share</Text>
                </Pressable>
              </View>
              <PrimaryButton label="Close" variant="ghost" onPress={() => setShowShareModal(false)} />
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditModal(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.infoTitle}>Edit profile</Text>
              <View style={styles.editMediaRow}>
                <PrimaryButton
                  label={uploadingAvatar ? 'Updating Photo...' : 'Edit Profile Photo'}
                  variant="ghost"
                  loading={uploadingAvatar}
                  onPress={() => void handlePickImage('avatar')}
                />
                <PrimaryButton
                  label={uploadingCover ? 'Updating Cover...' : 'Edit Cover Photo'}
                  variant="ghost"
                  loading={uploadingCover}
                  onPress={() => void handlePickImage('cover')}
                />
              </View>
              <View style={styles.editRow}>
                <TextInput
                  onChangeText={(value) => setForm((current) => ({ ...current, first_name: value }))}
                  placeholder="First name"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.first_name}
                />
                <TextInput
                  onChangeText={(value) => setForm((current) => ({ ...current, last_name: value }))}
                  placeholder="Last name"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.last_name}
                />
              </View>
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, username: value }))}
                placeholder="Username"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.username}
              />
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, home_course: value }))}
                placeholder="Home course"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.home_course}
              />
              <View style={styles.editRow}>
                <TextInput
                  onChangeText={(value) => setForm((current) => ({ ...current, ace_course: value }))}
                  placeholder="Hole-in-one course"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.ace_course}
                />
                <TextInput
                  onChangeText={(value) => setForm((current) => ({ ...current, ace_hole: value }))}
                  placeholder="Ace hole"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.ace_hole}
                />
              </View>
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, ace_date: value }))}
                placeholder="Hole-in-one date, ex. 2025-08-14"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.ace_date}
              />
              <View style={styles.editRow}>
                <TextInput
                  onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
                  placeholder="Location"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.location}
                />
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => setForm((current) => ({ ...current, handicap: value }))}
                  placeholder="Handicap"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.handicap}
                />
              </View>
              <TextInput
                multiline
                onChangeText={(value) => setForm((current) => ({ ...current, bio: value }))}
                placeholder="Bio"
                placeholderTextColor={palette.textMuted}
                style={[styles.input, styles.bioInput]}
                value={form.bio}
              />
              <PrimaryButton label="Save Profile" loading={saving} onPress={handleSave} />
              <PrimaryButton label="Close" variant="ghost" onPress={() => setShowEditModal(false)} />
            </Pressable>
          </Pressable>
        </Modal>
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
  headerCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 16,
    marginTop: -12,
    overflow: 'hidden',
    padding: 18
  },
  coverShell: {
    borderRadius: 22,
    height: 190,
    marginBottom: 26,
    overflow: 'hidden',
    position: 'relative'
  },
  coverGlow: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderRadius: 999,
    height: 180,
    position: 'absolute',
    right: -30,
    top: -80,
    width: 180,
    zIndex: 1
  },
  coverImage: {
    height: '100%',
    width: '100%'
  },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderWidth: 1,
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  coverFallbackText: {
    color: palette.textMuted,
    fontSize: 15,
    fontWeight: '600'
  },
  identityStack: {
    alignItems: 'center',
    marginTop: -58
  },
  avatarWrap: {
    borderColor: palette.card,
    borderRadius: 999,
    borderWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18
  },
  profileTopCopy: {
    alignItems: 'center',
    gap: 1,
    marginTop: 12,
    width: '100%'
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 0
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center'
  },
  name: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
    textAlign: 'center'
  },
  crownIcon: {
    marginBottom: -4,
    marginLeft: 8
  },
  infoRibbon: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: -16,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  headlineMeta: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center'
  },
  ratingSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 6
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
  ratingSummaryText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  verified: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.25)',
    borderRadius: 999,
    borderWidth: 1,
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  meta: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  bioCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%'
  },
  activityCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginTop: 2,
    padding: 16
  },
  profileTabRow: {
    backgroundColor: palette.bgElevated,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 6
  },
  profileTab: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12
  },
  profileTabActive: {
    backgroundColor: palette.card
  },
  profileTabText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  profileTabTextActive: {
    color: palette.text
  },
  activityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  activityCountPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activityCountText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800'
  },
  scorePanel: {
    flexDirection: 'row',
    gap: 10
  },
  scoreStat: {
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12
  },
  scoreLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  scoreValue: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800'
  },
  courseAverageCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  courseAverageHeader: {
    gap: 3
  },
  courseAverageTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800'
  },
  courseAverageMeta: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '600'
  },
  holeAverageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  holeAveragePill: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  holeAverageLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800'
  },
  holeAverageValue: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800'
  },
  bagEditButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.1)',
    borderColor: 'rgba(103,232,249,0.2)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  bagEditText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(3,10,8,0.68)',
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    maxHeight: '85%',
    padding: 20,
    width: '100%'
  },
  shareModalCard: {
    gap: 14
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
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 18
  },
  qrBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.10)',
    borderColor: 'rgba(103,232,249,0.22)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  qrBadgeText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  qrImage: {
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: 28,
    height: 224,
    marginBottom: 12,
    padding: 14,
    width: 224
  },
  qrHint: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center'
  },
  shareLinkBox: {
    backgroundColor: palette.bgElevated,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 14
  },
  shareLinkLabel: {
    color: palette.aqua,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  shareLinkText: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 20
  },
  shareActionRow: {
    flexDirection: 'row',
    gap: 10
  },
  shareActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 14
  },
  shareActionButtonPrimary: {
    backgroundColor: palette.white,
    borderColor: palette.white
  },
  shareActionText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700'
  },
  shareActionTextPrimary: {
    color: palette.bg
  },
  sectionEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  infoTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  infoLine: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  editRow: {
    flexDirection: 'row',
    gap: 10
  },
  editMediaRow: {
    gap: 10
  },
  input: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 52,
    paddingHorizontal: 16
  },
  flexInput: {
    flex: 1
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top'
  }
})
