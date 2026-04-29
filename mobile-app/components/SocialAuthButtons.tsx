import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { palette } from '@/lib/theme'
import { mobileSupabase } from '@/lib/supabase'
import { useAuth } from '@/providers/AuthProvider'

WebBrowser.maybeCompleteAuthSession()

const googleIOSClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
const googleExpoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
const googleConfigured =
  Platform.OS === 'ios'
    ? Boolean(googleIOSClientId)
    : Platform.OS === 'android'
      ? Boolean(googleAndroidClientId)
      : Boolean(googleExpoClientId)

type AuthIconButtonProps = {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  disabled?: boolean
  loading?: boolean
}

function AuthIconButton({ label, icon, onPress, disabled = false, loading = false }: AuthIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.authButton, (disabled || loading) && styles.authButtonDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          <View style={styles.authIconWrap}>
            <Ionicons color={palette.text} name={icon} size={18} />
          </View>
          <Text style={styles.authButtonLabel}>{label}</Text>
        </>
      )}
    </Pressable>
  )
}

export function SocialAuthButtons({ onSuccess }: { onSuccess?: () => void }) {
  if (!googleConfigured) {
    return <SocialAuthButtonsWithoutGoogle onSuccess={onSuccess} />
  }

  return <SocialAuthButtonsWithGoogle onSuccess={onSuccess} />
}

function SocialAuthButtonsWithoutGoogle({ onSuccess }: { onSuccess?: () => void }) {
  const { syncAuthSession } = useAuth()
  const [appleBusy, setAppleBusy] = useState(false)
  const [appleAvailable, setAppleAvailable] = useState(false)

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false))
  }, [])

  const handleGoogleUnavailable = () => {
    Alert.alert('Google sign in unavailable', 'This build is not configured for native Google sign in yet.')
  }

  const handleApple = async () => {
    setAppleBusy(true)

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      })

      if (!credential.identityToken) {
        throw new Error('Apple did not return an identity token.')
      }

      const { error } = await mobileSupabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken
      })

      if (error) {
        throw error
      }

      await syncAuthSession()
      onSuccess?.()
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
        return
      }

      Alert.alert('Apple sign in failed', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setAppleBusy(false)
    }
  }

  return (
    <View style={styles.row}>
      <AuthIconButton
        disabled
        icon="logo-google"
        label="Google"
        onPress={handleGoogleUnavailable}
      />
      {appleAvailable ? (
        <AuthIconButton
          icon="logo-apple"
          label="Apple"
          loading={appleBusy}
          onPress={handleApple}
        />
      ) : null}
    </View>
  )
}

function SocialAuthButtonsWithGoogle({ onSuccess }: { onSuccess?: () => void }) {
  const { syncAuthSession } = useAuth()
  const [googleBusy, setGoogleBusy] = useState(false)
  const [appleBusy, setAppleBusy] = useState(false)
  const [appleAvailable, setAppleAvailable] = useState(false)

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: googleIOSClientId!,
    androidClientId: googleAndroidClientId!,
    webClientId: googleExpoClientId!
  })

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false))
  }, [])

  useEffect(() => {
    const finishGoogleSignIn = async () => {
      if (response?.type !== 'success') {
        if (response?.type === 'error') {
          setGoogleBusy(false)
          Alert.alert('Google sign in failed', 'Please try again.')
        }
        return
      }

      try {
        const idToken = response.params.id_token

        if (!idToken) {
          throw new Error('Google did not return an ID token.')
        }

        const { error } = await mobileSupabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken
        })

        if (error) {
          throw error
        }

        await syncAuthSession()
        onSuccess?.()
      } catch (error) {
        Alert.alert('Google sign in failed', error instanceof Error ? error.message : 'Please try again.')
      } finally {
        setGoogleBusy(false)
      }
    }

    finishGoogleSignIn()
  }, [response, onSuccess, syncAuthSession])

  const handleGoogle = async () => {
    if (!request) {
      Alert.alert('Google sign in unavailable', 'This build is not configured for native Google sign in yet.')
      return
    }

    setGoogleBusy(true)
    const result = await promptAsync()

    if (result.type !== 'success') {
      setGoogleBusy(false)
    }
  }

  const handleApple = async () => {
    setAppleBusy(true)

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL
        ]
      })

      if (!credential.identityToken) {
        throw new Error('Apple did not return an identity token.')
      }

      const { error } = await mobileSupabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken
      })

      if (error) {
        throw error
      }

      await syncAuthSession()
      onSuccess?.()
    } catch (error) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
        return
      }

      Alert.alert('Apple sign in failed', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setAppleBusy(false)
    }
  }

  return (
    <View style={styles.row}>
      <AuthIconButton
        disabled={!googleConfigured || !request}
        icon="logo-google"
        label="Google"
        loading={googleBusy}
        onPress={handleGoogle}
      />
      {appleAvailable ? (
        <AuthIconButton
          icon="logo-apple"
          label="Apple"
          loading={appleBusy}
          onPress={handleApple}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12
  },
  authButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 14
  },
  authButtonDisabled: {
    opacity: 0.5
  },
  authIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  authButtonLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  }
})
