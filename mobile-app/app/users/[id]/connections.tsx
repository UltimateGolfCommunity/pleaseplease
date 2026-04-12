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
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
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

type PublicUser = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
}

function formatName(user?: UserCard | PublicUser | null) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'UGC Golfer'
}

export default function PublicUserConnectionsScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [profile, setProfile] = useState<PublicUser | null>(null)

  const connectedGolfers = useMemo(() => {
    if (!id) return []

    return connections
      .map((connection) => (connection.requester_id === id ? connection.recipient : connection.requester))
      .filter(Boolean) as UserCard[]
  }, [connections, id])

  const loadConnections = useCallback(async () => {
    if (!id) return

    try {
      const [profileResponse, connectionsResponse] = await Promise.all([
        apiGet<PublicUser>(`/api/users?id=${encodeURIComponent(id)}`),
        apiGet<ConnectionsPayload>(`/api/users?action=connections&id=${encodeURIComponent(id)}`)
      ])

      setProfile(profileResponse)
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
        <BrandHeader
          title="Connections"
          subtitle={`${formatName(profile)}'s golf network`}
          showBack
        />

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Network</Text>
          <Text style={styles.sectionTitle}>{connectedGolfers.length} connections</Text>
          <Text style={styles.helper}>
            Everyone this golfer is already connected with shows up here.
          </Text>
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
    padding: 20
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
  sectionEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: '700'
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
