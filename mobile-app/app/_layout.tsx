import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppLaunchScreen } from '@/components/AppLaunchScreen'
import { RootErrorBoundary } from '@/components/RootErrorBoundary'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'

function RootNavigator() {
  const { loading } = useAuth()
  const [holdLaunch, setHoldLaunch] = useState(true)
  const [forceHideLaunch, setForceHideLaunch] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHoldLaunch(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const failsafeTimer = setTimeout(() => setForceHideLaunch(true), 4500)
    return () => clearTimeout(failsafeTimer)
  }, [])

  const showLaunch = !forceHideLaunch && (loading || holdLaunch)

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
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
