import { useCallback, useEffect, useState } from 'react'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Redirect } from 'expo-router'
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
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type TeeTime = {
  id: string
  course_name?: string
  location?: string
  tee_time_date?: string
  tee_time_time?: string
  handicap_requirement?: string
  current_players?: number
  max_players?: number
  available_spots?: number
  visibility_scope?: string
  activity_id?: string | null
  like_count?: number
  liked_by_user?: boolean
  comment_count?: number
  accepted_players?: {
    id?: string
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
  }[]
}

const skillOptions = ['Beginner', 'Weekend Hack', 'Weekend Grinder', 'Low Handicap', 'Pro']

function formatDisplayDate(date?: string, time?: string) {
  if (!date) return 'No date set'

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })

  if (!time) return dateLabel
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
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function fromApiDate(value?: string) {
  if (!value) return null
  const parsed = new Date(`${value}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function fromApiTime(value?: string) {
  if (!value) return null
  const [hours = '0', minutes = '0'] = value.split(':')
  const next = new Date()
  next.setHours(Number(hours), Number(minutes), 0, 0)
  return next
}

function getJoinedCount(teeTime: TeeTime) {
  const currentPlayers = teeTime.current_players ?? 1
  return Math.max(currentPlayers - 1, 0)
}

function getRemainingSpots(teeTime: TeeTime) {
  if (teeTime.available_spots !== undefined && teeTime.available_spots !== null) {
    return teeTime.available_spots
  }

  return Math.max((teeTime.max_players || 0) - (teeTime.current_players || 0), 0)
}

export default function TeeTimesScreen() {
  const { loading, profile, user } = useAuth()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)
  const [teeTimes, setTeeTimes] = useState<TeeTime[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    course_name: '',
    location: '',
    tee_time_date: '',
    tee_time_time: '',
    max_players: '4',
    handicap_requirement: 'Weekend Hack',
    visibility_scope: 'public'
  })

  const displayName =
    profile?.first_name ||
    profile?.full_name?.split(' ')[0] ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'Golfer'

  const loadTeeTimes = useCallback(async () => {
    if (!user?.id) return

    try {
      const teeTimesResponse = await apiGet<TeeTime[]>(`/api/tee-times?action=user&user_id=${encodeURIComponent(user.id)}`)
      setTeeTimes(teeTimesResponse || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      void loadTeeTimes()
    }
  }, [loadTeeTimes, user?.id])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const startEditing = (teeTime: TeeTime) => {
    const nextDate = fromApiDate(teeTime.tee_time_date)
    const nextTime = fromApiTime(teeTime.tee_time_time)
    setEditingId(teeTime.id)
    setSelectedDate(nextDate)
    setSelectedTime(nextTime)
    setForm({
      course_name: teeTime.course_name || '',
      location: teeTime.location || '',
      tee_time_date: nextDate ? formatFormDate(nextDate) : '',
      tee_time_time: nextTime ? formatFormTime(nextTime) : teeTime.tee_time_time || '',
      max_players: teeTime.max_players ? String(teeTime.max_players) : '4',
      handicap_requirement: teeTime.handicap_requirement || 'Weekend Hack',
      visibility_scope: teeTime.visibility_scope || 'public'
    })
  }

  const resetEditor = () => {
    setEditingId(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setShowDatePicker(false)
    setShowTimePicker(false)
    setForm({
      course_name: '',
      location: '',
      tee_time_date: '',
      tee_time_time: '',
      max_players: '4',
      handicap_requirement: 'Weekend Hack',
      visibility_scope: 'public'
    })
  }

  const handleDateChange = (_event: DateTimePickerEvent, value?: Date) => {
    setShowDatePicker(false)
    if (!value) return
    setSelectedDate(value)
    setForm((current) => ({ ...current, tee_time_date: formatFormDate(value) }))
  }

  const handleTimeChange = (_event: DateTimePickerEvent, value?: Date) => {
    setShowTimePicker(false)
    if (!value) return
    setSelectedTime(value)
    setForm((current) => ({ ...current, tee_time_time: formatFormTime(value) }))
  }

  const handleSave = async () => {
    if (!user?.id || !editingId) return

    setSaving(true)
    try {
      await apiPost('/api/tee-times', {
        action: 'update',
        tee_time_id: editingId,
        user_id: user.id,
        creator_id: user.id,
        course_name: form.course_name.trim(),
        location: form.location.trim(),
        tee_time_date: selectedDate ? toApiDate(selectedDate) : form.tee_time_date.trim(),
        tee_time_time: selectedTime ? toApiTime(selectedTime) : form.tee_time_time.trim(),
        max_players: Number(form.max_players) || 4,
        handicap_requirement: form.handicap_requirement,
        visibility_scope: form.visibility_scope
      })

      await apiPost('/api/notifications', {
        action: 'create',
        user_id: user.id,
        type: 'tee_time_updated',
        title: 'Tee time updated successfully',
        message: `${form.course_name.trim()} was updated successfully.`,
        related_id: editingId
      }).catch(() => null)

      Alert.alert('Tee time updated', 'Your tee time changes are saved.')
      resetEditor()
      setBusy(true)
      await loadTeeTimes()
    } catch (error) {
      Alert.alert('Unable to update tee time', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleLike = async (teeTime: TeeTime) => {
    if (!user?.id || !teeTime.activity_id) return

    const liked = !!teeTime.liked_by_user

    setTeeTimes((current) =>
      current.map((item) =>
        item.id === teeTime.id
          ? {
              ...item,
              liked_by_user: !liked,
              like_count: Math.max((item.like_count || 0) + (liked ? -1 : 1), 0)
            }
          : item
      )
    )

    try {
      await apiPost('/api/feed/interactions', {
        action: liked ? 'unlike' : 'like',
        activity_id: teeTime.activity_id,
        user_id: user.id
      })
    } catch (error) {
      Alert.alert('Unable to react', error instanceof Error ? error.message : 'Please try again.')
      await loadTeeTimes()
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
              void loadTeeTimes()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader showBack title="My Tee Times" />

        {editingId ? (
          <View style={styles.editorCard}>
            <Text style={styles.sectionTitle}>Edit tee time</Text>
            <TextInput
              value={form.course_name}
              onChangeText={(value) => setForm((current) => ({ ...current, course_name: value }))}
              placeholder="Course name"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
            />
            <TextInput
              value={form.location}
              onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
              placeholder="Location"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
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
                <DateTimePicker display="default" mode="date" onChange={handleDateChange} value={selectedDate || new Date()} />
              </View>
            ) : null}
            {showTimePicker ? (
              <View style={styles.inlinePicker}>
                <DateTimePicker display="default" mode="time" onChange={handleTimeChange} value={selectedTime || new Date()} />
              </View>
            ) : null}
            <View style={styles.splitRow}>
              <TextInput
                value={form.max_players}
                onChangeText={(value) => setForm((current) => ({ ...current, max_players: value }))}
                keyboardType="number-pad"
                placeholder="Players"
                placeholderTextColor={palette.textMuted}
                style={[styles.input, styles.flexInput]}
              />
              <View style={styles.categoryPill}>
                <Text style={styles.categoryLabel}>{form.handicap_requirement}</Text>
              </View>
            </View>
            <View style={styles.skillGrid}>
              {skillOptions.map((option) => {
                const active = form.handicap_requirement === option
                return (
                  <Pressable
                    key={option}
                    onPress={() => setForm((current) => ({ ...current, handicap_requirement: option }))}
                    style={[styles.skillChip, active && styles.skillChipActive]}
                  >
                    <Text style={[styles.skillChipText, active && styles.skillChipTextActive]}>{option}</Text>
                  </Pressable>
                )
              })}
            </View>
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
                    <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{option.label}</Text>
                  </Pressable>
                )
              })}
            </View>
            <PrimaryButton label="Save Tee Time" loading={saving} onPress={handleSave} />
            <PrimaryButton label="Cancel" variant="ghost" onPress={resetEditor} />
          </View>
        ) : null}

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Your posted tee times</Text>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && teeTimes.length === 0 ? (
            <Text style={styles.empty}>No tee times posted yet.</Text>
          ) : null}
          {teeTimes.map((teeTime) => (
            <View key={teeTime.id} style={styles.teeTimeRow}>
              <View style={styles.teeTimeCopy}>
                <Text style={styles.teeTimeTitle}>{teeTime.course_name || 'Tee time'}</Text>
                <Text style={styles.teeTimeMeta}>{formatDisplayDate(teeTime.tee_time_date, teeTime.tee_time_time)}</Text>
                {teeTime.location ? <Text style={styles.teeTimeMeta}>{teeTime.location}</Text> : null}
                <Text style={styles.teeTimeMeta}>
                  {getJoinedCount(teeTime)} joined • {getRemainingSpots(teeTime)} spots left
                </Text>
                {(teeTime.accepted_players || []).length ? (
                  <View style={styles.joinedPlayersRow}>
                    {(teeTime.accepted_players || []).slice(0, 5).map((player, index) => {
                      const label =
                        [player.first_name, player.last_name].filter(Boolean).join(' ') ||
                        player.username ||
                        'Golfer'

                      return (
                        <View
                          key={player.id || `${teeTime.id}-player-${index}`}
                          style={[styles.joinedPlayerAvatar, index > 0 && styles.joinedPlayerAvatarOverlap]}
                        >
                          <Avatar label={label} size={28} uri={player.avatar_url} />
                        </View>
                      )
                    })}
                    {(teeTime.accepted_players || []).length > 5 ? (
                      <View style={[styles.joinedPlayerOverflow, styles.joinedPlayerAvatarOverlap]}>
                        <Text style={styles.joinedPlayerOverflowText}>
                          +{(teeTime.accepted_players || []).length - 5}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                <View style={styles.reactionRow}>
                  <Pressable
                    onPress={() => void handleToggleLike(teeTime)}
                    style={[styles.reactionButton, teeTime.liked_by_user && styles.reactionButtonActive]}
                  >
                    <Text style={[styles.reactionButtonText, teeTime.liked_by_user && styles.reactionButtonTextActive]}>
                      {teeTime.liked_by_user ? 'Liked' : 'Like'}{teeTime.like_count ? ` • ${teeTime.like_count}` : ''}
                    </Text>
                  </Pressable>
                </View>
              </View>
              <PrimaryButton label="Edit" variant="ghost" onPress={() => startEditing(teeTime)} />
            </View>
          ))}
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
    gap: 18,
    padding: 20
  },
  editorCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  listCard: {
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
  input: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 52,
    paddingHorizontal: 16
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10
  },
  flexInput: {
    flex: 1
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
  categoryPill: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 14
  },
  categoryLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  skillChip: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  skillChipActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  skillChipText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  skillChipTextActive: {
    color: palette.aqua
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
  empty: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  teeTimeRow: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 14
  },
  teeTimeCopy: {
    flex: 1,
    gap: 4
  },
  teeTimeTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700'
  },
  teeTimeMeta: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  joinedPlayersRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
    paddingLeft: 2
  },
  joinedPlayerAvatar: {
    borderColor: palette.cardSoft,
    borderRadius: 999,
    borderWidth: 2
  },
  joinedPlayerAvatarOverlap: {
    marginLeft: -8
  },
  joinedPlayerOverflow: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  joinedPlayerOverflowText: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '800'
  },
  reactionRow: {
    marginTop: 8
  },
  reactionButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 12
  },
  reactionButtonActive: {
    backgroundColor: 'rgba(103,232,249,0.16)',
    borderColor: 'rgba(103,232,249,0.3)'
  },
  reactionButtonText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800'
  },
  reactionButtonTextActive: {
    color: palette.text
  }
})
