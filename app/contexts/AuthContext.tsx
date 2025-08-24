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
    
    console.log('🔍 Setting up Supabase authentication...')
    
    // Set up auth state change listener - this is all we need
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('🔍 Auth state change:', event, { userId: session?.user?.id, email: session?.user?.email })
        
        try {
          setSession(session)
          setUser(session?.user ?? null)
          
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('✅ User signed in, fetching profile...')
            // Don't await here - let profile creation happen independently
            fetchProfile(session.user.id, session.user).catch(error => {
              console.error('❌ Profile fetch error in auth state change:', error)
            })
          } else if (event === 'SIGNED_OUT') {
            console.log('ℹ️  User signed out, clearing profile...')
            setProfile(null)
          }
          
          setLoading(false)
        } catch (error) {
          console.error('❌ Error in auth state change:', error)
          setLoading(false)
        }
      }
    )

    // Set loading to false immediately since we're not waiting for anything
    setLoading(false)

    return () => {
      console.log('🔍 Cleaning up auth subscription...')
      subscription.unsubscribe()
    }
  }, [supabase])

  const fetchProfile = async (userId: string, userData?: any) => {
    if (!supabase) return
    
    console.log('🔍 fetchProfile called for user ID:', userId)
    console.log('🔍 User data passed to fetchProfile:', userData)
    
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
      const directFetchUrl = `${supabase.supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=*`
      console.log('🔍 Direct fetch URL:', directFetchUrl)
      console.log('🔍 Supabase config:', { url: supabase.supabaseUrl, key: supabase.supabaseKey?.substring(0, 20) + '...' })
      
      try {
        const response = await fetch(directFetchUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabase.supabaseKey,
            'Authorization': `Bearer ${supabase.supabaseKey}`
          }
        })

        if (response.ok) {
          const profileData = await response.json()
          console.log('🔍 Direct fetch response:', { status: response.status, profileData, length: profileData?.length })
          
          if (profileData && profileData.length > 0) {
            console.log('✅ Direct fetch profile successful')
            await processProfileData(profileData[0], userId)
            return
          } else {
            console.log('❌ Direct fetch returned empty data:', { profileData, length: profileData?.length })
          }
        }
        
        console.log('❌ Direct fetch profile failed:', response.status, response.statusText)
      } catch (directError) {
        console.error('❌ Direct fetch profile error:', directError)
      }

      console.error('❌ All profile fetch methods failed')
      
      // If we get here, no profile exists - let's create one
      console.log('🔍 No profile found, attempting to create one...')
      
      // Use passed userData if available, otherwise fall back to current user state
      const userToUse = userData || user
      console.log('🔍 User data for profile creation:', { 
        passedUserData: userData, 
        currentUserState: user, 
        userToUse 
      })
      
      try {
        if (userToUse) {
          // Try to extract a better name from the email
          const emailName = userToUse.email?.split('@')[0] || 'Golfer'
          const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1)
          
          const profileData = {
            id: userId,
            email: userToUse.email,
            first_name: userToUse.user_metadata?.first_name || displayName,
            last_name: userToUse.user_metadata?.last_name || '',
            username: userToUse.user_metadata?.username || emailName.toLowerCase(),
            full_name: userToUse.user_metadata?.full_name || displayName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          console.log('🔍 Attempting to create profile with data:', profileData)
          
          try {
            const { data: insertResult, error: createError } = await supabase
              .from('user_profiles')
              .insert([profileData])
              .select()
            
            console.log('🔍 Profile creation result:', { insertResult, createError })
            
            if (createError) {
              console.error('❌ Profile creation failed:', createError)
              console.error('❌ Error details:', { 
                code: createError.code, 
                message: createError.message, 
                details: createError.details,
                hint: createError.hint 
              })
              return
            }
            
            console.log('✅ Profile created successfully:', insertResult)
          } catch (insertError) {
            console.error('❌ Exception during profile creation:', insertError)
            return
          }
          
          // Try to fetch the newly created profile
          console.log('✅ Profile created successfully, fetching again...')
          const { data: newProfileData, error: fetchError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()
          
          console.log('🔍 Profile fetch after creation:', { newProfileData, fetchError })
          
          if (!fetchError && newProfileData) {
            console.log('✅ New profile fetched successfully')
            await processProfileData(newProfileData, userId)
            return
          } else {
            console.error('❌ Failed to fetch newly created profile:', fetchError)
          }
        } else {
          console.error('❌ No user data available for profile creation')
        }
      } catch (createProfileError) {
        console.error('❌ Error in profile creation fallback:', createProfileError)
        if (createProfileError instanceof Error) {
          console.error('❌ Error stack:', createProfileError.stack)
        }
      }
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
      
      console.log('🔍 Attempting Supabase client sign-in...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('❌ Supabase sign-in error:', error)
        throw error
      }
      
      if (data?.user && data?.session) {
        console.log('✅ Supabase sign-in successful')
        console.log('🔍 User data:', { userId: data.user.id, email: data.user.email })
        console.log('🔍 Session data:', { accessToken: !!data.session.access_token, refreshToken: !!data.session.refresh_token })
        
        // Set user and session (this will trigger onAuthStateChange)
        setUser(data.user)
        setSession(data.session)
        
        // Profile will be fetched via onAuthStateChange
        return
      } else {
        throw new Error('No user or session data received from Supabase')
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
