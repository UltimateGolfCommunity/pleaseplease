import { useCallback, useEffect, useState } from 'react'
import { Redirect, useLocalSearchParams } from 'expo-router'
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
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { getShareableGroupLink, uploadImageToStorage } from '@/lib/supabase'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type GroupDetail = {
  id: string
  name: string
  description?: string | null
  slogan?: string | null
  location?: string | null
  group_type?: string | null
  logo_url?: string | null
  image_url?: string | null
  header_image_url?: string | null
  creator_id?: string | null
}

type Member = {
  id: string
  user_id?: string
  role?: string | null
  user_profiles?: {
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
    location?: string | null
  } | null
}

type GroupMessage = {
  id: string
  message_content?: string
  created_at?: string
  like_count?: number
  liked_by_user?: boolean
  parent_message_id?: string | null
  replies?: GroupMessage[]
  user_profiles?: {
    id?: string
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
    location?: string | null
  } | null
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

type GroupActivity = {
  id: string
  title?: string
  description?: string | null
  created_at?: string
  actor?: {
    first_name?: string | null
    username?: string | null
    avatar_url?: string | null
  } | null
}

export default function GroupScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(true)
  const [joining, setJoining] = useState(false)
  const [posting, setPosting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [groupFeed, setGroupFeed] = useState<GroupActivity[]>([])
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [draft, setDraft] = useState('')
  const [activeSection, setActiveSection] = useState<'board' | 'members' | 'info'>('board')
  const [editForm, setEditForm] = useState({
    name: '',
    slogan: '',
    description: '',
    location: '',
    group_type: 'community'
  })

  const loadGroup = useCallback(async () => {
    if (!id) return

    try {
      const [response, connectionsResponse] = await Promise.all([
        apiGet<{ success: boolean; group: GroupDetail; members: Member[] }>(
          `/api/groups/${encodeURIComponent(id)}`
        ),
        user?.id
          ? apiGet<{ success: boolean; connections: ConnectionRecord[] }>(
              `/api/users?action=connections&id=${encodeURIComponent(user.id)}`
            ).catch(() => ({ success: true, connections: [] }))
          : Promise.resolve({ success: true, connections: [] as ConnectionRecord[] })
      ])
      setGroup(response.group)
      setMembers(response.members || [])
      setConnections(connectionsResponse.connections || [])

      if (user?.id) {
        try {
          const board = await apiGet<{ success: boolean; messages: GroupMessage[] }>(
            `/api/groups/message?group_id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}`
          )
          setMessages(board.messages || [])
          const feed = await apiGet<{ success: boolean; activities: GroupActivity[] }>(
            `/api/activities?action=group_detail&group_id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}&limit=8`
          ).catch(() => ({ success: true, activities: [] }))
          setGroupFeed(feed.activities || [])
        } catch {
          setMessages([])
          setGroupFeed([])
        }
      }
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    if (id) {
      setBusy(true)
      loadGroup()
    }
  }, [id, loadGroup])

  useEffect(() => {
    if (!group) return

    setEditForm({
      name: group.name || '',
      slogan: group.slogan || '',
      description: group.description || '',
      location: group.location || '',
      group_type: group.group_type || 'community'
    })
  }, [group])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const founder = members.find((member) => member.user_id === group?.creator_id)?.user_profiles
  const founderName =
    founder?.first_name ||
    founder?.username ||
    (group?.creator_id ? 'Group founder' : 'Ultimate Golf Community')
  const myMembership = members.find((member) => member.user_id === user?.id)
  const isMember = !!myMembership
  const groupTypeLabel = (group?.group_type || 'community').replace(/^./, (char) => char.toUpperCase())
  const groupLink = group?.id ? getShareableGroupLink(group.id) : ''
  const groupQrUrl = groupLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(groupLink)}`
    : ''
  const isOwner =
    group?.creator_id === user?.id ||
    ['admin', 'owner', 'creator'].includes((myMembership?.role || '').toLowerCase())
  const acceptedConnections = connections
    .map((connection) =>
      connection.requester_id === user?.id ? connection.recipient : connection.requester
    )
    .filter(Boolean) as UserCard[]
  const memberIds = new Set(members.map((member) => member.user_id).filter(Boolean))
  const inviteableConnections = acceptedConnections.filter((connection) => !memberIds.has(connection.id))

  const handlePickGroupImage = async (target: 'logo' | 'cover') => {
    if (!group?.id || !isOwner) return
    const uploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
      const fileName = asset.fileName || `group-${target}-${Date.now()}.jpg`
      const mimeType = asset.mimeType || 'image/jpeg'

      if (target === 'logo') {
        setUploadingLogo(true)
      } else {
        setUploadingCover(true)
      }

      try {
        const upload = await uploadImageToStorage({
          folder: target === 'logo' ? 'group-logos' : 'group-covers',
          fileName,
          mimeType,
          uri: asset.uri
        })
        const displayUrl = `${upload.publicUrl}${upload.publicUrl.includes('?') ? '&' : '?'}v=${Date.now()}`

        if (target === 'logo') {
          await apiPost<{ success: boolean; group: GroupDetail }>('/api/groups/media', {
            group_id: group.id,
            user_id: user?.id,
            target: 'logo',
            url: upload.publicUrl
          })
          setGroup((current) =>
            current
              ? {
                  ...current,
                  logo_url: displayUrl
                }
              : current
          )
        } else {
          await apiPost<{ success: boolean; group: GroupDetail }>('/api/groups/media', {
            group_id: group.id,
            user_id: user?.id,
            target: 'cover',
            url: upload.publicUrl
          })
          setGroup((current) =>
            current
              ? {
                  ...current,
                  header_image_url: displayUrl
                }
              : current
          )
        }
      } catch (error) {
        Alert.alert('Unable to update image', error instanceof Error ? error.message : 'Please try again.')
      } finally {
        if (target === 'logo') {
          setUploadingLogo(false)
        } else {
          setUploadingCover(false)
        }
      }
    }

    const launchLibrary = async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo library access to choose a group image.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: target === 'logo' ? [1, 1] : [16, 9],
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
        Alert.alert('Camera access needed', 'Allow camera access to take a group image.')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: target === 'logo' ? [1, 1] : [16, 9],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      await uploadAsset(result.assets[0])
    }

    Alert.alert(
      target === 'logo' ? 'Update group logo' : 'Update group cover',
      target === 'logo'
        ? 'Choose how you want to set the group logo.'
        : 'Choose how you want to set the group cover photo.',
      [
        { text: 'Take Photo', onPress: () => void launchCamera() },
        { text: 'Choose From Library', onPress: () => void launchLibrary() },
        { style: 'cancel', text: 'Cancel' }
      ]
    )
  }

  const handleJoin = async () => {
    if (!user?.id || !group?.id) return

    setJoining(true)
    try {
      await apiPost('/api/groups', {
        action: 'join',
        group_id: group.id,
        user_id: user.id
      })
      await loadGroup()
    } catch (error) {
      Alert.alert('Unable to join group', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setJoining(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!user?.id || !group?.id) return

    const trimmedName = editForm.name.trim()

    if (!trimmedName) {
      Alert.alert('Group name required', 'Give the group a name before saving.')
      return
    }

    setSavingEdit(true)
    try {
      const response = await apiPost<{ success: boolean; group: GroupDetail }>('/api/groups', {
        action: 'update',
        group_id: group.id,
        user_id: user.id,
        name: trimmedName,
        description: editForm.description.trim(),
        slogan: editForm.slogan.trim(),
        location: editForm.location.trim(),
        group_type: editForm.group_type
      })

      if (response.group) {
        setGroup((current) =>
          current
            ? {
                ...current,
                ...response.group,
                logo_url: response.group.logo_url || current.logo_url,
                header_image_url: response.group.header_image_url || current.header_image_url,
                image_url: response.group.image_url || current.image_url
              }
            : response.group
        )
      }

      setIsEditing(false)
    } catch (error) {
      Alert.alert('Unable to update group', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSetMemberRole = async (member: Member, nextRole: 'admin' | 'member') => {
    if (!user?.id || !group?.id || !member.user_id) return

    try {
      await apiPost('/api/groups', {
        action: 'set_member_role',
        group_id: group.id,
        user_id: user.id,
        member_user_id: member.user_id,
        role: nextRole
      })
      await loadGroup()
    } catch (error) {
      Alert.alert('Unable to update member', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const handlePostMessage = async () => {
    if (!user?.id || !group?.id) return

    if (!isMember) {
      Alert.alert('Join required', 'Join this group before posting on the board.')
      return
    }

    if (!draft.trim()) {
      Alert.alert('Write something first', 'Add a post, score note, photo caption, or update before posting.')
      return
    }

    setPosting(true)
    try {
      const response = await apiPost<{ success: boolean; messages: GroupMessage[] }>('/api/groups/message', {
        group_id: group.id,
        user_id: user.id,
        message: draft.trim(),
        parent_message_id: replyingTo
      })
      setMessages(response.messages || [])
      setDraft('')
      setReplyingTo(null)
    } catch (error) {
      Alert.alert('Unable to post', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const handleToggleLike = async (messageId: string, liked: boolean) => {
    if (!user?.id || !group?.id) return

    try {
      const response = await apiPost<{ success: boolean; messages: GroupMessage[] }>('/api/groups/message', {
        action: liked ? 'unlike' : 'like',
        group_id: group.id,
        user_id: user.id,
        message_id: messageId
      })
      setMessages(response.messages || [])
    } catch (error) {
      Alert.alert('Unable to update like', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const handleInviteConnection = async (invitedUserId: string) => {
    if (!user?.id || !group?.id) return

    setInvitingId(invitedUserId)
    try {
      const response = await apiPost<{ success?: boolean; error?: string }>('/api/groups/invitations', {
        action: 'create',
        group_id: group.id,
        invited_user_id: invitedUserId,
        user_id: user.id
      })

      if (response?.error) {
        throw new Error(response.error)
      }

      Alert.alert('Invite sent', 'That golfer can now join this group from their invitations.')
    } catch (error) {
      Alert.alert('Unable to add member', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setInvitingId(null)
    }
  }

  const formatAuthor = (message: GroupMessage) =>
    message.user_profiles?.first_name ||
    message.user_profiles?.username ||
    'UGC Member'

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadGroup()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader
          showBack
          rightIconName="share-social-outline"
          onRightPress={() => setShowShareModal(true)}
        />

        <View style={styles.hero}>
          <View style={styles.coverShell}>
            {group?.header_image_url || group?.image_url ? (
              <Image source={{ uri: group?.header_image_url || group?.image_url || undefined }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverFallback}>
                <Text style={styles.coverFallbackText}>Add cover photo</Text>
              </View>
            )}
            {isEditing ? (
              <Pressable onPress={() => void handlePickGroupImage('cover')} style={styles.inlineMediaButton}>
                <Text style={styles.inlineMediaButtonText}>{uploadingCover ? 'Updating...' : 'Edit Cover'}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={styles.heroTop}>
            <View style={styles.logoColumn}>
              <Avatar
                label={group?.name || 'Group'}
                shape="rounded"
                size={92}
                uri={group?.logo_url || group?.image_url}
              />
              {isEditing ? (
                <Pressable onPress={() => void handlePickGroupImage('logo')} style={styles.inlineLogoButton}>
                  <Text style={styles.inlineMediaButtonText}>{uploadingLogo ? 'Updating...' : 'Edit Logo'}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.heroCopy}>
              {busy ? <ActivityIndicator color={palette.aqua} /> : null}
              {isEditing ? (
                <>
                  <TextInput
                    onChangeText={(value) => setEditForm((current) => ({ ...current, name: value }))}
                    placeholder="Group name"
                    placeholderTextColor={palette.textMuted}
                    style={styles.inlineNameInput}
                    value={editForm.name}
                  />
                  <Text style={styles.heroSubtitle}>{(editForm.group_type || 'community').replace(/^./, (char) => char.toUpperCase())} group</Text>
                </>
              ) : (
                <>
                  <Text style={styles.name}>{group?.name || id?.replace(/-/g, ' ') || 'Group'}</Text>
                  <Text style={styles.heroSubtitle}>{group?.slogan || `${groupTypeLabel} group`}</Text>
                  <View style={styles.heroMetaInlineRow}>
                    {group?.location ? <Text style={styles.heroMetaInlineText}>{group.location}</Text> : null}
                    <Pressable onPress={() => setActiveSection('members')}>
                      <Text style={styles.heroMetaInlineAccent}>{members.length} members</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.heroStory}>
                    {group?.description ||
                      'Build the story of this group so local golfers know exactly who it is for.'}
                  </Text>
                </>
              )}
            </View>
          </View>
          <View style={styles.metaRow}>
            {isEditing ? (
              <TextInput
                onChangeText={(value) => setEditForm((current) => ({ ...current, location: value }))}
                placeholder="City or course area"
                placeholderTextColor={palette.textMuted}
                style={styles.inlineMetaInput}
                value={editForm.location}
              />
            ) : null}
            <Text style={styles.metaPill}>Founded by {founderName}</Text>
          </View>
          {!isMember ? <PrimaryButton label="Join Group" loading={joining} onPress={handleJoin} /> : null}
          {isOwner ? (
            <View style={styles.quickActions}>
              <Pressable onPress={() => setIsEditing((current) => !current)} style={styles.quickAction}>
                <Ionicons color={palette.aqua} name="shield-checkmark-outline" size={18} />
                <Text style={styles.quickActionText}>Admin</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.tabRow}>
          {[
            { label: 'Board', value: 'board' as const },
            { label: 'Info', value: 'info' as const }
          ].map((tab) => {
            const active = activeSection === tab.value

            return (
              <Pressable
                key={tab.value}
                onPress={() => setActiveSection(tab.value)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            )
          })}
        </View>

        {activeSection === 'info' ? (
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>About</Text>
            <Text style={styles.sectionTitle}>What this group is about</Text>
            {isEditing ? (
              <>
                <TextInput
                  multiline
                  onChangeText={(value) => setEditForm((current) => ({ ...current, description: value }))}
                  placeholder="What is this group about?"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.editInput, styles.editTextarea]}
                  value={editForm.description}
                />
                <TextInput
                  onChangeText={(value) => setEditForm((current) => ({ ...current, slogan: value }))}
                  placeholder="Group slogan"
                  placeholderTextColor={palette.textMuted}
                  style={styles.editInput}
                  value={editForm.slogan}
                />
                <View style={styles.typeRow}>
                  {[
                    { label: 'Community', value: 'community' },
                    { label: 'Course', value: 'course' }
                  ].map((option) => {
                    const active = editForm.group_type === option.value

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setEditForm((current) => ({ ...current, group_type: option.value }))}
                        style={[styles.typeChip, active && styles.typeChipActive]}
                      >
                        <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{option.label}</Text>
                      </Pressable>
                    )
                  })}
                </View>
                <View style={styles.editActions}>
                  <PrimaryButton label="Cancel" variant="ghost" onPress={() => setIsEditing(false)} />
                  <PrimaryButton
                    label={savingEdit ? 'Saving...' : 'Save Group'}
                    loading={savingEdit}
                    onPress={handleSaveEdit}
                  />
                </View>
              </>
            ) : (
              <Text style={styles.body}>
                {group?.description ||
                  'Add what this group is for, who it serves, and why golfers should join.'}
              </Text>
            )}
            <View style={styles.infoGrid}>
              <View style={styles.infoPill}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>
                  {isEditing
                    ? (editForm.group_type || 'community').replace(/^./, (char) => char.toUpperCase())
                    : groupTypeLabel}
                </Text>
              </View>
              <View style={styles.infoPill}>
                <Text style={styles.infoLabel}>Founder</Text>
                <Text style={styles.infoValue}>{founderName}</Text>
              </View>
              <View style={styles.infoPill}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>
                  {isEditing ? editForm.location || 'Set a home area' : group?.location || 'Set a home area'}
                </Text>
              </View>
              <View style={styles.infoPill}>
                <Text style={styles.infoLabel}>Members</Text>
                <Text style={styles.infoValue}>{members.length}</Text>
              </View>
            </View>
          </View>
        ) : activeSection === 'members' ? (
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>People</Text>
            <Text style={styles.sectionTitle}>{members.length} group members</Text>
            {isOwner ? (
              <View style={styles.inviteSection}>
                <Text style={styles.inviteTitle}>Add members</Text>
                <Text style={styles.body}>
                  Invite golfers from your connections directly into this group.
                </Text>
                {inviteableConnections.length === 0 ? (
                  <Text style={styles.body}>
                    Everyone in your network is already here, or you have no connections yet.
                  </Text>
                ) : (
                  inviteableConnections.slice(0, 6).map((connection) => (
                    <View key={connection.id} style={styles.inviteRow}>
                      <View style={styles.invitePerson}>
                        <Avatar
                          label={
                            [connection.first_name, connection.last_name].filter(Boolean).join(' ') ||
                            connection.username ||
                            'UGC'
                          }
                          size={48}
                          uri={connection.avatar_url}
                        />
                        <View style={styles.inviteCopy}>
                          <Text style={styles.memberName}>
                            {[connection.first_name, connection.last_name].filter(Boolean).join(' ') ||
                              connection.username ||
                              'UGC Golfer'}
                          </Text>
                          <Text style={styles.memberMeta}>{connection.location || 'Local golfer'}</Text>
                        </View>
                      </View>
                      <PrimaryButton
                        label="Add"
                        loading={invitingId === connection.id}
                        onPress={() => void handleInviteConnection(connection.id)}
                      />
                    </View>
                  ))
                )}
              </View>
            ) : null}
            {members.length === 0 ? (
              <Text style={styles.body}>
                No members are visible yet. Once people join, this group roster will start filling in.
              </Text>
            ) : null}
            {members.slice(0, 10).map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberIdentity}>
                  <Avatar
                    label={member.user_profiles?.first_name || member.user_profiles?.username || 'UGC'}
                    size={46}
                    uri={member.user_profiles?.avatar_url}
                  />
                  <View style={styles.memberCopy}>
                    <Text style={styles.memberName}>
                      {member.user_profiles?.first_name || member.user_profiles?.username || 'UGC Member'}
                    </Text>
                    <Text style={styles.memberMeta}>
                      {(member.role || 'member').replace(/^./, (char) => char.toUpperCase())}
                      {member.user_profiles?.location ? ` • ${member.user_profiles.location}` : ''}
                    </Text>
                  </View>
                </View>
                {isOwner && group?.creator_id === user?.id && member.user_id !== user?.id ? (
                  <Pressable
                    onPress={() =>
                      void handleSetMemberRole(
                        member,
                        (member.role || '').toLowerCase() === 'admin' ? 'member' : 'admin'
                      )
                    }
                    style={styles.roleButton}
                  >
                    <Text style={styles.roleButtonText}>
                      {(member.role || '').toLowerCase() === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>Board</Text>
            <Text style={styles.sectionTitle}>Community board</Text>
            <Text style={styles.body}>
              Post scores, photos, tee-time updates, or start a thread for the group.
            </Text>
            <View style={styles.groupFeedPanel}>
              <Text style={styles.inviteTitle}>Group activity feed</Text>
              {groupFeed.length === 0 ? (
                <Text style={styles.body}>Member activity, tee times, posts, and score movement will show here.</Text>
              ) : null}
              {groupFeed.map((item) => (
                <View key={item.id} style={styles.groupFeedItem}>
                  <Avatar
                    label={item.actor?.first_name || item.actor?.username || 'UGC'}
                    size={34}
                    uri={item.actor?.avatar_url}
                  />
                  <View style={styles.memberCopy}>
                    <Text style={styles.memberName}>{item.title || 'Group activity'}</Text>
                    {item.description ? <Text style={styles.memberMeta}>{item.description}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
            {replyingTo ? (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText}>Replying to a member post</Text>
                <Pressable onPress={() => setReplyingTo(null)}>
                  <Text style={styles.replyCancel}>Cancel</Text>
                </Pressable>
              </View>
            ) : null}
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder="Post to the board: score, photo caption, tee time, or group update"
              placeholderTextColor={palette.textMuted}
              style={styles.composeInput}
              value={draft}
            />
            <PrimaryButton label={posting ? 'Posting...' : 'Post to Group'} loading={posting} onPress={handlePostMessage} />

            {messages.length === 0 ? (
              <Text style={styles.body}>No posts yet. Start the conversation for this group.</Text>
            ) : null}

            {messages.map((message) => (
              <View key={message.id} style={styles.messageCard}>
                <View style={styles.messageTop}>
                  <View style={styles.memberIdentity}>
                    <Avatar
                      label={formatAuthor(message)}
                      size={38}
                      uri={message.user_profiles?.avatar_url}
                    />
                    <Text style={styles.memberName}>{formatAuthor(message)}</Text>
                  </View>
                  <Text style={styles.messageMeta}>
                    {message.created_at ? new Date(message.created_at).toLocaleDateString() : 'Now'}
                  </Text>
                </View>
                <Text style={styles.body}>{message.message_content || ''}</Text>
                <View style={styles.messageActions}>
                  <Pressable onPress={() => void handleToggleLike(message.id, !!message.liked_by_user)}>
                    <Text style={styles.messageAction}>
                      {message.liked_by_user ? 'Unlike' : 'Like'}{message.like_count ? ` (${message.like_count})` : ''}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => setReplyingTo(message.id)}>
                    <Text style={styles.messageAction}>Reply</Text>
                  </Pressable>
                </View>
                {message.replies?.length ? (
                  <View style={styles.replies}>
                    {message.replies.map((reply) => (
                      <View key={reply.id} style={styles.replyCard}>
                        <Text style={styles.replyAuthor}>{formatAuthor(reply)}</Text>
                        <Text style={styles.replyText}>{reply.message_content || ''}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <Modal
        animationType="slide"
        transparent
        visible={showShareModal}
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowShareModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.sectionEyebrow}>Instant invite</Text>
            <Text style={styles.sectionTitle}>Scan to join {group?.name || 'this group'}</Text>
            <Text style={styles.body}>
              Pull this up on the first tee, at the clubhouse, or in a group chat.
            </Text>
            {groupQrUrl ? <Image source={{ uri: groupQrUrl }} style={styles.qrImage} /> : null}
            <Text style={styles.shareLink}>{groupLink}</Text>
            <PrimaryButton
              label="Share Group"
              onPress={() => void Share.share({ message: groupLink, url: groupLink })}
            />
            <PrimaryButton label="Close" variant="ghost" onPress={() => setShowShareModal(false)} />
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
  editInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 52,
    paddingHorizontal: 16
  },
  editTextarea: {
    minHeight: 110,
    paddingBottom: 16,
    paddingTop: 16,
    textAlignVertical: 'top'
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10
  },
  typeChip: {
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
  typeChipActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  mediaActions: {
    gap: 10,
    marginTop: 4
  },
  typeLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  typeLabelActive: {
    color: palette.aqua
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end'
  },
  hero: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 20
  },
  coverShell: {
    borderRadius: 22,
    height: 176,
    overflow: 'hidden',
    position: 'relative'
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
  inlineMediaButton: {
    backgroundColor: 'rgba(7, 20, 15, 0.82)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'absolute',
    right: 12
  },
  inlineLogoButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  inlineMediaButtonText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700'
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16
  },
  logoColumn: {
    alignItems: 'center'
  },
  heroCopy: {
    flex: 1,
    gap: 6
  },
  heroMetaInlineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  heroMetaInlineText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  heroMetaInlineAccent: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
  },
  name: {
    color: palette.text,
    fontSize: 26,
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  inlineNameInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    color: palette.text,
    fontSize: 24,
    fontWeight: '700',
    minHeight: 52,
    paddingHorizontal: 14
  },
  heroSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600'
  },
  heroStory: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 4
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2
  },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    color: palette.textMuted,
    fontSize: 13,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  quickActionText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800'
  },
  inlineMetaInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    color: palette.text,
    flexGrow: 1,
    fontSize: 13,
    minHeight: 38,
    minWidth: 180,
    paddingHorizontal: 12
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10
  },
  tabChip: {
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
  tabChipActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  tabLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  tabLabelActive: {
    color: palette.aqua
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  sectionEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  body: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  ownerPanel: {
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16
  },
  ownerPanelCopy: {
    gap: 4
  },
  ownerPanelEyebrow: {
    color: palette.aqua,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  ownerPanelTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  ownerPanelBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  ownerPanelActions: {
    gap: 10
  },
  infoGrid: {
    gap: 10
  },
  infoPill: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 14
  },
  infoLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  infoValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600'
  },
  inviteSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  inviteTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  groupFeedPanel: {
    backgroundColor: 'rgba(103,232,249,0.06)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  groupFeedItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    padding: 10
  },
  inviteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  invitePerson: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12
  },
  inviteCopy: {
    flex: 1,
    gap: 2
  },
  memberRow: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 14
  },
  memberIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12
  },
  memberCopy: {
    flex: 1,
    gap: 3
  },
  memberName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600'
  },
  memberMeta: {
    color: palette.textMuted,
    fontSize: 13
  },
  roleButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  roleButtonText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800'
  },
  composeInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 96,
    paddingHorizontal: 16,
    paddingTop: 16,
    textAlignVertical: 'top'
  },
  messageCard: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  messageTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  messageMeta: {
    color: palette.textMuted,
    fontSize: 12
  },
  messageActions: {
    flexDirection: 'row',
    gap: 16
  },
  messageAction: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
  },
  replies: {
    gap: 8
  },
  replyCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  replyAuthor: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  },
  replyText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  replyBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  replyBannerText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  replyCancel: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
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
    gap: 14,
    padding: 20
  },
  qrImage: {
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: 20,
    height: 240,
    width: 240
  },
  shareLink: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center'
  }
})
