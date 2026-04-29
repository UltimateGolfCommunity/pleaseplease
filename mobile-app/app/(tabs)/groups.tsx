import { useCallback, useEffect, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
  member_preview?: {
    id: string
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
  }[]
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

function getGroupActivityIcon(activityType?: string) {
  switch (activityType) {
    case 'group_joined':
      return 'person-add-outline'
    case 'group_logo_updated':
    case 'group_cover_updated':
      return 'image-outline'
    case 'group_created':
      return 'sparkles-outline'
    case 'group_details_updated':
      return 'create-outline'
    default:
      return 'chatbox-ellipses-outline'
  }
}

export default function GroupsTab() {
  const params = useLocalSearchParams<{ compose?: string }>()
  const { loading, user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(true)
  const [creating, setCreating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showMyGroupsMenu, setShowMyGroupsMenu] = useState(false)
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [groupActivity, setGroupActivity] = useState<GroupActivity[]>([])
  const [form, setForm] = useState({
    name: '',
    slogan: '',
    description: '',
    location: '',
    group_type: 'community',
    logo_url: '',
    maxMembers: '10'
  })

  const loadGroups = useCallback(async () => {
    if (!user?.id) return

    try {
      const [mine, activityResponse] = await Promise.all([
        apiGet<{ success: boolean; groups: Group[] }>(`/api/groups?user_id=${encodeURIComponent(user.id)}`),
        apiGet<{ success: boolean; activities: GroupActivity[] }>(
          `/api/activities?action=groups&user_id=${encodeURIComponent(user.id)}&limit=10`
        ).catch(() => ({ success: true, activities: [] }))
      ])

      const myGroupList = mine.groups || []

      setMyGroups(myGroupList)
      setGroupActivity(activityResponse.activities || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      loadGroups()
    }
  }, [loadGroups, user?.id])

  useEffect(() => {
    if (params.compose === 'create-group') {
      setShowCreateForm(true)
      router.setParams({ compose: undefined })
    }
  }, [params.compose])

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
        slogan: form.slogan.trim(),
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
        slogan: '',
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
        <BrandHeader
          largeLogo
          leftIconName="people-outline"
          onLeftPress={() => setShowMyGroupsMenu(true)}
          rightIconName={showCreateForm ? 'close' : 'add'}
          onRightPress={() => setShowCreateForm((value) => !value)}
        />

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
              onChangeText={(value) => setForm((current) => ({ ...current, slogan: value }))}
              placeholder="Group slogan"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.slogan}
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

        <View style={styles.section}>
          <View style={styles.feedHeader}>
            <Text style={styles.sectionEyebrow}>Activity Feed</Text>
          </View>
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
              style={styles.feedCard}
            >
              <View style={styles.feedCardTop}>
                <View style={styles.feedIconWrap}>
                  <Ionicons
                    color={palette.aqua}
                    name={getGroupActivityIcon(item.activity_type)}
                    size={18}
                  />
                </View>
                <View style={styles.feedCopy}>
                  <View style={styles.feedMetaRow}>
                    <Text style={styles.feedGroupName}>{item.group?.name || 'Group activity'}</Text>
                    <Text style={styles.feedTime}>{formatRelativeTime(item.created_at)}</Text>
                  </View>
                  <Text style={styles.feedHeadline}>{getGroupActivityTitle(item)}</Text>
                  <Text style={styles.feedDescription}>
                    {item.description || 'Fresh movement inside your golf communities.'}
                  </Text>
                </View>
              </View>
              <View style={styles.feedFooter}>
                <View style={styles.feedPill}>
                  <Ionicons color={palette.aqua} name="golf-outline" size={13} />
                  <Text style={styles.feedPillText}>{item.group?.location || 'Community update'}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

      </ScrollView>
      <Modal
        animationType="slide"
        transparent
        visible={showMyGroupsMenu}
        onRequestClose={() => setShowMyGroupsMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowMyGroupsMenu(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.sectionEyebrow}>My Groups</Text>
            <Text style={styles.sectionTitle}>Choose a group</Text>
            {myGroups.length === 0 ? (
              <Text style={styles.helper}>Create or join a group and it will appear here.</Text>
            ) : null}
            {myGroups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => {
                  setShowMyGroupsMenu(false)
                  router.push(`/group/${group.id}`)
                }}
                style={styles.drawerGroupRow}
              >
                <Avatar label={group.name} shape="rounded" size={52} uri={group.logo_url || group.image_url} />
                <View style={styles.groupCopy}>
                  <Text style={styles.cardTitle}>{group.name}</Text>
                  <Text style={styles.cardMeta}>
                    {group.location || 'Location not set'} • {group.member_count || 0} members
                  </Text>
                  <View style={styles.drawerMembersRow}>
                    {(group.member_preview || []).slice(0, 5).map((member, index) => (
                      <View
                        key={member.id}
                        style={[styles.drawerMemberAvatar, { marginLeft: index ? -10 : 0 }]}
                      >
                        <Avatar
                          label={member.first_name || member.username || 'G'}
                          size={28}
                          uri={member.avatar_url}
                        />
                      </View>
                    ))}
                    {group.member_count ? (
                      <Text style={styles.drawerMemberCount}>
                        {group.member_count} member{group.member_count === 1 ? '' : 's'}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            ))}
            <PrimaryButton label="Close" variant="ghost" onPress={() => setShowMyGroupsMenu(false)} />
          </Pressable>
        </Pressable>
      </Modal>
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
  feedHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.07)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 26,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 18
  },
  feedTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center'
  },
  feedSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center'
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
  feedCard: {
    backgroundColor: palette.card,
    borderColor: 'rgba(103,232,249,0.12)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18
  },
  feedCardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14
  },
  feedIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.1)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 16,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42
  },
  feedCopy: {
    flex: 1,
    gap: 6
  },
  feedMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  feedGroupName: {
    color: palette.aqua,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  feedTime: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10
  },
  feedHeadline: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23
  },
  feedDescription: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  feedFooter: {
    alignItems: 'flex-start',
    flexDirection: 'row'
  },
  feedPill: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  feedPillText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 18
  },
  modalBackdrop: {
    backgroundColor: 'rgba(3,10,8,0.72)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18
  },
  modalCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    maxHeight: '78%',
    padding: 20
  },
  drawerGroupRow: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12
  },
  drawerMembersRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8
  },
  drawerMemberAvatar: {
    borderColor: palette.cardSoft,
    borderRadius: 999,
    borderWidth: 2
  },
  drawerMemberCount: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10
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
