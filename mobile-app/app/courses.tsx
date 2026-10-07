import { useCallback, useEffect, useState } from 'react'
import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type Course = {
  id: string
  name: string
  location?: string | null
  description?: string | null
  logo_url?: string | null
  course_image_url?: string | null
  average_rating?: number | null
  review_count?: number | null
  course_type?: string | null
  green_fees_min?: number | null
  green_fees_max?: number | null
}

export default function CoursesScreen() {
  const { loading, user } = useAuth()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  const loadCourses = useCallback(async (nextQuery = query) => {
    try {
      const response = await apiGet<{ courses: Course[] }>(
        `/api/golf-courses?query=${encodeURIComponent(nextQuery.trim())}&limit=30`
      )
      setCourses(response.courses || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [query])

  useEffect(() => {
    void loadCourses('')
  }, [loadCourses])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
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
              void loadCourses()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader showBack showLogo={false} title="Course finder" subtitle="The club’s word of mouth, course by course." />
        <View style={styles.searchCard}>
          <View style={styles.searchHeading}><View><Text style={styles.searchKicker}>Discover local golf</Text><Text style={styles.searchTitle}>Where are you playing next?</Text></View><Ionicons color={palette.gold} name="flag-outline" size={29} /></View>
          <TextInput
            onChangeText={setQuery}
            onSubmitEditing={() => void loadCourses()}
            placeholder="Search courses or cities"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={query}
          />
          <PrimaryButton label="Find courses" onPress={() => void loadCourses()} />
        </View>
        {busy ? <ActivityIndicator color={palette.aqua} /> : null}
        {!busy ? <Text style={styles.resultLabel}>{query.trim() ? `Results for “${query.trim()}”` : 'Nashville-area courses'}</Text> : null}
        {courses.map((course) => (
          <Pressable key={course.id} onPress={() => router.push(`/courses/${course.id}`)} style={styles.card}>
            <View style={styles.courseVisual}>
              {course.course_image_url ? <Image source={{ uri: course.course_image_url }} style={styles.courseImage} /> : <View style={styles.courseImageFallback} />}
              <View style={styles.visualShade} />
              <Avatar label={course.name} shape="rounded" size={52} uri={course.logo_url} />
              <View style={styles.reviewChip}><Ionicons color={palette.gold} name="star" size={13} /><Text style={styles.reviewChipText}>{course.average_rating ? course.average_rating.toFixed(1) : 'New'}</Text></View>
            </View>
            <View style={styles.copy}>
              <Text numberOfLines={1} style={styles.name}>{course.name}</Text>
              <Text numberOfLines={1} style={styles.meta}>{course.location || 'Location not set'}</Text>
              <View style={styles.courseMetaRow}>
                <Text style={styles.courseStat}>{course.review_count || 0} reviews</Text>
                {course.green_fees_min ? <Text style={styles.courseStat}>from ${course.green_fees_min}</Text> : null}
                {course.course_type ? <Text style={styles.courseStat}>{course.course_type}</Text> : null}
              </View>
            </View>
            <Ionicons color={palette.aqua} name="chevron-forward" size={21} />
          </Pressable>
        ))}
        {!busy && !courses.length ? <View style={styles.emptyState}><Ionicons color={palette.gold} name="golf-outline" size={30} /><Text style={styles.emptyTitle}>No courses found</Text><Text style={styles.emptyBody}>Try a course, club, city, or nearby neighborhood.</Text></View> : null}
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
    gap: 16,
    padding: 20
  },
  searchCard: {
    backgroundColor: 'rgba(22,63,49,0.96)',
    borderColor: 'rgba(232,204,135,0.30)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  searchHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  searchKicker: {
    color: palette.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase'
  },
  searchTitle: {
    color: palette.text,
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 3
  },
  input: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 54,
    paddingHorizontal: 16
  },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,63,49,0.94)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 10
  },
  courseVisual: {
    borderRadius: 14,
    height: 76,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: 10,
    position: 'relative',
    width: 76
  },
  courseImage: {
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%'
  },
  courseImageFallback: {
    backgroundColor: palette.cardSoft,
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%'
  },
  visualShade: {
    backgroundColor: 'rgba(8,43,30,0.20)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  reviewChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,43,30,0.84)',
    borderRadius: 999,
    bottom: 5,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 3,
    position: 'absolute',
    right: 5
  },
  reviewChipText: {
    color: palette.white,
    fontSize: 10,
    fontWeight: '900'
  },
  copy: {
    flex: 1,
    gap: 4
  },
  name: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800'
  },
  meta: {
    color: palette.textMuted,
    fontSize: 13
  },
  courseMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 3
  },
  courseStat: {
    color: palette.aqua,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'capitalize'
  },
  resultLabel: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,63,49,0.75)',
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 7,
    padding: 24
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '900'
  },
  emptyBody: {
    color: palette.textMuted,
    fontSize: 13,
    textAlign: 'center'
  }
})
