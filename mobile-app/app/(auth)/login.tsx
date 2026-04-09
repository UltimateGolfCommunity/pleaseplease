import { Link, Redirect, router } from 'expo-router'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SocialAuthButtons } from '@/components/SocialAuthButtons'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

export default function LoginScreen() {
  const { authBusy, loading, signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!loading && user) {
    return <Redirect href="/home" />
  }

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Enter your email and password to continue.')
      return
    }

    try {
      await signIn(email, password)
      router.replace('/home')
    } catch (error) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboardWrap}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <BrandHeader
            title="Sign In"
            subtitle="Step back into your golf community and pick up right where your next round left off."
          />

          <View style={styles.formCard}>
            <View style={styles.formIntro}>
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formBody}>
                Tee times, groups, and your golf network are all waiting inside.
              </Text>
            </View>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={email}
            />
            <TextInput
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={palette.textMuted}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <PrimaryButton label="Continue" loading={authBusy} onPress={handleSignIn} />
            <SocialAuthButtons onSuccess={() => router.replace('/home')} />
            <Text style={styles.helper}>Use the same account you already use on the web experience.</Text>
            <View style={styles.legalRow}>
              <Pressable onPress={() => void Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://www.ultimategolfcommunity.com/privacy')}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL(`mailto:${process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@ultimategolfcommunity.com'}`)}>
                <Text style={styles.legalLink}>Support</Text>
              </Pressable>
            </View>
          </View>

          <Link href="/signup" style={styles.link}>
            New here? Create an account
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.bg,
    flex: 1
  },
  keyboardWrap: {
    flex: 1
  },
  content: {
    gap: 24,
    padding: 24
  },
  formCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 22
  },
  formIntro: {
    gap: 6
  },
  formTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700'
  },
  formBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  input: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 54,
    paddingHorizontal: 16
  },
  helper: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  legalRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center'
  },
  legalLink: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '600'
  },
  link: {
    color: palette.aqua,
    fontSize: 15,
    fontWeight: '600'
  }
})
