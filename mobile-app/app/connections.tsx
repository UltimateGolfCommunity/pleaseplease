import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
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

type RequestsPayload = {
  success: boolean
  incoming: ConnectionRecord[]
  outgoing: ConnectionRecord[]
}

type SearchPayload = {
  success: boolean
  users: UserCard[]
}

function formatName(user?: UserCard | null) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'UGC Golfer'
}

export default function ConnectionsScreen() {
  const { loading, user } = useAuth()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searching, setSearching] = useState(false)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserCard[]>([])
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [incoming, setIncoming] = useState<ConnectionRecord[]>([])
  const [outgoing, setOutgoing] = useState<ConnectionRecord[]>([])

  const acceptedConnections = useMemo(() => {
    return connections.map((connection) =>
      connection.requester_id === user?.id ? connection.recipient : connection.requester
    )
  }, [connections, user?.id])

  const loadConnections = useCallback(async () => {
    if (!user?.id) return

    try {
      const [connectionsResponse, requestsResponse] = await Promise.all([
        apiGet<ConnectionsPayload>(`/api/users?action=connections&id=${encodeURIComponent(user.id)}`),
        apiGet<RequestsPayload>(`/api/users?action=requests&id=${encodeURIComponent(user.id)}`)
      ])

      setConnections(connectionsResponse.connections || [])
      setIncoming(requestsResponse.incoming || [])
      setOutgoing(requestsResponse.outgoing || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      loadConnections()
    }
  }, [loadConnections, user?.id])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setSearching(true)

    try {
      const response = await apiGet<SearchPayload>(`/api/users?search=${encodeURIComponent(query.trim())}`)
      setResults((response.users || []).filter((candidate) => candidate.id !== user?.id))
    } catch (error) {
      Alert.alert('Unable to search golfers', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleConnect = async (targetId: string) => {
    if (!user?.id) return

    setConnectingId(targetId)

    try {
      await apiPost('/api/users', {
        action: 'connect',
        user_id: user.id,
        connected_user_id: targetId
      })
      await loadConnections()
      await handleSearch()
    } catch (error) {
      Alert.alert('Unable to connect', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setConnectingId(null)
    }
  }

  const handleRespond = async (connectionId: string, response: 'accept' | 'decline') => {
    if (!user?.id) return

    setRespondingId(connectionId)

    try {
      await apiPost('/api/users', {
        action: 'respond_connection',
        connection_id: connectionId,
        user_id: user.id,
        response
      })
      await loadConnections()
    } catch (error) {
      Alert.alert('Unable to update request', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setRespondingId(null)
    }
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
          subtitle="Search golfers, respond to requests, and keep your network feeling native on mobile."
          showBack
        />

        <View style={styles.searchCard}>
          <Text style={styles.sectionEyebrow}>Discover golfers</Text>
          <TextInput
            onChangeText={setQuery}
            onSubmitEditing={() => void handleSearch()}
            placeholder="Search by name, username, or city"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={query}
          />
          <PrimaryButton
            label={searching ? 'Searching...' : 'Search'}
            loading={searching}
            onPress={() => void handleSearch()}
          />
          {results.map((candidate) => (
            <View key={candidate.id} style={styles.card}>
              <Pressable onPress={() => router.push(`/users/${candidate.id}`)} style={styles.personRow}>
                <Avatar label={formatName(candidate)} size={56} uri={candidate.avatar_url} />
                <View style={styles.personCopy}>
                  <Text style={styles.personName}>{formatName(candidate)}</Text>
                  <Text style={styles.personMeta}>
                    {candidate.location || 'Location not set'} • Handicap {candidate.handicap ?? 'N/A'}
                  </Text>
                </View>
              </Pressable>
              <PrimaryButton
                label="Connect"
                loading={connectingId === candidate.id}
                onPress={() => void handleConnect(candidate.id)}
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Incoming</Text>
          <Text style={styles.sectionTitle}>Requests waiting on you</Text>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && incoming.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No pending requests</Text>
              <Text style={styles.emptyBody}>When golfers add you, their requests will land here.</Text>
            </View>
          ) : null}
          {incoming.map((connection) => {
            const golfer = connection.requester

            return (
              <View key={connection.id} style={styles.card}>
                <Pressable onPress={() => router.push(`/users/${golfer?.id}`)} style={styles.personRow}>
                  <Avatar label={formatName(golfer)} size={56} uri={golfer?.avatar_url} />
                  <View style={styles.personCopy}>
                    <Text style={styles.personName}>{formatName(golfer)}</Text>
                    <Text style={styles.personMeta}>{golfer?.location || 'Location not set'}</Text>
                  </View>
                </Pressable>
                <View style={styles.buttonRow}>
                  <PrimaryButton
                    label="Accept"
                    loading={respondingId === connection.id}
                    onPress={() => void handleRespond(connection.id, 'accept')}
                  />
                  <PrimaryButton
                    label="Decline"
                    variant="ghost"
                    loading={respondingId === connection.id}
                    onPress={() => void handleRespond(connection.id, 'decline')}
                  />
                </View>
              </View>
            )
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Your network</Text>
          <Text style={styles.sectionTitle}>Accepted connections</Text>
          {!busy && acceptedConnections.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No connections yet</Text>
              <Text style={styles.emptyBody}>Search golfers above and start building your UGC network.</Text>
            </View>
          ) : null}
          {acceptedConnections.map((connection) =>
            connection ? (
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
            ) : null
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Outgoing</Text>
          <Text style={styles.sectionTitle}>Requests you sent</Text>
          {!busy && outgoing.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No outgoing requests</Text>
              <Text style={styles.emptyBody}>Pending invites you send will stay visible here.</Text>
            </View>
          ) : null}
          {outgoing.map((connection) => {
            const golfer = connection.recipient

            return (
              <Pressable
                key={connection.id}
                onPress={() => router.push(`/users/${golfer?.id}`)}
                style={styles.card}
              >
                <View style={styles.personRow}>
                  <Avatar label={formatName(golfer)} size={56} uri={golfer?.avatar_url} />
                  <View style={styles.personCopy}>
                    <Text style={styles.personName}>{formatName(golfer)}</Text>
                    <Text style={styles.personMeta}>Request pending</Text>
                  </View>
                </View>
              </Pressable>
            )
          })}
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
  searchCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  section: {
    gap: 12
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
    fontSize: 22,
    fontWeight: '700'
  },
  input: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 54,
    paddingHorizontal: 16
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 18
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
    fontSize: 17,
    fontWeight: '700'
  },
  personMeta: {
    color: palette.textMuted,
    fontSize: 14
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10
  },
  emptyCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700'
  },
  emptyBody: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  }
})
