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
          largeLogo
          logoScale={1.14}
        />

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>Your golf world, built for the phone.</Text>
          <Text style={styles.heroBody}>
            Sign in with the same account, jump into groups, and keep your golf circle close wherever you play.
          </Text>
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
    gap: 20,
    padding: 24,
    paddingBottom: 36
  },
  heroCopy: {
    alignItems: 'center',
    gap: 10,
    marginTop: -10,
    paddingHorizontal: 8
  },
  heroTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center'
  },
  heroBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 320,
    textAlign: 'center'
  },
  actions: {
    gap: 12
  }
})
