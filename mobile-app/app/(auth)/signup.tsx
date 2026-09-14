import { Link, Redirect, router } from 'expo-router'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
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
        'Check your email',
        'We sent a confirmation link if email verification is enabled for this app. Confirm your email, then sign in.'
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroCrest}>
              <Ionicons color={palette.gold} name="golf-outline" size={26} />
            </View>
            <Text style={styles.eyebrow}>ULTIMATE GOLF COMMUNITY</Text>
            <Text style={styles.heroTitle}>Join the club.</Text>
          </View>

          <View style={styles.formCard}>
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
              label="Create My Profile"
              loading={authBusy}
              onPress={handleSignup}
            />
            <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OR CONTINUE WITH</Text><View style={styles.orLine} /></View>
            <SocialAuthButtons onSuccess={() => router.replace('/home')} />
            <Text style={styles.helper}>By joining, you agree to build a respectful golf community around you.</Text>
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
    gap: 20,
    padding: 24,
    paddingBottom: 42
  },
  hero: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 18
  },
  heroCrest: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,39,28,0.54)',
    borderColor: 'rgba(246,196,95,0.38)',
    borderRadius: 999,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54
  },
  eyebrow: {
    color: palette.gold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.6
  },
  heroTitle: {
    color: palette.text,
    fontFamily: 'Georgia',
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 43
  },
  heroBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 330,
    textAlign: 'center'
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
    fontFamily: 'Georgia',
    fontSize: 25,
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
  orRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 2
  },
  orLine: {
    backgroundColor: palette.border,
    flex: 1,
    height: 1
  },
  orText: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
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
