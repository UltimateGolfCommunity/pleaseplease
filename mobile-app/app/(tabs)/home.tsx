import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router } from 'expo-router'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { StatCard } from '@/components/StatCard'
import { apiGet, apiPost } from '@/lib/api'
import { palette } from '@/lib/theme'
import { getMobileWeather, type MobileWeatherData } from '@/lib/weather'
import { useAuth } from '@/providers/AuthProvider'

type TeeTime = {
  id: string
  course_name?: string
  location?: string
  tee_time_date?: string
  tee_time_time?: string
  current_players?: number
  max_players?: number
  available_spots?: number
  visibility_scope?: string
  creator_id?: string
}

type CreateTeeTimeResponse = {
  success?: boolean
  message?: string
  tee_time?: TeeTime | null
}

type Activity = {
  id: string
  title?: string
  description?: string
  created_at?: string
  actor?: {
    first_name?: string | null
    last_name?: string | null
    username?: string | null
  } | null
}

type WeatherData = MobileWeatherData

function formatDisplayDate(date?: string, time?: string) {
  if (!date) return 'No round on the books'

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })

  if (!time) {
    return dateLabel
  }

  return `${dateLabel} at ${time.slice(0, 5)}`
}

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

export default function HomeTab() {
  const { loading, profile, user } = useAuth()
  const [activeHomePanel, setActiveHomePanel] = useState<'tee-times' | 'network'>('tee-times')
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(true)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [nextTeeTime, setNextTeeTime] = useState<TeeTime | null>(null)
  const [availableTeeTimes, setAvailableTeeTimes] = useState<TeeTime[]>([])
  const [activityFeed, setActivityFeed] = useState<Activity[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [form, setForm] = useState({
    course_name: '',
    location: '',
    tee_time_date: '',
    tee_time_time: '',
    max_players: '4',
    handicap_requirement: 'any',
    visibility_scope: 'public'
  })

  const displayName = useMemo(() => {
    return (
      profile?.first_name ||
      profile?.full_name?.split(' ')[0] ||
      user?.user_metadata?.first_name ||
      user?.email?.split('@')[0] ||
      'Golfer'
    )
  }, [profile, user])

  const weatherQuery = useMemo(() => {
    const locationText = profile?.location || nextTeeTime?.location || ''
    return locationText.trim() || 'Monterey, CA'
  }, [nextTeeTime?.location, profile?.location])

  const loadHome = useCallback(async () => {
    if (!user?.id) return

    try {
      const [myRoundsResult, openingsResult, feedResult] = await Promise.allSettled([
        apiGet<TeeTime[]>(`/api/tee-times?action=user&user_id=${encodeURIComponent(user.id)}`),
        apiGet<TeeTime[]>(`/api/tee-times?action=available&user_id=${encodeURIComponent(user.id)}`),
        apiGet<{ activities: Activity[] }>(
          `/api/activities?action=feed&user_id=${encodeURIComponent(user.id)}&limit=6`
        )
      ])

      const myRounds = myRoundsResult.status === 'fulfilled' ? myRoundsResult.value : []
      const openings = openingsResult.status === 'fulfilled' ? openingsResult.value : []
      const feed = feedResult.status === 'fulfilled' ? feedResult.value : { activities: [] }

      const futureMyRounds = (myRounds || [])
        .filter((teeTime) => teeTime.tee_time_date)
        .sort((a, b) => {
          const aValue = `${a.tee_time_date || ''}T${a.tee_time_time || '00:00:00'}`
          const bValue = `${b.tee_time_date || ''}T${b.tee_time_time || '00:00:00'}`
          return aValue.localeCompare(bValue)
        })

      const nextMine = futureMyRounds[0] || null
      setNextTeeTime(nextMine)
      setAvailableTeeTimes((openings || []).filter((teeTime) => teeTime.creator_id !== user.id))
      setActivityFeed(feed.activities || [])
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

  useEffect(() => {
    void loadWeather()
  }, [loadWeather])

  useEffect(() => {
    void loadHeaderCounts()
  }, [loadHeaderCounts])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleCreateTeeTime = async () => {
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
        action: 'create',
        creator_id: user.id,
        user_id: user.id,
        course_name: form.course_name.trim(),
        location: form.location.trim(),
        tee_time_date: selectedDate ? toApiDate(selectedDate) : form.tee_time_date.trim(),
        tee_time_time: selectedTime ? toApiTime(selectedTime) : form.tee_time_time.trim(),
        max_players: Number(form.max_players) || 4,
        handicap_requirement: form.handicap_requirement.trim() || 'any',
        visibility_scope: form.visibility_scope
      })

      if (response.tee_time) {
        setNextTeeTime(response.tee_time)
      }

      Alert.alert('Tee time posted', 'Your round is now live in the community.')
      setForm({
        course_name: '',
        location: '',
        tee_time_date: '',
        tee_time_time: '',
        max_players: '4',
        handicap_requirement: 'any',
        visibility_scope: 'public'
      })
      setSelectedDate(null)
      setSelectedTime(null)
      setShowCreateForm(false)
      setBusy(true)
      await loadHome()
    } catch (error) {
      Alert.alert('Unable to post tee time', error instanceof Error ? error.message : 'Please try again.')
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

  const handleJoinTeeTime = async (teeTimeId: string) => {
    if (!user?.id) return

    setJoiningId(teeTimeId)
    try {
      await apiPost('/api/tee-times', {
        action: 'apply',
        tee_time_id: teeTimeId,
        applicant_id: user.id
      })
      Alert.alert('Request sent', 'The tee time host has been notified.')
      await Promise.all([loadHome(), loadHeaderCounts()])
    } catch (error) {
      Alert.alert('Unable to join tee time', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setJoiningId(null)
    }
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
                loadHome()
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

        {showCreateForm ? (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Post a tee time</Text>
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, course_name: value }))}
              placeholder="Course name"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.course_name}
            />
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
              placeholder="Location"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.location}
            />
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
            <View style={styles.splitRow}>
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => setForm((current) => ({ ...current, max_players: value }))}
                placeholder="Players"
                placeholderTextColor={palette.textMuted}
                style={[styles.input, styles.flexInput]}
                value={form.max_players}
              />
              <TextInput
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, handicap_requirement: value }))
                }
                placeholder="Handicap"
                placeholderTextColor={palette.textMuted}
                style={[styles.input, styles.flexInput]}
                value={form.handicap_requirement}
              />
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
                { label: 'Connections', value: 'connections' }
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
            <PrimaryButton
              label="Publish Tee Time"
              loading={creating}
              onPress={handleCreateTeeTime}
            />
          </View>
        ) : null}

        <View style={styles.row}>
          <StatCard
            label={`${displayName}'s Next Tee Time`}
            value={nextTeeTime ? nextTeeTime.course_name || 'Upcoming round' : 'No round yet'}
            detail={
              nextTeeTime
                ? formatDisplayDate(nextTeeTime.tee_time_date, nextTeeTime.tee_time_time)
                : 'Post one from the web app or the next mobile screen.'
            }
          />
        </View>

        <View style={styles.panelSwitcher}>
          <Pressable
            onPress={() => setActiveHomePanel('tee-times')}
            style={[styles.panelTab, activeHomePanel === 'tee-times' && styles.panelTabActive]}
          >
            <Text style={[styles.panelTabLabel, activeHomePanel === 'tee-times' && styles.panelTabLabelActive]}>
              Tee Times
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveHomePanel('network')}
            style={[styles.panelTab, activeHomePanel === 'network' && styles.panelTabActive]}
          >
            <Text style={[styles.panelTabLabel, activeHomePanel === 'network' && styles.panelTabLabelActive]}>
              Network Feed
            </Text>
          </Pressable>
        </View>

        {activeHomePanel === 'tee-times' ? (
          <View style={styles.card}>
            <Text style={styles.cardAccent}>Available tee times</Text>
            <Text style={styles.sectionTitle}>Join a round</Text>
            {busy ? <ActivityIndicator color={palette.aqua} /> : null}
            {!busy && availableTeeTimes.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No open rounds right now</Text>
                <Text style={styles.body}>When golfers post public tee times, they will show up here.</Text>
              </View>
            ) : null}
            {!busy
              ? availableTeeTimes.map((teeTime) => (
                  <View key={teeTime.id} style={styles.teeTimeCard}>
                    <View style={styles.teeTimeCopy}>
                      <Text style={styles.teeTimeTitle}>{teeTime.course_name || 'Open tee time'}</Text>
                      <Text style={styles.teeTimeMeta}>
                        {formatDisplayDate(teeTime.tee_time_date, teeTime.tee_time_time)}
                      </Text>
                      <Text style={styles.teeTimeMeta}>
                        {teeTime.available_spots ??
                          Math.max((teeTime.max_players || 0) - (teeTime.current_players || 0), 0)}{' '}
                        spots open
                      </Text>
                    </View>
                    <PrimaryButton
                      label="Join"
                      loading={joiningId === teeTime.id}
                      onPress={() => void handleJoinTeeTime(teeTime.id)}
                    />
                  </View>
                ))
              : null}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardAccent}>Network feed</Text>
            <Text style={styles.sectionTitle}>What your network is doing</Text>
            {busy ? <ActivityIndicator color={palette.aqua} /> : null}
            {!busy && activityFeed.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No fresh movement yet</Text>
                <Text style={styles.body}>
                  Once your connections post tee times or rounds, their movement will show up here.
                </Text>
              </View>
            ) : null}
            {!busy
              ? activityFeed.slice(0, 4).map((item) => (
                  <View key={item.id} style={styles.feedItem}>
                    <Text style={styles.feedTitle}>
                      {item.actor?.first_name || item.actor?.username || 'A golfer'} •{' '}
                      {item.title || 'Activity'}
                    </Text>
                    {item.description ? <Text style={styles.feedBody}>{item.description}</Text> : null}
                  </View>
                ))
              : null}
          </View>
        )}
        </ScrollView>

        <Pressable
          onPress={() => setShowCreateForm((value) => !value)}
          style={styles.floatingComposeButton}
        >
          <Text style={styles.floatingComposeIcon}>{showCreateForm ? '×' : '+'}</Text>
        </Pressable>
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
    gap: 18,
    padding: 20,
    paddingBottom: 120
  },
  headerShell: {
    justifyContent: 'center',
    minHeight: 128,
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
    top: 14,
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
    top: 14,
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
    borderRadius: 28,
    borderWidth: 1,
    gap: 10,
    marginTop: -8,
    paddingHorizontal: 16,
    paddingVertical: 14
  },
  weatherHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  weatherHeaderCopy: {
    flex: 1,
    gap: 4
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
    fontSize: 16,
    fontWeight: '700'
  },
  weatherTemp: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800'
  },
  weatherDescription: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 19,
    textTransform: 'capitalize'
  },
  weatherMetrics: {
    flexDirection: 'row',
    gap: 8
  },
  weatherMetric: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  weatherMetricLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  weatherMetricValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700'
  },
  weatherFallback: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  weatherLocationButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  weatherLocationButtonText: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
  },
  formCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  row: {
    gap: 12
  },
  panelSwitcher: {
    backgroundColor: palette.bgElevated,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 6
  },
  panelTab: {
    alignItems: 'center',
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14
  },
  panelTabActive: {
    backgroundColor: palette.card
  },
  panelTabLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  panelTabLabelActive: {
    color: palette.text
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
  feedBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  teeTimeCard: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  teeTimeCopy: {
    gap: 4
  },
  teeTimeTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  teeTimeMeta: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  floatingComposeButton: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 999,
    bottom: 22,
    elevation: 8,
    height: 62,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    width: 62
  },
  floatingComposeIcon: {
    color: palette.bg,
    fontSize: 30,
    fontWeight: '500',
    lineHeight: 30
  }
})
