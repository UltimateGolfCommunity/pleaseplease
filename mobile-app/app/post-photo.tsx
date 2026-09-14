import { useEffect, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiPost } from '@/lib/api'
import { uploadImageToStorage, mobileSupabase } from '@/lib/supabase'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type TaggableGolfer = { id: string; name: string; avatarUrl?: string | null }

export default function PostPhotoScreen() {
  const { loading, user } = useAuth()
  const params = useLocalSearchParams<{
    activity_id?: string
    caption?: string
    image_url?: string
  }>()
  const [caption, setCaption] = useState('')
  const [imageUri, setImageUri] = useState('')
  const [uploading, setUploading] = useState(false)
  const [tagPickerOpen, setTagPickerOpen] = useState(false)
  const [connections, setConnections] = useState<TaggableGolfer[]>([])
  const [taggedGolferIds, setTaggedGolferIds] = useState<string[]>([])
  const isEditing = !!params.activity_id

  useEffect(() => {
    setCaption(typeof params.caption === 'string' ? params.caption : '')
    setImageUri(typeof params.image_url === 'string' ? params.image_url : '')
  }, [params.caption, params.image_url])

  useEffect(() => {
    if (!user?.id) return

    void (async () => {
      const { data: edges } = await mobileSupabase
        .from('user_connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .in('status', ['accepted', 'active'])
      const ids = Array.from(new Set((edges || []).map((edge: any) => edge.requester_id === user.id ? edge.recipient_id : edge.requester_id).filter(Boolean)))
      if (!ids.length) return setConnections([])
      const { data: profiles } = await mobileSupabase
        .from('user_profiles')
        .select('id, first_name, last_name, username, avatar_url')
        .in('id', ids)
      setConnections((profiles || []).map((profile: any) => ({
        id: profile.id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'Golfer',
        avatarUrl: profile.avatar_url
      })))
    })().catch(() => setConnections([]))
  }, [user?.id])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
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
      setImageUri(result.assets[0].uri)
    }
  }

  const publishPhoto = async () => {
    if (!user?.id || !imageUri) {
      Alert.alert('Photo needed', 'Choose a photo before posting.')
      return
    }

    setUploading(true)
    try {
      let finalImageUrl = imageUri

      if (!imageUri.startsWith('http')) {
        const upload = await uploadImageToStorage({
          uri: imageUri,
          fileName: `feed-photo-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          folder: 'feed-photos'
        })
        finalImageUrl = upload.publicUrl
      }

      const payload = {
        title: 'Posted a golf photo',
        description: caption.trim() || 'Shared a new golf photo',
        metadata: {
          image_url: finalImageUrl,
          caption: caption.trim(),
          tagged_user_ids: taggedGolferIds,
          tagged_golfers: connections
            .filter((golfer) => taggedGolferIds.includes(golfer.id))
            .map((golfer) => ({ id: golfer.id, name: golfer.name, avatar_url: golfer.avatarUrl || null }))
        }
      }

      if (isEditing && params.activity_id) {
        const { error } = await mobileSupabase
          .from('user_activities')
          .update(payload)
          .eq('id', params.activity_id)
          .eq('user_id', user.id)

        if (error) {
          throw new Error(error.message || 'Unable to update post.')
        }
      } else {
        await apiPost('/api/activities', {
          user_id: user.id,
          activity_type: 'photo_posted',
          related_id: null,
          related_type: null,
          ...payload
        })
      }

      Alert.alert(isEditing ? 'Post updated' : 'Photo posted', isEditing ? 'Your post is updated in the network feed.' : 'Your photo is now in the network feed.')
      router.replace({ pathname: '/home', params: { refresh: String(Date.now()) } })
    } catch (error) {
      Alert.alert(isEditing ? 'Unable to update post' : 'Unable to post photo', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandHeader showBack title={isEditing ? 'Edit Post' : 'Post Photo'} subtitle={isEditing ? 'Refresh the caption or swap the photo.' : 'Share a round, swing, scorecard, or course moment.'} />
        <View style={styles.card}>
          <Pressable onPress={pickPhoto} style={styles.photoPicker}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : (
              <View style={styles.emptyPreview}>
                <Text style={styles.emptyTitle}>Choose Photo</Text>
                <Text style={styles.emptyBody}>This replaces the old course post action.</Text>
              </View>
            )}
          </Pressable>
          <TextInput
            multiline
            onChangeText={setCaption}
            placeholder="Write a caption..."
            placeholderTextColor={palette.textMuted}
            style={styles.caption}
            value={caption}
          />
          <Pressable onPress={() => setTagPickerOpen((current) => !current)} style={styles.tagToggle}>
            <Text style={styles.tagToggleText}>{taggedGolferIds.length ? `Tagged: ${taggedGolferIds.length}` : 'Tag connections'}</Text>
            <Text style={styles.tagTogglePlus}>{tagPickerOpen ? '−' : '+'}</Text>
          </Pressable>
          {tagPickerOpen ? (
            <View style={styles.tagPicker}>
              {connections.length ? connections.map((golfer) => {
                const selected = taggedGolferIds.includes(golfer.id)
                return <Pressable key={golfer.id} onPress={() => setTaggedGolferIds((current) => selected ? current.filter((id) => id !== golfer.id) : [...current, golfer.id])} style={[styles.tagOption, selected && styles.tagOptionSelected]}>
                  <Image source={golfer.avatarUrl ? { uri: golfer.avatarUrl } : undefined} style={styles.tagAvatar} />
                  <Text style={styles.tagOptionText}>{golfer.name}</Text>
                  <Text style={styles.tagCheck}>{selected ? '✓' : ''}</Text>
                </Pressable>
              }) : <Text style={styles.tagEmpty}>Add golf connections to tag them in your photos.</Text>}
            </View>
          ) : null}
          <PrimaryButton label={isEditing ? 'Save Post' : 'Post to Network Feed'} loading={uploading} onPress={publishPhoto} />
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
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 18
  },
  photoPicker: {
    borderRadius: 24,
    overflow: 'hidden'
  },
  preview: {
    aspectRatio: 4 / 5,
    width: '100%'
  },
  emptyPreview: {
    alignItems: 'center',
    aspectRatio: 4 / 5,
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    gap: 8
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800'
  },
  emptyBody: {
    color: palette.textMuted,
    fontSize: 14
  },
  caption: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 110,
    padding: 16,
    textAlignVertical: 'top'
  },
  tagToggle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 4 },
  tagToggleText: { color: palette.aqua, fontSize: 14, fontWeight: '800' },
  tagTogglePlus: { color: palette.aqua, fontSize: 24, fontWeight: '400', lineHeight: 24 },
  tagPicker: { backgroundColor: palette.cardSoft, borderColor: palette.border, borderRadius: 16, borderWidth: 1, maxHeight: 230, padding: 8 },
  tagOption: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', gap: 10, padding: 9 },
  tagOptionSelected: { backgroundColor: 'rgba(103,232,249,0.12)' },
  tagAvatar: { backgroundColor: palette.border, borderRadius: 16, height: 32, width: 32 },
  tagOptionText: { color: palette.text, flex: 1, fontSize: 14, fontWeight: '700' },
  tagCheck: { color: palette.aqua, fontSize: 18, fontWeight: '900', width: 20 },
  tagEmpty: { color: palette.textMuted, fontSize: 13, padding: 10 }
})
