import { useCallback, useEffect, useState } from 'react'
import { Redirect, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
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
import { apiGet, apiPost, apiUploadImage } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type GroupDetail = {
  id: string
  name: string
  description?: string | null
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
  const [showEditModal, setShowEditModal] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [draft, setDraft] = useState('')
  const [activeSection, setActiveSection] = useState<'info' | 'members' | 'board'>('info')
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    location: '',
    group_type: 'community'
  })

  const loadGroup = useCallback(async () => {
    if (!id) return

    try {
      const response = await apiGet<{ success: boolean; group: GroupDetail; members: Member[] }>(
        `/api/groups/${encodeURIComponent(id)}`
      )
      setGroup(response.group)
      setMembers(response.members || [])

      if (user?.id) {
        try {
          const board = await apiGet<{ success: boolean; messages: GroupMessage[] }>(
            `/api/groups/message?group_id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}`
          )
          setMessages(board.messages || [])
        } catch {
          setMessages([])
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
  const isOwner =
    group?.creator_id === user?.id ||
    ['admin', 'owner', 'creator'].includes((myMembership?.role || '').toLowerCase())

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

      const formData = new FormData()
      formData.append('folder', target === 'logo' ? 'group-logos' : 'group-covers')
      formData.append(
        'file',
        {
          uri: asset.uri,
          name: fileName,
          type: mimeType
        } as any
      )

      try {
        const upload = await apiUploadImage<{ success: boolean; url: string }>('/api/upload', formData)

        if (target === 'logo') {
          const response = await apiPost<{ success: boolean; group: GroupDetail }>('/api/groups', {
            action: 'update',
            group_id: group.id,
            user_id: user?.id,
            logo_url: upload.url,
            image_url: upload.url
          })
          setGroup((current) =>
            current
              ? {
                  ...current,
                  logo_url: response.group?.logo_url || upload.url,
                  image_url: response.group?.image_url || current.image_url
                }
              : current
          )
        } else {
          const response = await apiPost<{ success: boolean; group: GroupDetail }>('/api/groups', {
            action: 'update',
            group_id: group.id,
            user_id: user?.id,
            header_image_url: upload.url,
            image_url: upload.url
          })
          setGroup((current) =>
            current
              ? {
                  ...current,
                  header_image_url: response.group?.header_image_url || upload.url,
                  image_url: response.group?.image_url || upload.url
                }
              : current
          )
        }

        await loadGroup()
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
        location: editForm.location.trim(),
        group_type: editForm.group_type
      })

      if (response.group) {
        setGroup(response.group)
      }

      setShowEditModal(false)
      await loadGroup()
    } catch (error) {
      Alert.alert('Unable to update group', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handlePostMessage = async () => {
    if (!user?.id || !group?.id || !draft.trim()) return

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
          title="Group"
          subtitle="A cleaner club page with the essentials up front and the story just below."
          showBack
        />

        <Modal
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
          transparent
          visible={showEditModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Edit Group</Text>
              <Text style={styles.modalBody}>
                Update the club story, location, and type here. Cover and logo edits stay on the group header.
              </Text>

              <TextInput
                onChangeText={(value) => setEditForm((current) => ({ ...current, name: value }))}
                placeholder="Group name"
                placeholderTextColor={palette.textMuted}
                style={styles.modalInput}
                value={editForm.name}
              />
              <TextInput
                multiline
                onChangeText={(value) => setEditForm((current) => ({ ...current, description: value }))}
                placeholder="What is this group about?"
                placeholderTextColor={palette.textMuted}
                style={[styles.modalInput, styles.modalTextarea]}
                value={editForm.description}
              />
              <TextInput
                onChangeText={(value) => setEditForm((current) => ({ ...current, location: value }))}
                placeholder="City or course area"
                placeholderTextColor={palette.textMuted}
                style={styles.modalInput}
                value={editForm.location}
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

              <View style={styles.modalActions}>
                <PrimaryButton label="Cancel" variant="ghost" onPress={() => setShowEditModal(false)} />
                <PrimaryButton label={savingEdit ? 'Saving...' : 'Save Group'} loading={savingEdit} onPress={handleSaveEdit} />
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.hero}>
          <View style={styles.coverShell}>
            {group?.header_image_url || group?.image_url ? (
              <Image source={{ uri: group?.header_image_url || group?.image_url || undefined }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverFallback}>
                <Text style={styles.coverFallbackText}>Add a group cover photo</Text>
              </View>
            )}
            {isOwner ? (
              <View style={styles.coverActions}>
                <Pressable onPress={() => setShowEditModal(true)} style={[styles.coverButton, styles.coverButtonLeft]}>
                  <Text style={styles.coverButtonText}>Edit Group</Text>
                </Pressable>
                <Pressable onPress={() => void handlePickGroupImage('cover')} style={styles.coverButton}>
                  <Text style={styles.coverButtonText}>{uploadingCover ? 'Updating...' : 'Edit Cover'}</Text>
                </Pressable>
              </View>
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
              {isOwner ? (
                <Pressable onPress={() => void handlePickGroupImage('logo')} style={styles.logoEditChip}>
                  <Text style={styles.logoEditChipText}>{uploadingLogo ? 'Updating...' : 'Edit Logo'}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.heroCopy}>
              {busy ? <ActivityIndicator color={palette.aqua} /> : null}
              <Text style={styles.name}>{group?.name || id?.replace(/-/g, ' ') || 'Group'}</Text>
              <Text style={styles.heroSubtitle}>{groupTypeLabel} group</Text>
              <Text style={styles.heroStory}>
                {group?.description ||
                  'Give this club a stronger story so local golfers know exactly what the group is for.'}
              </Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            {group?.location ? <Text style={styles.metaPill}>{group.location}</Text> : null}
            <Text style={styles.metaPill}>{members.length} members</Text>
            <Text style={styles.metaPill}>Founded by {founderName}</Text>
          </View>
          {!isMember ? <PrimaryButton label="Join Group" loading={joining} onPress={handleJoin} /> : null}
        </View>

        <View style={styles.tabRow}>
          {[
            { label: 'Info', value: 'info' as const },
            { label: 'Members', value: 'members' as const },
            { label: 'Board', value: 'board' as const }
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
            {isOwner ? (
              <View style={styles.ownerPanel}>
                <View style={styles.ownerPanelCopy}>
                  <Text style={styles.ownerPanelEyebrow}>Creator tools</Text>
                  <Text style={styles.ownerPanelTitle}>Manage your club</Text>
                  <Text style={styles.ownerPanelBody}>
                    Update the group story, change the home area, and refresh the logo or cover any time.
                  </Text>
                </View>
                <View style={styles.ownerPanelActions}>
                  <PrimaryButton label="Edit Group" onPress={() => setShowEditModal(true)} />
                  <PrimaryButton
                    label={uploadingLogo ? 'Updating logo...' : 'Change Logo'}
                    variant="ghost"
                    loading={uploadingLogo}
                    onPress={() => void handlePickGroupImage('logo')}
                  />
                  <PrimaryButton
                    label={uploadingCover ? 'Updating cover...' : 'Change Cover'}
                    variant="ghost"
                    loading={uploadingCover}
                    onPress={() => void handlePickGroupImage('cover')}
                  />
                </View>
              </View>
            ) : null}
            <Text style={styles.sectionEyebrow}>About</Text>
            <Text style={styles.sectionTitle}>What this group is about</Text>
            <Text style={styles.body}>
              {group?.description ||
                'Add a stronger club story, who it is for, and how members use it so new golfers understand the purpose right away.'}
            </Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoPill}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{groupTypeLabel}</Text>
              </View>
              <View style={styles.infoPill}>
                <Text style={styles.infoLabel}>Founder</Text>
                <Text style={styles.infoValue}>{founderName}</Text>
              </View>
              <View style={styles.infoPill}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{group?.location || 'Set a home area'}</Text>
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
            <Text style={styles.sectionTitle}>Member snapshot</Text>
            {members.length === 0 ? (
              <Text style={styles.body}>
                No members are visible yet. Once people join, this group roster will start filling in.
              </Text>
            ) : null}
            {members.slice(0, 10).map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <Text style={styles.memberName}>
                  {member.user_profiles?.first_name || member.user_profiles?.username || 'UGC Member'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>Board</Text>
            <Text style={styles.sectionTitle}>Group conversation</Text>
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
              placeholder="Share a note with the group"
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
                  <Text style={styles.memberName}>{formatAuthor(message)}</Text>
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
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(2, 8, 6, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    maxWidth: 520,
    padding: 20,
    width: '100%'
  },
  modalTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  modalBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  modalInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 52,
    paddingHorizontal: 16
  },
  modalTextarea: {
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
  typeLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  typeLabelActive: {
    color: palette.aqua
  },
  modalActions: {
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
  coverActions: {
    bottom: 12,
    flexDirection: 'row',
    gap: 10,
    left: 12,
    position: 'absolute',
    right: 12
  },
  coverButton: {
    backgroundColor: 'rgba(7, 20, 15, 0.82)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'relative'
  },
  coverButtonLeft: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.22)'
  },
  coverButtonText: {
    color: palette.white,
    fontSize: 12,
    fontWeight: '700'
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16
  },
  logoColumn: {
    alignItems: 'center',
    gap: 10
  },
  logoEditChip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  logoEditChipText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700'
  },
  heroCopy: {
    flex: 1,
    gap: 6
  },
  name: {
    color: palette.text,
    fontSize: 26,
    fontWeight: '700',
    textTransform: 'capitalize'
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
    gap: 10
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
  memberRow: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14
  },
  memberName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600'
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
  }
})
