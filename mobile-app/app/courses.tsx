import { useCallback, useEffect, useState } from 'react'
import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
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
        <BrandHeader showBack title="Courses" subtitle="Find golf clubs, read reviews, and leave your own course breakdown." />
        <View style={styles.searchCard}>
          <TextInput
            onChangeText={setQuery}
            onSubmitEditing={() => void loadCourses()}
            placeholder="Search courses or cities"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={query}
          />
          <PrimaryButton label="Search Courses" onPress={() => void loadCourses()} />
        </View>
        {busy ? <ActivityIndicator color={palette.aqua} /> : null}
        {courses.map((course) => (
          <Pressable key={course.id} onPress={() => router.push(`/courses/${course.id}`)} style={styles.card}>
            <Avatar
              label={course.name}
              shape="rounded"
              size={62}
              uri={course.logo_url || course.course_image_url}
            />
            <View style={styles.copy}>
              <Text style={styles.name}>{course.name}</Text>
              <Text style={styles.meta}>{course.location || 'Location not set'}</Text>
              <Text style={styles.meta}>
                {course.average_rating ? `${course.average_rating.toFixed(1)} stars` : 'No rating yet'} •{' '}
                {course.review_count || 0} reviews
              </Text>
            </View>
          </Pressable>
        ))}
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
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 16
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
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16
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
  }
})
