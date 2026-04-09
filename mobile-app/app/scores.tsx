import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type RoundRecord = {
  id: string
  course_name: string
  holes_played: number
  hole_scores: number[]
  total_score: number
  average_score_per_hole: number
  played_at: string
}

type ScoresPayload = {
  success: boolean
  rounds: RoundRecord[]
}

function buildHoleScores(count: 9 | 18) {
  return Array.from({ length: count }, () => '')
}

export default function ScoresScreen() {
  const { loading, profile, user } = useAuth()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18)
  const [courseName, setCourseName] = useState('')
  const [rounds, setRounds] = useState<RoundRecord[]>([])
  const [holeScores, setHoleScores] = useState<string[]>(buildHoleScores(18))

  const loadRounds = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await apiGet<ScoresPayload>(`/api/scores?user_id=${encodeURIComponent(user.id)}`)
      setRounds(response.rounds || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      loadRounds()
    }
  }, [loadRounds, user?.id])

  useEffect(() => {
    setHoleScores((previous) => {
      const next = buildHoleScores(holesPlayed)
      previous.slice(0, holesPlayed).forEach((score, index) => {
        next[index] = score
      })
      return next
    })
  }, [holesPlayed])

  const numericScores = useMemo(
    () => holeScores.map((score) => Number(score)).filter((score) => Number.isFinite(score) && score > 0),
    [holeScores]
  )

  const totalScore = useMemo(
    () => numericScores.reduce((sum, score) => sum + score, 0),
    [numericScores]
  )

  const averagePerHole = useMemo(
    () => (numericScores.length ? totalScore / numericScores.length : 0),
    [numericScores.length, totalScore]
  )

  const overallAverage = useMemo(() => {
    const totals = rounds.reduce(
      (accumulator, round) => ({
        holes: accumulator.holes + round.holes_played,
        score: accumulator.score + round.total_score
      }),
      { score: 0, holes: 0 }
    )

    return totals.holes ? totals.score / totals.holes : 0
  }, [rounds])

  const bestRound = useMemo(() => {
    return rounds.length ? [...rounds].sort((a, b) => a.total_score - b.total_score)[0] : null
  }, [rounds])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleSaveRound = async () => {
    if (!user?.id) return

    if (!courseName.trim()) {
      Alert.alert('Missing course', 'Please add the course or club name for this round.')
      return
    }

    if (numericScores.length !== holesPlayed) {
      Alert.alert('Incomplete scorecard', `Please enter a score for all ${holesPlayed} holes.`)
      return
    }

    setSaving(true)

    try {
      await apiPost('/api/scores', {
        user_id: user.id,
        course_name: courseName.trim(),
        holes_played: holesPlayed,
        hole_scores: numericScores,
        played_at: new Date().toISOString()
      })

      setCourseName('')
      setHoleScores(buildHoleScores(holesPlayed))
      setShowForm(false)
      await loadRounds()
    } catch (error) {
      Alert.alert('Unable to save round', error instanceof Error ? error.message : 'Please try again.')
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
              loadRounds()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader
          title="Scores"
          subtitle="Log 9 or 18 holes, track your average per hole, and keep your best recent round within reach."
          showBack
        />

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Average / Hole</Text>
            <Text style={styles.summaryValue}>{overallAverage ? overallAverage.toFixed(2) : '--'}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Best Round</Text>
            <Text style={styles.summaryValue}>{bestRound ? bestRound.total_score : '--'}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Log every hole</Text>
          <Text style={styles.heroBody}>
            {profile?.home_course || profile?.home_club
              ? `Home course: ${profile.home_course || profile.home_club}`
              : 'Set your home course on your profile to keep your golf identity feeling complete.'}
          </Text>
          <PrimaryButton
            label={showForm ? 'Close Scorecard' : 'Log a Round'}
            onPress={() => setShowForm((value) => !value)}
          />
        </View>

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Round details</Text>
            <TextInput
              onChangeText={setCourseName}
              placeholder="Course or club name"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={courseName}
            />

            <View style={styles.segmentRow}>
              {[9, 18].map((option) => {
                const active = holesPlayed === option

                return (
                  <Pressable
                    key={option}
                    onPress={() => setHolesPlayed(option as 9 | 18)}
                    style={[styles.segment, active && styles.segmentActive]}
                  >
                    <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{option} Holes</Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.liveSummary}>
              <Text style={styles.liveSummaryText}>Current total: {totalScore || '--'}</Text>
              <Text style={styles.liveSummaryText}>
                Avg / hole: {averagePerHole ? averagePerHole.toFixed(2) : '--'}
              </Text>
            </View>

            <View style={styles.holesGrid}>
              {Array.from({ length: holesPlayed }).map((_, index) => (
                <View key={index} style={styles.holeCard}>
                  <Text style={styles.holeLabel}>Hole {index + 1}</Text>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => {
                      const next = [...holeScores]
                      next[index] = value
                      setHoleScores(next)
                    }}
                    placeholder="Score"
                    placeholderTextColor={palette.textMuted}
                    style={styles.holeInput}
                    value={holeScores[index] || ''}
                  />
                </View>
              ))}
            </View>

            <PrimaryButton label={saving ? 'Saving...' : 'Save Scorecard'} loading={saving} onPress={handleSaveRound} />
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent rounds</Text>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && rounds.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No scorecards yet</Text>
              <Text style={styles.emptyBody}>Log your first round to start seeing trends here.</Text>
            </View>
          ) : null}
          {rounds.map((round) => (
            <View key={round.id} style={styles.roundCard}>
              <View style={styles.roundHeader}>
                <View style={styles.roundCopy}>
                  <Text style={styles.roundTitle}>{round.course_name}</Text>
                  <Text style={styles.roundMeta}>
                    {new Date(round.played_at).toLocaleDateString()} • {round.holes_played} holes
                  </Text>
                </View>
                <Text style={styles.roundScore}>{round.total_score}</Text>
              </View>
              <View style={styles.roundStats}>
                <Text style={styles.roundStat}>Avg / hole {round.average_score_per_hole.toFixed(2)}</Text>
                <Text style={styles.roundStat}>Front nine {round.hole_scores.slice(0, 9).join('-')}</Text>
              </View>
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
  summaryRow: {
    flexDirection: 'row',
    gap: 10
  },
  summaryCard: {
    backgroundColor: palette.bgElevated,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    padding: 14
  },
  summaryLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  summaryValue: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700'
  },
  heroCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  heroTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  heroBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  formCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  section: {
    gap: 12
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
    minHeight: 54,
    paddingHorizontal: 16
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
  liveSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  liveSummaryText: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600'
  },
  holesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  holeCard: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 12,
    width: '31%'
  },
  holeLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  holeInput: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    minHeight: 36
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
  },
  roundCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 18
  },
  roundHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  roundCopy: {
    flex: 1,
    gap: 4
  },
  roundTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700'
  },
  roundMeta: {
    color: palette.textMuted,
    fontSize: 14
  },
  roundScore: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800'
  },
  roundStats: {
    gap: 6
  },
  roundStat: {
    color: palette.textMuted,
    fontSize: 14
  }
})
