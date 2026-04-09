import { Link, Redirect, router } from 'expo-router'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { SocialAuthButtons } from '@/components/SocialAuthButtons'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

export default function SignupScreen() {
  const { authBusy, loading, signUp, user } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!loading && user) {
    return <Redirect href="/home" />
  }

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('Missing info', 'Fill out the full form to create your account.')
      return
    }

    try {
      await signUp({ firstName, lastName, email, password })
      Alert.alert(
        'Account created',
        'Your account is set up. If email confirmation is enabled, confirm your email before signing in.'
      )
      router.replace('/login')
    } catch (error) {
      Alert.alert('Signup failed', error instanceof Error ? error.message : 'Please try again.')
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
            title="Create Account"
            subtitle="Start your golf identity with UGC and bring your tee times, groups, and future badges into one place."
          />

          <View style={styles.formCard}>
            <View style={styles.formIntro}>
              <Text style={styles.formTitle}>Build your golfer profile</Text>
              <Text style={styles.formBody}>
                Start with the basics now and we can keep layering in home course, handicap, and your golf story next.
              </Text>
            </View>
            <TextInput
              onChangeText={setFirstName}
              placeholder="First name"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={firstName}
            />
            <TextInput
              onChangeText={setLastName}
              placeholder="Last name"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={lastName}
            />
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
            <PrimaryButton
              label="Join Ultimate Golf Community"
              loading={authBusy}
              onPress={handleSignup}
            />
            <SocialAuthButtons onSuccess={() => router.replace('/home')} />
            <Text style={styles.helper}>
              Your same Supabase account powers both the mobile app and the live web experience.
            </Text>
            <View style={styles.legalRow}>
              <Pressable onPress={() => void Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://www.ultimategolfcommunity.com/privacy')}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL(`mailto:${process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@ultimategolfcommunity.com'}`)}>
                <Text style={styles.legalLink}>Support</Text>
              </Pressable>
            </View>
          </View>

          <Link href="/login" style={styles.link}>
            Already have an account? Sign in
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
