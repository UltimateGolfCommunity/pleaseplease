import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
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
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { uploadImageToStorage } from '@/lib/supabase'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type Group = {
  id: string
  name: string
  description?: string | null
  location?: string | null
  member_count?: number
  group_type?: string | null
  is_member?: boolean
  logo_url?: string | null
  image_url?: string | null
}

type GroupActivity = {
  id: string
  activity_type?: string
  title?: string
  description?: string | null
  created_at?: string
  actor?: {
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
  } | null
  group?: {
    id: string
    name?: string | null
    location?: string | null
    logo_url?: string | null
    image_url?: string | null
  } | null
}

function formatRelativeTime(value?: string) {
  if (!value) return 'Just now'
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const hour = 60 * 60 * 1000
  const day = 24 * hour

  if (diff < hour) {
    return `${Math.max(1, Math.round(diff / (60 * 1000)))}m ago`
  }

  if (diff < day) {
    return `${Math.round(diff / hour)}h ago`
  }

  return `${Math.round(diff / day)}d ago`
}

function getGroupActivityTitle(item: GroupActivity) {
  const actorName = item.actor?.first_name || item.actor?.username || 'A member'
  const groupName = item.group?.name || 'group'

  switch (item.activity_type) {
    case 'group_joined':
      return `${actorName} joined ${groupName}`
    case 'group_logo_updated':
      return `${actorName} refreshed the logo`
    case 'group_cover_updated':
      return `${actorName} updated the cover photo`
    case 'group_details_updated':
      return `${actorName} updated ${groupName}`
    case 'group_created':
      return `${actorName} started ${groupName}`
    default:
      return item.title || `${groupName} activity`
  }
}

export default function GroupsTab() {
  const { loading, user, profile } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(true)
  const [creating, setCreating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([])
  const [groupActivity, setGroupActivity] = useState<GroupActivity[]>([])
  const [leaderboardArea, setLeaderboardArea] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    group_type: 'community',
    logo_url: '',
    maxMembers: '10'
  })

  const localLeaderboard = useMemo(() => {
    const localText = (leaderboardArea || profile?.location || '').split(',')[0]?.trim().toLowerCase()
    const pool = localText
      ? discoverGroups.filter((group) => (group.location || '').toLowerCase().includes(localText))
      : discoverGroups

    return [...pool].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 8)
  }, [discoverGroups, leaderboardArea, profile?.location])

  const suggestedGroups = useMemo(() => {
    const myGroupIds = new Set(myGroups.map((group) => group.id))
    const locationText = (profile?.location || '').split(',')[0]?.trim().toLowerCase()

    return discoverGroups
      .filter((group) => !group.is_member && !myGroupIds.has(group.id))
      .sort((a, b) => {
        const aLocal = locationText && (a.location || '').toLowerCase().includes(locationText) ? 1 : 0
        const bLocal = locationText && (b.location || '').toLowerCase().includes(locationText) ? 1 : 0
        return bLocal - aLocal || (b.member_count || 0) - (a.member_count || 0)
      })
      .slice(0, 4)
  }, [discoverGroups, myGroups, profile?.location])

  const loadGroups = useCallback(async () => {
    if (!user?.id) return

    try {
      const [mine, discover, activityResponse] = await Promise.all([
        apiGet<{ success: boolean; groups: Group[] }>(`/api/groups?user_id=${encodeURIComponent(user.id)}`),
        apiGet<{ success: boolean; groups: Group[] }>(
          `/api/groups?action=search&user_id=${encodeURIComponent(user.id)}&query=`
        ),
        apiGet<{ success: boolean; activities: GroupActivity[] }>(
          `/api/activities?action=groups&user_id=${encodeURIComponent(user.id)}&limit=10`
        ).catch(() => ({ success: true, activities: [] }))
      ])

      const myGroupList = mine.groups || []
      const discoverList = discover.groups || []

      setMyGroups(myGroupList)
      setDiscoverGroups(discoverList)
      setGroupActivity(activityResponse.activities || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    setLeaderboardArea(profile?.location || '')
  }, [profile?.location])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      loadGroups()
    }
  }, [loadGroups, user?.id])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handlePickGroupImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to choose a group image.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    })

    if (result.canceled || !result.assets[0]) {
      return
    }

    const asset = result.assets[0]
    const fileName = asset.fileName || `group-${Date.now()}.jpg`
    const mimeType = asset.mimeType || 'image/jpeg'

    setUploadingImage(true)

    try {
      const upload = await uploadImageToStorage({
        uri: asset.uri,
        fileName,
        mimeType,
        folder: 'group-logos'
      })

      setForm((current) => ({ ...current, logo_url: upload.publicUrl }))
    } catch (error) {
      Alert.alert('Unable to upload image', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!user?.id) return

    if (!form.name.trim()) {
      Alert.alert('Missing info', 'A group name is required.')
      return
    }

    setCreating(true)
    try {
      await apiPost('/api/groups', {
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        logo_url: form.logo_url.trim() || null,
        group_type: form.group_type.trim() || 'community',
        maxMembers: Number(form.maxMembers) || 10,
        user_id: user.id
      })

      Alert.alert('Group created', 'Your group is ready for members to join.')
      setForm({
        name: '',
        description: '',
        location: '',
        group_type: 'community',
        logo_url: '',
        maxMembers: '10'
      })
      setShowCreateForm(false)
      setBusy(true)
      await loadGroups()
    } catch (error) {
      Alert.alert('Unable to create group', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (groupId: string) => {
    if (!user?.id) return

    setJoiningId(groupId)
    try {
      await apiPost('/api/groups', {
        action: 'join',
        group_id: groupId,
        user_id: user.id
      })
      await loadGroups()
    } catch (error) {
      Alert.alert('Unable to join group', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setJoiningId(null)
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
              loadGroups()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader largeLogo />

        <View style={styles.actions}>
          <PrimaryButton
            label={showCreateForm ? 'Close Form' : 'Create Group'}
            onPress={() => setShowCreateForm((value) => !value)}
          />
        </View>

        {showCreateForm ? (
          <View style={styles.searchCard}>
            <Text style={styles.sectionEyebrow}>Build a group</Text>
            <Text style={styles.sectionTitle}>Create a group</Text>
          <Text style={styles.helper}>
            Start a local community or a course-based club people can rally around.
          </Text>
          <View style={styles.imagePickerRow}>
            {form.logo_url ? (
              <Image source={{ uri: form.logo_url }} style={styles.previewImage} />
            ) : (
              <View style={styles.previewFallback}>
                <Text style={styles.previewFallbackText}>Add image</Text>
              </View>
            )}
            <View style={styles.imagePickerCopy}>
              <Text style={styles.imagePickerTitle}>Group photo</Text>
              <Text style={styles.imagePickerBody}>
                Add the visual members will recognize in discovery and on the club page.
              </Text>
              <PrimaryButton
                label={uploadingImage ? 'Uploading...' : form.logo_url ? 'Change Image' : 'Choose Image'}
                variant="ghost"
                loading={uploadingImage}
                onPress={handlePickGroupImage}
              />
            </View>
          </View>
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder="Group name"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.name}
            />
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
              placeholder="Purpose of the group"
              placeholderTextColor={palette.textMuted}
              style={[styles.input, styles.tallInput]}
              value={form.description}
            />
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
              placeholder="Location"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.location}
            />
            <View style={styles.createRow}>
              <View style={styles.segmentRow}>
                {[
                  { label: 'Community', value: 'community' },
                  { label: 'Course', value: 'course' }
                ].map((option) => {
                  const active = form.group_type === option.value

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setForm((current) => ({ ...current, group_type: option.value }))}
                      style={[styles.segment, active && styles.segmentActive]}
                    >
                      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              <TextInput
                keyboardType="number-pad"
                onChangeText={(value) => setForm((current) => ({ ...current, maxMembers: value }))}
                placeholder="Members"
                placeholderTextColor={palette.textMuted}
                style={[styles.input, styles.flexInput]}
                value={form.maxMembers}
              />
            </View>
            <PrimaryButton
              label="Create Group"
              loading={creating || uploadingImage}
              onPress={handleCreateGroup}
            />
          </View>
        ) : null}

        <View style={styles.discoveryHero}>
          <Text style={styles.sectionEyebrow}>Discovery</Text>
          <Text style={styles.discoveryTitle}>Find a crew before your next round</Text>
          <Text style={styles.helper}>
            Join course clubs, local weekend games, and city groups so your feed has people worth playing with.
          </Text>
          <View style={styles.discoveryStatsRow}>
            <View style={styles.discoveryStat}>
              <Text style={styles.discoveryStatValue}>{discoverGroups.length}</Text>
              <Text style={styles.discoveryStatLabel}>Open groups</Text>
            </View>
            <View style={styles.discoveryStat}>
              <Text style={styles.discoveryStatValue}>{localLeaderboard[0]?.member_count || 0}</Text>
              <Text style={styles.discoveryStatLabel}>Top local members</Text>
            </View>
          </View>
        </View>

        {suggestedGroups.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested groups</Text>
            {suggestedGroups.map((group) => (
              <View key={group.id} style={styles.card}>
                <Pressable onPress={() => router.push(`/group/${group.id}`)} style={styles.linkArea}>
                  <View style={styles.groupRow}>
                    <Avatar
                      label={group.name}
                      shape="rounded"
                      size={56}
                      uri={group.logo_url || group.image_url}
                    />
                    <View style={styles.groupCopy}>
                      <Text style={styles.cardTitle}>{group.name}</Text>
                      <Text style={styles.cardMeta}>
                        {(group.group_type || 'community').replace(/^./, (char) => char.toUpperCase())} •{' '}
                        {group.member_count || 0} members
                      </Text>
                      <Text style={styles.cardBody}>
                        {group.location || 'Location not set'} • {group.description || 'A new place to find golf people.'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
                <PrimaryButton
                  label="Join Group"
                  loading={joiningId === group.id}
                  onPress={() => handleJoin(group.id)}
                />
              </View>
            ))}
          </View>
        ) : null}

        {localLeaderboard.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top groups near you</Text>
            <Text style={styles.helper}>
              Ranked by member count near {(leaderboardArea || profile?.location || 'your area').split(',')[0]}.
            </Text>
            {localLeaderboard.slice(0, 3).map((group, index) => (
              <Pressable key={group.id} onPress={() => router.push(`/group/${group.id}`)} style={styles.leaderboardPodiumCard}>
                <Text style={styles.leaderboardRank}>#{index + 1}</Text>
                <View style={styles.groupCopy}>
                  <Text style={styles.cardTitle}>{group.name}</Text>
                  <Text style={styles.cardMeta}>
                    {group.location || 'Location not set'} • {group.member_count || 0} members
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity feed</Text>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && groupActivity.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No recent group activity</Text>
              <Text style={styles.empty}>Joins, refreshed logos, cover updates, and club changes will show up here.</Text>
            </View>
          ) : null}
          {groupActivity.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => item.group?.id && router.push(`/group/${item.group.id}`)}
              style={styles.card}
            >
              <Text style={styles.cardTitle}>{item.group?.name || 'Group activity'}</Text>
              <Text style={styles.cardBody}>{getGroupActivityTitle(item)}</Text>
              <Text style={styles.cardMeta}>
                {item.description || 'Fresh movement inside your golf communities.'} •{' '}
                {formatRelativeTime(item.created_at)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My groups</Text>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && myGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No groups joined yet</Text>
              <Text style={styles.empty}>Create one or join a course and it will land here.</Text>
            </View>
          ) : null}
          {myGroups.map((group) => (
            <Pressable key={group.id} onPress={() => router.push(`/group/${group.id}`)} style={styles.card}>
              <View style={styles.groupRow}>
                <Avatar
                  label={group.name}
                  shape="rounded"
                  size={56}
                  uri={group.logo_url || group.image_url}
                />
                <View style={styles.groupCopy}>
                  <Text style={styles.cardTitle}>{group.name}</Text>
                  <Text style={styles.cardMeta}>
                    {(group.group_type || 'community').replace(/^./, (char) => char.toUpperCase())} •{' '}
                    {group.member_count || 0} members
                  </Text>
                  {group.location ? <Text style={styles.cardBody}>{group.location}</Text> : null}
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Groups leaderboard</Text>
          {leaderboardArea || profile?.location ? (
            <Text style={styles.helper}>
              Ranked by member count near {(leaderboardArea || profile?.location || 'your area').split(',')[0]}.
            </Text>
          ) : null}
          {!busy && localLeaderboard.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No local groups yet</Text>
              <Text style={styles.empty}>As groups grow around you, the local leaderboard will show the top clubs here.</Text>
            </View>
          ) : null}
          {localLeaderboard.map((group, index) => (
            <View key={group.id} style={styles.card}>
              <Pressable onPress={() => router.push(`/group/${group.id}`)} style={styles.linkArea}>
                <View style={styles.groupRow}>
                  <Avatar
                    label={group.name}
                    shape="rounded"
                    size={56}
                    uri={group.logo_url || group.image_url}
                  />
                  <View style={styles.groupCopy}>
                    <Text style={styles.cardTitle}>
                      #{index + 1} {group.name}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {(group.group_type || 'community').replace(/^./, (char) => char.toUpperCase())} •{' '}
                      {group.member_count || 0} members
                    </Text>
                    {group.location ? <Text style={styles.cardBody}>{group.location}</Text> : null}
                  </View>
                </View>
              </Pressable>
              {!group.is_member ? (
                <PrimaryButton
                  label="Join"
                  loading={joiningId === group.id}
                  onPress={() => handleJoin(group.id)}
                />
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
  actions: {
    gap: 12
  },
  searchCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  discoveryHero: {
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.2)',
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  discoveryTitle: {
    color: palette.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30
  },
  discoveryStatsRow: {
    flexDirection: 'row',
    gap: 10
  },
  discoveryStat: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    padding: 12
  },
  discoveryStatValue: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800'
  },
  discoveryStatLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  leaderboardPodiumCard: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16
  },
  leaderboardRank: {
    color: palette.aqua,
    fontSize: 26,
    fontWeight: '900',
    minWidth: 44
  },
  imagePickerRow: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14
  },
  previewImage: {
    borderRadius: 18,
    height: 76,
    width: 76
  },
  previewFallback: {
    alignItems: 'center',
    backgroundColor: palette.bgElevated,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 76
  },
  previewFallbackText: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  imagePickerCopy: {
    flex: 1,
    gap: 8
  },
  imagePickerTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700'
  },
  imagePickerBody: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19
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
  tallInput: {
    minHeight: 88,
    paddingTop: 14,
    textAlignVertical: 'top'
  },
  createRow: {
    flexDirection: 'row',
    gap: 10
  },
  segmentRow: {
    flex: 1,
    gap: 10
  },
  segment: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
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
  flexInput: {
    flex: 1
  },
  section: {
    gap: 12
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
  helper: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 18
  },
  linkArea: {
    gap: 6
  },
  groupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14
  },
  groupCopy: {
    flex: 1,
    gap: 4
  },
  cardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  cardMeta: {
    color: palette.textMuted,
    fontSize: 14
  },
  cardBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  empty: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
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
  }
})
