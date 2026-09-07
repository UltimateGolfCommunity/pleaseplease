import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '@/components/Avatar'
import { apiGet } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type UserCard = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
  location?: string | null
  handicap?: number | null
}

type ConnectionRecord = {
  id: string
  requester_id?: string
  recipient_id?: string
  requester?: UserCard | null
  recipient?: UserCard | null
}

type ConnectionsPayload = {
  success: boolean
  connections: ConnectionRecord[]
}

function formatName(user?: UserCard | null) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'UGC Golfer'
}

export default function PublicUserConnectionsScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [connections, setConnections] = useState<ConnectionRecord[]>([])

  const connectedGolfers = useMemo(() => {
    if (!id) return []

    return connections
      .map((connection) => (connection.requester_id === id ? connection.recipient : connection.requester))
      .filter(Boolean) as UserCard[]
  }, [connections, id])

  const loadConnections = useCallback(async () => {
    if (!id) return

    try {
      const connectionsResponse = await apiGet<ConnectionsPayload>(
        `/api/users?action=connections&id=${encodeURIComponent(id)}`
      )
      setConnections(connectionsResponse.connections || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      setBusy(true)
      loadConnections()
    }
  }, [id, loadConnections])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadConnections()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={12}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons color={palette.text} name="chevron-back" size={24} />
          </Pressable>
          <Text style={styles.pageTitle}>Connections</Text>
        </View>

        <View style={styles.section}>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && connectedGolfers.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>No connections yet</Text>
              <Text style={styles.helper}>
                Once this golfer builds out their network, their accepted connections will show here.
              </Text>
            </View>
          ) : null}
          {connectedGolfers.map((connection) => (
            <Pressable
              key={connection.id}
              onPress={() => router.push(`/users/${connection.id}`)}
              style={styles.card}
            >
              <View style={styles.personRow}>
                <Avatar label={formatName(connection)} size={56} uri={connection.avatar_url} />
                <View style={styles.personCopy}>
                  <Text style={styles.personName}>{formatName(connection)}</Text>
                  <Text style={styles.personMeta}>
                    {connection.location || 'Location not set'} • Handicap {connection.handicap ?? 'N/A'}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.bg,
    flex: 1
  },
  content: {
    gap: 20,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 42
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 30
  },
  pageTitle: {
    color: palette.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  section: {
    gap: 14
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 10,
    padding: 20
  },
  helper: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  personRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14
  },
  personCopy: {
    flex: 1,
    gap: 4
  },
  personName: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  personMeta: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  }
})
