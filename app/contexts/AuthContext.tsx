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
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 5000) // 5 second timeout

    // Try to restore session from localStorage first
    const restoreFromLocalStorage = () => {
      try {
        const storedSession = localStorage.getItem('supabase.auth.token')
        const storedUser = localStorage.getItem('supabase.auth.user')
        
        if (storedSession && storedUser) {
          console.log('🔍 Restoring session from localStorage...')
          const session = JSON.parse(storedSession)
          const user = JSON.parse(storedUser)
          
          console.log('🔍 Restored user object:', user)
          console.log('🔍 User ID from localStorage:', user.id)
          console.log('🔍 User email from localStorage:', user.email)
          
          setSession(session)
          setUser(user)
          
          // Fetch profile for restored user
          if (user.id) {
            console.log('🔍 Fetching profile for restored user ID:', user.id)
            fetchProfile(user.id)
          } else {
            console.error('❌ Restored user has no ID:', user)
          }
          
          console.log('✅ Session restored from localStorage')
          setLoading(false)
          clearTimeout(timeoutId)
          return true // Session restored successfully
        }
      } catch (restoreError) {
        console.error('❌ Error restoring session:', restoreError)
        // Clear invalid stored data
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('supabase.auth.user')
      }
      return false // No session restored
    }

    // Try localStorage first, then Supabase auth
    const sessionRestored = restoreFromLocalStorage()
    
    if (!sessionRestored) {
      // Only try Supabase auth if no localStorage session
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
    }

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
    
    console.log('🔍 fetchProfile called for user ID:', userId)
    
    try {
      // Try Supabase client first with timeout
      console.log('🔍 Trying Supabase client profile fetch...')
      try {
        const profilePromise = supabase
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

        const profileTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Supabase profile fetch timed out after 8 seconds')), 8000)
        })

        const { data: profileData, error: profileError } = await Promise.race([profilePromise, profileTimeout]) as any

        if (profileError) {
          console.log('❌ Supabase profile fetch error:', profileError)
          throw profileError
        }

        if (profileData) {
          console.log('✅ Supabase profile fetch successful')
          await processProfileData(profileData, userId)
          return
        }
      } catch (supabaseError) {
        console.log('🔍 Supabase profile fetch failed or timed out, trying direct fetch...')
      }

      // Fallback to direct fetch
      console.log('🔍 Trying direct fetch profile...')
      try {
        const response = await fetch(`${supabase.supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=*`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`
          }
        })

        if (response.ok) {
          const profileData = await response.json()
          if (profileData && profileData.length > 0) {
            console.log('✅ Direct fetch profile successful')
            await processProfileData(profileData[0], userId)
            return
          }
        }
        
        console.log('❌ Direct fetch profile failed:', response.status, response.statusText)
      } catch (directError) {
        console.error('❌ Direct fetch profile error:', directError)
      }

      console.error('❌ All profile fetch methods failed')
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error)
    }
  }

  const processProfileData = async (profileData: any, userId: string) => {
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
    
    // Check if user should get the Founding Member badge
    await checkFoundingMemberBadge(userId)
  }

  const checkFoundingMemberBadge = async (userId: string) => {
    if (!supabase) return
    
    try {
      // Check if user already has the Founding Member badge
      const { data: existingBadge, error: badgeError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', (await supabase.from('badges').select('id').eq('name', 'Founding Member').single()).data?.id)
        .single()

      if (badgeError && badgeError.code !== 'PGRST116') {
        console.error('Error checking Founding Member badge:', badgeError)
        return
      }

      // If user doesn't have the badge, check if they're within the first 50 users
      if (!existingBadge) {
        const { count: userCount, error: countError } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })

        if (countError) {
          console.error('Error counting users:', countError)
          return
        }

        // If user is within first 50, award the badge
        if (userCount && userCount <= 50) {
          const { data: badgeData, error: badgeInsertError } = await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: (await supabase.from('badges').select('id').eq('name', 'Founding Member').single()).data?.id,
              earned_reason: 'One of the first 50 founding members!'
            })
            .select()
            .single()

          if (badgeInsertError) {
            console.error('Error awarding Founding Member badge:', badgeInsertError)
          } else {
            console.log('🎉 Founding Member badge awarded!')
            // Refresh profile to show the new badge
            await fetchProfile(userId)
          }
        }
      }
    } catch (error) {
      console.error('Error in checkFoundingMemberBadge:', error)
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
      
      // Try Supabase client first with timeout
      console.log('🔍 Trying Supabase client sign-in first...')
      try {
        const supabasePromise = supabase.auth.signInWithPassword({
          email,
          password
        })
        
        const supabaseTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Supabase client sign-in timed out after 8 seconds')), 8000)
        })
        
        const { data, error } = await Promise.race([supabasePromise, supabaseTimeout]) as any
        
        if (error) {
          console.log('❌ Supabase client sign-in failed:', error)
          throw error
        }
        
        if (data?.user && data?.session) {
          console.log('✅ Supabase client sign-in successful')
          setUser(data.user)
          setSession(data.session)
          
          // Fetch profile
          if (data.user.id) {
            await fetchProfile(data.user.id)
          }
          
          return
        }
      } catch (supabaseError) {
        console.log('🔍 Supabase client sign-in failed or timed out, trying direct fetch...')
      }
      
      // Fallback to direct fetch
      console.log('🔍 Testing direct fetch for sign-in...')
      console.log('🔍 Using Supabase key:', supabase.supabaseKey ? 'Key exists' : 'No key')
      
      try {
        console.log('🔍 About to make direct fetch request...')
        const fetchPromise = fetch('https://xnuokgscavnytpqxlurg.supabase.co/auth/v1/token?grant_type=password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`
          },
          body: JSON.stringify({
            email,
            password
          })
        })
        
        console.log('🔍 Fetch request sent, waiting for response...')
        
        // Add timeout to direct fetch
        const fetchTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Direct fetch sign-in timed out after 15 seconds')), 15000)
        })
        
        console.log('🔍 Racing fetch vs timeout...')
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
              } catch (profileOuterError) {
                console.error('❌ Outer profile fetch error:', profileOuterError)
                // Don't fail the sign-in if profile fetch fails
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
    console.log('🔍 🔍 🔍 AuthContext signOut function called!')
    console.log('🔍 signOut called, supabase exists:', !!supabase)
    console.log('🔍 Current user state:', { user: !!user, userId: user?.id, email: user?.email })
    
    try {
      // Clear localStorage session data first
      if (typeof window !== 'undefined') {
        console.log('🔍 Clearing localStorage session data...')
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('supabase.auth.user')
        console.log('✅ localStorage cleared')
      }
      
      // Try Supabase auth.signOut() if available with timeout
      if (supabase) {
        try {
          console.log('🔍 Calling Supabase auth.signOut() with timeout...')
          
          // Create a timeout promise for Supabase signOut
          const signOutPromise = supabase.auth.signOut()
          const signOutTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Supabase signOut timed out after 5 seconds')), 5000)
          })
          
          // Race between signOut and timeout
          const { error } = await Promise.race([signOutPromise, signOutTimeout]) as any
          
          if (error) {
            console.error('❌ Supabase signOut error:', error)
            // Don't throw here - we still want to clear local state
          } else {
            console.log('✅ Supabase signOut successful')
          }
        } catch (supabaseError) {
          console.error('❌ Supabase signOut error or timeout:', supabaseError)
          // Don't throw here - we still want to clear local state
        }
      }
      
      // Always clear local state regardless of Supabase result
      console.log('🔍 Clearing local state...')
      setUser(null)
      setSession(null)
      setProfile(null)
      console.log('✅ Local state cleared successfully')
      
      console.log('✅ Sign out completed successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      // Even if there's an error, try to clear local state
      setUser(null)
      setSession(null)
      setProfile(null)
      throw error
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    console.log('🔍 updateProfile called with:', { updates, hasSupabase: !!supabase, hasUser: !!user, userId: user?.id })
    
    if (!supabase || !user) {
      console.error('❌ updateProfile: Missing supabase or user')
      throw new Error('Missing supabase client or user')
    }
    
    if (!user.id) {
      console.error('❌ updateProfile: User ID is undefined')
      throw new Error('User ID is undefined')
    }
    
    try {
      console.log('🔍 Updating profile for user ID:', user.id)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()

      if (error) {
        console.error('❌ Supabase update error:', error)
        throw error
      }

      console.log('✅ Profile updated in database:', data)

      // Update local profile state
      if (profile) {
        const updatedProfile = { ...profile, ...updates }
        console.log('🔍 Updating local profile state:', updatedProfile)
        setProfile(updatedProfile)
      }
      
      console.log('✅ Profile update completed successfully')
    } catch (error) {
      console.error('❌ Update profile error:', error)
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
