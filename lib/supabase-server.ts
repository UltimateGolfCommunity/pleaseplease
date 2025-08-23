import { createServerClient as createServerClientSSR } from '@supabase/ssr'

export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createServerClientSSR(supabaseUrl, supabaseKey, {
    cookies: {
      get: () => '',
      set: () => {},
      remove: () => {},
    },
  })
}
