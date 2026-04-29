import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
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
  TextInput,
  View
} from 'react-native'
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { fetchNetworkFeed, type NetworkFeedActivity } from '@/lib/feed'
import { mobileSupabase } from '@/lib/supabase'
import { palette } from '@/lib/theme'
import { getMobileWeather, type MobileWeatherData } from '@/lib/weather'
import { useAuth } from '@/providers/AuthProvider'

type TeeTime = {
  id: string
  course_name?: string
  location?: string
  course_location?: string
  tee_time_date?: string
  tee_time_time?: string
  handicap_requirement?: string
  current_players?: number
  max_players?: number
  available_spots?: number
  visibility_scope?: string
  creator_id?: string
  accepted_players?: {
    id?: string
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
  }[]
}

type CreateTeeTimeResponse = {
  success?: boolean
  message?: string
  tee_time?: TeeTime | null
}

type Activity = NetworkFeedActivity

type GroupOption = {
  id: string
  name: string
  logo_url?: string | null
  image_url?: string | null
}

type WeatherData = MobileWeatherData

const teeTimeSkillOptions = ['Beginner', 'Weekend Hack', 'Weekend Grinder', 'Low Handicap', 'Pro']

function formatFormDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatFormTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  })
}

function toApiDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function toApiTime(date: Date) {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

function estimatePrecipitationRisk(weather: WeatherData) {
  const description = weather.description.toLowerCase()
  const humidityBump = Math.max(0, Math.round((weather.humidity - 55) * 0.6))

  if (description.includes('thunder') || description.includes('storm')) return 90
  if (description.includes('rain') || description.includes('drizzle') || description.includes('shower')) return 80
  if (description.includes('snow') || description.includes('sleet')) return 85
  if (description.includes('mist') || description.includes('fog') || description.includes('haze')) return 45
  if (description.includes('cloud')) return Math.min(60, 20 + humidityBump)

  return Math.max(5, Math.min(35, 5 + Math.round(humidityBump / 2)))
}

function getGolfRecommendation(weather: WeatherData) {
  const description = weather.description.toLowerCase()
  const precipRisk = estimatePrecipitationRisk(weather)

  if (description.includes('thunder') || precipRisk >= 80) {
    return 'Rough golf weather today'
  }

  if (weather.windSpeed >= 20) {
    return 'Playable, but very windy'
  }

  if (weather.temperature <= 45) {
    return 'Cold round, bundle up'
  }

  if (weather.temperature >= 92) {
    return 'Playable, but hot and draining'
  }

  if (precipRisk >= 50) {
    return 'Borderline, keep an eye on the sky'
  }

  return 'Great day to tee it up'
}

function formatUpcomingTeeTime(teeTime?: TeeTime | null) {
  if (!teeTime?.tee_time_date) return 'No tee times yet'

  const base = new Date(`${teeTime.tee_time_date}T${teeTime.tee_time_time || '12:00:00'}`)
  const dateLabel = base.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
  const timeLabel = teeTime.tee_time_time
    ? base.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : null

  return timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel
}

function formatFeedTimestamp(value?: string) {
  if (!value) return ''

  const date = new Date(value)
  const now = Date.now()
  const diffMs = now - date.getTime()
  const diffHours = Math.floor(diffMs / 3600000)

  if (diffHours < 1) {
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))
    return `${diffMinutes}m ago`
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
}

function describeBagUpdate(activity: Activity) {
  const changes = Array.isArray(activity.metadata?.bag_changes)
    ? (activity.metadata?.bag_changes as {
        label?: string
        previous_value?: string
        next_value?: string
      }[])
    : []

  if (!changes.length) {
    return activity.description || 'Updated their bag setup'
  }

  const summary = changes
    .slice(0, 3)
    .map((change) => {
      const label = change.label || 'equipment'
      const nextValue = (change.next_value || '').trim()
      return nextValue ? `${label}: ${nextValue}` : `${label} removed`
    })
    .join(' • ')

  return summary
}

async function getDirectInteractionSummary(activityId: string, userId: string) {
  const [likesResult, commentsResult] = await Promise.all([
    mobileSupabase.from('activity_likes').select('user_id').eq('activity_id', activityId),
    mobileSupabase.from('activity_comments').select('id').eq('activity_id', activityId)
  ])

  if (likesResult.error) {
    throw new Error(likesResult.error.message || 'Unable to load likes.')
  }

  if (commentsResult.error) {
    throw new Error(commentsResult.error.message || 'Unable to load comments.')
  }

  const likes = likesResult.data || []
  const comments = commentsResult.data || []

  return {
    like_count: likes.length,
    liked_by_user: likes.some((like: any) => like.user_id === userId),
    comment_count: comments.length
  }
}

export default function HomeTab() {
  const { loading, profile, user } = useAuth()
  const params = useLocalSearchParams<{ compose?: string; refresh?: string }>()
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(true)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTeeTimeId, setEditingTeeTimeId] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [nextTeeTime, setNextTeeTime] = useState<TeeTime | null>(null)
  const [myTeeTimes, setMyTeeTimes] = useState<TeeTime[]>([])
  const [activityFeed, setActivityFeed] = useState<Activity[]>([])
  const [commentingOn, setCommentingOn] = useState<string | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [joiningFeedTeeTimeId, setJoiningFeedTeeTimeId] = useState<string | null>(null)
  const [myGroups, setMyGroups] = useState<GroupOption[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [form, setForm] = useState({
    course_name: '',
    location: '',
    tee_time_date: '',
    tee_time_time: '',
    max_players: '4',
    handicap_requirement: 'Weekend Hack',
    visibility_scope: 'public',
    group_id: ''
  })

  const weatherQuery = useMemo(() => {
    const locationText = profile?.location || nextTeeTime?.location || ''
    return locationText.trim() || 'Monterey, CA'
  }, [nextTeeTime?.location, profile?.location])

  const loadHome = useCallback(async () => {
    if (!user?.id) return

    try {
      const [myRoundsResult, feedResult, groupsResult] = await Promise.allSettled([
        apiGet<TeeTime[]>(`/api/tee-times?action=user&user_id=${encodeURIComponent(user.id)}`),
        fetchNetworkFeed(user.id, 20),
        apiGet<{ success: boolean; groups: GroupOption[] }>(
          `/api/groups?user_id=${encodeURIComponent(user.id)}`
        )
      ])

      const myRounds = myRoundsResult.status === 'fulfilled' ? myRoundsResult.value : []
      const feed = feedResult.status === 'fulfilled' ? feedResult.value : []
      const groups = groupsResult.status === 'fulfilled' ? groupsResult.value : { groups: [] }

      const futureMyRounds = (myRounds || [])
        .filter((teeTime) => teeTime.tee_time_date)
        .sort((a, b) => {
          const aValue = `${a.tee_time_date || ''}T${a.tee_time_time || '00:00:00'}`
          const bValue = `${b.tee_time_date || ''}T${b.tee_time_time || '00:00:00'}`
          return aValue.localeCompare(bValue)
        })

      setMyTeeTimes(myRounds || [])
      const nextMine = futureMyRounds[0] || null
      setNextTeeTime(nextMine)
      setActivityFeed(feed || [])
      setMyGroups(groups.groups || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [user?.id])

  const loadHeaderCounts = useCallback(async () => {
    if (!user?.id) return

    try {
      const [notificationResponse, inboxResponse] = await Promise.all([
        apiGet<{ notifications: { is_read?: boolean; read?: boolean }[] }>(
          `/api/notifications?user_id=${encodeURIComponent(user.id)}`
        ),
        apiGet<{ is_read?: boolean; read?: boolean }[]>(
          `/api/messages?action=inbox&user_id=${encodeURIComponent(user.id)}`
        )
      ])

      setUnreadNotifications(
        (notificationResponse.notifications || []).filter((notification) => !(notification.is_read ?? notification.read))
          .length
      )
      setUnreadMessages((inboxResponse || []).filter((message) => !(message.is_read ?? message.read)).length)
    } catch {
      setUnreadNotifications(0)
      setUnreadMessages(0)
    }
  }, [user?.id])

  const loadWeather = useCallback(async () => {
    try {
      setWeatherLoading(true)
      const response = await getMobileWeather(weatherQuery)
      setWeather(response)
    } catch {
      setWeather(null)
    } finally {
      setWeatherLoading(false)
    }
  }, [weatherQuery])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      loadHome()
    }
  }, [loadHome, user?.id])

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return
      void Promise.all([loadHome(), loadHeaderCounts()])
    }, [loadHeaderCounts, loadHome, user?.id])
  )

  useEffect(() => {
    void loadWeather()
  }, [loadWeather])

  useEffect(() => {
    void loadHeaderCounts()
  }, [loadHeaderCounts])

  useEffect(() => {
    if (!user?.id) return

    const interval = setInterval(() => {
      void loadHeaderCounts()
    }, 15000)

    return () => clearInterval(interval)
  }, [loadHeaderCounts, user?.id])

  useEffect(() => {
    if (params.compose === 'tee-time') {
      setShowCreateForm(true)
      router.setParams({ compose: undefined })
    }
  }, [params.compose])

  useEffect(() => {
    if (!params.refresh || !user?.id) return
    void Promise.all([loadHome(), loadHeaderCounts()])
    router.setParams({ refresh: undefined })
  }, [loadHeaderCounts, loadHome, params.refresh, user?.id])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const resetComposer = () => {
    setEditingTeeTimeId(null)
    setForm({
      course_name: '',
      location: '',
      tee_time_date: '',
      tee_time_time: '',
      max_players: '4',
      handicap_requirement: 'Weekend Hack',
      visibility_scope: 'public',
      group_id: ''
    })
    setSelectedDate(null)
    setSelectedTime(null)
    setShowCategoryMenu(false)
    setShowDatePicker(false)
    setShowTimePicker(false)
  }

  const handleSaveTeeTime = async () => {
    if (!user?.id) return

    const hasDate = !!selectedDate || !!form.tee_time_date.trim()
    const hasTime = !!selectedTime || !!form.tee_time_time.trim()

    if (!form.course_name.trim() || !hasDate || !hasTime) {
      Alert.alert('Missing info', 'Course, date, and time are required to post a tee time.')
      return
    }

    setCreating(true)

    try {
      const response = await apiPost<CreateTeeTimeResponse>('/api/tee-times', {
        action: editingTeeTimeId ? 'update' : 'create',
        tee_time_id: editingTeeTimeId,
        creator_id: user.id,
        user_id: user.id,
        course_name: form.course_name.trim(),
        location: form.location.trim(),
        tee_time_date: selectedDate ? toApiDate(selectedDate) : form.tee_time_date.trim(),
        tee_time_time: selectedTime ? toApiTime(selectedTime) : form.tee_time_time.trim(),
        max_players: Number(form.max_players) || 4,
        handicap_requirement: form.handicap_requirement.trim() || 'any',
        visibility_scope: form.visibility_scope,
        group_id: form.visibility_scope === 'group' ? form.group_id : null
      })

      if (response.tee_time) {
        setNextTeeTime(response.tee_time)
      }

      await apiPost('/api/notifications', {
        action: 'create',
        user_id: user.id,
        type: editingTeeTimeId ? 'tee_time_updated' : 'tee_time_posted',
        title: editingTeeTimeId ? 'Tee time updated successfully' : 'Tee time posted successfully',
        message: editingTeeTimeId
          ? `${form.course_name.trim()} was updated and is ready to go.`
          : `${form.course_name.trim()} is live and golfers can now find it.`,
        related_id: response.tee_time?.id || editingTeeTimeId || null
      }).catch(() => null)

      Alert.alert(
        editingTeeTimeId ? 'Tee time updated' : 'Tee time posted',
        editingTeeTimeId
          ? 'Your round details are refreshed.'
          : 'Your round is now live in the community.'
      )
      resetComposer()
      setShowCreateForm(false)
      setBusy(true)
      await Promise.all([loadHome(), loadHeaderCounts()])
    } catch (error) {
      Alert.alert(
        editingTeeTimeId ? 'Unable to update tee time' : 'Unable to post tee time',
        error instanceof Error ? error.message : 'Please try again.'
      )
    } finally {
      setCreating(false)
    }
  }

  const handleDateChange = (event: DateTimePickerEvent, value?: Date) => {
    setShowDatePicker(false)

    if (event.type === 'dismissed' || !value) {
      return
    }

    setSelectedDate(value)
    setForm((current) => ({ ...current, tee_time_date: formatFormDate(value) }))
  }

  const handleTimeChange = (event: DateTimePickerEvent, value?: Date) => {
    setShowTimePicker(false)

    if (event.type === 'dismissed' || !value) {
      return
    }

    setSelectedTime(value)
    setForm((current) => ({ ...current, tee_time_time: formatFormTime(value) }))
  }

  const handleToggleFeedLike = async (activity: Activity) => {
    if (!user?.id) return

    const liked = !!activity.liked_by_user
    const previousLikeCount = activity.like_count || 0
    setActivityFeed((current) =>
      current.map((item) =>
        item.id === activity.id
          ? {
              ...item,
              liked_by_user: !liked,
              like_count: Math.max((item.like_count || 0) + (liked ? -1 : 1), 0)
            }
          : item
      )
    )

    try {
      if (liked) {
        const { error } = await mobileSupabase
          .from('activity_likes')
          .delete()
          .eq('activity_id', activity.id)
          .eq('user_id', user.id)

        if (error) {
          throw new Error(error.message || 'Unable to unlike activity.')
        }
      } else {
        const { error } = await mobileSupabase
          .from('activity_likes')
          .upsert({ activity_id: activity.id, user_id: user.id }, { onConflict: 'activity_id,user_id', ignoreDuplicates: true })

        if (error) {
          throw new Error(error.message || 'Unable to like activity.')
        }
      }

      const response = await getDirectInteractionSummary(activity.id, user.id)

      setActivityFeed((current) =>
        current.map((item) =>
          item.id === activity.id
            ? {
                ...item,
                liked_by_user: response.liked_by_user ?? !liked,
                like_count: response.like_count ?? previousLikeCount
              }
            : item
        )
      )
    } catch {
      setActivityFeed((current) =>
        current.map((item) =>
          item.id === activity.id
            ? {
                ...item,
                liked_by_user: liked,
                like_count: previousLikeCount
              }
            : item
        )
      )
    }
  }

  const handlePostFeedComment = async (activityId: string) => {
    if (!user?.id) return
    const comment = commentDrafts[activityId]?.trim()
    if (!comment) return

    try {
      const { error } = await mobileSupabase.from('activity_comments').insert({
        activity_id: activityId,
        user_id: user.id,
        comment
      })

      if (error) {
        throw new Error(error.message || 'Unable to comment on this post.')
      }

      const summary = await getDirectInteractionSummary(activityId, user.id)

      setCommentDrafts((current) => ({ ...current, [activityId]: '' }))
      setCommentingOn(null)
      setActivityFeed((current) =>
        current.map((item) =>
          item.id === activityId
            ? {
                ...item,
                comment_count: summary.comment_count,
                like_count: summary.like_count,
                liked_by_user: summary.liked_by_user
              }
            : item
        )
      )
    } catch (error) {
      Alert.alert('Unable to comment', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const handleEditFeedPost = (activity: Activity) => {
    const imageUrl = typeof activity.metadata?.image_url === 'string' ? activity.metadata.image_url : ''
    const caption = typeof activity.metadata?.caption === 'string' ? activity.metadata.caption : activity.description || ''

    router.push({
      pathname: '/post-photo',
      params: {
        activity_id: activity.id,
        image_url: imageUrl,
        caption
      }
    })
  }

  const handleOpenRoundFromFeed = (activity: Activity) => {
    const roundId =
      typeof activity.metadata?.round_id === 'string'
        ? activity.metadata.round_id
        : typeof activity.related_id === 'string' && activity.related_type === 'round'
          ? activity.related_id
          : ''

    if (!roundId) {
      return
    }

    router.push(`/rounds/${roundId}`)
  }

  const handleJoinTeeTimeFromFeed = async (activity: Activity) => {
    if (!user?.id || typeof activity.related_id !== 'string') return

    setJoiningFeedTeeTimeId(activity.id)

    try {
      const response = await apiPost<{ success?: boolean; already_joined?: boolean; message?: string }>(
        '/api/tee-times',
        {
          action: 'join',
          tee_time_id: activity.related_id,
          user_id: user.id
        }
      )

      Alert.alert(
        response.already_joined ? 'Already joined' : 'Joined tee time',
        response.message || (response.already_joined ? 'You are already in this round.' : 'You are in for this tee time.')
      )
      setBusy(true)
      await Promise.all([loadHome(), loadHeaderCounts()])
    } catch (error) {
      Alert.alert('Unable to join tee time', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setJoiningFeedTeeTimeId(null)
    }
  }

  const renderFeedContent = (item: Activity) => {
    const actorName =
      item.user_id === user?.id ? 'You' : item.actor?.first_name || item.actor?.username || 'A golfer'
    const actorLabel = item.actor?.first_name || item.actor?.username || 'A golfer'
    const courseName =
      typeof item.metadata?.course_name === 'string' ? item.metadata.course_name : ''
    const location =
      typeof item.metadata?.location === 'string' ? item.metadata.location : ''
    const teeDate =
      typeof item.metadata?.tee_time_date === 'string' ? item.metadata.tee_time_date : ''
    const teeTime =
      typeof item.metadata?.tee_time_time === 'string' ? item.metadata.tee_time_time : ''
    const score =
      typeof item.metadata?.score === 'number'
        ? item.metadata.score
        : typeof item.metadata?.score === 'string'
          ? Number(item.metadata.score)
          : null
    const handicap =
      typeof item.metadata?.handicap === 'number'
        ? item.metadata.handicap
        : typeof item.metadata?.handicap === 'string'
          ? item.metadata.handicap
          : null
    const holesPlayed =
      typeof item.metadata?.holes_played === 'number'
        ? item.metadata.holes_played
        : typeof item.metadata?.holes_played === 'string'
          ? Number(item.metadata.holes_played)
          : null
    const avgPerHole =
      typeof item.metadata?.average_score_per_hole === 'number'
        ? item.metadata.average_score_per_hole
        : typeof item.metadata?.average_score_per_hole === 'string'
          ? Number(item.metadata.average_score_per_hole)
          : null
    const caption =
      typeof item.metadata?.caption === 'string'
        ? item.metadata.caption.trim()
        : typeof item.description === 'string'
          ? item.description.trim()
          : ''
    const imageUrl =
      typeof item.metadata?.image_url === 'string' ? item.metadata.image_url : ''

    if (item.activity_type === 'tee_time_created') {
      const teeDateLabel = teeDate
        ? new Date(`${teeDate}T${teeTime || '12:00:00'}`).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
          })
        : 'Upcoming'
      const teeTimeLabel =
        teeDate && teeTime
          ? new Date(`${teeDate}T${teeTime}`).toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit'
            })
          : teeTime

      return (
        <View style={styles.feedSpecialCard}>
          <View style={styles.feedProfileHeader}>
            <Avatar
              label={actorLabel}
              size={40}
              uri={item.actor?.avatar_url || undefined}
            />
            <View style={styles.feedProfileHeaderCopy}>
              <Text style={styles.feedProfileName}>{actorName}</Text>
              <Text style={styles.feedProfileMeta}>Posted a tee time</Text>
            </View>
            <Text style={styles.feedTimestamp}>{formatFeedTimestamp(item.created_at)}</Text>
          </View>
          <Text style={styles.feedSpecialTitle}>{courseName || 'Open tee time'}</Text>
          <Text style={styles.feedSpecialMeta}>
            {[teeDateLabel, teeTimeLabel, location].filter(Boolean).join(' • ')}
          </Text>
          <View style={styles.feedSpecialActions}>
            <Pressable onPress={() => router.push('/tee-times')} style={styles.feedSecondaryButton}>
              <Text style={styles.feedSecondaryButtonText}>View Tee Times</Text>
            </Pressable>
            {item.user_id !== user?.id ? (
              <Pressable
                onPress={() => void handleJoinTeeTimeFromFeed(item)}
                style={styles.feedPrimaryButton}
              >
                <Text style={styles.feedPrimaryButtonText}>
                  {joiningFeedTeeTimeId === item.id ? 'Joining...' : 'Join'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      )
    }

    if (item.activity_type === 'photo_posted') {
      return (
        <>
          <View style={styles.feedProfileHeader}>
            <Avatar
              label={actorLabel}
              size={40}
              uri={item.actor?.avatar_url || undefined}
            />
            <View style={styles.feedProfileHeaderCopy}>
              <Text style={styles.feedProfileName}>{actorName}</Text>
            </View>
            <Text style={styles.feedTimestamp}>{formatFeedTimestamp(item.created_at)}</Text>
            {item.user_id === user?.id ? (
              <Pressable onPress={() => handleEditFeedPost(item)} style={styles.feedEditButton}>
                <Ionicons color={palette.aqua} name="create-outline" size={16} />
              </Pressable>
            ) : null}
          </View>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.feedImage} /> : null}
          {caption ? <Text style={styles.feedPhotoCaption}>{caption}</Text> : null}
        </>
      )
    }

    if (item.activity_type === 'round_logged') {
      return (
        <Pressable onPress={() => handleOpenRoundFromFeed(item)} style={styles.feedSpecialCard}>
          <View style={styles.feedSpecialHeader}>
            <Text style={styles.feedSpecialEyebrow}>{actorName} logged a round</Text>
            <Text style={styles.feedTimestamp}>{formatFeedTimestamp(item.created_at)}</Text>
          </View>
          <View style={styles.scoreHeroRow}>
            <View>
              <Text style={styles.feedSpecialTitle}>{courseName || 'Golf round'}</Text>
              <Text style={styles.feedSpecialMeta}>
                {[
                  holesPlayed ? `${holesPlayed} holes` : '',
                  handicap !== null && handicap !== '' ? `HCP ${handicap}` : '',
                  avgPerHole ? `${avgPerHole.toFixed(1)}/hole` : ''
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeValue}>{score ?? '--'}</Text>
            </View>
          </View>
        </Pressable>
      )
    }

    if (item.activity_type === 'bag_updated') {
      return (
        <View style={styles.feedSpecialCard}>
          <View style={styles.feedProfileHeader}>
            <Avatar
              label={actorLabel}
              size={40}
              uri={item.actor?.avatar_url || undefined}
            />
            <View style={styles.feedProfileHeaderCopy}>
              <Text style={styles.feedProfileName}>{actorName}</Text>
            </View>
            <Text style={styles.feedTimestamp}>{formatFeedTimestamp(item.created_at)}</Text>
          </View>
          <Text style={styles.feedSpecialMeta}>{describeBagUpdate(item)}</Text>
        </View>
      )
    }

    return (
      <>
        <View style={styles.feedHeader}>
          <Avatar
            label={actorLabel}
            size={40}
            uri={item.actor?.avatar_url || undefined}
          />
          <View style={styles.feedHeaderCopy}>
            <Text style={styles.feedTitle}>
              {actorName} • {item.title || 'Activity'}
            </Text>
            {item.description ? <Text style={styles.feedBody}>{item.description}</Text> : null}
          </View>
          <Text style={styles.feedTimestamp}>{formatFeedTimestamp(item.created_at)}</Text>
        </View>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.feedImage} />
        ) : null}
      </>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                void Promise.all([loadHome(), loadHeaderCounts()])
              }}
              tintColor={palette.aqua}
            />
          }
        >
          <View style={styles.headerShell}>
            <View pointerEvents="box-none" style={styles.headerActions}>
              <Pressable onPress={() => router.push('/notifications')} style={styles.notificationButton}>
                <Ionicons color={palette.text} name="notifications-outline" size={20} />
                {unreadNotifications ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Text>
                  </View>
                ) : null}
              </Pressable>

              <Pressable onPress={() => router.push('/messages')} style={styles.messageButton}>
                <Ionicons color={palette.text} name="mail-outline" size={20} />
                {unreadMessages ? (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            <BrandHeader largeLogo />
          </View>

        <View style={styles.weatherCard}>
          <View style={styles.weatherHeader}>
            <View style={styles.weatherHeaderCopy}>
              <Text style={styles.weatherEyebrow}>Golf weather</Text>
              <Text style={styles.weatherLocation}>{weather?.location || weatherQuery}</Text>
            </View>
            <Text style={styles.weatherTemp}>
              {weatherLoading ? '--' : weather ? `${weather.temperature}°` : '--'}
            </Text>
          </View>

          {weather ? (
            <>
              <Text style={styles.weatherDescription}>
                {weather.description} • {getGolfRecommendation(weather)}
              </Text>
              <View style={styles.weatherMetrics}>
                <View style={styles.weatherMetric}>
                  <Text style={styles.weatherMetricLabel}>Wind</Text>
                  <Text style={styles.weatherMetricValue}>{weather.windSpeed} mph</Text>
                </View>
                <View style={styles.weatherMetric}>
                  <Text style={styles.weatherMetricLabel}>Precip Risk</Text>
                  <Text style={styles.weatherMetricValue}>{estimatePrecipitationRisk(weather)}%</Text>
                </View>
                <View style={styles.weatherMetric}>
                  <Text style={styles.weatherMetricLabel}>Feels Like</Text>
                  <Text style={styles.weatherMetricValue}>{weather.feelsLike}°</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.weatherFallback}>
              {weatherLoading
                ? 'Loading local golf conditions...'
                : 'Weather is unavailable right now.'}
            </Text>
          )}
        </View>

        <Pressable onPress={() => router.push('/tee-times')} style={styles.myTeeTimesCard}>
          <View style={styles.myTeeTimesHeader}>
            <View style={styles.myTeeTimesTitleRow}>
              <Ionicons color={palette.aqua} name="golf-outline" size={16} />
              <Text style={styles.myTeeTimesTitle}>My Tee Times</Text>
            </View>
            <View style={styles.myTeeTimesCountPill}>
              <Text style={styles.myTeeTimesCountText}>{myTeeTimes.length}</Text>
            </View>
          </View>
          {nextTeeTime ? (
            <View style={styles.myTeeTimesBody}>
              <Text numberOfLines={1} style={styles.myTeeTimesCourse}>
                {nextTeeTime.course_name || 'Open tee time'}
              </Text>
              <Text numberOfLines={1} style={styles.myTeeTimesMeta}>
                {formatUpcomingTeeTime(nextTeeTime)}
                {(nextTeeTime.location || nextTeeTime.course_location)
                  ? ` • ${nextTeeTime.location || nextTeeTime.course_location}`
                  : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.myTeeTimesEmpty}>Tap to see your tee times and post the next one.</Text>
          )}
        </Pressable>

        {showCreateForm ? (
          <View style={styles.formCard}>
            <View style={styles.composerHeader}>
              <View style={styles.composerTitleWrap}>
                <Text style={styles.cardAccent}>{editingTeeTimeId ? 'Edit round' : 'Quick post'}</Text>
                <Text style={styles.sectionTitle}>{editingTeeTimeId ? 'Edit tee time' : 'Post a tee time'}</Text>
              </View>
              <Text style={styles.composerHint}>Fast choices, clean details, and you are live.</Text>
            </View>

            <View style={styles.composerSection}>
              <Text style={styles.formSectionLabel}>Where</Text>
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, course_name: value }))}
                placeholder="Course name"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.course_name}
              />
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
                placeholder="Area or city"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.location}
              />
            </View>

            <View style={styles.composerSection}>
              <View style={styles.formSectionHeader}>
                <Text style={styles.formSectionLabel}>When</Text>
                <Text style={styles.formSectionHint}>Choose the date and tee time directly</Text>
              </View>
              <View style={styles.splitRow}>
                <Pressable
                  onPress={() => {
                    setShowTimePicker(false)
                    setShowDatePicker(true)
                  }}
                  style={[styles.input, styles.flexInput, styles.pickerField]}
                >
                  <Text style={form.tee_time_date ? styles.pickerValue : styles.pickerPlaceholder}>
                    {form.tee_time_date || 'Pick date'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowDatePicker(false)
                    setShowTimePicker(true)
                  }}
                  style={[styles.input, styles.flexInput, styles.pickerField]}
                >
                  <Text style={form.tee_time_time ? styles.pickerValue : styles.pickerPlaceholder}>
                    {form.tee_time_time || 'Pick time'}
                  </Text>
                </Pressable>
              </View>
            </View>
            {showDatePicker ? (
              <View style={styles.inlinePicker}>
                <DateTimePicker
                  display="default"
                  mode="date"
                  onChange={handleDateChange}
                  value={selectedDate || new Date()}
                />
              </View>
            ) : null}
            {showTimePicker ? (
              <View style={styles.inlinePicker}>
                <DateTimePicker
                  display="default"
                  mode="time"
                  onChange={handleTimeChange}
                  value={selectedTime || new Date()}
                />
              </View>
            ) : null}
            <View style={styles.composerSection}>
              <View style={styles.formSectionHeader}>
                <Text style={styles.formSectionLabel}>Who fits this round</Text>
                <Text style={styles.formSectionHint}>Keep it flexible, but set the tone</Text>
              </View>
              <View style={styles.splitRow}>
                <View style={[styles.input, styles.flexInput, styles.inlineInfoField]}>
                  <Text style={styles.inlineFieldLabel}>Spots</Text>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => setForm((current) => ({ ...current, max_players: value }))}
                    placeholder="4"
                    placeholderTextColor={palette.textMuted}
                    style={styles.inlineFieldInput}
                    value={form.max_players}
                  />
                </View>
                <Pressable
                  onPress={() => setShowCategoryMenu((value) => !value)}
                  style={[styles.categoryPill, styles.flexInput]}
                >
                  <Text style={styles.inlineFieldLabel}>Category</Text>
                  <View style={styles.categoryValueRow}>
                    <Text style={styles.categoryLabel}>{form.handicap_requirement}</Text>
                    <Ionicons
                      color={palette.textMuted}
                      name={showCategoryMenu ? 'chevron-up' : 'chevron-down'}
                      size={16}
                    />
                  </View>
                </Pressable>
              </View>
              {showCategoryMenu ? (
                <View style={styles.categoryMenu}>
                  {teeTimeSkillOptions.map((option) => {
                    const active = form.handicap_requirement === option

                    return (
                      <Pressable
                        key={option}
                        onPress={() => {
                          setForm((current) => ({ ...current, handicap_requirement: option }))
                          setShowCategoryMenu(false)
                        }}
                        style={[styles.categoryMenuItem, active && styles.categoryMenuItemActive]}
                      >
                        <Text style={[styles.categoryMenuText, active && styles.categoryMenuTextActive]}>
                          {option}
                        </Text>
                        {active ? <Ionicons color={palette.aqua} name="checkmark" size={16} /> : null}
                      </Pressable>
                    )
                  })}
                </View>
              ) : null}
            </View>

            <View style={styles.composerSection}>
              <View style={styles.formSectionHeader}>
                <Text style={styles.formSectionLabel}>Visibility</Text>
                <Text style={styles.formSectionHint}>Choose who sees the invite first</Text>
              </View>
              <TextInput
                editable={false}
                placeholder="Visibility"
                placeholderTextColor={palette.textMuted}
                style={styles.hiddenInput}
                value={form.visibility_scope}
              />
              <View style={styles.segmentRow}>
                  {[
                    { label: 'Public', value: 'public' },
                  { label: 'Connections', value: 'connections' },
                  { label: 'Group', value: 'group' }
                ].map((option) => {
                  const active = form.visibility_scope === option.value

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setForm((current) => ({ ...current, visibility_scope: option.value }))}
                      style={[styles.segment, active && styles.segmentActive]}
                    >
                      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              {form.visibility_scope === 'group' ? (
                <View style={styles.groupPicker}>
                  {myGroups.length === 0 ? (
                    <Text style={styles.body}>Join or create a group first, then you can post tee times directly to it.</Text>
                  ) : null}
                  {myGroups.map((group) => {
                    const active = form.group_id === group.id

                    return (
                      <Pressable
                        key={group.id}
                        onPress={() => setForm((current) => ({ ...current, group_id: group.id }))}
                        style={[styles.groupOption, active && styles.groupOptionActive]}
                      >
                        <Text style={[styles.groupOptionText, active && styles.groupOptionTextActive]}>
                          {group.name}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              ) : null}
            </View>
            <PrimaryButton
              label={editingTeeTimeId ? 'Save Tee Time' : 'Publish Tee Time'}
              loading={creating}
              onPress={handleSaveTeeTime}
            />
            {editingTeeTimeId ? (
              <PrimaryButton
                label="Cancel Edit"
                variant="ghost"
                onPress={() => {
                  resetComposer()
                  setShowCreateForm(false)
                }}
              />
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.feedCardAccent}>Network feed</Text>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && activityFeed.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No fresh movement yet</Text>
              <Text style={styles.body}>
                Tee times, rounds, joins, posts, and the rest of your connections&apos; activity will show up here.
              </Text>
            </View>
          ) : null}
          {!busy
            ? activityFeed.map((item) => (
                <View key={item.id} style={styles.feedItem}>
                  {renderFeedContent(item)}
                  <View style={styles.feedActions}>
                    <Pressable onPress={() => void handleToggleFeedLike(item)} style={styles.feedActionButton}>
                      <Ionicons
                        color={palette.aqua}
                        name={item.liked_by_user ? 'heart' : 'heart-outline'}
                        size={16}
                      />
                      <Text style={styles.feedActionText}>
                        {item.like_count || 0}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setCommentingOn(commentingOn === item.id ? null : item.id)} style={styles.feedActionButton}>
                      <Ionicons color={palette.aqua} name="chatbubble-outline" size={16} />
                      <Text style={styles.feedActionText}>{item.comment_count || 0}</Text>
                    </Pressable>
                  </View>
                  {commentingOn === item.id ? (
                    <View style={styles.commentComposer}>
                      <TextInput
                        onChangeText={(value) =>
                          setCommentDrafts((current) => ({ ...current, [item.id]: value }))
                        }
                        placeholder="Write a comment..."
                        placeholderTextColor={palette.textMuted}
                        style={styles.commentInput}
                        value={commentDrafts[item.id] || ''}
                      />
                      <PrimaryButton label="Post" onPress={() => void handlePostFeedComment(item.id)} />
                    </View>
                  ) : null}
                </View>
              ))
            : null}
        </View>
        </ScrollView>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.bg,
    flex: 1
  },
  screen: {
    flex: 1
  },
  content: {
    gap: 14,
    padding: 20,
    paddingBottom: 120
  },
  headerShell: {
    justifyContent: 'center',
    minHeight: 74,
    position: 'relative'
  },
  headerActions: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 5
  },
  notificationButton: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    top: 2,
    width: 42,
    zIndex: 10
  },
  messageButton: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 2,
    width: 42,
    zIndex: 10
  },
  notificationBadge: {
    alignItems: 'center',
    backgroundColor: palette.danger,
    borderRadius: 999,
    minWidth: 18,
    paddingHorizontal: 5,
    position: 'absolute',
    right: -3,
    top: -3
  },
  notificationBadgeText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '800'
  },
  weatherCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    marginTop: -8,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  weatherHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  weatherHeaderCopy: {
    flex: 1,
    gap: 2
  },
  weatherEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  weatherLocation: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700'
  },
  weatherTemp: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800'
  },
  weatherDescription: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textTransform: 'capitalize'
  },
  weatherMetrics: {
    flexDirection: 'row',
    gap: 6
  },
  weatherMetric: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 7
  },
  weatherMetricLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  weatherMetricValue: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  },
  weatherFallback: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  myTeeTimesCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  myTeeTimesHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  myTeeTimesTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  myTeeTimesTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  myTeeTimesCountPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.10)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 30,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  myTeeTimesCountText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800'
  },
  myTeeTimesBody: {
    gap: 2
  },
  myTeeTimesCourse: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700'
  },
  myTeeTimesMeta: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  myTeeTimesEmpty: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  formCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 18,
    padding: 20
  },
  composerHeader: {
    gap: 8
  },
  composerTitleWrap: {
    gap: 4
  },
  composerHint: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  composerSection: {
    gap: 10
  },
  formSectionHeader: {
    gap: 3
  },
  formSectionLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  formSectionHint: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 20
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  feedCardAccent: {
    color: palette.aqua,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center'
  },
  body: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  cardAccent: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
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
  hiddenInput: {
    display: 'none'
  },
  pickerField: {
    justifyContent: 'center'
  },
  pickerPlaceholder: {
    color: palette.textMuted,
    fontSize: 15
  },
  pickerValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600'
  },
  inlinePicker: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden'
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10
  },
  categoryPill: {
    alignItems: 'flex-start',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 14
  },
  categoryLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'left'
  },
  categoryValueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  categoryMenu: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden'
  },
  categoryMenuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 16
  },
  categoryMenuItemActive: {
    backgroundColor: 'rgba(103,232,249,0.1)'
  },
  categoryMenuText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600'
  },
  categoryMenuTextActive: {
    color: palette.aqua
  },
  inlineInfoField: {
    gap: 5,
    justifyContent: 'center',
    paddingVertical: 8
  },
  inlineFieldLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  inlineFieldInput: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 0
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10
  },
  segment: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16
  },
  segmentActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  segmentLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  segmentLabelActive: {
    color: palette.aqua
  },
  groupPicker: {
    gap: 8
  },
  groupOption: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  groupOptionActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.28)'
  },
  groupOptionText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  groupOptionTextActive: {
    color: palette.aqua
  },
  flexInput: {
    flex: 1
  },
  feedItem: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
    padding: 14
  },
  feedSpecialCard: {
    backgroundColor: 'rgba(6,20,16,0.28)',
    borderColor: 'rgba(103,232,249,0.14)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  feedSpecialHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  feedSpecialEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase'
  },
  feedSpecialTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800'
  },
  feedSpecialMeta: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  feedSpecialActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2
  },
  feedProfileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  feedProfileHeaderCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  feedProfileName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800'
  },
  feedProfileMeta: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  feedPrimaryButton: {
    alignItems: 'center',
    backgroundColor: palette.aqua,
    borderRadius: 999,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16
  },
  feedPrimaryButtonText: {
    color: palette.bg,
    fontSize: 13,
    fontWeight: '800'
  },
  feedSecondaryButton: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 16
  },
  feedSecondaryButtonText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  },
  feedHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12
  },
  feedHeaderCopy: {
    flex: 1,
    gap: 4,
    paddingTop: 2
  },
  feedEditButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginLeft: 8,
    width: 32
  },
  emptyCard: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 16
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700'
  },
  feedTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700'
  },
  feedTimestamp: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 'auto',
    textAlign: 'right'
  },
  feedBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  feedImage: {
    borderRadius: 18,
    height: 220,
    marginTop: 8,
    width: '100%'
  },
  feedPhotoCaption: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10
  },
  scoreHeroRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between'
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.22)',
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 74,
    minWidth: 74,
    paddingHorizontal: 14
  },
  scoreBadgeValue: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '900'
  },
  feedActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  feedActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  feedActionText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800'
  },
  commentComposer: {
    gap: 8,
    marginTop: 8
  },
  commentInput: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    color: palette.text,
    minHeight: 48,
    paddingHorizontal: 14
  },
})
