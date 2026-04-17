import { useMemo, useState } from 'react'
import { Redirect, router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type SearchUser = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
  location?: string | null
  handicap?: number | null
  is_founder_verified?: boolean
}

type SearchGroup = {
  id: string
  name: string
  description?: string | null
  location?: string | null
  member_count?: number
  group_type?: string | null
  logo_url?: string | null
  image_url?: string | null
  is_member?: boolean
}

type SearchTeeTime = {
  id: string
  course_name?: string
  tee_time_date?: string
  tee_time_time?: string
  available_spots?: number
  current_players?: number
  max_players?: number
  location?: string
  creator_id?: string
}

type SearchCourse = {
  id: string
  name: string
  location?: string | null
  description?: string | null
  logo_url?: string | null
  course_image_url?: string | null
  average_rating?: number
  review_count?: number
}

function formatUserName(user: SearchUser) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'UGC Golfer'
}

function formatTeeTime(teeTime: SearchTeeTime) {
  if (!teeTime.tee_time_date) return 'Time not set'
  const dateLabel = new Date(`${teeTime.tee_time_date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })
  return teeTime.tee_time_time ? `${dateLabel} at ${teeTime.tee_time_time.slice(0, 5)}` : dateLabel
}

export default function SearchTab() {
  const { loading, user } = useAuth()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [users, setUsers] = useState<SearchUser[]>([])
  const [groups, setGroups] = useState<SearchGroup[]>([])
  const [teeTimes, setTeeTimes] = useState<SearchTeeTime[]>([])
  const [courses, setCourses] = useState<SearchCourse[]>([])

  const hasResults = useMemo(
    () => users.length > 0 || groups.length > 0 || teeTimes.length > 0 || courses.length > 0,
    [courses.length, groups.length, teeTimes.length, users.length]
  )

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleSearch = async () => {
    if (!user?.id || !query.trim()) {
      setUsers([])
      setGroups([])
      setTeeTimes([])
      setCourses([])
      return
    }

    setSearching(true)

    try {
      const [userResponse, groupResponse, teeTimeResponse, courseResponse] = await Promise.all([
        apiGet<{ success: boolean; users: SearchUser[] }>(`/api/users?search=${encodeURIComponent(query.trim())}`),
        apiGet<{ success: boolean; groups: SearchGroup[] }>(
          `/api/groups?action=search&user_id=${encodeURIComponent(user.id)}&query=${encodeURIComponent(query.trim())}`
        ),
        apiGet<SearchTeeTime[]>(`/api/tee-times?action=available&user_id=${encodeURIComponent(user.id)}`),
        apiGet<{ courses: SearchCourse[] }>(
          `/api/golf-courses?query=${encodeURIComponent(query.trim())}&limit=12`
        ).catch(() => ({ courses: [] }))
      ])

      const loweredQuery = query.trim().toLowerCase()
      setUsers((userResponse.users || []).filter((candidate) => candidate.id !== user.id))
      setGroups(groupResponse.groups || [])
      setCourses(courseResponse.courses || [])
      setTeeTimes(
        (teeTimeResponse || []).filter((teeTime) =>
          [teeTime.course_name, teeTime.location, teeTime.tee_time_date, teeTime.tee_time_time]
            .filter(Boolean)
            .some((field) => field!.toLowerCase().includes(loweredQuery))
        )
      )
    } finally {
      setSearching(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandHeader largeLogo />

        <View style={styles.searchCard}>
          <TextInput
            onChangeText={setQuery}
            onSubmitEditing={() => void handleSearch()}
            placeholder="Search golfers, groups, courses, or tee times"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={query}
          />
          <PrimaryButton
            label={searching ? 'Searching...' : 'Search'}
            loading={searching}
            onPress={() => void handleSearch()}
          />
        </View>

        {searching ? <ActivityIndicator color={palette.aqua} /> : null}

        {!searching && query.trim() && !hasResults ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No results yet</Text>
            <Text style={styles.emptyBody}>Try a name, club, course, or city.</Text>
          </View>
        ) : null}

        {users.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Golfers</Text>
            {users.map((result) => (
              <Pressable key={result.id} onPress={() => router.push(`/users/${result.id}`)} style={styles.card}>
                <View style={styles.row}>
                  <Avatar label={formatUserName(result)} size={56} uri={result.avatar_url} />
                  <View style={styles.copy}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{formatUserName(result)}</Text>
                      {result.is_founder_verified ? (
                        <Ionicons color={palette.emerald} name="checkmark-circle" size={17} />
                      ) : null}
                    </View>
                    <Text style={styles.meta}>
                      {result.location || 'Location not set'} • Handicap {result.handicap ?? 'N/A'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {groups.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Groups</Text>
            {groups.map((result) => (
              <Pressable key={result.id} onPress={() => router.push(`/group/${result.id}`)} style={styles.card}>
                <View style={styles.row}>
                  <Avatar
                    label={result.name}
                    shape="rounded"
                    size={56}
                    uri={result.logo_url || result.image_url}
                  />
                  <View style={styles.copy}>
                    <Text style={styles.name}>{result.name}</Text>
                    <Text style={styles.meta}>
                      {(result.group_type || 'community').replace(/^./, (char) => char.toUpperCase())} •{' '}
                      {result.member_count || 0} members
                    </Text>
                    {result.location ? <Text style={styles.meta}>{result.location}</Text> : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {courses.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Golf Clubs</Text>
            {courses.map((result) => (
              <Pressable key={result.id} onPress={() => router.push(`/courses/${result.id}`)} style={styles.card}>
                <View style={styles.row}>
                  <Avatar
                    label={result.name}
                    shape="rounded"
                    size={56}
                    uri={result.logo_url || result.course_image_url}
                  />
                  <View style={styles.copy}>
                    <Text style={styles.name}>{result.name}</Text>
                    <Text style={styles.meta}>
                      {result.location || 'Location not set'} •{' '}
                      {result.average_rating ? `${result.average_rating.toFixed(1)} stars` : 'No reviews yet'}
                    </Text>
                    {result.description ? <Text style={styles.meta}>{result.description}</Text> : null}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {teeTimes.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tee Times</Text>
            {teeTimes.map((result) => (
              <View key={result.id} style={styles.card}>
                <Text style={styles.name}>{result.course_name || 'Open tee time'}</Text>
                <Text style={styles.meta}>{formatTeeTime(result)}</Text>
                <Text style={styles.meta}>
                  {result.available_spots ??
                    Math.max((result.max_players || 0) - (result.current_players || 0), 0)}{' '}
                  spots open
                </Text>
                {result.location ? <Text style={styles.meta}>{result.location}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}
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
  searchCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 18
  },
  input: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 56,
    paddingHorizontal: 16
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14
  },
  copy: {
    flex: 1,
    gap: 4
  },
  name: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700'
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6
  },
  meta: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  emptyCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700'
  },
  emptyBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  }
})
