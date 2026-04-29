import { useEffect, useState } from 'react'
import { Stack, usePathname } from 'expo-router'
import { StatusBar, type StatusBarStyle } from 'expo-status-bar'
import { View } from 'react-native'
import { AppBottomBar } from '@/components/AppBottomBar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppLaunchScreen } from '@/components/AppLaunchScreen'
import { RootErrorBoundary } from '@/components/RootErrorBoundary'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'

function RootNavigator() {
  const { loading, user } = useAuth()
  const [holdLaunch, setHoldLaunch] = useState(true)
  const [forceHideLaunch, setForceHideLaunch] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const timer = setTimeout(() => setHoldLaunch(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const failsafeTimer = setTimeout(() => setForceHideLaunch(true), 4500)
    return () => clearTimeout(failsafeTimer)
  }, [])

  const showLaunch = !forceHideLaunch && (loading || holdLaunch)
  const authRoutes = new Set(['/welcome', '/login', '/signup'])
  const showBottomBar = Boolean(user) && !showLaunch && !authRoutes.has(pathname)
  const statusBarStyle: StatusBarStyle = authRoutes.has(pathname) ? 'dark' : 'light'

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={statusBarStyle} />
      <Stack screenOptions={{ headerShown: false }} />
      {showBottomBar ? <AppBottomBar /> : null}
      {showLaunch ? <AppLaunchScreen /> : null}
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
