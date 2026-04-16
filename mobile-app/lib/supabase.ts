import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const fallbackSupabaseUrl = 'https://xnuokgscavnytpqxlurg.supabase.co'
const fallbackSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhudW9rZ3NjYXZueXRwcXhsdXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTcyMjMsImV4cCI6MjA3MDY3MzIyM30.a3vgfoRo2ZsoQeoD-5PdqWsmAxxYSLXpIhzpVNr0I6M'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || fallbackSupabaseUrl
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey

export const mobileSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

export async function clearMobileAuthStorage() {
  const keys = await AsyncStorage.getAllKeys()
  const authKeys = keys.filter((key) => {
    const normalizedKey = key.toLowerCase()
    return (
      normalizedKey.includes('supabase') ||
      normalizedKey.includes('sb-') ||
      normalizedKey.includes('auth-token')
    )
  })

  if (authKeys.length) {
    await AsyncStorage.multiRemove(authKeys)
  }
}

export async function uploadImageToStorage({
  uri,
  fileName,
  mimeType,
  folder
}: {
  uri: string
  fileName: string
  mimeType?: string
  folder: string
}) {
  const extension = fileName.split('.').pop() || 'jpg'
  const normalizedMimeType = mimeType || 'image/jpeg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const response = await fetch(uri)
  const arrayBuffer = await response.arrayBuffer()

  if (!arrayBuffer.byteLength) {
    throw new Error('Selected image file was empty.')
  }

  const fileBytes = new Uint8Array(arrayBuffer)

  const { error } = await mobileSupabase.storage
    .from('uploads')
    .upload(path, fileBytes, {
      contentType: normalizedMimeType,
      upsert: false
    })

  if (error) {
    throw new Error(error.message || 'Unable to upload image.')
  }

  const {
    data: { publicUrl }
  } = mobileSupabase.storage.from('uploads').getPublicUrl(path)

  return {
    path,
    publicUrl
  }
}

export function getShareableProfileLink(userId: string) {
  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://www.ultimategolfcommunity.com'
  return `${siteUrl}/users/${userId}?connect=1`
}
