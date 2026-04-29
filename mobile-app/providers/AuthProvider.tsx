import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { apiGet } from '@/lib/api'
import { mobileSupabase } from '@/lib/supabase'
import { markMobileBootHealthy, prepareMobileBoot } from '@/lib/startupRecovery'

type NotificationsModule = typeof import('expo-notifications')

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
  ace_details?: {
    course?: string | null
    date?: string | null
    hole?: string | null
  } | null
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
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  syncAuthSession: () => Promise<void>
  refreshProfile: (userId?: string) => Promise<void>
  updateProfile: (updates: Record<string, unknown>) => Promise<void>
}

const optionalProfileColumns = [
  'home_course',
  'home_club',
  'bag_items',
  'header_image_url',
  'avatar_url',
  'handicap',
  'location',
  'ace_details'
]

function getMissingProfileColumn(error: unknown) {
  const source = error as { message?: string; details?: string }
  const message = `${source?.message || ''} ${source?.details || ''}`.toLowerCase()

  return optionalProfileColumns.find((column) =>
    message.includes(column.toLowerCase()) &&
    (message.includes('column') || message.includes('schema cache') || message.includes('could not find'))
  )
}

function buildProfileUpdateAttempts(updates: Record<string, unknown>) {
  const attempts: Record<string, unknown>[] = [updates]
  const hasHomeCourse = Object.prototype.hasOwnProperty.call(updates, 'home_course')
  const hasHomeClub = Object.prototype.hasOwnProperty.call(updates, 'home_club')

  if (hasHomeCourse || hasHomeClub) {
    const withoutHomeCourse = { ...updates }
    delete withoutHomeCourse.home_course
    attempts.push(withoutHomeCourse)

    const withoutHomeClub = { ...updates }
    delete withoutHomeClub.home_club
    attempts.push(withoutHomeClub)

    const withoutEitherHomeField = { ...updates }
    delete withoutEitherHomeField.home_course
    delete withoutEitherHomeField.home_club
    attempts.push(withoutEitherHomeField)
  }

  attempts.push(
    Object.fromEntries(
      Object.entries(updates).filter(([key]) => !optionalProfileColumns.includes(key))
    )
  )

  const seen = new Set<string>()

  return attempts.filter((attempt) => {
    const key = JSON.stringify(Object.keys(attempt).sort())
    if (seen.has(key)) return false
    seen.add(key)
    return Object.keys(attempt).some((field) => field !== 'updated_at')
  })
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

let notificationsModule: NotificationsModule | null = null

try {
  notificationsModule = require('expo-notifications') as NotificationsModule
} catch (error) {
  console.warn('expo-notifications native module is unavailable in this build:', error)
}

notificationsModule?.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
})

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
  const pushTokenRef = useRef<string | null>(null)
  const pushRegistrationAttemptedRef = useRef<string | null>(null)

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

  const registerPushNotifications = useCallback(async (userId: string) => {
    if (!userId) return
    if (pushRegistrationAttemptedRef.current === userId) return
    pushRegistrationAttemptedRef.current = userId
    if (!notificationsModule) return

    try {
      const existingPermissions = await notificationsModule.getPermissionsAsync()
      let finalStatus = existingPermissions.status

      if (finalStatus !== 'granted') {
        const requested = await notificationsModule.requestPermissionsAsync()
        finalStatus = requested.status
      }

      if (finalStatus !== 'granted') {
        return
      }

      if (Platform.OS === 'android') {
        await notificationsModule.setNotificationChannelAsync('default', {
          name: 'default',
          importance: notificationsModule.AndroidImportance.DEFAULT
        })
      }

      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId

      if (!projectId) {
        return
      }

      const tokenResponse = await notificationsModule.getExpoPushTokenAsync({ projectId })
      const expoPushToken = tokenResponse.data

      if (!expoPushToken || expoPushToken === pushTokenRef.current) {
        return
      }

      pushTokenRef.current = expoPushToken

      await fetch(
        `${(process.env.EXPO_PUBLIC_SITE_URL || 'https://www.ultimategolfcommunity.com').replace(/\/$/, '')}/api/notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'register_push_token',
            user_id: userId,
            expo_push_token: expoPushToken
          })
        }
      )
    } catch (error) {
      console.warn('Unable to register push notifications in mobile app:', error)
    }
  }, [])

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

  useEffect(() => {
    if (!user?.id) return
    void registerPushNotifications(user.id)
  }, [registerPushNotifications, user?.id])

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
          emailRedirectTo: `${process.env.EXPO_PUBLIC_SITE_URL || 'https://www.ultimategolfcommunity.com'}/login`,
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

  const resetPassword = useCallback(async (email: string) => {
    setAuthBusy(true)
    try {
      const { error } = await mobileSupabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${process.env.EXPO_PUBLIC_SITE_URL || 'https://www.ultimategolfcommunity.com'}/login`
      })

      if (error) {
        throw error
      }
    } finally {
      setAuthBusy(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setAuthBusy(true)
    try {
      if (userRef.current?.id) {
        await fetch(
          `${(process.env.EXPO_PUBLIC_SITE_URL || 'https://www.ultimategolfcommunity.com').replace(/\/$/, '')}/api/notifications`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              action: 'clear_push_token',
              user_id: userRef.current.id
            })
          }
        ).catch(() => null)
      }

      const { error } = await mobileSupabase.auth.signOut()
      if (error) {
        throw error
      }

      pushTokenRef.current = null
      pushRegistrationAttemptedRef.current = null
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
      let lastDirectError: unknown = null
      let savedDirectly = false
      const baseDirectUpdate = {
        ...normalizedUpdates,
        updated_at: new Date().toISOString()
      }

      for (const attempt of buildProfileUpdateAttempts(baseDirectUpdate)) {
        const { error } = await mobileSupabase
          .from('user_profiles')
          .update(attempt)
          .eq('id', user.id)

        if (!error) {
          savedDirectly = true
          break
        }

        lastDirectError = error

        if (!getMissingProfileColumn(error)) {
          break
        }
      }

      if (!savedDirectly) {
        if (lastDirectError instanceof Error) {
          throw lastDirectError
        }

        throw apiError instanceof Error ? apiError : new Error('Unable to update profile.')
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
      resetPassword,
      signOut,
      syncAuthSession,
      refreshProfile,
      updateProfile
    }),
    [user, session, profile, loading, authBusy, signIn, signUp, resetPassword, signOut, syncAuthSession, refreshProfile, updateProfile]
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
