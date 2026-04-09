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

export function getShareableProfileLink(userId: string) {
  const siteUrl = process.env.EXPO_PUBLIC_SITE_URL || 'https://www.ultimategolfcommunity.com'
  return `${siteUrl}/users/${userId}?connect=1`
}
