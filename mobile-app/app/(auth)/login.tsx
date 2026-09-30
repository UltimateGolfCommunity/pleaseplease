import Ionicons from '@expo/vector-icons/Ionicons'
import { Link, Redirect, router } from 'expo-router'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SocialAuthButtons } from '@/components/SocialAuthButtons'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

export default function LoginScreen() {
  const { authBusy, loading, resetPassword, signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!loading && user) return <Redirect href="/home" />

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
      <View pointerEvents="none" style={styles.sunGlow} />
      <View pointerEvents="none" style={styles.hill} />
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.keyboardWrap}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/welcome')} style={styles.backButton}>
            <Ionicons color={palette.ink} name="chevron-back" size={20} />
            <Text style={styles.backLabel}>Welcome</Text>
          </Pressable>

          <View style={styles.hero}>
            <Text style={styles.title}>Welcome back.</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>EMAIL</Text>
              <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor="#80958c" style={styles.input} value={email} />
            </View>
            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}><Text style={styles.fieldLabel}>PASSWORD</Text><Pressable onPress={handleResetPassword}><Text style={styles.forgotText}>Forgot password?</Text></Pressable></View>
              <TextInput autoComplete="password" onChangeText={setPassword} placeholder="Your password" placeholderTextColor="#80958c" secureTextEntry style={styles.input} value={password} />
            </View>

            <Pressable accessibilityRole="button" disabled={authBusy} onPress={handleSignIn} style={[styles.continueButton, authBusy && styles.continueDisabled]}>
              <Text style={styles.continueText}>{authBusy ? 'Signing in...' : 'Sign in'}</Text>
              <Ionicons color="#fffdf5" name="arrow-forward" size={18} />
            </Pressable>

            <View style={styles.dividerRow}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>
            <SocialAuthButtons onSuccess={() => router.replace('/home')} />
          </View>

          <View style={styles.footerPrompt}>
            <Text style={styles.footerPromptText}>New here?</Text>
            <Link href="/signup" style={styles.footerPromptLink}>Create account</Link>
          </View>
          <View style={styles.legalRow}>
            <Pressable onPress={() => void Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://www.ultimategolfcommunity.com/privacy')}><Text style={styles.legalLink}>Privacy</Text></Pressable>
            <Text style={styles.legalDivider}>•</Text>
            <Pressable onPress={() => void Linking.openURL(`mailto:${process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@ultimategolfcommunity.com'}`)}><Text style={styles.legalLink}>Support</Text></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#c1e0ea', flex: 1 },
  keyboardWrap: { flex: 1 },
  sunGlow: { backgroundColor: 'rgba(255,240,182,0.72)', borderRadius: 999, height: 260, position: 'absolute', right: -88, top: 2, width: 260 },
  hill: { backgroundColor: 'rgba(78,129,83,0.26)', borderRadius: 999, bottom: -190, height: 410, left: -110, position: 'absolute', width: '145%' },
  content: { flexGrow: 1, padding: 22, paddingBottom: 32 },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 2, minHeight: 38 },
  backLabel: { color: palette.ink, fontSize: 14, fontWeight: '700' },
  hero: { marginTop: 28, paddingHorizontal: 5 },
  title: { color: palette.ink, fontFamily: 'Georgia', fontSize: 37, fontWeight: '700', letterSpacing: -0.8, lineHeight: 40 },
  formCard: { backgroundColor: '#fffdf5', borderColor: 'rgba(27,70,51,0.10)', borderRadius: 27, borderWidth: 1, gap: 17, marginTop: 24, padding: 20, shadowColor: '#1a4b37', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.16, shadowRadius: 26 },
  fieldGroup: { gap: 7 },
  passwordLabelRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { color: '#557267', fontSize: 10, fontWeight: '800', letterSpacing: 1.15 },
  input: { backgroundColor: '#f1f4ed', borderColor: '#d4dfd2', borderRadius: 15, borderWidth: 1, color: palette.ink, minHeight: 55, paddingHorizontal: 15 },
  forgotText: { color: '#167458', fontSize: 12, fontWeight: '700' },
  continueButton: { alignItems: 'center', backgroundColor: '#194938', borderRadius: 16, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 55, shadowColor: '#153e2e', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.16, shadowRadius: 10 },
  continueDisabled: { opacity: 0.56 },
  continueText: { color: '#fffdf5', fontSize: 15, fontWeight: '800' },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 1 },
  dividerLine: { backgroundColor: '#d7e0d6', flex: 1, height: 1 },
  dividerText: { color: '#73877d', fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  footerPrompt: { alignItems: 'center', gap: 5, marginTop: 27 },
  footerPromptText: { color: '#456a60', fontSize: 14 },
  footerPromptLink: { color: '#174b39', fontSize: 15, fontWeight: '800' },
  legalRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 18 },
  legalLink: { color: '#53746a', fontSize: 12, fontWeight: '600' },
  legalDivider: { color: '#75968c', fontSize: 12 }
})
