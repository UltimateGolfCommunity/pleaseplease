import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

export default function WelcomeScreen() {
  const { loading, user } = useAuth()

  if (!loading && user) {
    return <Redirect href="/home" />
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <BrandHeader
          title="Ultimate Golf Community"
          subtitle="Find your next round, keep up with your golf network, and bring the same UGC community into a native iPhone experience."
        />

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Native preview</Text>
          <Text style={styles.heroTitle}>Your golf world, built for the phone.</Text>
          <Text style={styles.heroBody}>
            Sign in with the same account, check tee times, jump into groups, and carry your golf circle with you wherever you play.
          </Text>
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Live tee times</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Groups</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Connections</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Sign In" onPress={() => router.push('/login')} />
          <PrimaryButton
            label="Create Account"
            variant="ghost"
            onPress={() => router.push('/signup')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.bg,
    flex: 1
  },
  content: {
    gap: 24,
    padding: 24
  },
  heroCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 22
  },
  heroEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase'
  },
  heroTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '700'
  },
  heroBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  pillLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  },
  actions: {
    gap: 12
  }
})
