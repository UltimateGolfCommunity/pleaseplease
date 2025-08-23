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
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: profileData
        }
      })

      if (error) {
        console.error('❌ Supabase auth.signUp error:', error)
        throw error
      }

      console.log('✅ User created successfully:', data.user?.id)

      if (data.user) {
        console.log('🔍 Creating user profile for user ID:', data.user.id)
        
        // Create user profile
        const { error: profileError } = await supabase
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

        if (profileError) {
          console.error('❌ Error creating profile:', profileError)
          // Don't throw here - user was created successfully
        } else {
          console.log('✅ User profile created successfully')
        }
      }
      
      console.log('✅ SignUp process completed successfully')
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
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
    } catch (error) {
      console.error('Sign in error:', error)
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
