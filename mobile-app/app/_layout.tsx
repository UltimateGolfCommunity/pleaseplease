import { Stack, usePathname } from 'expo-router'
import { StatusBar, type StatusBarStyle } from 'expo-status-bar'
import { View } from 'react-native'
import { AppBottomBar } from '@/components/AppBottomBar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { RootErrorBoundary } from '@/components/RootErrorBoundary'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'

function RootNavigator() {
  const { user } = useAuth()
  const pathname = usePathname()
  const authRoutes = new Set(['/welcome', '/login', '/signup'])
  // A conversation needs the full lower safe area for its composer and the
  // keyboard. Keeping the persistent tab bar there clips the send controls.
  const isConversationRoute = pathname.startsWith('/messages/')
  const showBottomBar = Boolean(user) && !authRoutes.has(pathname) && !isConversationRoute
  const statusBarStyle: StatusBarStyle = authRoutes.has(pathname) ? 'dark' : 'light'

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }} />
      {showBottomBar ? <AppBottomBar /> : null}
    </View>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootErrorBoundary>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </RootErrorBoundary>
    </SafeAreaProvider>
  )
}
