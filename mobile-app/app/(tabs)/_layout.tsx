import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { palette } from '@/lib/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.aqua,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: '#091812',
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 84,
          paddingBottom: 12,
          paddingTop: 10
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3
        },
        tabBarItemStyle: {
          paddingVertical: 2
        }
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="golf-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />
        }}
      />
    </Tabs>
  )
}
