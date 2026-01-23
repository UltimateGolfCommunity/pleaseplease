import { createClient } from '@supabase/supabase-js'
import { mockSupabaseClient } from './supabase-mock'

// Helper function to check if environment variables are valid
function isValidSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Check if they exist
  if (!url || !key) {
    console.error('❌ Missing Supabase environment variables')
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', url ? 'exists' : 'MISSING')
    console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? 'exists' : 'MISSING')
    return false
  }
  
  // Check for placeholder values
  if (url.includes('[YOUR-') || url.includes('your_') || url.includes('_here') || url.includes('your-project')) {
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
    
    // Check for common issues
    if (urlObj.hostname.length < 20) {
      console.error('❌ Supabase URL hostname seems too short (might be invalid):', urlObj.hostname)
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Invalid URL format:', url)
    console.error('   Error:', error instanceof Error ? error.message : 'Unknown')
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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.error('❌ Invalid Supabase configuration detected:')
    console.error('  URL exists:', !!url)
    console.error('  Key exists:', !!key)
    console.error('  URL value:', url ? `${url.substring(0, 30)}...` : 'missing')
    
    if (typeof window !== 'undefined') {
      console.error('⚠️  Using mock client. This will not work for authentication.')
      console.error('⚠️  Please check your environment variables in Vercel/production settings.')
    }
    
    cachedClient = mockSupabaseClient as any
    return cachedClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  console.log('✅ Creating Supabase client with URL:', url)
  
  // Create and cache the client
  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
    
    // Test the connection by checking if we can reach the URL
    if (typeof window !== 'undefined') {
      // Add a test to verify the URL is reachable
      fetch(`${url}/rest/v1/`, { 
        method: 'HEAD',
        mode: 'no-cors' 
      }).catch((error) => {
        console.error('❌ Supabase URL appears unreachable:', error)
        console.error('   This could mean:')
        console.error('   1. The Supabase project is paused or deleted')
        console.error('   2. The URL is incorrect')
        console.error('   3. There is a network/DNS issue')
        console.error('   Please verify your Supabase project is active and the URL is correct.')
      })
    }
    
    return cachedClient
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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
