import { useEffect, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { uploadImageToStorage, mobileSupabase } from '@/lib/supabase'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

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
  const isEditing = !!params.activity_id

  useEffect(() => {
    setCaption(typeof params.caption === 'string' ? params.caption : '')
    setImageUri(typeof params.image_url === 'string' ? params.image_url : '')
  }, [params.caption, params.image_url])

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
          caption: caption.trim()
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
        const { error } = await mobileSupabase
          .from('user_activities')
          .insert({
            user_id: user.id,
            activity_type: 'photo_posted',
            related_id: null,
            related_type: null,
            ...payload
          })

        if (error) {
          throw new Error(error.message || 'Unable to create post.')
        }
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
  }
})
