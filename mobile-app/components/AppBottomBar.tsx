import { useMemo, useState } from 'react'
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import { palette } from '@/lib/theme'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiPost } from '@/lib/api'
import { mobileSupabase, uploadImageToStorage } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

type ComposeMode = 'menu' | 'photo' | 'tee-time' | 'score'
type PrimaryRoute = '/home' | '/groups' | '/search' | '/profile'

const primaryTabs = [
  { key: 'home', label: 'Home', icon: 'home-outline' as const, activeIcon: 'home' as const, route: '/home' },
  { key: 'groups', label: 'Groups', icon: 'people-outline' as const, activeIcon: 'people' as const, route: '/groups' },
  { key: 'search', label: 'Search', icon: 'search-outline' as const, activeIcon: 'search' as const, route: '/search' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' as const, activeIcon: 'person' as const, route: '/profile' }
] as const satisfies readonly {
  key: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
  route: PrimaryRoute
}[]

function getActiveKey(pathname: string) {
  if (pathname.startsWith('/groups') || pathname.startsWith('/group')) return 'groups'
  if (pathname.startsWith('/search') || pathname.startsWith('/courses') || pathname.startsWith('/course')) return 'search'
  if (pathname.startsWith('/profile') || pathname.startsWith('/users') || pathname.startsWith('/connections')) return 'profile'
  return 'home'
}

function buildHoleScores(count: 9 | 18) {
  return Array.from({ length: count }, () => '')
}

export function AppBottomBar() {
  const pathname = usePathname()
  const { profile, user } = useAuth()
  const [showCreateWheel, setShowCreateWheel] = useState(false)
  const [composeMode, setComposeMode] = useState<ComposeMode>('menu')
  const [photoCaption, setPhotoCaption] = useState('')
  const [photoUri, setPhotoUri] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [teeTimeBusy, setTeeTimeBusy] = useState(false)
  const [scoreBusy, setScoreBusy] = useState(false)
  const [teeTimeForm, setTeeTimeForm] = useState({
    course_name: '',
    location: '',
    tee_time_date: '',
    tee_time_time: '',
    max_players: '4'
  })
  const [holesPlayed, setHolesPlayed] = useState<9 | 18>(18)
  const [scoreMode, setScoreMode] = useState<'total' | 'holes'>('total')
  const [scoreCourseName, setScoreCourseName] = useState('')
  const [totalOnlyScore, setTotalOnlyScore] = useState('')
  const [holeScores, setHoleScores] = useState<string[]>(buildHoleScores(18))
  const activeKey = getActiveKey(pathname)

  const scoreTotal = useMemo(() => {
    if (scoreMode === 'total') return Number(totalOnlyScore) || 0
    return holeScores.reduce((sum, score) => {
      const value = Number(score)
      return Number.isFinite(value) && value > 0 ? sum + value : sum
    }, 0)
  }, [holeScores, scoreMode, totalOnlyScore])

  const averagePerHole = useMemo(() => {
    if (!scoreTotal) return 0
    if (scoreMode === 'total') return scoreTotal / holesPlayed
    const completed = holeScores.filter((score) => {
      const value = Number(score)
      return Number.isFinite(value) && value > 0
    }).length
    return completed ? scoreTotal / completed : 0
  }, [holeScores, holesPlayed, scoreMode, scoreTotal])

  const closeCompose = () => {
    setShowCreateWheel(false)
    setComposeMode('menu')
  }

  const openComposer = (mode: ComposeMode) => {
    setComposeMode(mode)
  }

  const refreshCurrentScreen = () => {
    if (pathname.startsWith('/home')) {
      router.setParams({ refresh: String(Date.now()) })
    }
  }

  const resetPhotoComposer = () => {
    setPhotoCaption('')
    setPhotoUri('')
  }

  const resetTeeTimeComposer = () => {
    setTeeTimeForm({
      course_name: '',
      location: '',
      tee_time_date: '',
      tee_time_time: '',
      max_players: '4'
    })
  }

  const resetScoreComposer = () => {
    setScoreCourseName('')
    setTotalOnlyScore('')
    setHolesPlayed(18)
    setScoreMode('total')
    setHoleScores(buildHoleScores(18))
  }

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to share a golf photo.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 5],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.88
    })

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri)
    }
  }

  const publishPhoto = async () => {
    if (!user?.id || !photoUri) {
      Alert.alert('Photo needed', 'Choose a photo before posting.')
      return
    }

    setPhotoBusy(true)
    try {
      let finalImageUrl = photoUri

      if (!photoUri.startsWith('http')) {
        const upload = await uploadImageToStorage({
          uri: photoUri,
          fileName: `feed-photo-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          folder: 'feed-photos'
        })
        finalImageUrl = upload.publicUrl
      }

      const { error } = await mobileSupabase.from('user_activities').insert({
        user_id: user.id,
        activity_type: 'photo_posted',
        related_id: null,
        related_type: null,
        title: 'Posted a golf photo',
        description: photoCaption.trim() || 'Shared a new golf photo',
        metadata: {
          image_url: finalImageUrl,
          caption: photoCaption.trim()
        }
      })

      if (error) {
        throw new Error(error.message || 'Unable to create post.')
      }

      resetPhotoComposer()
      closeCompose()
      refreshCurrentScreen()
      Alert.alert('Photo posted', 'Your photo is now in the network feed.')
    } catch (error) {
      Alert.alert('Unable to post photo', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setPhotoBusy(false)
    }
  }

  const publishTeeTime = async () => {
    if (!user?.id) return

    if (!teeTimeForm.course_name.trim() || !teeTimeForm.tee_time_date.trim() || !teeTimeForm.tee_time_time.trim()) {
      Alert.alert('Missing info', 'Course, date, and time are required to post a tee time.')
      return
    }

    setTeeTimeBusy(true)
    try {
      await apiPost('/api/tee-times', {
        action: 'create',
        creator_id: user.id,
        user_id: user.id,
        course_name: teeTimeForm.course_name.trim(),
        location: teeTimeForm.location.trim(),
        tee_time_date: teeTimeForm.tee_time_date.trim(),
        tee_time_time: teeTimeForm.tee_time_time.trim(),
        max_players: Number(teeTimeForm.max_players) || 4,
        handicap_requirement: 'Weekend Hack',
        visibility_scope: 'public',
        group_id: null
      })

      resetTeeTimeComposer()
      closeCompose()
      refreshCurrentScreen()
      Alert.alert('Tee time posted', 'Your round is now live in the community.')
    } catch (error) {
      Alert.alert('Unable to post tee time', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setTeeTimeBusy(false)
    }
  }

  const saveScore = async () => {
    if (!user?.id) return

    if (!scoreCourseName.trim()) {
      Alert.alert('Missing course', 'Please add the course or club name for this round.')
      return
    }

    if (scoreMode === 'holes') {
      const filled = holeScores.filter((score) => {
        const value = Number(score)
        return Number.isFinite(value) && value > 0
      }).length

      if (filled !== holesPlayed) {
        Alert.alert('Incomplete scorecard', `Please enter a score for all ${holesPlayed} holes.`)
        return
      }
    }

    if (scoreMode === 'total' && (!Number(totalOnlyScore) || Number(totalOnlyScore) <= 0)) {
      Alert.alert('Missing score', 'Enter your total round score.')
      return
    }

    setScoreBusy(true)
    try {
      const numericScores = holeScores
        .map((score) => Number(score))
        .filter((score) => Number.isFinite(score) && score > 0)

      const response = await apiPost<{ round?: { id: string; total_score: number; course_name: string; holes_played: number; average_score_per_hole: number; played_at: string } }>(
        '/api/scores',
        {
          user_id: user.id,
          course_name: scoreCourseName.trim(),
          holes_played: holesPlayed,
          hole_scores: scoreMode === 'holes' ? numericScores : [],
          total_score: scoreMode === 'total' ? Number(totalOnlyScore) : undefined,
          played_at: new Date().toISOString()
        }
      )

      const savedRound = response.round

      if (savedRound?.id) {
        await mobileSupabase.from('user_activities').insert({
          user_id: user.id,
          activity_type: 'round_logged',
          title: 'Logged a score',
          description: `Logged ${savedRound.total_score} at ${savedRound.course_name}`,
          related_id: savedRound.id,
          related_type: 'round',
          metadata: {
            round_id: savedRound.id,
            course_name: savedRound.course_name,
            score: savedRound.total_score,
            holes_played: savedRound.holes_played,
            handicap: profile?.handicap ?? null,
            average_score_per_hole: savedRound.average_score_per_hole,
            played_at: savedRound.played_at
          }
        })
      }

      resetScoreComposer()
      closeCompose()
      refreshCurrentScreen()
      Alert.alert('Score saved', 'Your round is now on your profile and the network feed.')
    } catch (error) {
      Alert.alert('Unable to save round', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setScoreBusy(false)
    }
  }

  return (
    <>
      <View pointerEvents="box-none" style={styles.shell}>
        <View style={styles.greenFringe}>
          <View style={styles.bar}>
            <View pointerEvents="none" style={styles.turfStripeLight} />
            <View pointerEvents="none" style={styles.turfStripeDark} />
          {primaryTabs.slice(0, 2).map((tab) => {
            const active = activeKey === tab.key
            return (
              <Pressable key={tab.key} onPress={() => router.push(tab.route)} style={styles.tabButton}>
                <Ionicons color={active ? palette.aqua : palette.textMuted} name={active ? tab.activeIcon : tab.icon} size={24} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            )
          })}

          <Pressable onPress={() => setShowCreateWheel(true)} style={styles.composeTabButton}>
            <View style={styles.composeButton}>
              <Ionicons color="#123826" name="add" size={28} />
            </View>
          </Pressable>

          {primaryTabs.slice(2).map((tab) => {
            const active = activeKey === tab.key
            return (
              <Pressable key={tab.key} onPress={() => router.push(tab.route)} style={styles.tabButton}>
                <Ionicons color={active ? palette.aqua : palette.textMuted} name={active ? tab.activeIcon : tab.icon} size={24} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            )
          })}
          </View>
        </View>
      </View>

      <Modal animationType="fade" transparent visible={showCreateWheel} onRequestClose={closeCompose}>
        <Pressable style={styles.modalBackdrop} onPress={closeCompose}>
          <Pressable style={styles.composeSheet} onPress={() => {}}>
            {composeMode === 'menu' ? (
              <>
                <Text style={styles.composeEyebrow}>Create</Text>
                <Text style={styles.composeTitle}>What do you want to share?</Text>
                <View style={styles.composeOptionRow}>
                  <Pressable onPress={() => openComposer('photo')} style={styles.composeOption}>
                    <View style={styles.wheelIcon}>
                      <Ionicons color={palette.aqua} name="camera-outline" size={20} />
                    </View>
                    <Text style={styles.wheelLabel}>Photo</Text>
                  </Pressable>
                  <Pressable onPress={() => openComposer('tee-time')} style={styles.composeOption}>
                    <View style={styles.wheelIcon}>
                      <Ionicons color={palette.aqua} name="golf-outline" size={20} />
                    </View>
                    <Text style={styles.wheelLabel}>Tee Time</Text>
                  </Pressable>
                  <Pressable onPress={() => openComposer('score')} style={styles.composeOption}>
                    <View style={styles.wheelIcon}>
                      <Ionicons color={palette.aqua} name="stats-chart-outline" size={20} />
                    </View>
                    <Text style={styles.wheelLabel}>Score</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {composeMode === 'photo' ? (
              <ScrollView contentContainerStyle={styles.composeScroll}>
                <View style={styles.composeHeaderRow}>
                  <Pressable onPress={() => setComposeMode('menu')} style={styles.composeBackButton}>
                    <Ionicons color={palette.text} name="chevron-back" size={18} />
                  </Pressable>
                  <Text style={styles.composeTitle}>Post Photo</Text>
                  <View style={styles.composeSpacer} />
                </View>
                <Pressable onPress={pickPhoto} style={styles.photoPicker}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  ) : (
                    <View style={styles.photoEmptyState}>
                      <Ionicons color={palette.aqua} name="image-outline" size={26} />
                      <Text style={styles.photoEmptyTitle}>Choose Photo</Text>
                    </View>
                  )}
                </Pressable>
                <TextInput
                  multiline
                  onChangeText={setPhotoCaption}
                  placeholder="Write a caption..."
                  placeholderTextColor={palette.textMuted}
                  style={styles.composeInputMultiline}
                  value={photoCaption}
                />
                <PrimaryButton label="Post to Network Feed" loading={photoBusy} onPress={publishPhoto} />
              </ScrollView>
            ) : null}

            {composeMode === 'tee-time' ? (
              <ScrollView contentContainerStyle={styles.composeScroll}>
                <View style={styles.composeHeaderRow}>
                  <Pressable onPress={() => setComposeMode('menu')} style={styles.composeBackButton}>
                    <Ionicons color={palette.text} name="chevron-back" size={18} />
                  </Pressable>
                  <Text style={styles.composeTitle}>Post Tee Time</Text>
                  <View style={styles.composeSpacer} />
                </View>
                <TextInput
                  onChangeText={(value) => setTeeTimeForm((current) => ({ ...current, course_name: value }))}
                  placeholder="Course name"
                  placeholderTextColor={palette.textMuted}
                  style={styles.composeInput}
                  value={teeTimeForm.course_name}
                />
                <TextInput
                  onChangeText={(value) => setTeeTimeForm((current) => ({ ...current, location: value }))}
                  placeholder="Area or city"
                  placeholderTextColor={palette.textMuted}
                  style={styles.composeInput}
                  value={teeTimeForm.location}
                />
                <View style={styles.composeSplitRow}>
                  <TextInput
                    onChangeText={(value) => setTeeTimeForm((current) => ({ ...current, tee_time_date: value }))}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={palette.textMuted}
                    style={[styles.composeInput, styles.composeHalfInput]}
                    value={teeTimeForm.tee_time_date}
                  />
                  <TextInput
                    onChangeText={(value) => setTeeTimeForm((current) => ({ ...current, tee_time_time: value }))}
                    placeholder="HH:MM"
                    placeholderTextColor={palette.textMuted}
                    style={[styles.composeInput, styles.composeHalfInput]}
                    value={teeTimeForm.tee_time_time}
                  />
                </View>
                <TextInput
                  keyboardType="number-pad"
                  onChangeText={(value) => setTeeTimeForm((current) => ({ ...current, max_players: value }))}
                  placeholder="Open spots"
                  placeholderTextColor={palette.textMuted}
                  style={styles.composeInput}
                  value={teeTimeForm.max_players}
                />
                <PrimaryButton label="Post Tee Time" loading={teeTimeBusy} onPress={publishTeeTime} />
              </ScrollView>
            ) : null}

            {composeMode === 'score' ? (
              <ScrollView contentContainerStyle={styles.composeScroll}>
                <View style={styles.composeHeaderRow}>
                  <Pressable onPress={() => setComposeMode('menu')} style={styles.composeBackButton}>
                    <Ionicons color={palette.text} name="chevron-back" size={18} />
                  </Pressable>
                  <Text style={styles.composeTitle}>Log Score</Text>
                  <View style={styles.composeSpacer} />
                </View>
                <TextInput
                  onChangeText={setScoreCourseName}
                  placeholder="Course or club name"
                  placeholderTextColor={palette.textMuted}
                  style={styles.composeInput}
                  value={scoreCourseName}
                />
                <View style={styles.segmentRow}>
                  {[9, 18].map((option) => {
                    const active = holesPlayed === option
                    return (
                      <Pressable
                        key={option}
                        onPress={() => {
                          setHolesPlayed(option as 9 | 18)
                          setHoleScores((previous) => {
                            const next = buildHoleScores(option as 9 | 18)
                            previous.slice(0, option).forEach((score, index) => {
                              next[index] = score
                            })
                            return next
                          })
                        }}
                        style={[styles.segment, active && styles.segmentActive]}
                      >
                        <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{option} Holes</Text>
                      </Pressable>
                    )
                  })}
                </View>
                <View style={styles.segmentRow}>
                  {[
                    { label: 'Total', value: 'total' as const },
                    { label: 'By Hole', value: 'holes' as const }
                  ].map((option) => {
                    const active = scoreMode === option.value
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setScoreMode(option.value)}
                        style={[styles.segment, active && styles.segmentActive]}
                      >
                        <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{option.label}</Text>
                      </Pressable>
                    )
                  })}
                </View>
                {scoreMode === 'total' ? (
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={setTotalOnlyScore}
                    placeholder="Total score"
                    placeholderTextColor={palette.textMuted}
                    style={styles.composeInput}
                    value={totalOnlyScore}
                  />
                ) : (
                  <View style={styles.holeGrid}>
                    {Array.from({ length: holesPlayed }).map((_, index) => (
                      <View key={index} style={styles.holeCard}>
                        <Text style={styles.holeLabel}>H{index + 1}</Text>
                        <TextInput
                          keyboardType="number-pad"
                          onChangeText={(value) => {
                            const next = [...holeScores]
                            next[index] = value
                            setHoleScores(next)
                          }}
                          placeholder="0"
                          placeholderTextColor={palette.textMuted}
                          style={styles.holeInput}
                          value={holeScores[index] || ''}
                        />
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.scoreSummaryRow}>
                  <Text style={styles.scoreSummaryText}>Current total: {scoreTotal || '--'}</Text>
                  <Text style={styles.scoreSummaryText}>Avg / hole: {averagePerHole ? averagePerHole.toFixed(2) : '--'}</Text>
                </View>
                <PrimaryButton label="Save Scorecard" loading={scoreBusy} onPress={saveScore} />
              </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: '#18472b',
    bottom: 0,
    left: 0,
    paddingBottom: 7,
    paddingHorizontal: 9,
    paddingTop: 9,
    position: 'absolute',
    right: 0,
    shadowColor: '#0a2517',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.22,
    shadowRadius: 10
  },
  greenFringe: {
    backgroundColor: '#0e3921',
    borderColor: '#2d7040',
    borderRadius: 32,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 6
  },
  bar: {
    alignItems: 'flex-start',
    backgroundColor: '#78b95f',
    borderRadius: 26,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 31,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 21,
    flexDirection: 'row',
    height: 84,
    justifyContent: 'space-around',
    paddingBottom: 12,
    paddingTop: 10
  },
  turfStripeLight: {
    backgroundColor: 'rgba(224,244,183,0.16)',
    height: 22,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 20
  },
  turfStripeDark: {
    backgroundColor: 'rgba(43,112,48,0.1)',
    bottom: 17,
    height: 20,
    left: 0,
    position: 'absolute',
    right: 0
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    paddingVertical: 2
  },
  tabLabel: {
    color: 'rgba(255,255,244,0.82)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  tabLabelActive: {
    color: '#f8edbf'
  },
  composeTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    width: 76
  },
  composeButton: {
    alignItems: 'center',
    backgroundColor: '#f4e7bc',
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    width: 58
  },
  modalBackdrop: {
    backgroundColor: 'rgba(3,10,8,0.56)',
    flex: 1,
    justifyContent: 'flex-end'
  },
  composeSheet: {
    backgroundColor: '#0b1913',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '82%',
    minHeight: 240,
    padding: 18
  },
  composeEyebrow: {
    color: palette.aqua,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  composeTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center'
  },
  composeOptionRow: {
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'space-between',
    marginTop: 24
  },
  composeOption: {
    alignItems: 'center',
    flex: 1,
    gap: 8
  },
  wheelIcon: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58
  },
  wheelLabel: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700'
  },
  composeScroll: {
    gap: 14,
    paddingBottom: 18
  },
  composeHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  composeBackButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  composeSpacer: {
    width: 38
  },
  composeInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 52,
    paddingHorizontal: 16
  },
  composeInputMultiline: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 118,
    padding: 16,
    textAlignVertical: 'top'
  },
  composeSplitRow: {
    flexDirection: 'row',
    gap: 10
  },
  composeHalfInput: {
    flex: 1
  },
  photoPicker: {
    borderRadius: 22,
    overflow: 'hidden'
  },
  photoPreview: {
    aspectRatio: 4 / 5,
    width: '100%'
  },
  photoEmptyState: {
    alignItems: 'center',
    aspectRatio: 4 / 5,
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    justifyContent: 'center'
  },
  photoEmptyTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '800'
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10
  },
  segment: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 46,
    justifyContent: 'center',
    paddingHorizontal: 10
  },
  segmentActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.22)'
  },
  segmentLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  segmentLabelActive: {
    color: palette.text
  },
  holeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  holeCard: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    minWidth: '22%',
    padding: 10
  },
  holeLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  holeInput: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700',
    padding: 0
  },
  scoreSummaryRow: {
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 14
  },
  scoreSummaryText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  }
})
