import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none'
        }
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="groups" />
      <Tabs.Screen name="compose" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
