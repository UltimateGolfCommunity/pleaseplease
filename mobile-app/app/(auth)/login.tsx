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
  const { authBusy, loading, resetPassword, signIn, user } = useAuth()
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

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email needed', 'Enter your email first and we will send you a reset link.')
      return
    }

    try {
      await resetPassword(email)
      Alert.alert('Reset link sent', 'Check your inbox for a secure password reset link.')
    } catch (error) {
      Alert.alert('Unable to send reset link', error instanceof Error ? error.message : 'Please try again.')
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
            largeLogo
            logoScale={1.1}
          />

          <View style={styles.formCard}>
            <View style={styles.formIntro}>
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formBody}>Sign in with email or use a faster account shortcut below.</Text>
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
            <Pressable onPress={handleResetPassword} style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>
            <PrimaryButton label="Continue" loading={authBusy} onPress={handleSignIn} />
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>quick access</Text>
              <View style={styles.dividerLine} />
            </View>
            <SocialAuthButtons onSuccess={() => router.replace('/home')} />
            <Text style={styles.helper}>Use the same account you already use on the web.</Text>
            <View style={styles.legalRow}>
              <Pressable onPress={() => void Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://www.ultimategolfcommunity.com/privacy')}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL(`mailto:${process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@ultimategolfcommunity.com'}`)}>
                <Text style={styles.legalLink}>Support</Text>
              </Pressable>
            </View>
            <View style={styles.footerPrompt}>
              <Text style={styles.footerPromptText}>New here?</Text>
              <Link href="/signup" style={styles.footerPromptLink}>
                Create an account
              </Link>
            </View>
          </View>
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
    gap: 18,
    padding: 20,
    paddingBottom: 32
  },
  formCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28
  },
  formIntro: {
    gap: 5,
    marginBottom: 4
  },
  formTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center'
  },
  formBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
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
    lineHeight: 18,
    textAlign: 'center'
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -2,
    paddingVertical: 2
  },
  forgotText: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  dividerLine: {
    backgroundColor: palette.border,
    flex: 1,
    height: 1
  },
  dividerText: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase'
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
  footerPrompt: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 2
  },
  footerPromptText: {
    color: palette.textMuted,
    fontSize: 14
  },
  footerPromptLink: {
    color: palette.aqua,
    fontSize: 14,
    fontWeight: '700'
  }
})
