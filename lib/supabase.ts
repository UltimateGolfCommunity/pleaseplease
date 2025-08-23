import { createBrowserClient, createServerClient as createServerClientSSR } from '@supabase/ssr'
import { mockSupabaseClient } from './supabase-mock'

// Helper function to check if environment variables are valid
function isValidSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Check if they exist
  if (!url || !key) return false
  
  // Check if URL is valid
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function createClient() {
  // Debug logging
  console.log('🔍 Supabase Config Check:')
  console.log('  URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('  Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  console.log('  Key starts with:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
  
  // Check if we have valid Supabase configuration
  if (!isValidSupabaseConfig()) {
    console.warn('⚠️  Invalid Supabase credentials. Using mock client for development.')
    return mockSupabaseClient as any
  }

  console.log('✅ Using real Supabase client')
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServerClient() {
  // Check if we have valid Supabase configuration
  if (!isValidSupabaseConfig()) {
    console.warn('⚠️  Invalid or placeholder Supabase credentials. Using mock client for development.')
    return mockSupabaseClient as any
  }

  return createServerClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: () => '',
        set: () => {},
        remove: () => {},
      },
    }
  )
}
