'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createBrowserClient } from '@/lib/supabase'
import { UserProfile } from '@/lib/database.types'

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, profileData: Partial<UserProfile>) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    // Only create client on the client side
    if (typeof window !== 'undefined') {
      const client = createBrowserClient()
      console.log('🔍 AuthContext: Creating Supabase client:', client)
      setSupabase(client)
      
      // Try to restore session from localStorage
      try {
        const storedSession = localStorage.getItem('supabase.auth.token')
        const storedUser = localStorage.getItem('supabase.auth.user')
        
        if (storedSession && storedUser) {
          console.log('🔍 Restoring session from localStorage...')
          const session = JSON.parse(storedSession)
          const user = JSON.parse(storedUser)
          
          setSession(session)
          setUser(user)
          
          // Fetch profile for restored user
          if (user.id) {
            fetchProfile(user.id)
          }
          
          console.log('✅ Session restored from localStorage')
        }
      } catch (restoreError) {
        console.error('❌ Error restoring session:', restoreError)
        // Clear invalid stored data
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('supabase.auth.user')
      }
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 5000) // 5 second timeout

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
        
        setLoading(false)
        clearTimeout(timeoutId)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
          
          setLoading(false)
          clearTimeout(timeoutId)
        } catch (error) {
          console.error('Error in auth state change:', error)
          setLoading(false)
          clearTimeout(timeoutId)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeoutId)
    }
  }, [supabase])

  const fetchProfile = async (userId: string) => {
    if (!supabase) return
    
    try {
      // Fetch user profile with related data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          badges:user_badges(
            badge_id,
            earned_at,
            earned_reason,
            badge:badges(*)
          ),
          achievements:user_achievements(*)
        `)
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        return
      }

      if (profileData) {
        // Calculate additional stats
        const connectionsCount = 0 // Mock value for now
        const teeTimesCount = 0 // Mock value for now
        const groupsCount = 0 // Mock value for now

        const enhancedProfile: UserProfile = {
          ...profileData,
          connections_count: connectionsCount,
          tee_times_count: teeTimesCount,
          groups_count: groupsCount,
          tee_times: [],
          groups: [],
          group_messages: [],
          current_group: null,
          group_activity: []
        }

        setProfile(enhancedProfile)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    }
  }

  const signUp = async (email: string, password: string, profileData: Partial<UserProfile>) => {
    if (!supabase) {
      console.error('❌ No Supabase client available for signUp')
      throw new Error('Supabase client not initialized')
    }
    
    try {
      console.log('🔍 Starting signUp process for:', email)
      console.log('🔍 Supabase client available:', !!supabase)
      console.log('🔍 Supabase auth methods:', Object.keys(supabase.auth || {}))
      
            console.log('🔍 About to call supabase.auth.signUp...')
      console.log('🔍 Request details:', { email, passwordLength: password.length, profileData })
      
      // Try direct fetch first to test connection
      console.log('🔍 Testing direct fetch to Supabase...')
      
      let data: any, error: any
      
      try {
        const testResponse = await fetch('https://xnuokgscavnytpqxlurg.supabase.co/auth/v1/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({
            email,
            password,
            data: profileData
          })
        })
        
        console.log('🔍 Direct fetch response:', testResponse.status, testResponse.statusText)
        
        if (testResponse.ok) {
          const testData = await testResponse.json()
          console.log('🔍 Direct fetch data:', testData)
          
          // If direct fetch works, use the data
          data = testData
          error = null
        } else {
          console.log('🔍 Direct fetch failed, trying Supabase client...')
          throw new Error('Direct fetch failed')
        }
      } catch (fetchError) {
        console.log('🔍 Direct fetch error, falling back to Supabase client:', fetchError)
        
        // Fallback to Supabase client
        const signUpPromise = supabase.auth.signUp({
          email,
          password,
          options: {
            data: profileData
          }
        })
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SignUp request timed out after 30 seconds')), 30000)
        })
        
        // Race between signUp and timeout
        console.log('🔍 Waiting for Supabase client response...')
        
        try {
          const result = await Promise.race([signUpPromise, timeoutPromise]) as any
          console.log('🔍 Supabase client response received:', { data: !!result.data, error: !!result.error })
          console.log('🔍 Full response:', result)
          
          data = result.data
          error = result.error
        } catch (timeoutError) {
          console.error('❌ Supabase client timeout or error:', timeoutError)
          throw timeoutError
        }
      }
      
      if (error) {
        console.error('❌ Supabase auth.signUp error:', error)
        throw error
      }

      console.log('✅ User created successfully:', data.user?.id)

      if (data.user) {
        console.log('🔍 Creating user profile for user ID:', data.user.id)
        
        try {
          // Create user profile with timeout
          const profilePromise = supabase
            .from('user_profiles')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                username: profileData.username,
                full_name: profileData.full_name || `${profileData.first_name} ${profileData.last_name}`.trim(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ])
          
          // Add timeout to profile creation
          const profileTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Profile creation timed out after 15 seconds')), 15000)
          })
          
          const { error: profileError } = await Promise.race([profilePromise, profileTimeout]) as any
          
          if (profileError) {
            console.error('❌ Error creating profile:', profileError)
            // Don't throw here - user was created successfully
          } else {
            console.log('✅ User profile created successfully')
          }
        } catch (profileTimeoutError) {
          console.error('❌ Profile creation timed out:', profileTimeoutError)
          // Don't fail the sign-up if profile creation times out
        }
      }
      
      // Always complete sign-up successfully, even if profile creation fails
      console.log('✅ SignUp process completed successfully')
      
      // Set user session immediately after successful sign-up
      if (data.user) {
        console.log('🔍 Setting user session after sign-up...')
        setUser(data.user)
        
        // Create a basic session object
        const signUpSession = {
          access_token: data.session?.access_token || 'temp-token',
          refresh_token: data.session?.refresh_token || 'temp-refresh',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: data.user
        }
        
        setSession(signUpSession as any)
        console.log('✅ User session established after sign-up')
      }
    } catch (error) {
      console.error('❌ Sign up error:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔍 signIn called with:', { email, supabaseExists: !!supabase })
    
    if (!supabase) {
      console.error('❌ No Supabase client available')
      throw new Error('Supabase client not initialized')
    }
    
    try {
      console.log('🔍 Supabase client methods:', Object.keys(supabase))
      console.log('🔍 Auth methods:', Object.keys(supabase.auth || {}))
      
      console.log('🔍 Testing direct fetch for sign-in...')
      
      // Try direct fetch first to bypass hanging issue
      try {
        const fetchPromise = fetch('https://xnuokgscavnytpqxlurg.supabase.co/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
          },
          body: JSON.stringify({
            email,
            password
          })
        })
        
        // Add timeout to direct fetch
        const fetchTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Direct fetch sign-in timed out after 15 seconds')), 15000)
        })
        
        const signInResponse = await Promise.race([fetchPromise, fetchTimeout]) as Response
        
        console.log('🔍 Direct fetch sign-in response:', signInResponse.status, signInResponse.statusText)
        
        if (signInResponse.ok) {
          const signInData = await signInResponse.json()
          console.log('🔍 Direct fetch sign-in data:', signInData)
          
          // If direct fetch works, manually set the session
          if (signInData.user && signInData.access_token) {
            console.log('🔍 Setting user session manually...')
            
            // Create a mock session object that matches Supabase's format
            const mockSession = {
              access_token: signInData.access_token,
              refresh_token: signInData.refresh_token,
              expires_in: signInData.expires_in,
              expires_at: signInData.expires_at,
              token_type: signInData.token_type,
              user: signInData.user
            }
            
            // Update the local state
            setUser(signInData.user)
            setSession(mockSession as any)
            
            // Persist session to localStorage
            try {
              localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession))
              localStorage.setItem('supabase.auth.user', JSON.stringify(signInData.user))
              console.log('🔍 Session persisted to localStorage')
            } catch (storageError) {
              console.error('❌ Error persisting session:', storageError)
            }
            
            // Try to fetch the user profile
            if (signInData.user.id) {
              console.log('🔍 Fetching profile for user ID:', signInData.user.id)
              try {
                // Add timeout to profile fetching
                const profilePromise = fetchProfile(signInData.user.id)
                const profileTimeout = new Promise((_, reject) => {
                  setTimeout(() => reject(new Error('Profile fetch timed out after 15 seconds')), 15000)
                })
                
                try {
                  await Promise.race([profilePromise, profileTimeout])
                  console.log('✅ Profile fetched successfully')
                } catch (profileError) {
                  console.error('❌ Profile fetch timed out or failed:', profileError)
                  // Don't fail the sign-in if profile fetch fails
                }
              }
              
              console.log('✅ Sign in successful via direct fetch, session established')
              return
            } else {
              console.log('🔍 Direct fetch sign-in failed, trying Supabase client...')
              throw new Error('Direct fetch sign-in failed - no user data')
            }
          } else {
            console.log('🔍 Direct fetch sign-in failed, trying Supabase client...')
            throw new Error('Direct fetch sign-in failed - no user data')
          }
        } else {
          console.log('🔍 Direct fetch sign-in failed, trying Supabase client...')
          throw new Error('Direct fetch sign-in failed')
        }
      } catch (fetchError) {
        console.log('🔍 Direct fetch sign-in error, falling back to Supabase client:', fetchError)
        
        // Fallback to Supabase client with timeout
        const signInPromise = supabase.auth.signInWithPassword({
          email,
          password
        })
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('SignIn request timed out after 30 seconds')), 30000)
        })
        
        // Race between signIn and timeout
        console.log('🔍 Waiting for Supabase client sign-in response...')
        
        const { error } = await Promise.race([signInPromise, timeoutPromise]) as any
        
        if (error) throw error
        console.log('✅ Sign in successful via Supabase client')
      }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    console.log('🔍 signOut called, supabase exists:', !!supabase)
    
    if (!supabase) {
      console.error('❌ No Supabase client available for signOut')
      return
    }
    
    try {
      console.log('🔍 Calling Supabase auth.signOut()...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Supabase signOut error:', error)
        throw error
      }
      
      console.log('✅ Supabase signOut successful, clearing local state...')
      setUser(null)
      setSession(null)
      setProfile(null)
      console.log('✅ Local state cleared successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase || !user) return
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      // Update local profile state
      if (profile) {
        setProfile({ ...profile, ...updates })
      }
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
