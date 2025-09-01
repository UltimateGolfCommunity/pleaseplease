import { createClient } from '@supabase/supabase-js'
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

// Cache for the Supabase client to avoid recreating it
let cachedClient: any = null

export function createBrowserClient() {
  // Return cached client if available
  if (cachedClient) {
    return cachedClient
  }
  
  // Check if we have valid Supabase configuration
  if (!isValidSupabaseConfig()) {
    console.warn('⚠️  Invalid Supabase credentials. Using mock client for development.')
    cachedClient = mockSupabaseClient as any
    return cachedClient
  }

  // Create and cache the client
  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return cachedClient
}

// Cache for server client
let cachedServerClient: any = null

export function createServerClient() {
  // Return cached client if available
  if (cachedServerClient) {
    return cachedServerClient
  }
  
  // Check if we have valid Supabase configuration
  if (!isValidSupabaseConfig()) {
    console.warn('⚠️  Invalid or placeholder Supabase credentials. Using mock client for development.')
    cachedServerClient = mockSupabaseClient as any
    return cachedServerClient
  }

  // Create and cache the client
  cachedServerClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  return cachedServerClient
}
