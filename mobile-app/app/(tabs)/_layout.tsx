import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { router, Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { palette } from '@/lib/theme'

export default function TabsLayout() {
  const [showCreateWheel, setShowCreateWheel] = useState(false)

  const openCreatePath = (path: '/home?compose=tee-time' | '/scores' | '/course') => {
    setShowCreateWheel(false)
    router.push(path)
  }

  return (
    <>
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
          name="compose"
          options={{
            title: '',
            tabBarButton: () => (
              <Pressable onPress={() => setShowCreateWheel(true)} style={styles.composeTabButton}>
                <View style={styles.composeButton}>
                  <Ionicons color={palette.bg} name="add" size={28} />
                </View>
              </Pressable>
            )
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

      <Modal
        animationType="fade"
        transparent
        visible={showCreateWheel}
        onRequestClose={() => setShowCreateWheel(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateWheel(false)}>
          <View pointerEvents="box-none" style={styles.wheelShell}>
            <View style={styles.wheelRow}>
              <Pressable onPress={() => openCreatePath('/home?compose=tee-time')} style={styles.wheelAction}>
                <View style={styles.wheelIcon}>
                  <Ionicons color={palette.aqua} name="golf-outline" size={20} />
                </View>
                <Text style={styles.wheelLabel}>Tee Time</Text>
              </Pressable>
              <Pressable onPress={() => openCreatePath('/scores')} style={styles.wheelAction}>
                <View style={styles.wheelIcon}>
                  <Ionicons color={palette.aqua} name="stats-chart-outline" size={20} />
                </View>
                <Text style={styles.wheelLabel}>Score</Text>
              </Pressable>
              <Pressable onPress={() => openCreatePath('/course')} style={styles.wheelAction}>
                <View style={styles.wheelIcon}>
                  <Ionicons color={palette.aqua} name="flag-outline" size={20} />
                </View>
                <Text style={styles.wheelLabel}>Course</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  composeTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    width: 76
  },
  composeButton: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 999,
    height: 58,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    width: 58
  },
  modalBackdrop: {
    backgroundColor: 'rgba(3,10,8,0.56)',
    flex: 1,
    justifyContent: 'flex-end'
  },
  wheelShell: {
    alignItems: 'center',
    paddingBottom: 104
  },
  wheelRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 14
  },
  wheelAction: {
    alignItems: 'center',
    gap: 8,
    width: 88
  },
  wheelIcon: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54
  },
  wheelLabel: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700'
  }
})
