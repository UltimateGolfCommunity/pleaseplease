import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Redirect, useLocalSearchParams } from 'expo-router'
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
import * as ImagePicker from 'expo-image-picker'
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { uploadImageToStorage } from '@/lib/supabase'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type CourseReview = {
  id: string
  rating?: number | null
  comment?: string | null
  course_condition_rating?: number | null
  staff_rating?: number | null
  price_rating?: number | null
  difficulty_rating?: number | null
  photo_url?: string | null
  created_at?: string
  user_profiles?: {
    first_name?: string | null
    last_name?: string | null
    avatar_url?: string | null
  } | null
}

type CourseDetail = {
  id: string
  name: string
  location?: string | null
  description?: string | null
  logo_url?: string | null
  course_image_url?: string | null
  founded?: string | number | null
  year_founded?: string | number | null
  par?: number | null
  holes?: number | null
  average_rating?: number
  review_count?: number
  recent_reviews?: CourseReview[]
  course_reviews?: CourseReview[]
}

const reviewCategories = [
  'Course Condition',
  'Staff',
  'Price',
  'Difficulty'
]

export default function CourseScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const scrollRef = useRef<ScrollView | null>(null)
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reviewPhotoUri, setReviewPhotoUri] = useState('')
  const [reviewComposerY, setReviewComposerY] = useState(0)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [comment, setComment] = useState('')
  const [ratings, setRatings] = useState<Record<string, number>>({
    'Course Condition': 0,
    Staff: 0,
    Price: 0,
    Difficulty: 0
  })

  const reviews = useMemo(
    () => course?.recent_reviews || course?.course_reviews || [],
    [course?.course_reviews, course?.recent_reviews]
  )

  const averageRating = useMemo(() => {
    const values = Object.values(ratings).filter((value) => value > 0)
    if (values.length !== reviewCategories.length) return 0
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }, [ratings])

  const loadCourse = useCallback(async () => {
    if (!id) return

    try {
      const response = await apiGet<{ course: CourseDetail | null }>(`/api/golf-courses?id=${encodeURIComponent(id)}`)
      setCourse(response.course)
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      setBusy(true)
      void loadCourse()
    }
  }, [id, loadCourse])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleSaveReview = async () => {
    if (!user?.id || !course?.id || !averageRating) {
      Alert.alert('Finish your review', 'Add a 1-5 star score for each category before posting.')
      return
    }

    setSaving(true)

    try {
      let uploadedPhotoUrl: string | null = null

      if (reviewPhotoUri) {
        const upload = await uploadImageToStorage({
          uri: reviewPhotoUri,
          fileName: `course-review-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          folder: 'course-reviews'
        })
        uploadedPhotoUrl = upload.publicUrl
      }

      await apiPost('/api/golf-courses/review', {
        course_id: course.id,
        user_id: user.id,
        rating: Math.round(averageRating),
        comment: comment.trim(),
        course_condition_rating: ratings['Course Condition'],
        staff_rating: ratings.Staff,
        price_rating: ratings.Price,
        difficulty_rating: ratings.Difficulty,
        photo_url: uploadedPhotoUrl
      })

      setComment('')
      setReviewPhotoUri('')
      setRatings({
        'Course Condition': 0,
        Staff: 0,
        Price: 0,
        Difficulty: 0
      })
      await loadCourse()
      Alert.alert('Review posted', 'Your course review is now attached to this club.')
    } catch (error) {
      Alert.alert('Unable to post review', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePickReviewPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to add a course review photo.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    })

    if (!result.canceled && result.assets[0]) {
      setReviewPhotoUri(result.assets[0].uri)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              void loadCourse()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader
          showBack
          largeLogo
          rightIconName="create-outline"
          onRightPress={() => scrollRef.current?.scrollTo({ y: reviewComposerY, animated: true })}
        />

        <View style={styles.heroCard}>
          <View style={styles.coverShell}>
            {course?.course_image_url ? (
              <Image source={{ uri: course.course_image_url }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverFallback}>
                <Text style={styles.coverFallbackText}>Golf Club</Text>
              </View>
            )}
          </View>
          <View style={styles.avatarWrap}>
            <Avatar label={course?.name || 'Course'} shape="rounded" size={94} uri={course?.logo_url} />
          </View>
          <View style={styles.identityStack}>
            <Text style={styles.name}>{course?.name || 'Golf club'}</Text>
            <Text style={styles.locationLine}>{course?.location || 'Location not set'}</Text>
            <View style={styles.ratingStrip}>
              <Ionicons color={palette.gold} name="star" size={18} />
              <Text style={styles.ratingText}>
                {course?.average_rating ? course.average_rating.toFixed(1) : 'New course'} average • {course?.review_count || 0} reviews
              </Text>
            </View>
            <View style={styles.courseFactsRow}>
              <Text style={styles.meta}>Founded {course?.year_founded || course?.founded || 'not listed'}</Text>
              <Text style={styles.meta}>{course?.holes || 18} holes</Text>
            </View>
          </View>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {course?.description ? <Text style={styles.body}>{course.description}</Text> : null}
        </View>

        <View
          style={styles.card}
          onLayout={(event) => setReviewComposerY(event.nativeEvent.layout.y)}
        >
          <Text style={styles.sectionTitle}>Leave a review</Text>
          <Text style={styles.body}>Rate the parts golfers actually care about before they book a round.</Text>
          {reviewCategories.map((category) => (
            <View key={category} style={styles.ratingRow}>
              <Text style={styles.ratingCategory}>{category}</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setRatings((current) => ({ ...current, [category]: value }))}
                  >
                    <Ionicons
                      color={value <= ratings[category] ? palette.gold : palette.textMuted}
                      name={value <= ratings[category] ? 'star' : 'star-outline'}
                      size={22}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
          <TextInput
            multiline
            onChangeText={setComment}
            placeholder="Add notes, favorite holes, photos you took, or what another golfer should know."
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={comment}
          />
          <Pressable onPress={handlePickReviewPhoto} style={styles.photoReviewButton}>
            {reviewPhotoUri ? (
              <Image source={{ uri: reviewPhotoUri }} style={styles.reviewPhotoPreview} />
            ) : (
              <>
                <Ionicons color={palette.aqua} name="image-outline" size={18} />
                <Text style={styles.photoReviewText}>Add course photo</Text>
              </>
            )}
          </Pressable>
          <PrimaryButton label={saving ? 'Posting...' : 'Post Review'} loading={saving} onPress={handleSaveReview} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Golfer reviews</Text>
          {!reviews.length ? <Text style={styles.body}>No reviews yet. Be the first to leave one.</Text> : null}
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Avatar
                  label={[review.user_profiles?.first_name, review.user_profiles?.last_name].filter(Boolean).join(' ') || 'Golfer'}
                  size={38}
                  uri={review.user_profiles?.avatar_url}
                />
                <View style={styles.reviewCopy}>
                  <Text style={styles.reviewName}>
                    {[review.user_profiles?.first_name, review.user_profiles?.last_name].filter(Boolean).join(' ') || 'UGC Golfer'}
                  </Text>
                  <Text style={styles.meta}>{review.rating || 0}/5 stars</Text>
                </View>
              </View>
              {review.comment ? <Text style={styles.body}>{review.comment}</Text> : null}
              <View style={styles.categoryMiniGrid}>
                {[
                  ['Condition', review.course_condition_rating],
                  ['Staff', review.staff_rating],
                  ['Price', review.price_rating],
                  ['Difficulty', review.difficulty_rating]
                ].map(([label, value]) => (
                  <Text key={String(label)} style={styles.categoryMini}>
                    {label}: {value || '-'}
                  </Text>
                ))}
              </View>
              {review.photo_url ? <Image source={{ uri: review.photo_url }} style={styles.reviewPhoto} /> : null}
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
  heroCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    overflow: 'hidden',
    padding: 18
  },
  coverShell: {
    borderRadius: 22,
    overflow: 'hidden'
  },
  coverImage: {
    height: 170,
    width: '100%'
  },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    height: 170,
    justifyContent: 'center'
  },
  coverFallbackText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  avatarWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: palette.card,
    borderRadius: 28,
    borderWidth: 6,
    marginTop: -64,
    zIndex: 2
  },
  identityStack: {
    alignItems: 'center',
    gap: 6,
    marginTop: -2
  },
  name: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center'
  },
  locationLine: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  courseFactsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  meta: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center'
  },
  ratingStrip: {
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.24)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  ratingText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800'
  },
  body: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 26,
    borderWidth: 1,
    gap: 14,
    padding: 18
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800'
  },
  ratingRow: {
    gap: 8
  },
  ratingCategory: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800'
  },
  stars: {
    flexDirection: 'row',
    gap: 8
  },
  input: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 110,
    padding: 14,
    textAlignVertical: 'top'
  },
  photoReviewButton: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 56,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  photoReviewText: {
    color: palette.aqua,
    fontSize: 14,
    fontWeight: '800'
  },
  reviewPhotoPreview: {
    height: 160,
    width: '100%'
  },
  categoryMiniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  categoryMini: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  reviewPhoto: {
    borderRadius: 16,
    height: 160,
    width: '100%'
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  reviewCopy: {
    flex: 1,
    gap: 2
  },
  reviewName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '800'
  }
})
