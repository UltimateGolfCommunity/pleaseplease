import { useEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { PrimaryButton } from '@/components/PrimaryButton'
import { mobileSupabase } from '@/lib/supabase'

WebBrowser.maybeCompleteAuthSession()

const googleIOSClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
const googleExpoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
const googleConfigured = Boolean(googleIOSClientId && googleAndroidClientId && googleExpoClientId)

export function SocialAuthButtons({ onSuccess }: { onSuccess?: () => void }) {
  if (!googleConfigured) {
    return <SocialAuthButtonsWithoutGoogle onSuccess={onSuccess} />
  }

  return <SocialAuthButtonsWithGoogle onSuccess={onSuccess} />
}

function SocialAuthButtonsWithoutGoogle({ onSuccess }: { onSuccess?: () => void }) {
  const [appleBusy, setAppleBusy] = useState(false)
  const [appleAvailable, setAppleAvailable] = useState(false)

  useEffect(() => {
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false))
  }, [])

  const handleGoogleUnavailable = () => {
    Alert.alert(
      'Google sign in not ready',
      'Add the Google client IDs in mobile-app/.env before testing native sign in.'
    )
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
    <View style={styles.stack}>
      <PrimaryButton
        disabled
        label="Continue with Google"
        loading={false}
        variant="ghost"
        onPress={handleGoogleUnavailable}
      />
      {appleAvailable ? (
        <PrimaryButton
          label="Continue with Apple"
          loading={appleBusy}
          variant="ghost"
          onPress={handleApple}
        />
      ) : null}
    </View>
  )
}

function SocialAuthButtonsWithGoogle({ onSuccess }: { onSuccess?: () => void }) {
  const [googleBusy, setGoogleBusy] = useState(false)
  const [appleBusy, setAppleBusy] = useState(false)
  const [appleAvailable, setAppleAvailable] = useState(false)

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: googleIOSClientId!,
    androidClientId: googleAndroidClientId!,
    clientId: googleExpoClientId!
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

        onSuccess?.()
      } catch (error) {
        Alert.alert('Google sign in failed', error instanceof Error ? error.message : 'Please try again.')
      } finally {
        setGoogleBusy(false)
      }
    }

    finishGoogleSignIn()
  }, [response, onSuccess])

  const handleGoogle = async () => {
    if (!request) {
      Alert.alert(
        'Google sign in not ready',
        'Add the Google client IDs in mobile-app/.env before testing native sign in.'
      )
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

      onSuccess?.()
    } catch (error) {
      if (
        typeof error === 'object' &&
        error &&
        'code' in error &&
        error.code === 'ERR_REQUEST_CANCELED'
      ) {
        return
      }

      Alert.alert('Apple sign in failed', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setAppleBusy(false)
    }
  }

  return (
    <View style={styles.stack}>
      <PrimaryButton
        disabled={!googleConfigured || !request}
        label="Continue with Google"
        loading={googleBusy}
        variant="ghost"
        onPress={handleGoogle}
      />
      {appleAvailable ? (
        <PrimaryButton
          label="Continue with Apple"
          loading={appleBusy}
          variant="ghost"
          onPress={handleApple}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  stack: {
    gap: 12
  }
})
