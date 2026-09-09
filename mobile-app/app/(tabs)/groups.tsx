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
  tournament_date?: string | null
  tournament_format?: string | null
  tournament_type?: string | null
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

  switch (item.activity_type) {
    case 'group_joined':
      return `${actorName} joined the group`
    case 'group_logo_updated':
      return `${actorName} updated the group logo`
    case 'group_cover_updated':
      return `${actorName} updated the cover photo`
    case 'group_details_updated':
      return `${actorName} refreshed group details`
    case 'group_created':
      return `${actorName} created this group`
    default:
      return item.title || `${actorName} shared an update`
  }
}

function getGroupActivityDetail(item: GroupActivity) {
  if (item.description && item.description.trim() && item.description.trim() !== item.title?.trim()) return item.description
  switch (item.activity_type) {
    case 'group_joined': return 'Welcome to the club.'
    case 'group_logo_updated': return 'A fresh look for the community.'
    case 'group_cover_updated': return 'The clubhouse view has been refreshed.'
    case 'group_details_updated': return 'Club information has been updated.'
    case 'group_created': return 'A new place for golfers to connect.'
    default: return null
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
    header_image_url: '',
    maxMembers: '10',
    is_private: false,
    tournament_date: '',
    tournament_end_date: '',
    tournament_format: 'Stroke Play',
    tournament_type: '',
    tournament_matchups: ''
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

  const handlePickGroupImage = async (target: 'logo' | 'cover') => {
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
    const fileName = asset.fileName || `group-${target}-${Date.now()}.jpg`
    const mimeType = asset.mimeType || 'image/jpeg'

    setUploadingImage(true)

    try {
      const upload = await uploadImageToStorage({
        uri: asset.uri,
        fileName,
        mimeType,
        folder: target === 'logo' ? 'group-logos' : 'group-covers'
      })

      setForm((current) => ({ ...current, [target === 'logo' ? 'logo_url' : 'header_image_url']: upload.publicUrl }))
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
        header_image_url: form.header_image_url.trim() || null,
        group_type: form.group_type.trim() || 'community',
        is_private: form.is_private,
        tournament_date: form.group_type === 'tournament' ? form.tournament_date.trim() || null : null,
        tournament_end_date: form.group_type === 'tournament' ? form.tournament_end_date.trim() || null : null,
        tournament_format: form.group_type === 'tournament' ? form.tournament_format.trim() || null : null,
        tournament_type: form.group_type === 'tournament' ? form.tournament_type.trim() || null : null,
        tournament_matchups: form.group_type === 'tournament' ? form.tournament_matchups.trim() || null : null,
        maxMembers: Number(form.maxMembers) || 10,
        user_id: user.id
      })

      Alert.alert(form.group_type === 'tournament' ? 'Tournament created' : 'Group created', form.group_type === 'tournament' ? 'Your tournament is ready for participants.' : 'Your group is ready for members to join.')
      setForm({
        name: '',
        slogan: '',
        description: '',
        location: '',
        group_type: 'community',
        logo_url: '',
        header_image_url: '',
        maxMembers: '10',
        is_private: false,
        tournament_date: '',
        tournament_end_date: '',
        tournament_format: 'Stroke Play',
        tournament_type: '',
        tournament_matchups: ''
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
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="My groups" onPress={() => setShowMyGroupsMenu(true)} style={[styles.topBarButton, styles.topBarLeftAction]}>
            <Ionicons color={palette.text} name="people-outline" size={21} />
          </Pressable>
          <Text style={styles.topBarTitle}>Activity Feed</Text>
          <Pressable accessibilityLabel={showCreateForm ? 'Close group creation' : 'Create group'} onPress={() => setShowCreateForm((value) => !value)} style={[styles.topBarButton, styles.topBarRightAction]}>
            <Ionicons color={palette.text} name={showCreateForm ? 'close' : 'add'} size={24} />
          </Pressable>
        </View>

        {showCreateForm ? (
          <View style={styles.searchCard}>
            <Text style={styles.sectionEyebrow}>Build a community</Text>
            <Text style={styles.sectionTitle}>Create a group or tournament</Text>
          {form.group_type !== 'tournament' ? <Text style={styles.helper}>Start a local community or a course-based club people can rally around.</Text> : null}
          <View style={styles.imagePickerRow}>
            {form.logo_url ? (
              <Image source={{ uri: form.logo_url }} style={styles.previewImage} />
            ) : (
              <View style={styles.previewFallback}><Text style={styles.previewFallbackText}>{form.group_type === 'tournament' ? 'Add logo' : 'Add image'}</Text></View>
            )}
            <View style={styles.imagePickerCopy}>
              <Text style={styles.imagePickerTitle}>{form.group_type === 'tournament' ? 'Tournament logo' : 'Group photo'}</Text>
              <Text style={styles.imagePickerBody}>
                Add the visual {form.group_type === 'tournament' ? 'participants' : 'members'} will recognize in discovery and on the {form.group_type === 'tournament' ? 'tournament' : 'club'} page.
              </Text>
              <PrimaryButton
                label={uploadingImage ? 'Uploading...' : form.logo_url ? (form.group_type === 'tournament' ? 'Change Logo' : 'Change Image') : (form.group_type === 'tournament' ? 'Choose Logo' : 'Choose Image')}
                variant="ghost"
                loading={uploadingImage}
                onPress={() => void handlePickGroupImage('logo')}
              />
            </View>
          </View>
          {form.group_type === 'tournament' ? (
            <View style={styles.imagePickerRow}>
              {form.header_image_url ? <Image source={{ uri: form.header_image_url }} style={styles.coverPreviewImage} /> : <View style={styles.coverPreviewFallback}><Text style={styles.previewFallbackText}>Add cover</Text></View>}
              <View style={styles.imagePickerCopy}>
                <Text style={styles.imagePickerTitle}>Tournament cover</Text>
                <Text style={styles.imagePickerBody}>Set the scene for this tournament&apos;s home page.</Text>
                <PrimaryButton label={form.header_image_url ? 'Change Cover' : 'Choose Cover'} variant="ghost" loading={uploadingImage} onPress={() => void handlePickGroupImage('cover')} />
              </View>
            </View>
          ) : null}
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
              placeholder={form.group_type === 'tournament' ? 'Tournament name' : 'Group name'}
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.name}
            />
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, slogan: value }))}
              placeholder={form.group_type === 'tournament' ? 'Tournament slogan' : 'Group slogan'}
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={form.slogan}
            />
            <TextInput
              onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
              placeholder={form.group_type === 'tournament' ? 'Purpose of the tournament' : 'Purpose of the group'}
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
                  { label: 'Course', value: 'course' },
                  { label: 'Tournament', value: 'tournament' }
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
            {form.group_type === 'tournament' ? (
              <View style={styles.tournamentFields}>
                <TextInput onChangeText={(value) => setForm((current) => ({ ...current, tournament_date: value }))} placeholder="Tournament start date (YYYY-MM-DD)" placeholderTextColor={palette.textMuted} style={styles.input} value={form.tournament_date} />
                <TextInput onChangeText={(value) => setForm((current) => ({ ...current, tournament_end_date: value }))} placeholder="Tournament end date (optional)" placeholderTextColor={palette.textMuted} style={styles.input} value={form.tournament_end_date} />
                <View style={styles.segmentRow}>
                  {['Stroke Play', 'Match Play', 'Ryder Cup'].map((format) => (
                    <Pressable key={format} onPress={() => setForm((current) => ({ ...current, tournament_format: format }))} style={[styles.segment, form.tournament_format === format && styles.segmentActive]}>
                      <Text style={[styles.segmentLabel, form.tournament_format === format && styles.segmentLabelActive]}>{format}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput onChangeText={(value) => setForm((current) => ({ ...current, tournament_type: value }))} placeholder="Tournament type or division (optional)" placeholderTextColor={palette.textMuted} style={styles.input} value={form.tournament_type} />
                {form.tournament_format !== 'Stroke Play' ? <TextInput multiline onChangeText={(value) => setForm((current) => ({ ...current, tournament_matchups: value }))} placeholder="Matchups (for example: Luke vs. Grant)" placeholderTextColor={palette.textMuted} style={[styles.input, styles.tallInput]} value={form.tournament_matchups} /> : null}
              </View>
            ) : null}
            <View style={styles.visibilitySection}>
              <Text style={styles.visibilityTitle}>{form.group_type === 'tournament' ? 'Tournament access' : 'Who can join?'}</Text>
              <View style={styles.visibilityRow}>
                {[
                  { label: 'Public', value: false, detail: 'People join immediately' },
                  { label: 'Private', value: true, detail: 'People must request to join' }
                ].map((option) => {
                  const active = form.is_private === option.value
                  return (
                    <Pressable
                      key={option.label}
                      onPress={() => setForm((current) => ({ ...current, is_private: option.value }))}
                      style={[styles.visibilityOption, active && styles.visibilityOptionActive]}
                    >
                      <Ionicons color={active ? palette.aqua : palette.textMuted} name={option.value ? 'lock-closed-outline' : 'globe-outline'} size={17} />
                      <View style={styles.visibilityCopy}>
                        <Text style={[styles.visibilityLabel, active && styles.visibilityLabelActive]}>{option.label}</Text>
                        <Text style={styles.visibilityDetail}>{option.detail}</Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>
            <PrimaryButton
              label={form.group_type === 'tournament' ? 'Create Tournament' : 'Create Group'}
              loading={creating || uploadingImage}
              onPress={handleCreateGroup}
            />
          </View>
        ) : null}

        {!showCreateForm ? <View style={styles.section}>
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
                <View style={styles.feedActorWrap}>
                  <Avatar label={item.actor?.first_name || item.actor?.username || 'G'} shape="circle" size={44} uri={item.actor?.avatar_url} />
                  <View style={styles.feedEventIcon}>
                    <Ionicons color={palette.bg} name={getGroupActivityIcon(item.activity_type)} size={13} />
                  </View>
                </View>
                <View style={styles.feedCopy}>
                  <View style={styles.feedMetaRow}>
                    <Text style={styles.feedHeadline}>{getGroupActivityTitle(item)}</Text>
                    <Text style={styles.feedTime}>{formatRelativeTime(item.created_at)}</Text>
                  </View>
                  {getGroupActivityDetail(item) ? <Text numberOfLines={1} style={styles.feedDetail}>{getGroupActivityDetail(item)}</Text> : null}
                  <View style={styles.feedGroupBadge}>
                    {item.group?.logo_url || item.group?.image_url ? <Avatar label={item.group?.name || 'Group'} shape="circle" size={18} uri={item.group.logo_url || item.group.image_url} /> : <Ionicons color={palette.aqua} name="people-outline" size={14} />}
                    <Text numberOfLines={1} style={styles.feedGroupName}>{item.group?.name || 'Golf community'}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
        </View> : null}

      </ScrollView>
      <Modal
        animationType="slide"
        transparent
        visible={showMyGroupsMenu}
        onRequestClose={() => setShowMyGroupsMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowMyGroupsMenu(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {myGroups.some((group) => group.group_type !== 'tournament') ? <Text style={[styles.sectionEyebrow, styles.myGroupsHeading]}>My Groups</Text> : null}
            {myGroups.filter((group) => group.group_type !== 'tournament').length === 0 ? (
              <Text style={styles.helper}>Create or join a group and it will appear here.</Text>
            ) : null}
            <View style={styles.myGroupsGrid}>
              {myGroups.filter((group) => group.group_type !== 'tournament').map((group) => (
                <Pressable
                  key={group.id}
                  onPress={() => {
                    setShowMyGroupsMenu(false)
                    router.push(`/group/${group.id}`)
                  }}
                  style={styles.groupCircleTile}
                >
                  <Avatar label={group.name} shape="circle" size={66} uri={group.logo_url || group.image_url} />
                  <Text numberOfLines={2} style={styles.groupCircleName}>{group.name}</Text>
                </Pressable>
              ))}
            </View>
            {myGroups.some((group) => group.group_type === 'tournament') ? <Text style={[styles.sectionEyebrow, styles.myGroupsHeading, styles.tournamentsHeading]}>My Tournaments</Text> : null}
            <View style={styles.myGroupsGrid}>
              {myGroups.filter((group) => group.group_type === 'tournament').map((group) => (
                <Pressable key={group.id} onPress={() => { setShowMyGroupsMenu(false); router.push(`/group/${group.id}`) }} style={styles.groupCircleTile}>
                  <Avatar label={group.name} shape="circle" size={66} uri={group.logo_url || group.image_url} />
                  <Text numberOfLines={2} style={styles.groupCircleName}>{group.name}</Text>
                </Pressable>
              ))}
            </View>
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
    padding: 20,
    paddingBottom: 132
  },
  actions: {
    gap: 12
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48
  },
  topBarTitle: {
    color: palette.text,
    fontFamily: 'Georgia',
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.5
  },
  topBarButton: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  topBarLeftAction: {
    left: 0,
    position: 'absolute'
  },
  topBarRightAction: {
    position: 'absolute',
    right: 0
  },
  searchCard: {
    gap: 12,
    paddingHorizontal: 2
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
  coverPreviewImage: {
    borderRadius: 18,
    height: 76,
    width: 104
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
  coverPreviewFallback: {
    alignItems: 'center',
    backgroundColor: palette.bgElevated,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 76,
    justifyContent: 'center',
    width: 104
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
  tournamentFields: {
    gap: 10
  },
  visibilitySection: {
    gap: 8
  },
  visibilityTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800'
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 10
  },
  visibilityOption: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12
  },
  visibilityOptionActive: {
    backgroundColor: 'rgba(103,232,249,0.11)',
    borderColor: 'rgba(103,232,249,0.32)'
  },
  visibilityCopy: {
    flex: 1,
    gap: 2
  },
  visibilityLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800'
  },
  visibilityLabelActive: {
    color: palette.aqua
  },
  visibilityDetail: {
    color: palette.textMuted,
    fontSize: 10,
    lineHeight: 14
  },
  section: {
    gap: 12
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
  tournamentsHeading: {
    marginTop: 14
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
    backgroundColor: 'rgba(9, 44, 33, 0.84)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18
  },
  feedCardTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12
  },
  feedActorWrap: {
    position: 'relative'
  },
  feedEventIcon: {
    alignItems: 'center',
    backgroundColor: palette.aqua,
    borderColor: palette.bg,
    borderRadius: 999,
    borderWidth: 2,
    bottom: -2,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: -4,
    width: 22
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
    gap: 5,
  },
  feedMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  feedGroupName: {
    color: palette.aqua,
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  feedTime: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10
  },
  feedHeadline: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20
  },
  feedDetail: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 17
  },
  feedGroupBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    maxWidth: '100%',
    paddingHorizontal: 7,
    paddingVertical: 4
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
  myGroupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    justifyContent: 'center',
    paddingVertical: 8
  },
  myGroupsHeading: {
    textAlign: 'center'
  },
  groupCircleTile: {
    alignItems: 'center',
    gap: 7,
    width: 76
  },
  groupCircleName: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center'
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
