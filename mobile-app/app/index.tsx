import { ActivityIndicator, View } from 'react-native'
import { Redirect } from 'expo-router'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

export default function Index() {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: palette.bg,
          flex: 1,
          justifyContent: 'center'
        }}
      >
        <ActivityIndicator color={palette.aqua} />
      </View>
    )
  }

  return <Redirect href={user ? '/home' : '/welcome'} />
}
