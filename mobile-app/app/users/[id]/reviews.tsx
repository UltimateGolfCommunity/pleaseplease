import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
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
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type ReviewProfile = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
}

type UserReview = {
  id: string
  stars: number
  review_text?: string | null
  created_at?: string | null
  updated_at?: string | null
  rater_user_id: string
  user_profiles?: ReviewProfile | null
}

type ReviewsPayload = {
  success?: boolean
  average: number | null
  count: number
  viewerRating: number | null
  viewerReview?: UserReview | null
  reviews: UserReview[]
}

type PublicUser = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
}

const starOptions = [1, 2, 3, 4, 5]
const emptyReviewsPayload: ReviewsPayload = {
  average: null,
  count: 0,
  viewerRating: null,
  viewerReview: null,
  reviews: []
}

function formatName(user?: ReviewProfile | PublicUser | null) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'UGC Golfer'
}

function formatReviewDate(value?: string | null) {
  if (!value) return 'Just now'
  const date = new Date(value)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function normalizeReviewsPayload(payload?: Partial<ReviewsPayload> | null): ReviewsPayload {
  return {
    average: typeof payload?.average === 'number' ? payload.average : null,
    count: typeof payload?.count === 'number' ? payload.count : 0,
    viewerRating: typeof payload?.viewerRating === 'number' ? payload.viewerRating : null,
    viewerReview: payload?.viewerReview || null,
    reviews: Array.isArray(payload?.reviews) ? payload.reviews : []
  }
}

export default function UserReviewsScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [payload, setPayload] = useState<ReviewsPayload>(emptyReviewsPayload)
  const [selectedStars, setSelectedStars] = useState(5)
  const [draftReview, setDraftReview] = useState('')

  const displayName = useMemo(() => formatName(profile), [profile])
  const isOwnProfile = user?.id === id

  const loadReviews = useCallback(async () => {
    if (!id) return

    try {
      const [profileResponse, reviewsResponse] = await Promise.all([
        apiGet<PublicUser>(`/api/users?id=${encodeURIComponent(id)}`),
        apiGet<ReviewsPayload>(
          `/api/users?action=reviews&id=${encodeURIComponent(id)}${user?.id ? `&viewer_id=${encodeURIComponent(user.id)}` : ''}`
        ).catch(() => emptyReviewsPayload)
      ])

      const normalizedPayload = normalizeReviewsPayload(reviewsResponse)
      setProfile(profileResponse)
      setPayload(normalizedPayload)
      setSelectedStars(normalizedPayload.viewerRating || normalizedPayload.viewerReview?.stars || 5)
      setDraftReview(normalizedPayload.viewerReview?.review_text || '')
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    if (id) {
      setBusy(true)
      loadReviews()
    }
  }, [id, loadReviews])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleSaveReview = async () => {
    if (!user?.id || !id) return

    if (isOwnProfile) {
      Alert.alert('Not available', 'You cannot leave a golfer review on your own profile.')
      return
    }

    setSaving(true)
    try {
      const response = await apiPost<ReviewsPayload>('/api/users', {
        action: 'rate',
        rated_user_id: id,
        rater_user_id: user.id,
        stars: selectedStars,
        review_text: draftReview
      })

      setPayload(normalizeReviewsPayload(response))
      Alert.alert(
        'Review saved',
        `Your ${selectedStars}-star review is now live on ${displayName.split(' ')[0]}'s profile.`,
        [
          {
            text: 'View profile',
            onPress: () => router.replace(`/users/${id}`)
          }
        ]
      )
    } catch (error) {
      Alert.alert('Unable to save review', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSaving(false)
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
              loadReviews()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader
          showBack
          largeLogo
          rightIconName={isOwnProfile ? undefined : 'person-outline'}
          onRightPress={isOwnProfile ? undefined : () => id && router.push(`/users/${id}`)}
        />

        <View style={styles.heroCard}>
          <Avatar label={displayName} size={86} uri={profile?.avatar_url} />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.kicker}>Golfer Reviews</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryBadge}>
              <Ionicons color={palette.gold} name="star" size={18} />
              <Text style={styles.summaryBadgeText}>{payload.average ? payload.average.toFixed(1) : 'New'}</Text>
            </View>
            <Text style={styles.summaryText}>
              {payload.count ? `${payload.count} community reviews` : 'Be the first to leave a golfer review'}
            </Text>
          </View>
        </View>

        {!isOwnProfile ? (
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>{payload.viewerReview ? 'Update review' : 'Leave a review'}</Text>
            <Text style={styles.sectionTitle}>
              {payload.viewerReview ? `Update what you think of ${displayName.split(' ')[0]}` : `Rate ${displayName.split(' ')[0]}'s game`}
            </Text>
            <View style={styles.starsRow}>
              {starOptions.map((star) => {
                const active = star <= selectedStars
                return (
                  <Pressable
                    key={star}
                    accessibilityRole="button"
                    onPress={() => setSelectedStars(star)}
                    style={[styles.starButton, active && styles.starButtonActive]}
                  >
                    <Ionicons color={active ? palette.gold : palette.textMuted} name="star" size={24} />
                  </Pressable>
                )
              })}
            </View>
            <TextInput
              multiline
              onChangeText={setDraftReview}
              placeholder="Add a quick review about this golfer, their vibe, pace, competitiveness, or why people should tee it up with them."
              placeholderTextColor={palette.textMuted}
              style={styles.reviewInput}
              textAlignVertical="top"
              value={draftReview}
            />
            <PrimaryButton
              label={payload.viewerReview ? 'Update Review' : 'Post Review'}
              loading={saving}
              onPress={handleSaveReview}
            />
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Community</Text>
          <Text style={styles.sectionTitle}>What golfers are saying</Text>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && !payload.reviews.length ? (
            <Text style={styles.helper}>No reviews yet. The first golfer who rates this profile will show up here.</Text>
          ) : null}
          {(payload.reviews || []).map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewIdentity}>
                  <Avatar label={formatName(review.user_profiles)} size={42} uri={review.user_profiles?.avatar_url || undefined} />
                  <View style={styles.reviewCopy}>
                    <Text style={styles.reviewName}>{formatName(review.user_profiles)}</Text>
                    <Text style={styles.reviewDate}>{formatReviewDate(review.updated_at || review.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.reviewStars}>
                  <Ionicons color={palette.gold} name="star" size={14} />
                  <Text style={styles.reviewStarsText}>{review.stars.toFixed(1)}</Text>
                </View>
              </View>
              {review.review_text ? <Text style={styles.reviewBody}>{review.review_text}</Text> : null}
              {!review.review_text ? (
                <Text style={styles.reviewBodyMuted}>Left a star rating without a written note.</Text>
              ) : null}
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
    gap: 20,
    padding: 20
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 10,
    padding: 24
  },
  name: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center'
  },
  kicker: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  summaryBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.28)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  summaryBadgeText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700'
  },
  summaryText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center'
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 20
  },
  sectionEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  starsRow: {
    flexDirection: 'row',
    gap: 10
  },
  starButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    width: 48
  },
  starButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderColor: 'rgba(245, 158, 11, 0.34)'
  },
  reviewInput: {
    backgroundColor: palette.bgElevated,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    color: palette.text,
    fontSize: 15,
    minHeight: 140,
    padding: 16
  },
  helper: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 16
  },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  reviewIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12
  },
  reviewCopy: {
    flex: 1,
    gap: 2
  },
  reviewName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700'
  },
  reviewDate: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '600'
  },
  reviewStars: {
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
  reviewStarsText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  },
  reviewBody: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 22
  },
  reviewBodyMuted: {
    color: palette.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21
  }
})
