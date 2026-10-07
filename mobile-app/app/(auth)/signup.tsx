import Ionicons from '@expo/vector-icons/Ionicons'
import { Link, Redirect, router } from 'expo-router'
import { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SocialAuthButtons } from '@/components/SocialAuthButtons'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

export default function SignupScreen() {
  const { authBusy, loading, signUp, user } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (!loading && user) return <Redirect href="/home" />

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('Missing info', 'Fill out each field to create your account.')
      return
    }
    try {
      await signUp({ firstName, lastName, email, password })
      Alert.alert('Check your email', 'We sent a confirmation link. Confirm your email, then sign in.')
      router.replace('/login')
    } catch (error) {
      Alert.alert('Signup failed', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', default: undefined })} style={styles.keyboardWrap}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/welcome')} style={styles.backButton}>
            <Ionicons color={palette.ink} name="chevron-back" size={20} />
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>

          <View style={styles.hero}>
            <Text style={styles.title}>Create account</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.nameRow}>
              <View style={styles.halfField}><Text style={styles.fieldLabel}>FIRST NAME</Text><TextInput autoComplete="given-name" onChangeText={setFirstName} placeholder="First name" placeholderTextColor="#80958c" style={styles.input} value={firstName} /></View>
              <View style={styles.halfField}><Text style={styles.fieldLabel}>LAST NAME</Text><TextInput autoComplete="family-name" onChangeText={setLastName} placeholder="Last name" placeholderTextColor="#80958c" style={styles.input} value={lastName} /></View>
            </View>
            <View style={styles.field}><Text style={styles.fieldLabel}>EMAIL</Text><TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={setEmail} placeholder="you@email.com" placeholderTextColor="#80958c" style={styles.input} value={email} /></View>
            <View style={styles.field}><Text style={styles.fieldLabel}>PASSWORD</Text><TextInput autoComplete="new-password" onChangeText={setPassword} placeholder="Create a password" placeholderTextColor="#80958c" secureTextEntry style={styles.input} value={password} /></View>
            <Pressable accessibilityRole="button" disabled={authBusy} onPress={handleSignup} style={[styles.continueButton, authBusy && styles.continueDisabled]}><Text style={styles.continueText}>{authBusy ? 'Creating account...' : 'Create account'}</Text><Ionicons color="#fffdf5" name="arrow-forward" size={18} /></Pressable>
            <View style={styles.dividerRow}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR CONTINUE WITH</Text><View style={styles.dividerLine} /></View>
            <SocialAuthButtons onSuccess={() => router.replace('/home')} />
          </View>

          <View style={styles.footerPrompt}><Text style={styles.footerPromptText}>Already have an account?</Text><Link href="/login" style={styles.footerPromptLink}>Sign in</Link></View>
          <View style={styles.legalRow}><Pressable onPress={() => void Linking.openURL(process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://www.ultimategolfcommunity.com/privacy')}><Text style={styles.legalLink}>Privacy</Text></Pressable><Text style={styles.legalDivider}>•</Text><Pressable onPress={() => void Linking.openURL(`mailto:${process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@ultimategolfcommunity.com'}`)}><Text style={styles.legalLink}>Support</Text></Pressable></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#e7f1ef', flex: 1 },
  keyboardWrap: { flex: 1 },
  content: { flexGrow: 1, padding: 22, paddingBottom: 32 },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 2, minHeight: 38 },
  backLabel: { color: palette.ink, fontSize: 14, fontWeight: '700' },
  hero: { marginTop: 30, paddingHorizontal: 2 },
  title: { color: palette.ink, fontFamily: 'Georgia', fontSize: 31, fontWeight: '700', letterSpacing: -0.5 },
  formCard: { backgroundColor: '#ffffff', borderColor: 'rgba(27,70,51,0.12)', borderRadius: 20, borderWidth: 1, gap: 15, marginTop: 22, padding: 18 },
  nameRow: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1, gap: 7 },
  field: { gap: 7 },
  fieldLabel: { color: '#557267', fontSize: 10, fontWeight: '800', letterSpacing: 1.15 },
  input: { backgroundColor: '#f1f4ed', borderColor: '#d4dfd2', borderRadius: 15, borderWidth: 1, color: palette.ink, minHeight: 54, paddingHorizontal: 14 },
  continueButton: { alignItems: 'center', backgroundColor: '#194938', borderRadius: 16, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 55, shadowColor: '#153e2e', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.16, shadowRadius: 10 },
  continueDisabled: { opacity: 0.56 },
  continueText: { color: '#fffdf5', fontSize: 15, fontWeight: '800' },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 1 },
  dividerLine: { backgroundColor: '#d7e0d6', flex: 1, height: 1 },
  dividerText: { color: '#73877d', fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  footerPrompt: { alignItems: 'center', gap: 5, marginTop: 24 },
  footerPromptText: { color: '#456a60', fontSize: 14 },
  footerPromptLink: { color: '#174b39', fontSize: 15, fontWeight: '800' },
  legalRow: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 16 },
  legalLink: { color: '#53746a', fontSize: 12, fontWeight: '600' },
  legalDivider: { color: '#75968c', fontSize: 12 }
})
