'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
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

  // Initialize Supabase client once
  useEffect(() => {
    if (typeof window !== 'undefined' && !supabase) {
      const client = createBrowserClient()
      setSupabase(client)
    }
  }, [supabase])

  // Memoized profile processing to avoid unnecessary recalculations
  const processProfileData = useCallback(async (profileData: any, userId: string) => {
    const enhancedProfile: UserProfile = {
      ...profileData,
      connections_count: 0,
      tee_times_count: 0,
      groups_count: 0,
      tee_times: [],
      groups: [],
      group_messages: [],
      current_group: null,
      group_activity: []
    }

    setProfile(enhancedProfile)
    
    // Check for Founding Member badge
    await checkFoundingMemberBadge(userId)
  }, [])

  // Optimized badge checking with early returns
  const checkFoundingMemberBadge = useCallback(async (userId: string) => {
    if (!supabase) return
    
    try {
      const { data: foundingMemberBadge, error: badgeQueryError } = await supabase
        .from('badges')
        .select('id')
        .eq('name', 'Founding Member')
        .single()

      if (badgeQueryError?.code === 'PGRST116') {
        return // Badge doesn't exist, skip
      }

      if (!foundingMemberBadge?.id) return

      // Check if user already has the badge
      const { data: existingBadge, error: badgeError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .eq('badge_id', foundingMemberBadge.id)
        .single()

      if (existingBadge) return // Already has badge

      // Check if within first 50 users
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      if (userCount && userCount <= 50) {
        await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_id: foundingMemberBadge.id,
            earned_reason: 'One of the first 50 founding members!'
          })
      }
    } catch (error) {
      // Silently fail badge operations
    }
  }, [supabase])

  // Optimized profile fetching with better error handling
  const fetchProfile = useCallback(async (userId: string, userData?: any) => {
    if (!supabase) return
    
    try {
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
        // Try simple fetch as fallback
        const { data: simpleProfile, error: simpleError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (simpleError) {
          // Wait for database trigger and retry once
          await new Promise(resolve => setTimeout(resolve, 2000))
          const { data: retryProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (retryProfile) {
            await processProfileData(retryProfile, userId)
          }
          return
        }

        if (simpleProfile) {
          await processProfileData(simpleProfile, userId)
        }
        return
      }

      if (profileData) {
        await processProfileData(profileData, userId)
      }
    } catch (error) {
      // Handle silently - profile will be created by trigger
    }
  }, [supabase, processProfileData])

  // Optimized auth state change handler
  useEffect(() => {
    if (!supabase) return
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (event === 'SIGNED_IN' && session?.user) {
          fetchProfile(session.user.id, session.user)
        } else if (event === 'SIGNED_OUT') {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    setLoading(false)

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  // Memoized auth functions to prevent unnecessary re-renders
  const signUp = useCallback(async (email: string, password: string, profileData: Partial<UserProfile>) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: profileData }
      })
      
      if (error) throw error

      if (data?.user) {
        setUser(data.user)
        if (data.session) {
          setSession(data.session)
        }
      }
    } catch (error) {
      throw error
    }
  }, [supabase])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase client not initialized')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error

      if (data?.user && data?.session) {
        setUser(data.user)
        setSession(data.session)
      } else {
        throw new Error('No user or session data received')
      }
    } catch (error) {
      throw error
    }
  }, [supabase])

  const signOut = useCallback(async () => {
    if (!supabase) return
    
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setProfile(null)
    } catch (error) {
      // Clear state even if Supabase call fails
      setUser(null)
      setSession(null)
      setProfile(null)
    }
  }, [supabase])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!supabase || !user?.id) {
      throw new Error('Missing supabase client or user')
    }
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()

      if (error) throw new Error(`Database update failed: ${error.message}`)

      // Update local profile state
      if (profile) {
        setProfile({ ...profile, ...updates })
      }
    } catch (error) {
      throw error
    }
  }, [supabase, user?.id, profile])

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  }), [user, session, profile, loading, signUp, signIn, signOut, updateProfile])

  return (
    <AuthContext.Provider value={contextValue}>
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
