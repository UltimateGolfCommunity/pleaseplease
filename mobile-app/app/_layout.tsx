import { useEffect, useState } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppLaunchScreen } from '@/components/AppLaunchScreen'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'

function RootNavigator() {
  const { loading } = useAuth()
  const [holdLaunch, setHoldLaunch] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setHoldLaunch(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  const showLaunch = loading || holdLaunch

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
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
