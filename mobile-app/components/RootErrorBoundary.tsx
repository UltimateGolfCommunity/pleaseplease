import { Component, type ReactNode } from 'react'
import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { clearMobileAuthStorage, mobileSupabase } from '@/lib/supabase'
import { palette } from '@/lib/theme'

type RootErrorBoundaryProps = {
  children: ReactNode
}

type RootErrorBoundaryState = {
  errorMessage: string | null
  recovering: boolean
}

export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
  state: RootErrorBoundaryState = {
    errorMessage: null,
    recovering: false
  }

  static getDerivedStateFromError(error: Error) {
    return {
      errorMessage: error?.message || 'Unexpected startup error'
    }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('Root render failure:', error, info.componentStack)
  }

  private handleTryAgain = () => {
    this.setState({ errorMessage: null })
    router.replace('/welcome')
  }

  private handleResetSession = async () => {
    this.setState({ recovering: true })

    try {
      await mobileSupabase.auth.signOut()
      await clearMobileAuthStorage()
    } catch (error) {
      console.warn('Unable to clear local auth session after render failure:', error)
      await clearMobileAuthStorage().catch(() => null)
    } finally {
      this.setState({
        errorMessage: null,
        recovering: false
      })
      router.replace('/welcome')
    }
  }

  render() {
    const { children } = this.props
    const { errorMessage, recovering } = this.state

    if (!errorMessage) {
      return children
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Recovery Mode</Text>
            <Text style={styles.title}>The app hit a startup error</Text>
            <Text style={styles.body}>
              A screen failed while the app was opening. Instead of dropping you on a black screen,
              this recovery view is taking over so you can get back in.
            </Text>
            <Text style={styles.errorLabel}>Last error</Text>
            <Text style={styles.errorBody}>{errorMessage}</Text>

            <Pressable onPress={this.handleTryAgain} style={styles.primaryButton}>
              <Text style={styles.primaryButtonLabel}>Open Welcome Screen</Text>
            </Pressable>

            <Pressable
              disabled={recovering}
              onPress={() => void this.handleResetSession()}
              style={[styles.secondaryButton, recovering && styles.buttonDisabled]}
            >
              <Text style={styles.secondaryButtonLabel}>
                {recovering ? 'Clearing Session...' : 'Clear Session And Recover'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.bg,
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 22
  },
  eyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase'
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 34
  },
  body: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  errorLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6
  },
  errorBody: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 999,
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56,
    paddingHorizontal: 20
  },
  primaryButtonLabel: {
    color: palette.bg,
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 20
  },
  secondaryButtonLabel: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '700'
  },
  buttonDisabled: {
    opacity: 0.6
  }
})
