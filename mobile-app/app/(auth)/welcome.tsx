import { Redirect, router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PrimaryButton } from '@/components/PrimaryButton'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

const backgroundGolfBallDimples = [
  ...Array.from({ length: 16 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 16
    return [50 + Math.cos(angle) * 43, 50 + Math.sin(angle) * 43]
  }),
  ...Array.from({ length: 14 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 14 + 0.16
    return [50 + Math.cos(angle) * 31, 50 + Math.sin(angle) * 31]
  }),
  ...Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 10 + 0.31
    return [50 + Math.cos(angle) * 18, 50 + Math.sin(angle) * 18]
  }),
  [50, 50]
]

export default function WelcomeScreen() {
  const { loading, user } = useAuth()

  if (!loading && user) return <Redirect href="/home" />

  return (
    <SafeAreaView style={styles.safeArea}>
      <View pointerEvents="none" style={styles.backgroundGolfBall}>
        {backgroundGolfBallDimples.map(([left, top], index) => <View key={index} style={[styles.golfBallDimple, { left: `${left}%`, top: `${top}%` }]} />)}
      </View>
      <ScrollView bounces={false} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>ULTIMATE GOLF COMMUNITY</Text>
          <Text style={styles.title}>Your club,{`\n`}wherever you play.</Text>
          <Text style={styles.body}>Meet golfers. Make plans. Play more.</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Create an account" onPress={() => router.push('/signup')} />
          <Pressable accessibilityRole="button" onPress={() => router.push('/login')} style={styles.signInButton}>
            <Text style={styles.signInText}>I already have an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#bcdde8', flex: 1 },
  backgroundGolfBall: { backgroundColor: 'rgba(255,253,245,0.7)', borderColor: 'rgba(255,255,255,0.84)', borderRadius: 999, borderWidth: 1, height: 320, left: -126, overflow: 'hidden', position: 'absolute', top: 110, width: 320 },
  golfBallDimple: { backgroundColor: 'rgba(34,70,57,0.12)', borderColor: 'rgba(255,255,255,0.56)', borderRadius: 999, borderWidth: 1, height: 17, marginLeft: -8.5, marginTop: -8.5, position: 'absolute', width: 17 },
  content: { flexGrow: 1, justifyContent: 'space-between', padding: 22, paddingBottom: 38 },
  copy: { alignItems: 'center', marginTop: 28, paddingHorizontal: 10 },
  eyebrow: { color: '#996d2c', fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 10 },
  title: { color: '#153e2e', fontFamily: 'Georgia', fontSize: 36, fontWeight: '700', letterSpacing: -0.8, lineHeight: 40, textAlign: 'center' },
  body: { color: '#375f55', fontSize: 16, lineHeight: 23, marginTop: 15, textAlign: 'center' },
  actions: { gap: 12, marginTop: 'auto' },
  signInButton: { alignItems: 'center', borderColor: 'rgba(23,70,52,0.3)', borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 54 },
  signInText: { color: '#174634', fontSize: 15, fontWeight: '700' },
})
