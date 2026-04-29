import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  mutual_connection_count?: number
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

const RECENT_SEARCHES_KEY = 'ugc_recent_searches'
const MAX_RECENT_SEARCHES = 6

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
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [recommendedUsers, setRecommendedUsers] = useState<SearchUser[]>([])
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [users, setUsers] = useState<SearchUser[]>([])
  const [groups, setGroups] = useState<SearchGroup[]>([])
  const [teeTimes, setTeeTimes] = useState<SearchTeeTime[]>([])
  const [courses, setCourses] = useState<SearchCourse[]>([])

  const hasResults = useMemo(
    () => users.length > 0 || groups.length > 0 || teeTimes.length > 0 || courses.length > 0,
    [courses.length, groups.length, teeTimes.length, users.length]
  )

  useEffect(() => {
    let active = true

    const loadRecentSearches = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY)
        if (!active || !stored) return
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_SEARCHES))
        }
      } catch {
        if (active) {
          setRecentSearches([])
        }
      }
    }

    void loadRecentSearches()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadRecommendations = async () => {
      if (!user?.id) return

      setLoadingRecommendations(true)

      try {
        const response = await apiGet<{ success: boolean; users: SearchUser[] }>(
          `/api/users?action=recommended&id=${encodeURIComponent(user.id)}`
        )

        if (active) {
          setRecommendedUsers((response.users || []).filter((candidate) => candidate.id !== user.id))
        }
      } catch {
        if (active) {
          setRecommendedUsers([])
        }
      } finally {
        if (active) {
          setLoadingRecommendations(false)
        }
      }
    }

    void loadRecommendations()

    return () => {
      active = false
    }
  }, [user?.id])

  const clearResults = useCallback(() => {
    setUsers([])
    setGroups([])
    setTeeTimes([])
    setCourses([])
  }, [])

  const persistRecentSearch = useCallback(async (term: string) => {
    const normalized = term.trim()
    if (!normalized) return

    const next = [normalized, ...recentSearches.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(
      0,
      MAX_RECENT_SEARCHES
    )

    setRecentSearches(next)

    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
    } catch {
      // Keep the search flow smooth even if local storage fails.
    }
  }, [recentSearches])

  const handleSearch = useCallback(async (incomingQuery?: string, options?: { persist?: boolean }) => {
    const nextQuery = incomingQuery ?? query
    const trimmedQuery = nextQuery.trim()

    if (!user?.id || !trimmedQuery) {
      clearResults()
      setSearching(false)
      return
    }

    if (trimmedQuery.length < 2) {
      clearResults()
      return
    }

    if (options?.persist !== false) {
      void persistRecentSearch(trimmedQuery)
    }

    setSearching(true)

    try {
      const [userResponse, groupResponse, teeTimeResponse, courseResponse] = await Promise.all([
        apiGet<{ success: boolean; users: SearchUser[] }>(`/api/users?search=${encodeURIComponent(trimmedQuery)}`),
        apiGet<{ success: boolean; groups: SearchGroup[] }>(
          `/api/groups?action=search&user_id=${encodeURIComponent(user.id)}&query=${encodeURIComponent(trimmedQuery)}`
        ),
        apiGet<SearchTeeTime[]>(`/api/tee-times?action=available&user_id=${encodeURIComponent(user.id)}`),
        apiGet<{ courses: SearchCourse[] }>(
          `/api/golf-courses?query=${encodeURIComponent(trimmedQuery)}&limit=12`
        ).catch(() => ({ courses: [] }))
      ])

      const loweredQuery = trimmedQuery.toLowerCase()
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
  }, [clearResults, persistRecentSearch, query, user?.id])

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      clearResults()
      setSearching(false)
      return
    }

    if (trimmedQuery.length < 2) {
      clearResults()
      return
    }

    const timeout = setTimeout(() => {
      void handleSearch(trimmedQuery, { persist: false })
    }, 220)

    return () => clearTimeout(timeout)
  }, [clearResults, handleSearch, query])

  const hasQuery = query.trim().length > 0

  const applyRecentSearch = (term: string) => {
    setQuery(term)
    void handleSearch(term)
  }

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([])

    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore local persistence errors.
    }
  }, [])

  const openUser = (id: string) => {
    if (query.trim()) {
      void persistRecentSearch(query.trim())
    }
    router.push(`/users/${id}`)
  }

  const openGroup = (id: string) => {
    if (query.trim()) {
      void persistRecentSearch(query.trim())
    }
    router.push(`/group/${id}`)
  }

  const openCourse = (id: string) => {
    if (query.trim()) {
      void persistRecentSearch(query.trim())
    }
    router.push(`/courses/${id}`)
  }

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandHeader largeLogo />

        <View style={styles.searchCard}>
          <View style={styles.searchTopRow}>
            <View style={styles.searchInputWrap}>
              <Ionicons color={palette.textMuted} name="search" size={18} style={styles.searchIcon} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                onSubmitEditing={() => void handleSearch()}
                placeholder="Search golfers, groups, courses, or tee times"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={query}
              />
              {hasQuery ? (
                <Pressable onPress={() => setQuery('')} style={styles.clearQueryButton}>
                  <Ionicons color={palette.textMuted} name="close" size={16} />
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={() => void handleSearch()} style={styles.searchActionButton}>
              <Ionicons color={palette.bg} name="arrow-forward" size={18} />
            </Pressable>
          </View>

          {!hasQuery && recentSearches.length ? (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>Recent</Text>
                <Pressable onPress={() => void clearRecentSearches()}>
                  <Text style={styles.recentClear}>Clear</Text>
                </Pressable>
              </View>
              <View style={styles.recentChips}>
                {recentSearches.map((term) => (
                  <Pressable key={term} onPress={() => applyRecentSearch(term)} style={styles.recentChip}>
                    <Ionicons color={palette.textMuted} name="time-outline" size={14} />
                    <Text style={styles.recentChipText}>{term}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {!hasQuery ? (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recommended Connections</Text>
              {loadingRecommendations ? <ActivityIndicator color={palette.aqua} size="small" /> : null}
            </View>
            {recommendedUsers.length ? (
              recommendedUsers.map((result) => (
                <Pressable key={result.id} onPress={() => openUser(result.id)} style={styles.card}>
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
                      <View style={styles.mutualRow}>
                        <View style={styles.mutualBadge}>
                          <Ionicons color={palette.aqua} name="people-outline" size={14} />
                          <Text style={styles.mutualBadgeText}>
                            {result.mutual_connection_count === 1
                              ? '1 mutual connection'
                              : `${result.mutual_connection_count || 0} mutual connections`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))
            ) : !loadingRecommendations ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No mutuals yet</Text>
                <Text style={styles.emptyBody}>
                  Once your network grows a bit more, we&apos;ll start surfacing golfers you both know.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {searching ? <ActivityIndicator color={palette.aqua} /> : null}

        {!searching && hasQuery && query.trim().length < 2 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Keep typing</Text>
            <Text style={styles.emptyBody}>Results will start appearing after 2 characters.</Text>
          </View>
        ) : null}

        {!searching && query.trim().length >= 2 && !hasResults ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No results yet</Text>
            <Text style={styles.emptyBody}>Try a name, club, course, or city.</Text>
          </View>
        ) : null}

        {users.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Golfers</Text>
            {users.map((result) => (
              <Pressable key={result.id} onPress={() => openUser(result.id)} style={styles.card}>
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
              <Pressable key={result.id} onPress={() => openGroup(result.id)} style={styles.card}>
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
              <Pressable key={result.id} onPress={() => openCourse(result.id)} style={styles.card}>
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
    gap: 14,
    padding: 18
  },
  searchTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  searchInputWrap: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 14
  },
  searchIcon: {
    marginRight: 8
  },
  input: {
    color: palette.text,
    flex: 1,
    minHeight: 56,
    paddingRight: 10
  },
  clearQueryButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  searchActionButton: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 18,
    height: 54,
    justifyContent: 'center',
    width: 54
  },
  recentSection: {
    gap: 10
  },
  recentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  recentTitle: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  recentClear: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  recentChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  recentChipText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600'
  },
  section: {
    gap: 12
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
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
  mutualRow: {
    flexDirection: 'row',
    marginTop: 4
  },
  mutualBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.10)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  mutualBadgeText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700'
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
