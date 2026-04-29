import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, useLocalSearchParams } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { apiGet } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type RoundRecord = {
  id: string
  user_id: string
  course_name: string
  holes_played: number
  hole_scores: number[]
  total_score: number
  average_score_per_hole: number
  played_at: string
}

type RoundDetailPayload = {
  success: boolean
  round: RoundRecord
  course_average: number
  rounds_at_course: number
  best_at_course: number
  same_course_rounds: RoundRecord[]
}

export default function RoundDetailScreen() {
  const { loading, user, profile } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [payload, setPayload] = useState<RoundDetailPayload | null>(null)

  const loadRound = useCallback(async () => {
    if (!id) return

    try {
      const response = await apiGet<RoundDetailPayload>(`/api/scores?round_id=${encodeURIComponent(id)}`)
      setPayload(response)
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      setBusy(true)
      void loadRound()
    }
  }, [id, loadRound])

  const frontNine = useMemo(() => payload?.round.hole_scores.slice(0, 9) || [], [payload])
  const backNine = useMemo(() => payload?.round.hole_scores.slice(9, 18) || [], [payload])
  const frontTotal = frontNine.reduce((sum, score) => sum + score, 0)
  const backTotal = backNine.reduce((sum, score) => sum + score, 0)
  const currentHandicap = profile?.handicap ?? null

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
              void loadRound()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader showBack largeLogo />

        {busy ? <ActivityIndicator color={palette.aqua} /> : null}

        {!busy && payload ? (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.courseName}>{payload.round.course_name}</Text>
              <Text style={styles.dateText}>
                {new Date(payload.round.played_at).toLocaleDateString()} • {payload.round.holes_played} holes
              </Text>
              <View style={styles.scoreHero}>
                <Text style={styles.scoreHeroValue}>{payload.round.total_score}</Text>
                <Text style={styles.scoreHeroLabel}>Total Score</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Handicap</Text>
                <Text style={styles.summaryValue}>{currentHandicap ?? '--'}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Avg At Course</Text>
                <Text style={styles.summaryValue}>{payload.course_average?.toFixed(1) || '--'}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Avg / Hole</Text>
                <Text style={styles.summaryValue}>{payload.round.average_score_per_hole.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Round breakdown</Text>
              <View style={styles.nineRow}>
                <View style={styles.nineSummary}>
                  <Text style={styles.nineLabel}>Front 9</Text>
                  <Text style={styles.nineValue}>{frontNine.length ? frontTotal : '--'}</Text>
                </View>
                <View style={styles.nineSummary}>
                  <Text style={styles.nineLabel}>Back 9</Text>
                  <Text style={styles.nineValue}>{backNine.length ? backTotal : '--'}</Text>
                </View>
              </View>

              <View style={styles.scoreGrid}>
                {payload.round.hole_scores.map((score, index) => (
                  <View key={`${payload.round.id}-${index}`} style={styles.holeCard}>
                    <Text style={styles.holeLabel}>Hole {index + 1}</Text>
                    <Text style={styles.holeValue}>{score}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Course history</Text>
              <View style={styles.courseHistoryRow}>
                <View style={styles.courseHistoryPill}>
                  <Ionicons color={palette.aqua} name="golf-outline" size={14} />
                  <Text style={styles.courseHistoryText}>{payload.rounds_at_course} rounds here</Text>
                </View>
                <View style={styles.courseHistoryPill}>
                  <Ionicons color={palette.gold} name="trophy-outline" size={14} />
                  <Text style={styles.courseHistoryText}>Best {payload.best_at_course}</Text>
                </View>
              </View>
              {payload.same_course_rounds.slice(0, 4).map((round) => (
                <View key={round.id} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{new Date(round.played_at).toLocaleDateString()}</Text>
                  <Text style={styles.historyScore}>{round.total_score}</Text>
                </View>
              ))}
            </View>
          </>
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
    padding: 20,
    paddingBottom: 110
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 6,
    padding: 24
  },
  courseName: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center'
  },
  dateText: {
    color: palette.textMuted,
    fontSize: 14
  },
  scoreHero: {
    alignItems: 'center',
    marginTop: 8
  },
  scoreHeroValue: {
    color: palette.text,
    fontSize: 52,
    fontWeight: '800'
  },
  scoreHeroLabel: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10
  },
  summaryCard: {
    backgroundColor: palette.bgElevated,
    borderColor: palette.border,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    padding: 14
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  summaryValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
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
    fontSize: 20,
    fontWeight: '700'
  },
  nineRow: {
    flexDirection: 'row',
    gap: 10
  },
  nineSummary: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    padding: 12
  },
  nineLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  nineValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  holeCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: '30%',
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  holeLabel: {
    color: palette.textMuted,
    fontSize: 12
  },
  holeValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 4
  },
  courseHistoryRow: {
    flexDirection: 'row',
    gap: 10
  },
  courseHistoryPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  courseHistoryText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700'
  },
  historyRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  historyDate: {
    color: palette.textMuted,
    fontSize: 14
  },
  historyScore: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  }
})
