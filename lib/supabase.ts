import { createBrowserClient, createServerClient as createServerClientSSR } from '@supabase/ssr'
import { mockSupabaseClient } from './supabase-mock'

// Helper function to check if environment variables are valid
function isValidSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Check if they exist
  if (!url || !key) {
    console.error('❌ Missing Supabase environment variables')
    return false
  }
  
  // Check for placeholder values
  if (url.includes('[YOUR-') || url.includes('your_') || url.includes('_here')) {
    console.error('❌ Supabase URL contains placeholder values:', url)
    return false
  }
  
  if (key.includes('[YOUR-') || key.includes('your_') || key.includes('_here')) {
    console.error('❌ Supabase key contains placeholder values')
    return false
  }
  
  // Check if URL is valid and is a proper Supabase URL
  try {
    const urlObj = new URL(url)
    
    // Ensure it's not a database connection URL
    if (urlObj.protocol === 'postgresql:' || urlObj.protocol === 'postgres:') {
      console.error('❌ Found database URL instead of API URL. Use https://your-project.supabase.co format:', url)
      return false
    }
    
    if (!urlObj.hostname.includes('supabase.co')) {
      console.error('❌ URL is not a valid Supabase URL:', url)
      return false
    }
    
    if (urlObj.protocol !== 'https:') {
      console.error('❌ Supabase URL must use HTTPS:', url)
      return false
    }
    
    return true
  } catch {
    console.error('❌ Invalid URL format:', url)
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
