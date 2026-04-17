import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { apiGet } from '@/lib/api'
import { mobileSupabase } from '@/lib/supabase'
import { markMobileBootHealthy, prepareMobileBoot } from '@/lib/startupRecovery'

type MobileProfile = {
  id: string
  first_name?: string | null
  last_name?: string | null
  full_name?: string | null
  username?: string | null
  email?: string | null
  avatar_url?: string | null
  header_image_url?: string | null
  bio?: string | null
  handicap?: number | null
  home_course?: string | null
  home_club?: string | null
  location?: string | null
  years_playing?: number | null
  favorite_course?: string | null
  playing_style?: string | null
  goals?: string | null
  experience_level?: string | null
  bag_items?: Record<string, string | null> | null
}

type AuthContextValue = {
  user: User | null
  session: Session | null
  profile: MobileProfile | null
  loading: boolean
  authBusy: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => Promise<void>
  signOut: () => Promise<void>
  syncAuthSession: () => Promise<void>
  refreshProfile: (userId?: string) => Promise<void>
  updateProfile: (updates: Record<string, unknown>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(userId: string) {
  try {
    const profile = await apiGet<MobileProfile>(`/api/profile?userId=${encodeURIComponent(userId)}`)
    return profile || null
  } catch {
    const { data, error } = await mobileSupabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      throw error
    }

    return (data || null) as MobileProfile | null
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<MobileProfile | null>(null)
  const loading = false
  const [authBusy, setAuthBusy] = useState(false)
  const userRef = useRef<User | null>(null)

  useEffect(() => {
    userRef.current = user
  }, [user])

  const refreshProfile = useCallback(async (explicitUserId?: string) => {
    const userId = explicitUserId || userRef.current?.id
    if (!userId) return

    try {
      const nextProfile = await fetchProfile(userId)
      setProfile(nextProfile)
    } catch (error) {
      console.warn('Unable to refresh profile in mobile app:', error)
    }
  }, [])

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession)
    setUser(nextSession?.user ?? null)

    if (nextSession?.user?.id) {
      void refreshProfile(nextSession.user.id)
    } else {
      setProfile(null)
    }
  }, [refreshProfile])

  useEffect(() => {
    let mounted = true
    let allowAuthEvents = false

    const bootstrap = async () => {
      try {
        const { recoveredFromPreviousCrash } = await prepareMobileBoot()
        if (!mounted) return

        if (recoveredFromPreviousCrash) {
          setSession(null)
          setUser(null)
          setProfile(null)
          return
        }

        // Let the first React frame render before touching persisted auth state.
        await new Promise((resolve) => setTimeout(resolve, 900))
        if (!mounted) return
        allowAuthEvents = true

        const {
          data: { session: existingSession }
        } = await mobileSupabase.auth.getSession()

        if (!mounted) return

        applySession(existingSession)
      } catch (error) {
        console.warn('Unable to restore mobile auth session:', error)
        if (!mounted) return
        setSession(null)
        setUser(null)
        setProfile(null)
      }
    }

    bootstrap()

    const {
      data: { subscription }
    } = mobileSupabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      if (!allowAuthEvents) return

      applySession(nextSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [applySession])

  useEffect(() => {
    const timer = setTimeout(() => {
      void markMobileBootHealthy()
    }, 6000)

    return () => clearTimeout(timer)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthBusy(true)
    try {
      const { data, error } = await mobileSupabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        throw error
      }

      applySession(data.session)
    } finally {
      setAuthBusy(false)
    }
  }, [applySession])

  const signUp = useCallback(async ({
    firstName,
    lastName,
    email,
    password
  }: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => {
    setAuthBusy(true)

    try {
      const { data, error } = await mobileSupabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim()
          }
        }
      })

      if (error) {
        throw error
      }

      applySession(data.session)

      if (data.user?.id) {
        const fallbackUsername =
          email.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 18) || `ugc_${Date.now()}`

        await mobileSupabase.from('user_profiles').upsert({
          id: data.user.id,
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          username: fallbackUsername
        })
      }
    } finally {
      setAuthBusy(false)
    }
  }, [applySession])

  const signOut = useCallback(async () => {
    setAuthBusy(true)
    try {
      const { error } = await mobileSupabase.auth.signOut()
      if (error) {
        throw error
      }

      applySession(null)
    } finally {
      setAuthBusy(false)
    }
  }, [applySession])

  const syncAuthSession = useCallback(async () => {
    const {
      data: { session: nextSession }
    } = await mobileSupabase.auth.getSession()

    applySession(nextSession)
  }, [applySession])

  const updateProfile = useCallback(async (updates: Record<string, unknown>) => {
    if (!user?.id) {
      throw new Error('You need to be signed in to update your profile.')
    }

    const { home_course, ...restUpdates } = updates
    const normalizedUpdates = {
      ...restUpdates,
      ...(home_course !== undefined
        ? {
            home_course,
            home_club: home_course
          }
        : {})
    }

    try {
      const response = await fetch(
        `${(process.env.EXPO_PUBLIC_SITE_URL || 'https://www.ultimategolfcommunity.com').replace(/\/$/, '')}/api/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            ...normalizedUpdates
          })
        }
      )

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || payload?.details || 'Unable to update profile.')
      }
    } catch (apiError) {
      const { error } = await mobileSupabase
        .from('user_profiles')
        .update({
          ...normalizedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        throw apiError instanceof Error ? apiError : error
      }
    }

    await refreshProfile(user.id)
  }, [refreshProfile, user?.email, user?.id])

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      authBusy,
      signIn,
      signUp,
      signOut,
      syncAuthSession,
      refreshProfile,
      updateProfile
    }),
    [user, session, profile, loading, authBusy, signIn, signUp, signOut, syncAuthSession, refreshProfile, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
