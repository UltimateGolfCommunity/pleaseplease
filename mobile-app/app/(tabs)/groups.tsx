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
import { apiGet, apiPost, apiUploadImage } from '@/lib/api'
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

type GroupMessage = {
  id: string
  message_content?: string
  created_at?: string
  replies?: GroupMessage[]
  user_profiles?: {
    first_name?: string | null
    last_name?: string | null
    username?: string | null
  } | null
}

type GroupActivity = {
  id: string
  groupId: string
  groupName: string
  message: string
  createdAt: string
  author: string
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

export default function GroupsTab() {
  const { loading, user, profile } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(true)
  const [creating, setCreating] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [selectedInviteGroupId, setSelectedInviteGroupId] = useState<string | null>(null)
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [discoverGroups, setDiscoverGroups] = useState<Group[]>([])
  const [groupActivity, setGroupActivity] = useState<GroupActivity[]>([])
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    group_type: 'community',
    logo_url: '',
    maxMembers: '10'
  })

  const localLeaderboard = useMemo(() => {
    const localText = profile?.location?.split(',')[0]?.trim().toLowerCase()
    const pool = localText
      ? discoverGroups.filter((group) => (group.location || '').toLowerCase().includes(localText))
      : discoverGroups

    return [...pool].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 8)
  }, [discoverGroups, profile?.location])

  const inviteableGroups = useMemo(() => myGroups.slice(0, 8), [myGroups])

  const acceptedConnections = useMemo(() => {
    return connections
      .map((connection) =>
        connection.requester_id === user?.id ? connection.recipient : connection.requester
      )
      .filter(Boolean) as UserCard[]
  }, [connections, user?.id])

  const loadGroups = useCallback(async () => {
    if (!user?.id) return

    try {
      const [mine, discover, connectionResponse] = await Promise.all([
        apiGet<{ success: boolean; groups: Group[] }>(`/api/groups?user_id=${encodeURIComponent(user.id)}`),
        apiGet<{ success: boolean; groups: Group[] }>(
          `/api/groups?action=search&user_id=${encodeURIComponent(user.id)}&query=`
        ),
        apiGet<{ success: boolean; connections: ConnectionRecord[] }>(
          `/api/users?action=connections&id=${encodeURIComponent(user.id)}`
        ).catch(() => ({ success: true, connections: [] }))
      ])

      const myGroupList = mine.groups || []
      const discoverList = discover.groups || []

      setMyGroups(myGroupList)
      setDiscoverGroups(discoverList)
      setConnections(connectionResponse.connections || [])
      setSelectedInviteGroupId((current) => current || myGroupList[0]?.id || null)

      const boardResponses = await Promise.all(
        myGroupList.slice(0, 8).map(async (group) => {
          try {
            const board = await apiGet<{ success: boolean; messages: GroupMessage[] }>(
              `/api/groups/message?group_id=${encodeURIComponent(group.id)}&user_id=${encodeURIComponent(user.id)}`
            )

            const flattened = (board.messages || []).flatMap((message) => [message, ...(message.replies || [])])

            return flattened.map((message) => ({
              id: `${group.id}-${message.id}`,
              groupId: group.id,
              groupName: group.name,
              message: message.message_content || 'New group activity',
              createdAt: message.created_at || new Date().toISOString(),
              author:
                message.user_profiles?.first_name ||
                message.user_profiles?.username ||
                'Member'
            }))
          } catch {
            return []
          }
        })
      )

      setGroupActivity(
        boardResponses
          .flat()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 8)
      )
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
      const formData = new FormData()
      formData.append('folder', 'group-logos')
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: mimeType
      } as unknown as Blob)

      const upload = await apiUploadImage<{ success: boolean; url: string }>('/api/upload', formData)
      setForm((current) => ({ ...current, logo_url: upload.url }))
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

  const handleInviteConnection = async (invitedUserId: string) => {
    if (!user?.id || !selectedInviteGroupId) return

    setInvitingId(invitedUserId)
    try {
      const response = await apiPost<{ success?: boolean; error?: string }>('/api/groups/invitations', {
        action: 'create',
        group_id: selectedInviteGroupId,
        invited_user_id: invitedUserId,
        user_id: user.id
      })

      if (response?.error) {
        throw new Error(response.error)
      }

      Alert.alert('Invite sent', 'Your connection can now join this group from their invitations.')
    } catch (error) {
      Alert.alert('Unable to add to group', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setInvitingId(null)
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity feed</Text>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && groupActivity.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No recent group activity</Text>
              <Text style={styles.empty}>When members post in your groups, the latest movement will show up here.</Text>
            </View>
          ) : null}
          {groupActivity.map((item) => (
            <Pressable key={item.id} onPress={() => router.push(`/group/${item.groupId}`)} style={styles.card}>
              <Text style={styles.cardTitle}>{item.groupName}</Text>
              <Text style={styles.cardBody}>{item.message}</Text>
              <Text style={styles.cardMeta}>
                {item.author} • {formatRelativeTime(item.createdAt)}
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
          <Text style={styles.sectionTitle}>Add connections to a group</Text>
          <Text style={styles.helper}>
            Pick one of your groups, then invite people from your network into it.
          </Text>
          {inviteableGroups.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Create or join a group first</Text>
              <Text style={styles.empty}>
                Once you have a group here, you can start inviting your connections into it.
              </Text>
            </View>
          ) : (
            <View style={styles.selectorWrap}>
              {inviteableGroups.map((group) => {
                const active = selectedInviteGroupId === group.id

                return (
                  <Pressable
                    key={group.id}
                    onPress={() => setSelectedInviteGroupId(group.id)}
                    style={[styles.selectorChip, active && styles.selectorChipActive]}
                  >
                    <Text style={[styles.selectorChipText, active && styles.selectorChipTextActive]}>
                      {group.name}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          )}
          {inviteableGroups.length > 0 && acceptedConnections.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No connections yet</Text>
              <Text style={styles.empty}>
                Add golfers as connections and they will show up here for quick group invites.
              </Text>
            </View>
          ) : null}
          {inviteableGroups.length > 0 &&
            acceptedConnections.map((connection) => (
              <View key={connection.id} style={styles.card}>
                <Pressable onPress={() => router.push(`/users/${connection.id}`)} style={styles.groupRow}>
                  <Avatar label={connection.first_name || connection.username || 'UGC'} size={56} uri={connection.avatar_url} />
                  <View style={styles.groupCopy}>
                    <Text style={styles.cardTitle}>
                      {[connection.first_name, connection.last_name].filter(Boolean).join(' ') ||
                        connection.username ||
                        'UGC Golfer'}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {connection.location || 'Location not set'} • Handicap {connection.handicap ?? 'N/A'}
                    </Text>
                  </View>
                </Pressable>
                <PrimaryButton
                  label="Add to Group"
                  loading={invitingId === connection.id}
                  onPress={() => void handleInviteConnection(connection.id)}
                />
              </View>
            ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Groups leaderboard</Text>
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
  selectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  selectorChip: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  selectorChipActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  selectorChipText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  selectorChipTextActive: {
    color: palette.aqua
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
