import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { palette } from '@/lib/theme'

type CreatePath =
  | '/home?compose=tee-time'
  | '/scores'
  | '/post-photo'

type PrimaryRoute = '/home' | '/groups' | '/search' | '/profile'

const primaryTabs = [
  { key: 'home', label: 'Home', icon: 'home-outline' as const, activeIcon: 'home' as const, route: '/home' },
  { key: 'groups', label: 'Groups', icon: 'people-outline' as const, activeIcon: 'people' as const, route: '/groups' },
  { key: 'search', label: 'Search', icon: 'search-outline' as const, activeIcon: 'search' as const, route: '/search' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' as const, activeIcon: 'person' as const, route: '/profile' }
] as const satisfies ReadonlyArray<{
  key: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
  route: PrimaryRoute
}>

function getActiveKey(pathname: string) {
  if (pathname.startsWith('/groups') || pathname.startsWith('/group')) return 'groups'
  if (pathname.startsWith('/search') || pathname.startsWith('/courses') || pathname.startsWith('/course')) return 'search'
  if (pathname.startsWith('/profile') || pathname.startsWith('/users') || pathname.startsWith('/connections')) return 'profile'
  return 'home'
}

export function AppBottomBar() {
  const pathname = usePathname()
  const [showCreateWheel, setShowCreateWheel] = useState(false)
  const activeKey = getActiveKey(pathname)

  const openCreatePath = (path: CreatePath) => {
    setShowCreateWheel(false)
    router.push(path)
  }

  return (
    <>
      <View pointerEvents="box-none" style={styles.shell}>
        <View style={styles.bar}>
          {primaryTabs.slice(0, 2).map((tab) => {
            const active = activeKey === tab.key
            return (
              <Pressable key={tab.key} onPress={() => router.push(tab.route)} style={styles.tabButton}>
                <Ionicons color={active ? palette.aqua : palette.textMuted} name={active ? tab.activeIcon : tab.icon} size={24} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            )
          })}

          <Pressable onPress={() => setShowCreateWheel(true)} style={styles.composeTabButton}>
            <View style={styles.composeButton}>
              <Ionicons color={palette.bg} name="add" size={28} />
            </View>
          </Pressable>

          {primaryTabs.slice(2).map((tab) => {
            const active = activeKey === tab.key
            return (
              <Pressable key={tab.key} onPress={() => router.push(tab.route)} style={styles.tabButton}>
                <Ionicons color={active ? palette.aqua : palette.textMuted} name={active ? tab.activeIcon : tab.icon} size={24} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      <Modal animationType="fade" transparent visible={showCreateWheel} onRequestClose={() => setShowCreateWheel(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateWheel(false)}>
          <View pointerEvents="box-none" style={styles.wheelShell}>
            <View style={styles.wheelRow}>
              <Pressable onPress={() => openCreatePath('/post-photo')} style={styles.wheelAction}>
                <View style={styles.wheelIcon}>
                  <Ionicons color={palette.aqua} name="camera-outline" size={20} />
                </View>
                <Text style={styles.wheelLabel}>Photo</Text>
              </Pressable>
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
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  shell: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0
  },
  bar: {
    alignItems: 'flex-start',
    backgroundColor: '#091812',
    borderTopColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 84,
    justifyContent: 'space-around',
    paddingBottom: 12,
    paddingTop: 10
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    paddingVertical: 2
  },
  tabLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3
  },
  tabLabelActive: {
    color: palette.aqua
  },
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
    gap: 18
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
