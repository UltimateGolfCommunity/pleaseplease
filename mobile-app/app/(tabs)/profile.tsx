import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { Avatar } from '@/components/Avatar'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiDelete, apiGet, apiPost } from '@/lib/api'
import { getShareableProfileLink, uploadImageToStorage } from '@/lib/supabase'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type BadgeRecord = {
  id: string
  badge?: {
    name?: string
  }
}

type ActivityItem = {
  id: string
  activity_type: string
  title: string
  description?: string | null
  created_at: string
  metadata?: Record<string, unknown>
}

type UserCard = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
  location?: string | null
  handicap?: number | null
}

type ConnectionRecord = {
  id: string
  requester_id?: string
  recipient_id?: string
  requester?: UserCard | null
  recipient?: UserCard | null
}

type RatingSummary = {
  average: number | null
  count: number
  viewerRating: number | null
}

function formatActivityTime(value: string) {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diff < hour) {
    const minutes = Math.max(1, Math.round(diff / (60 * 1000)))
    return `${minutes}m ago`
  }

  if (diff < day) {
    return `${Math.round(diff / hour)}h ago`
  }

  return `${Math.round(diff / day)}d ago`
}

function getActivityLabel(activity: ActivityItem) {
  switch (activity.activity_type) {
    case 'tee_time_created':
      return 'Posted a tee time'
    case 'tee_time_updated':
      return 'Updated a tee time'
    case 'round_logged':
      return 'Logged a score'
    case 'profile_updated':
      return 'Updated profile'
    case 'group_joined':
      return 'Joined a group'
    case 'group_created':
      return 'Created a group'
    case 'group_logo_updated':
      return 'Updated a group logo'
    case 'group_cover_updated':
      return 'Updated a group cover'
    case 'group_details_updated':
      return 'Updated group details'
    default:
      return activity.title || 'Recent activity'
  }
}

export default function ProfileTab() {
  const { loading, profile, refreshProfile, session, signOut, updateProfile, user } = useAuth()
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [badges, setBadges] = useState<BadgeRecord[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    average: null,
    count: 0,
    viewerRating: null
  })
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    location: '',
    handicap: '',
    home_course: ''
  })

  const shareLink = user?.id ? getShareableProfileLink(user.id) : ''
  const shareQrUrl = shareLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareLink)}`
    : ''
  const displayName = useMemo(() => {
    return (
      profile?.full_name ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      user?.email?.split('@')[0] ||
      'UGC Member'
    )
  }, [profile, user])

  const isVerified = !!session?.user?.email_confirmed_at
  const founderBadge = badges.find((badge) => badge.badge?.name === 'Founding Member')
  const profileSummary = useMemo(() => {
    const bits = [
      profile?.home_course || profile?.home_club || null,
      profile?.location || null,
      profile?.handicap !== null && profile?.handicap !== undefined
        ? `Handicap ${profile.handicap}`
        : null,
      ratingSummary.average ? `${ratingSummary.average.toFixed(1)}★` : null
    ].filter(Boolean)

    return bits.length ? bits.join(' • ') : 'Complete your golfer profile'
  }, [profile?.handicap, profile?.home_club, profile?.home_course, profile?.location, ratingSummary.average])
  const acceptedConnections = useMemo(() => {
    return connections
      .map((connection) =>
        connection.requester_id === user?.id ? connection.recipient : connection.requester
      )
      .filter(Boolean) as UserCard[]
  }, [connections, user?.id])

  const loadProfile = useCallback(async () => {
    if (!user?.id) return

    try {
      await refreshProfile(user.id)
      const [userBadges, activityResponse, connectionResponse, ratingResponse] = await Promise.all([
        apiGet<BadgeRecord[]>(`/api/badges?action=user_badges&user_id=${encodeURIComponent(user.id)}`),
        apiGet<{ success: boolean; activities: ActivityItem[] }>(
          `/api/activities?user_id=${encodeURIComponent(user.id)}&limit=6`
        ).catch(() => ({ success: true, activities: [] })),
        apiGet<{ success: boolean; connections: ConnectionRecord[] }>(
          `/api/users?action=connections&id=${encodeURIComponent(user.id)}`
        ).catch(() => ({ success: true, connections: [] })),
        apiGet<RatingSummary>(`/api/users?action=rating&id=${encodeURIComponent(user.id)}&viewer_id=${encodeURIComponent(user.id)}`)
          .catch(() => ({ average: null, count: 0, viewerRating: null }))
      ])

      setBadges(userBadges || [])
      setActivities(activityResponse?.activities || [])
      setConnections(connectionResponse?.connections || [])
      setRatingSummary(ratingResponse)
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [refreshProfile, user?.id])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      loadProfile()
    }
  }, [loadProfile, user?.id])

  useEffect(() => {
    setForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      username: profile?.username || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      handicap: profile?.handicap?.toString() || '',
      home_course: profile?.home_course || profile?.home_club || ''
    })
  }, [profile])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const nextHomeCourse = form.home_course.trim()
      const nextLocation = form.location.trim()
      const nextHandicap = form.handicap ? Number(form.handicap) : null
      const updatedFields: string[] = []

      if ((profile?.home_course || profile?.home_club || '') !== nextHomeCourse) {
        updatedFields.push('home course')
      }

      if ((profile?.location || '') !== nextLocation) {
        updatedFields.push('location')
      }

      if ((profile?.handicap ?? null) !== nextHandicap) {
        updatedFields.push('handicap')
      }

      await updateProfile({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        bio: form.bio.trim(),
        location: nextLocation,
        handicap: nextHandicap,
        home_course: nextHomeCourse
      })

      if (user?.id) {
        await apiPost('/api/activities', {
          user_id: user.id,
          activity_type: 'profile_updated',
          title: updatedFields.length ? 'Updated golfer profile' : 'Saved golfer profile',
          description: updatedFields.length
            ? `Updated ${updatedFields.join(', ')}`
            : 'Saved profile changes from mobile',
          metadata: {
            fields_updated: updatedFields
          }
        }).catch(() => null)
      }

      setShowEditModal(false)
      Alert.alert('Profile saved', 'Your mobile profile details are updated.')
      await loadProfile()
    } catch (error) {
      Alert.alert('Unable to save profile', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePickImage = async (target: 'avatar' | 'cover') => {
    if (!user?.id) return
    const uploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
      const fileName =
        asset.fileName || `${target === 'avatar' ? 'avatar' : 'cover'}-${Date.now()}.jpg`
      const mimeType = asset.mimeType || 'image/jpeg'

      if (target === 'avatar') {
        setUploadingAvatar(true)
      } else {
        setUploadingCover(true)
      }

      try {
        const upload = await uploadImageToStorage({
          folder: target === 'avatar' ? 'avatars' : 'profile-covers',
          fileName,
          mimeType,
          uri: asset.uri
        })

        await updateProfile(
          target === 'avatar'
            ? {
                avatar_url: upload.publicUrl
              }
            : {
                header_image_url: upload.publicUrl
              }
        )

        Alert.alert(
          target === 'avatar' ? 'Profile photo updated' : 'Cover photo updated',
          target === 'avatar'
            ? 'Your golfer profile now has a new photo.'
            : 'Your profile header now has a new cover photo.'
        )
        await loadProfile()
      } catch (error) {
        Alert.alert('Unable to update photo', error instanceof Error ? error.message : 'Please try again.')
      } finally {
        if (target === 'avatar') {
          setUploadingAvatar(false)
        } else {
          setUploadingCover(false)
        }
      }
    }

    const launchLibrary = async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo library access to choose a profile picture.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: target === 'avatar' ? [1, 1] : [16, 9],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      await uploadAsset(result.assets[0])
    }

    const launchCamera = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Camera access needed', 'Allow camera access to take a profile picture.')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: target === 'avatar' ? [1, 1] : [16, 9],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      await uploadAsset(result.assets[0])
    }

    Alert.alert(
      target === 'avatar' ? 'Update profile photo' : 'Update cover photo',
      target === 'avatar'
        ? 'Choose how you want to set your golfer photo.'
        : 'Choose how you want to set your profile cover photo.',
      [
      { text: 'Take Photo', onPress: () => void launchCamera() },
      { text: 'Choose From Library', onPress: () => void launchLibrary() },
      { style: 'cancel', text: 'Cancel' }
      ]
    )
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
              loadProfile()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader />

        <View style={styles.headerCard}>
          <View style={styles.coverShell}>
            <View style={styles.coverGlow} />
            <View style={styles.coverActions}>
              <Pressable
                onPress={() => {
                  setShowShareModal(false)
                  setShowEditModal(true)
                }}
                style={styles.coverActionButton}
              >
                <Ionicons color={palette.text} name="create-outline" size={18} />
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowEditModal(false)
                  setShowShareModal(true)
                }}
                style={styles.coverActionButton}
              >
                <Ionicons color={palette.text} name="share-social-outline" size={18} />
              </Pressable>
            </View>
            {profile?.header_image_url ? (
              <Image source={{ uri: profile.header_image_url }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverFallback}>
                <Text style={styles.coverFallbackText}>Add a profile cover photo</Text>
              </View>
            )}
          </View>
          <View style={styles.identityStack}>
            <View style={styles.avatarWrap}>
              <Avatar label={displayName} size={108} uri={profile?.avatar_url} />
            </View>
            <View style={styles.profileTopCopy}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{displayName}</Text>
                {founderBadge ? (
                  <Ionicons color={palette.gold} name="cafe" size={20} style={styles.crownIcon} />
                ) : null}
              </View>
              {isVerified ? (
                <View style={styles.badgeRow}>
                  <Text style={styles.verified}>Verified</Text>
                </View>
              ) : null}
              <View style={styles.infoRibbon}>
                <Text style={styles.headlineMeta}>{profileSummary}</Text>
              </View>
              <View style={styles.ratingSummaryRow}>
                <View style={styles.ratingBadge}>
                  <Ionicons color={palette.gold} name="star" size={16} />
                  <Text style={styles.ratingBadgeText}>
                    {ratingSummary.average ? ratingSummary.average.toFixed(1) : 'New golfer'}
                  </Text>
                </View>
                <Text style={styles.ratingSummaryText}>
                  {ratingSummary.count ? `${ratingSummary.count} ratings` : 'Waiting on first rating'}
                </Text>
              </View>
              {profile?.bio ? (
                <View style={styles.bioCard}>
                  <Text style={styles.meta}>{profile.bio}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={styles.activityCard}>
            <Pressable onPress={() => router.push('/connections')} style={styles.connectionCard}>
              <View style={styles.connectionHeader}>
                <Text style={styles.infoTitle}>Connections</Text>
                <View style={styles.activityCountPill}>
                  <Text style={styles.activityCountText}>{acceptedConnections.length}</Text>
                </View>
              </View>
              {acceptedConnections.length === 0 ? (
                <Text style={styles.infoLine}>
                  Start connecting with golfers and your network will show up here.
                </Text>
              ) : (
                <>
                  {acceptedConnections.slice(0, 3).map((connection) => (
                    <View key={connection.id} style={styles.connectionRow}>
                      <Avatar
                        label={
                          [connection.first_name, connection.last_name].filter(Boolean).join(' ') ||
                          connection.username ||
                          'UGC'
                        }
                        size={42}
                        uri={connection.avatar_url}
                      />
                      <View style={styles.connectionCopy}>
                        <Text style={styles.connectionName}>
                          {[connection.first_name, connection.last_name].filter(Boolean).join(' ') ||
                            connection.username ||
                            'UGC Golfer'}
                        </Text>
                        <Text style={styles.connectionMeta}>{connection.location || 'Local golfer'}</Text>
                      </View>
                    </View>
                  ))}
                  <Text style={styles.connectionFooter}>Open connections</Text>
                </>
              )}
            </Pressable>
            <View style={styles.activityHeader}>
              <Text style={styles.infoTitle}>Activity</Text>
              <View style={styles.activityCountPill}>
                <Text style={styles.activityCountText}>{activities.length}</Text>
              </View>
            </View>
            {busy ? <ActivityIndicator color={palette.aqua} /> : null}
            {!busy && activities.length === 0 ? (
              <Text style={styles.infoLine}>No profile activity yet. Posting tee times, logging scores, and updating your home course will show up here.</Text>
            ) : null}
            {activities.map((activity) => (
              <View key={activity.id} style={styles.activityRow}>
                <View style={styles.activityDot} />
                <View style={styles.activityCopy}>
                  <Text style={styles.activityTitle}>{getActivityLabel(activity)}</Text>
                  {activity.description ? <Text style={styles.activityDescription}>{activity.description}</Text> : null}
                </View>
                <Text style={styles.activityTime}>{formatActivityTime(activity.created_at)}</Text>
              </View>
            ))}
          </View>
        <View style={styles.actions}>
            <PrimaryButton label="Help & Support" variant="ghost" onPress={() => router.push('/help')} />
            <PrimaryButton
              label="Privacy Policy"
              variant="ghost"
              onPress={() => void Linking.openURL('https://www.ultimategolfcommunity.com/privacy')}
            />
            <PrimaryButton label="Scores" variant="ghost" onPress={() => router.push('/scores')} />
            <PrimaryButton label="Sign Out" variant="ghost" onPress={signOut} />
            <PrimaryButton
              label="Delete Account"
              variant="ghost"
              onPress={() => {
                if (!user?.id) return

                Alert.alert(
                  'Delete account?',
                  'This permanently removes your account access from Ultimate Golf Community.',
                  [
                    { style: 'cancel', text: 'Cancel' },
                    {
                      style: 'destructive',
                      text: 'Delete',
                      onPress: async () => {
                        try {
                          await apiDelete('/api/account/delete', { user_id: user.id })
                          await signOut()
                        } catch (error) {
                          Alert.alert(
                            'Unable to delete account',
                            error instanceof Error ? error.message : 'Please try again.'
                          )
                        }
                      }
                    }
                  ]
                )
              }}
            />
          </View>
        </View>

        <Modal
          animationType="fade"
          transparent
          visible={showShareModal}
          onRequestClose={() => setShowShareModal(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowShareModal(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.sectionEyebrow}>Share</Text>
              <Text style={styles.infoTitle}>Invite with link or QR</Text>
              <Text style={styles.infoLine}>
                Share this link or let another golfer scan the code to jump straight into adding you.
              </Text>
              {shareQrUrl ? <Image source={{ uri: shareQrUrl }} style={styles.qrImage} /> : null}
              <View style={styles.shareLinkBox}>
                <Text selectable style={styles.shareLinkText}>
                  {shareLink}
                </Text>
              </View>
              <PrimaryButton
                label="Share Invite Link"
                onPress={() => Share.share({ message: shareLink, url: shareLink })}
              />
              <PrimaryButton label="Close" variant="ghost" onPress={() => setShowShareModal(false)} />
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={showEditModal}
          onRequestClose={() => setShowEditModal(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowEditModal(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <Text style={styles.infoTitle}>Edit profile</Text>
              <View style={styles.editMediaRow}>
                <PrimaryButton
                  label={uploadingAvatar ? 'Updating Photo...' : 'Edit Profile Photo'}
                  variant="ghost"
                  loading={uploadingAvatar}
                  onPress={() => void handlePickImage('avatar')}
                />
                <PrimaryButton
                  label={uploadingCover ? 'Updating Cover...' : 'Edit Cover Photo'}
                  variant="ghost"
                  loading={uploadingCover}
                  onPress={() => void handlePickImage('cover')}
                />
              </View>
              <View style={styles.editRow}>
                <TextInput
                  onChangeText={(value) => setForm((current) => ({ ...current, first_name: value }))}
                  placeholder="First name"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.first_name}
                />
                <TextInput
                  onChangeText={(value) => setForm((current) => ({ ...current, last_name: value }))}
                  placeholder="Last name"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.last_name}
                />
              </View>
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, username: value }))}
                placeholder="Username"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.username}
              />
              <TextInput
                onChangeText={(value) => setForm((current) => ({ ...current, home_course: value }))}
                placeholder="Home course"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                value={form.home_course}
              />
              <View style={styles.editRow}>
                <TextInput
                  onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
                  placeholder="Location"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.location}
                />
                <TextInput
                  keyboardType="decimal-pad"
                  onChangeText={(value) => setForm((current) => ({ ...current, handicap: value }))}
                  placeholder="Handicap"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.input, styles.flexInput]}
                  value={form.handicap}
                />
              </View>
              <TextInput
                multiline
                onChangeText={(value) => setForm((current) => ({ ...current, bio: value }))}
                placeholder="Bio"
                placeholderTextColor={palette.textMuted}
                style={[styles.input, styles.bioInput]}
                value={form.bio}
              />
              <PrimaryButton label="Save Profile" loading={saving} onPress={handleSave} />
              <PrimaryButton label="Close" variant="ghost" onPress={() => setShowEditModal(false)} />
            </Pressable>
          </Pressable>
        </Modal>
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
  headerCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 16,
    overflow: 'hidden',
    padding: 18
  },
  coverShell: {
    borderRadius: 22,
    height: 190,
    marginBottom: 26,
    overflow: 'hidden',
    position: 'relative'
  },
  coverGlow: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderRadius: 999,
    height: 180,
    position: 'absolute',
    right: -30,
    top: -80,
    width: 180,
    zIndex: 1
  },
  coverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 14,
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 2
  },
  coverActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,15,12,0.46)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42
  },
  coverImage: {
    height: '100%',
    width: '100%'
  },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderWidth: 1,
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  coverFallbackText: {
    color: palette.textMuted,
    fontSize: 15,
    fontWeight: '600'
  },
  identityStack: {
    alignItems: 'center',
    marginTop: -58
  },
  avatarWrap: {
    borderColor: palette.card,
    borderRadius: 999,
    borderWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18
  },
  profileTopCopy: {
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    width: '100%'
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: -2
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center'
  },
  name: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
    textAlign: 'center'
  },
  crownIcon: {
    marginBottom: -4,
    marginLeft: 8
  },
  infoRibbon: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    borderWidth: 1,
    marginTop: -2,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  headlineMeta: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center'
  },
  ratingSummaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: -1
  },
  ratingBadge: {
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
  ratingBadgeText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  },
  ratingSummaryText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  verified: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.25)',
    borderRadius: 999,
    borderWidth: 1,
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  meta: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  },
  bioCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%'
  },
  connectionCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  connectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  connectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  connectionCopy: {
    flex: 1,
    gap: 2
  },
  connectionName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '700'
  },
  connectionMeta: {
    color: palette.textMuted,
    fontSize: 13
  },
  connectionFooter: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center'
  },
  activityCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginTop: 2,
    padding: 16
  },
  activityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  activityCountPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activityCountText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800'
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(3,10,8,0.68)',
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    maxHeight: '85%',
    padding: 20,
    width: '100%'
  },
  activityRow: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 12
  },
  activityDot: {
    backgroundColor: palette.aqua,
    borderRadius: 999,
    height: 8,
    marginTop: 7,
    width: 8
  },
  activityCopy: {
    flex: 1,
    gap: 2
  },
  activityTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20
  },
  activityDescription: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  activityTime: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 'auto'
  },
  actions: {
    gap: 10,
    marginTop: 8
  },
  qrImage: {
    alignSelf: 'center',
    borderRadius: 20,
    height: 220,
    width: 220
  },
  shareLinkBox: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14
  },
  shareLinkText: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 20
  },
  sectionEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  infoTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  infoLine: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  editRow: {
    flexDirection: 'row',
    gap: 10
  },
  editMediaRow: {
    gap: 10
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
  flexInput: {
    flex: 1
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top'
  }
})
