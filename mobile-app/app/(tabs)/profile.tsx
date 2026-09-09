import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router, useFocusEffect } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
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
  member_count?: number
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
  if (activity.activity_type === 'profile_updated') {
    const fields = Array.isArray(activity.metadata?.fields_updated)
      ? activity.metadata.fields_updated.filter((field): field is string => typeof field === 'string')
      : []
    const socialLabels: Record<string, string> = {
      linkedin: 'LinkedIn',
      instagram: 'Instagram',
      facebook: 'Facebook',
      x: 'X'
    }
    const socialField = fields.find((field) => socialLabels[field])

    if (socialField) return `Added ${socialLabels[socialField]} to profile`
    if (fields.length === 1) return `Updated ${fields[0].replace(/_/g, ' ')}`
    return 'Updated profile'
  }

  if (activity.activity_type === 'bag_updated' && activity.description) {
    return activity.description.replace(/^Updated\s+/i, 'Updated ')
  }

  switch (activity.activity_type) {
    case 'tee_time_created':
      return 'Posted a tee time'
    case 'tee_time_updated':
      return 'Updated a tee time'
    case 'round_logged':
      return 'Logged a score'
    case 'photo_posted':
      return 'Shared a photo'
    case 'profile_photo_updated':
      return 'Updated profile photo'
    case 'profile_cover_updated':
      return 'Updated cover photo'
    case 'tee_time_joined':
      return 'Joined a tee time'
    case 'connection_added':
      return 'Added a new connection'
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

function getSpecificActivityLabel(activity: ActivityItem, actorName: string, relatedName?: string | null) {
  const groupName = typeof activity.metadata?.group_name === 'string' ? activity.metadata.group_name : null
  switch (activity.activity_type) {
    case 'connection_added': return relatedName ? `${actorName} added ${relatedName} as a connection` : `${actorName} added a new connection`
    case 'group_joined': return `${actorName} joined ${groupName || 'a group'}`
    case 'group_created': return `${actorName} created ${groupName || 'a group'}`
    case 'group_logo_updated': return `${actorName} updated ${groupName || 'a group'} logo`
    case 'group_cover_updated': return `${actorName} updated ${groupName || 'a group'} cover photo`
    case 'group_details_updated': return `${actorName} updated ${groupName || 'a group'} details`
    default: return `${actorName} ${getActivityLabel(activity).replace(/^./, (letter) => letter.toLowerCase())}`
  }
}

function getActivityIcon(activityType: string): keyof typeof Ionicons.glyphMap {
  switch (activityType) {
    case 'tee_time_created': case 'tee_time_updated': case 'tee_time_joined': return 'golf-outline'
    case 'round_logged': return 'trophy-outline'
    case 'photo_posted': case 'profile_photo_updated': case 'profile_cover_updated': return 'image-outline'
    case 'connection_added': return 'people-outline'
    case 'group_joined': case 'group_created': return 'people-circle-outline'
    case 'bag_updated': return 'briefcase-outline'
    default: return 'create-outline'
  }
}

function getActivityRoundId(activity: ActivityItem) {
  const metadataRoundId = typeof activity.metadata?.round_id === 'string' ? activity.metadata.round_id : null
  return metadataRoundId || activity.related_id || null
}

function getActivityRoundScore(activity: ActivityItem) {
  return typeof activity.metadata?.score === 'number' ? activity.metadata.score : null
}

function getActivityImageUrl(activity: ActivityItem) {
  const imageKeys = ['image_url', 'photo_url', 'image', 'photo']

  for (const key of imageKeys) {
    const value = activity.metadata?.[key]
    if (typeof value === 'string' && value.trim()) return value
  }

  return null
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
  const [expandedRoundId, setExpandedRoundId] = useState<string | null>(null)
  const isInlineAboutEditing = false
  const [refreshing, setRefreshing] = useState(false)
  const [badges, setBadges] = useState<BadgeRecord[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [rounds, setRounds] = useState<RoundRecord[]>([])
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [memberGroups, setMemberGroups] = useState<MemberGroup[]>([])
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
    linkedin_url: '',
    instagram_url: '',
    facebook_url: '',
    x_url: '',
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
  const socialLinks = useMemo(() => {
    const normalizeUrl = (value?: string | null) => {
      const trimmed = value?.trim() || ''
      if (!trimmed) return ''
      if (/^https?:\/\//i.test(trimmed)) return trimmed
      return `https://${trimmed}`
    }

    return [
      {
        key: 'linkedin',
        label: 'LinkedIn',
        icon: 'logo-linkedin' as const,
        url: normalizeUrl(profile?.linkedin_url)
      },
      {
        key: 'instagram',
        label: 'Instagram',
        icon: 'logo-instagram' as const,
        url: normalizeUrl(profile?.instagram_url)
      },
      {
        key: 'facebook',
        label: 'Facebook',
        icon: 'logo-facebook' as const,
        url: normalizeUrl(profile?.facebook_url)
      },
      {
        key: 'x',
        label: 'X',
        icon: 'logo-twitter' as const,
        url: normalizeUrl(profile?.x_url)
      }
    ].filter((item) => item.url)
  }, [profile?.facebook_url, profile?.instagram_url, profile?.linkedin_url, profile?.x_url])
  const acceptedConnections = useMemo(() => {
    return connections
      .map((connection) =>
        connection.requester_id === user?.id ? connection.recipient : connection.requester
      )
      .filter(Boolean) as UserCard[]
  }, [connections, user?.id])
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

  const loadProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      await refreshProfile(user.id)
      const [userBadges, activityResponse, connectionResponse, ratingResponse, scoreResponse, groupsResponse] = await Promise.all([
        apiGet<BadgeRecord[]>(`/api/badges?action=user_badges&user_id=${encodeURIComponent(user.id)}`),
        apiGet<{ success: boolean; activities: ActivityItem[] }>(
          `/api/activities?user_id=${encodeURIComponent(user.id)}&limit=24`
        ).catch(() => ({ success: true, activities: [] })),
        apiGet<{ success: boolean; connections: ConnectionRecord[] }>(
          `/api/users?action=connections&id=${encodeURIComponent(user.id)}`
        ).catch(() => ({ success: true, connections: [] })),
        apiGet<RatingSummary>(`/api/users?action=rating&id=${encodeURIComponent(user.id)}&viewer_id=${encodeURIComponent(user.id)}`)
          .catch(() => ({ average: null, count: 0, viewerRating: null })),
        apiGet<{ success: boolean; rounds: RoundRecord[] }>(`/api/scores?user_id=${encodeURIComponent(user.id)}`)
          .catch(() => ({ success: true, rounds: [] })),
        apiGet<{ success: boolean; groups: MemberGroup[] }>(`/api/groups?user_id=${encodeURIComponent(user.id)}`)
          .catch(() => ({ success: true, groups: [] }))
      ])

      setBadges(userBadges || [])
      setActivities(activityResponse?.activities || [])
      setConnections(connectionResponse?.connections || [])
      setRatingSummary(ratingResponse)
      setRounds(scoreResponse.rounds || [])
      setMemberGroups(groupsResponse.groups || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [refreshProfile, user?.id])

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return
      setBusy(true)
      void loadProfile()
    }, [loadProfile, user?.id])
  )

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
      linkedin_url: profile?.linkedin_url || '',
      instagram_url: profile?.instagram_url || '',
      facebook_url: profile?.facebook_url || '',
      x_url: profile?.x_url || '',
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

      if ((profile?.linkedin_url || '') !== form.linkedin_url.trim()) {
        updatedFields.push('linkedin')
      }

      if ((profile?.instagram_url || '') !== form.instagram_url.trim()) {
        updatedFields.push('instagram')
      }

      if ((profile?.facebook_url || '') !== form.facebook_url.trim()) {
        updatedFields.push('facebook')
      }

      if ((profile?.x_url || '') !== form.x_url.trim()) {
        updatedFields.push('x')
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
        linkedin_url: form.linkedin_url.trim(),
        instagram_url: form.instagram_url.trim(),
        facebook_url: form.facebook_url.trim(),
        x_url: form.x_url.trim(),
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
            target,
            image_url: target === 'avatar' ? upload.publicUrl : undefined
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
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
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
        <View style={styles.profileTopActions}>
          <Pressable
            accessibilityLabel="Share profile"
            onPress={() => {
              setShowEditModal(false)
              setShowSettingsModal(false)
              setShowProfileMenu(false)
              setShowShareModal(true)
            }}
            style={styles.profileHeaderButton}
          >
            <Ionicons color={palette.text} name="qr-code-outline" size={20} />
          </Pressable>
          <Pressable
            accessibilityLabel="Profile menu"
            onPress={() => {
              setShowShareModal(false)
              setShowSettingsModal(false)
              setShowProfileMenu(true)
            }}
            style={styles.profileHeaderButton}
          >
            <Ionicons color={palette.text} name="ellipsis-horizontal" size={20} />
          </Pressable>
        </View>

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
            <View style={styles.coverShade} />
            {socialLinks.length ? (
              <View style={styles.coverSocialLinks}>
                {socialLinks.map((link) => (
                  <Pressable
                    key={link.key}
                    accessibilityLabel={`Open ${link.label}`}
                    onPress={() => void Linking.openURL(link.url)}
                    style={styles.coverSocialLink}
                  >
                    <Ionicons color="#fffaf0" name={link.icon} size={17} />
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View style={styles.coverAvatarCluster}>
              <View style={styles.avatarWrap}>
                <Avatar label={displayName} size={94} uri={profile?.avatar_url} />
              </View>
            </View>
            <Pressable onPress={() => router.push('/connections')} style={styles.identityBusinessCard}>
              <View style={styles.identityTopRow}>
                <View style={styles.identityHeadline}>
                  <View style={styles.identityNameRow}>
                    <Text numberOfLines={1} style={styles.name}>
                      {displayName}
                    </Text>
                    {isVerified ? <Ionicons color="#38bdf8" name="checkmark-circle" size={20} /> : null}
                    {founderBadge ? <Text style={styles.identityCrown}>👑</Text> : null}
                  </View>
                </View>
              </View>

              <Text numberOfLines={1} style={styles.businessClubLine}>
                {profile?.home_course || profile?.home_club || 'No home club added yet'}
              </Text>

              <View style={styles.businessMetricsRow}>
                <View style={styles.businessMetric}>
                  <Text numberOfLines={1} style={styles.businessMetricLabel}>Handicap</Text>
                  <Text style={styles.businessMetricValue}>{profile?.handicap ?? '--'}</Text>
                </View>
                <View style={styles.businessMetric}>
                  <Text numberOfLines={1} style={styles.businessMetricLabel}>Connections</Text>
                  <Text style={styles.businessMetricValue}>{acceptedConnections.length}</Text>
                </View>
                <View style={styles.businessMetric}>
                  <Text numberOfLines={1} style={styles.businessMetricLabel}>Ratings</Text>
                  <Text style={styles.businessMetricValue}>{ratingSummary.count || '--'}</Text>
                </View>
              </View>
            </Pressable>
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
              {busy ? <ActivityIndicator color={palette.aqua} /> : null}
              {!busy && activities.length === 0 ? (
                <Text style={styles.infoLine}>No profile activity yet. Tee times, rounds, photo changes, connections, and bag updates will show up here.</Text>
              ) : null}
              {activities.map((activity) => {
                const linkedRound = activity.activity_type === 'round_logged' ? findRoundForActivity(activity, rounds) : null

                if (linkedRound) {
                  const expanded = expandedRoundId === linkedRound.id

                  return (
                    <Pressable
                      key={activity.id}
                      onPress={() => setExpandedRoundId((current) => (current === linkedRound.id ? null : linkedRound.id))}
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
                      <View style={styles.roundActivityExpandRow}>
                        <Text style={styles.roundActivityExpandText}>{expanded ? 'Hide hole scores' : 'View hole scores'}</Text>
                        <Ionicons color={palette.aqua} name={expanded ? 'chevron-up' : 'chevron-down'} size={16} />
                      </View>
                      {expanded ? (
                        <View style={styles.roundScoreGrid}>
                          {linkedRound.hole_scores.map((score, index) => (
                            <View key={`${linkedRound.id}-${index}`} style={styles.roundScorePill}>
                              <Text style={styles.roundScoreHole}>Hole {index + 1}</Text>
                              <Text style={styles.roundScoreValue}>{score}</Text>
                            </View>
                          ))}
                        </View>
                      ) : null}
                    </Pressable>
                  )
                }

                const activityImageUrl = getActivityImageUrl(activity)

                return (
                  <View key={activity.id} style={styles.activityRow}>
                    <View style={styles.activityActorWrap}>
                      <Avatar label={displayName} size={42} uri={profile?.avatar_url} />
                      <View style={styles.activityEventIcon}><Ionicons color={palette.bg} name={getActivityIcon(activity.activity_type)} size={13} /></View>
                    </View>
                    <View style={styles.activityCopy}>
                      <View style={styles.activityTitleRow}><Text numberOfLines={2} style={styles.activityTitle}>{getSpecificActivityLabel(activity, 'You', ([...connections.flatMap((connection) => [connection.requester, connection.recipient])].find((candidate) => candidate?.id === activity.related_id) as UserCard | undefined)?.first_name || ([...connections.flatMap((connection) => [connection.requester, connection.recipient])].find((candidate) => candidate?.id === activity.related_id) as UserCard | undefined)?.username)}</Text><Text style={styles.activityTime}>{formatActivityTime(activity.created_at)}</Text></View>
                      {activityImageUrl ? <Image source={{ uri: activityImageUrl }} style={styles.activityImage} /> : null}
                    </View>
                  </View>
                )
              })}
            </View>
          ) : (
            <View style={styles.activityCard}>
              <View style={styles.aboutFeed}>
              {profile?.bio ? (
                <View style={[styles.bioCard, styles.aboutBioCard]}>
                  <Text style={[styles.meta, styles.bioText]}>{profile.bio}</Text>
                </View>
              ) : null}
              <View style={styles.aceCard}>
                <View style={styles.aboutSectionHeading}>
                  <Ionicons color="#183f2e" name="flag-outline" size={16} />
                  <Text style={[styles.aboutSectionTitle, styles.aceTitle]}>Hole In One</Text>
                </View>
                {isInlineAboutEditing ? (
                  <View style={styles.inlineFieldStack}>
                    <TextInput
                      onChangeText={(value) => setForm((current) => ({ ...current, ace_course: value }))}
                      placeholder="Hole-in-one course"
                      placeholderTextColor={palette.textMuted}
                      style={styles.input}
                      value={form.ace_course}
                    />
                    <View style={styles.editRow}>
                      <TextInput
                        onChangeText={(value) => setForm((current) => ({ ...current, ace_hole: value }))}
                        placeholder="Hole"
                        placeholderTextColor={palette.textMuted}
                        style={[styles.input, styles.flexInput]}
                        value={form.ace_hole}
                      />
                      <TextInput
                        onChangeText={(value) => setForm((current) => ({ ...current, ace_date: value }))}
                        placeholder="Date"
                        placeholderTextColor={palette.textMuted}
                        style={[styles.input, styles.flexInput]}
                        value={form.ace_date}
                      />
                    </View>
                  </View>
                ) : aceDetails ? (
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
                ) : <Text style={styles.infoLine}>No groups joined yet.</Text>}
              </View>
              <View style={styles.aboutBagSection}>
              <View style={styles.aboutSectionHeading}>
                <MaterialCommunityIcons color="#d8bd76" name="golf" size={18} />
                <Text style={styles.aboutSectionTitle}>What&apos;s In The Bag</Text>
              </View>
              <View style={styles.bagGrid}>
              {bagFields.map((field) => {
                const value = bagItems[field.key]?.trim()
                return (
                  <View key={field.key} style={styles.bagRow}>
                    <Text style={styles.bagLabel}>{field.label}</Text>
                    {isInlineAboutEditing ? (
                      <TextInput
                        onChangeText={(nextValue) =>
                          setBagItems((current) => ({
                            ...current,
                            [field.key]: nextValue
                          }))
                        }
                        placeholder={field.placeholder}
                        placeholderTextColor={palette.textMuted}
                        style={styles.aboutInlineInput}
                        value={bagItems[field.key] || ''}
                      />
                    ) : (
                      <Text style={styles.bagValue}>{value || 'Not added yet'}</Text>
                    )}
                  </View>
                )
              })}
              </View>
              </View>
              </View>
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
                label="My Tee Times"
                variant="ghost"
                onPress={() => {
                  setShowProfileMenu(false)
                  setShowShareModal(false)
                  router.push('/tee-times')
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
              <View style={styles.qrBusinessCard}>
                {profile?.header_image_url ? (
                  <Image source={{ uri: profile.header_image_url }} style={styles.qrBusinessCardImage} />
                ) : (
                  <View style={styles.qrBusinessCardFallback} />
                )}
                <View style={styles.qrBusinessCardShade} />
                <View style={styles.qrCardBrandRow}>
                  <View>
                    <Text style={styles.qrCardBrand}>Ultimate Golf Community</Text>
                    <Text style={styles.qrCardType}>Member Card</Text>
                  </View>
                  {socialLinks.length ? (
                    <View style={styles.qrCardSocialLinks}>
                      {socialLinks.map((link) => (
                        <Pressable
                          key={link.key}
                          accessibilityLabel={`Open ${link.label}`}
                          onPress={() => void Linking.openURL(link.url)}
                          style={styles.qrCardSocialLink}
                        >
                          <Ionicons color="#f6e7ba" name={link.icon} size={15} />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
                <View style={styles.qrBusinessCardTop}>
                  <View style={styles.qrAvatarWrap}>
                    <Avatar label={displayName} size={66} uri={profile?.avatar_url} />
                  </View>
                  <View style={styles.qrIdentityCopy}>
                    <Text numberOfLines={1} style={styles.qrBusinessCardName}>{displayName}</Text>
                    <Text numberOfLines={1} style={styles.qrBusinessCardCourse}>
                      {profile?.home_course || profile?.home_club || 'Ultimate Golf Community'}
                    </Text>
                  </View>
                </View>
                <View style={styles.qrBusinessCardStats}>
                  <View style={styles.qrBusinessCardStat}>
                    <Text style={styles.qrBusinessCardStatLabel}>Handicap</Text>
                    <Text style={styles.qrBusinessCardStatValue}>{profile?.handicap ?? '--'}</Text>
                  </View>
                  <View style={styles.qrBusinessCardStat}>
                    <Text style={styles.qrBusinessCardStatLabel}>Connections</Text>
                    <Text style={styles.qrBusinessCardStatValue}>{acceptedConnections.length}</Text>
                  </View>
                  <View style={styles.qrBusinessCardStat}>
                    <Text style={styles.qrBusinessCardStatLabel}>Ratings</Text>
                    <Text style={styles.qrBusinessCardStatValue}>{ratingSummary.count || '--'}</Text>
                  </View>
                </View>
                <View style={styles.qrBusinessCardBottom}>
                  {shareQrUrl ? <Image source={{ uri: shareQrUrl }} style={styles.qrImage} /> : null}
                  <Text style={styles.qrScanLabel}>Scan to view profile</Text>
                </View>
              </View>
              <View style={styles.shareActionRow}>
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
            <Pressable style={styles.editProfileDialog} onPress={() => {}}>
              <ScrollView
                contentContainerStyle={styles.editProfileContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                style={styles.editProfileScroll}
              >
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
                  keyboardType="decimal-pad"
                  onChangeText={(value) => setForm((current) => ({ ...current, handicap: value }))}
                  placeholder="Handicap"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.handicap}
                />
                <TextInput
                  onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
                  placeholder="Location"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.location}
                />
              </View>
              <TextInput
                autoCapitalize="none"
                onChangeText={(value) => setForm((current) => ({ ...current, linkedin_url: value }))}
                placeholder="LinkedIn URL"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.linkedin_url}
              />
              <TextInput
                autoCapitalize="none"
                onChangeText={(value) => setForm((current) => ({ ...current, instagram_url: value }))}
                placeholder="Instagram URL"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.instagram_url}
              />
              <TextInput
                autoCapitalize="none"
                onChangeText={(value) => setForm((current) => ({ ...current, facebook_url: value }))}
                placeholder="Facebook URL"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.facebook_url}
              />
              <TextInput
                autoCapitalize="none"
                onChangeText={(value) => setForm((current) => ({ ...current, x_url: value }))}
                placeholder="X URL"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.x_url}
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
              <TextInput
                multiline
                onChangeText={(value) => setForm((current) => ({ ...current, bio: value }))}
                placeholder="Bio"
                placeholderTextColor={palette.textMuted}
                style={[styles.input, styles.bioInput]}
                value={form.bio}
              />
              </ScrollView>
              <View style={styles.editProfileFooter}>
                <PrimaryButton label="Save Profile" loading={saving} onPress={handleSave} />
                <PrimaryButton label="Close" variant="ghost" onPress={() => setShowEditModal(false)} />
              </View>
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
    paddingBottom: 156,
    paddingHorizontal: 0,
    paddingTop: 0
  },
  profileTopActions: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    height: 96,
    justifyContent: 'space-between',
    marginHorizontal: 16,
    paddingTop: 44,
    position: 'relative',
    zIndex: 5
  },
  profileHeaderButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,18,12,0.68)',
    borderColor: 'rgba(232,216,178,0.28)',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  headerCard: {
    backgroundColor: 'transparent',
    gap: 0,
    marginTop: -56,
    overflow: 'visible',
    paddingHorizontal: 0,
    zIndex: 1
  },
  coverShell: {
    borderColor: 'rgba(232,216,178,0.14)',
    borderRadius: 28,
    borderWidth: 1,
    height: 270,
    marginHorizontal: 16,
    overflow: 'hidden',
    position: 'relative'
  },
  coverGlow: {
    backgroundColor: 'rgba(210,180,104,0.18)',
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
  coverShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,18,12,0.42)'
  },
  coverSocialLinks: {
    flexDirection: 'row',
    gap: 8,
    left: 16,
    position: 'absolute',
    top: 64
  },
  coverSocialLink: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,18,12,0.60)',
    borderColor: 'rgba(232,216,178,0.28)',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34
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
  coverAvatarCluster: {
    alignItems: 'center',
    gap: 10,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 46
  },
  avatarWrap: {
    borderColor: '#e8d8b2',
    borderRadius: 999,
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 18
  },
  identityBusinessCard: {
    alignItems: 'center',
    bottom: undefined,
    gap: 5,
    left: 16,
    position: 'absolute',
    right: 16,
    top: 154
  },
  identityTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    position: 'relative',
    width: '100%'
  },
  identityHeadline: {
    alignItems: 'center',
    flex: 1,
    gap: 4
  },
  identityNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    maxWidth: '100%'
  },
  name: {
    color: '#fffaf0',
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '800',
    flexShrink: 1,
    letterSpacing: -0.5,
    lineHeight: 23,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5
  },
  identityCrown: {
    fontSize: 19
  },
  businessClubLine: {
    color: 'rgba(255,250,240,0.70)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  businessMetricsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
    width: '100%'
  },
  businessMetric: {
    alignItems: 'center',
    flex: 1,
    gap: 1
  },
  businessMetricLabel: {
    color: 'rgba(255,250,240,0.68)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  businessMetricValue: {
    color: '#fffaf0',
    fontFamily: 'Georgia',
    fontSize: 16,
    fontWeight: '800'
  },
  ratingSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 6
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
    textAlign: 'left'
  },
  bioText: {
    color: '#f5eedc',
    fontFamily: 'Georgia',
    fontSize: 16,
    lineHeight: 24
  },
  bioCard: {
    backgroundColor: 'rgba(7, 39, 28, 0.64)',
    borderColor: 'rgba(216,189,118,0.34)',
    borderLeftWidth: 3,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  aboutBioCard: {
    marginHorizontal: 0,
    marginTop: 0
  },
  aboutBioHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginBottom: 8
  },
  aboutBioEyebrow: {
    color: '#d8bd76',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  activityCard: {
    backgroundColor: 'transparent',
    gap: 14,
    marginTop: 12,
    paddingHorizontal: 20
  },
  aboutFeed: {
    gap: 12,
  },
  profileTabRow: {
    backgroundColor: '#34715b',
    borderColor: 'rgba(234,246,216,0.28)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 5
  },
  profileTab: {
    alignItems: 'center',
    borderRadius: 13,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12
  },
  profileTabActive: {
    backgroundColor: '#e8d8b2',
    borderColor: '#e8d8b2',
    borderWidth: 1
  },
  profileTabText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  profileTabTextActive: {
    color: '#102c20'
  },
  activityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2
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
    backgroundColor: '#3b7e65',
    borderColor: 'rgba(234,246,216,0.24)',
    borderRadius: 16,
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
    color: '#f6e7ba',
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '800'
  },
  courseAverageCard: {
    backgroundColor: '#3b7e65',
    borderColor: 'rgba(234,246,216,0.24)',
    borderRadius: 20,
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
  aboutActionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  aboutSecondaryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  aboutSecondaryButtonText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  aboutInlineInput: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700',
    minHeight: 34,
    padding: 0
  },
  inlineFieldStack: {
    gap: 10
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
  editProfileDialog: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    maxHeight: '88%',
    overflow: 'hidden',
    width: '100%'
  },
  editProfileScroll: {
    flexGrow: 0,
    flexShrink: 1
  },
  editProfileContent: {
    gap: 12,
    padding: 20
  },
  editProfileFooter: {
    backgroundColor: palette.card,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    gap: 8,
    padding: 14
  },
  shareModalCard: {
    gap: 14
  },
  roundActivityCard: {
    backgroundColor: '#3b7e65',
    borderColor: 'rgba(234,246,216,0.24)',
    borderRadius: 20,
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
  roundActivityExpandRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(232,216,178,0.12)',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10
  },
  roundActivityExpandText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700'
  },
  roundScoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  roundScorePill: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 12,
    borderWidth: 1,
    minWidth: '21%',
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  roundScoreHole: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  roundScoreValue: {
    color: palette.text,
    fontSize: 17,
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
    backgroundColor: 'rgba(9, 44, 33, 0.84)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12
  },
  activityActorWrap: {
    position: 'relative'
  },
  activityEventIcon: {
    alignItems: 'center',
    backgroundColor: palette.aqua,
    borderColor: palette.bg,
    borderRadius: 999,
    borderWidth: 2,
    bottom: -2,
    height: 21,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    width: 21
  },
  activityCopy: {
    flex: 1,
    gap: 5
  },
  activityTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  activityTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 19
  },
  activityImage: {
    borderRadius: 12,
    height: 150,
    marginTop: 6,
    width: '100%'
  },
  activityTime: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 'auto'
  },
  bagRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    minWidth: '47%',
    padding: 10
  },
  bagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  bagLabel: {
    color: '#d5b970',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  bagValue: {
    color: '#fffaf0',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20
  },
  aboutInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  aboutBagSection: {
    backgroundColor: 'rgba(7,39,28,0.3)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 19,
    borderWidth: 1,
    gap: 10,
    padding: 12
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
  aboutInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(255,255,255,0.17)',
    borderRadius: 17,
    borderWidth: 1,
    gap: 2,
    minWidth: '47%',
    padding: 10
  },
  aboutInfoLabel: {
    color: 'rgba(245,238,220,0.58)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  aboutInfoValue: {
    color: '#fffaf0',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20
  },
  aceCard: {
    backgroundColor: '#d8bd76',
    borderColor: '#f6e7ba',
    borderRadius: 19,
    borderWidth: 1,
    gap: 8,
    padding: 12
  },
  aceTitle: {
    color: '#183f2e'
  },
  aboutSectionTitle: {
    color: '#f6e7ba',
    fontFamily: 'Georgia',
    fontSize: 16,
    fontWeight: '800'
  },
  aboutSectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7
  },
  aboutDetailCard: {
    backgroundColor: 'rgba(7,39,28,0.3)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 19,
    borderWidth: 1,
    padding: 12
  },
  socialSection: {
    gap: 7
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7
  },
  socialChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderColor: 'rgba(216,189,118,0.27)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  socialChipText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700'
  },
  aceDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  acePill: {
    backgroundColor: 'rgba(255,250,240,0.35)',
    borderColor: 'rgba(24,63,46,0.18)',
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    minWidth: '31%',
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  acePillLabel: {
    color: 'rgba(24,63,46,0.72)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase'
  },
  acePillValue: {
    color: '#183f2e',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18
  },
  qrCard: {
    display: 'none'
  },
  qrBusinessCard: {
    alignItems: 'center',
    borderColor: 'rgba(232,216,178,0.30)',
    borderRadius: 24,
    borderWidth: 1,
    height: 400,
    overflow: 'hidden',
    position: 'relative'
  },
  qrBusinessCardImage: {
    height: '100%',
    position: 'absolute',
    width: '100%'
  },
  qrBusinessCardFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#15382c'
  },
  qrBusinessCardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3,10,8,0.56)'
  },
  qrCardBrandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 18,
    position: 'absolute',
    right: 18,
    top: 16
  },
  qrCardSocialLinks: {
    flexDirection: 'row',
    gap: 6
  },
  qrCardSocialLink: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,18,12,0.48)',
    borderColor: 'rgba(232,216,178,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  qrCardBrand: {
    color: '#f6e7ba',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase'
  },
  qrCardType: {
    color: 'rgba(255,250,240,0.72)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  qrBusinessCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    left: 20,
    position: 'absolute',
    right: 20,
    top: 48
  },
  qrAvatarWrap: {
    borderColor: '#e8d8b2',
    borderRadius: 999,
    borderWidth: 3
  },
  qrIdentityCopy: {
    flex: 1,
    gap: 4
  },
  qrBusinessCardName: {
    color: palette.white,
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    textAlign: 'left'
  },
  qrBusinessCardCourse: {
    color: 'rgba(255,250,240,0.74)',
    fontSize: 13,
    fontWeight: '600'
  },
  qrBusinessCardStats: {
    flexDirection: 'row',
    gap: 6,
    left: 20,
    position: 'absolute',
    right: 20,
    top: 130
  },
  qrBusinessCardStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,18,12,0.52)',
    borderColor: 'rgba(232,216,178,0.16)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 8
  },
  qrBusinessCardStatLabel: {
    color: 'rgba(232,216,178,0.68)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
  },
  qrBusinessCardStatValue: {
    color: '#fffaf0',
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '800'
  },
  qrBusinessCardBottom: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#f8f3e7',
    borderColor: 'rgba(232,216,178,0.70)',
    borderRadius: 18,
    borderWidth: 1,
    bottom: 16,
    padding: 10,
    position: 'absolute'
  },
  qrImage: {
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: 10,
    height: 148,
    width: 148
  },
  qrScanLabel: {
    color: '#234334',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 4,
    textTransform: 'uppercase'
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
