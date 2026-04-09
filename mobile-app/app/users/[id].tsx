import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type PublicUser = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
  location?: string | null
  handicap?: number | null
  bio?: string | null
}

type ConnectionStatusResponse = {
  success: boolean
  status: 'none' | 'pending' | 'incoming_pending' | 'connected'
}

export default function PublicUserScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [profile, setProfile] = useState<PublicUser | null>(null)
  const [status, setStatus] = useState<ConnectionStatusResponse['status']>('none')

  const displayName = useMemo(() => {
    return (
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      profile?.username ||
      'UGC Golfer'
    )
  }, [profile])

  const loadUser = useCallback(async () => {
    if (!id) return

    try {
      const [profileResponse, statusResponse] = await Promise.all([
        apiGet<PublicUser>(`/api/users?id=${encodeURIComponent(id)}`),
        user?.id
          ? apiGet<ConnectionStatusResponse>(
              `/api/users?action=status&id=${encodeURIComponent(id)}&viewer_id=${encodeURIComponent(user.id)}`
            )
          : Promise.resolve({ success: true, status: 'none' as const })
      ])

      setProfile(profileResponse)
      setStatus(statusResponse.status)
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    if (id) {
      setBusy(true)
      loadUser()
    }
  }, [id, loadUser])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleConnect = async () => {
    if (!user?.id || !id) return

    setConnecting(true)
    try {
      await apiPost('/api/users', {
        action: 'connect',
        user_id: user.id,
        connected_user_id: id
      })
      await loadUser()
      Alert.alert('Connection sent', 'This golfer can now accept your request.')
    } catch (error) {
      Alert.alert('Unable to connect', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  const actionLabel =
    status === 'connected'
      ? 'Connected'
      : status === 'pending'
        ? 'Request Sent'
      : status === 'incoming_pending'
          ? 'Accept on web for now'
          : 'Add Connection'
  const statusLabel =
    status === 'connected'
      ? 'Already connected'
      : status === 'pending'
        ? 'Request pending'
        : status === 'incoming_pending'
          ? 'Incoming request'
          : 'Open to connect'

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadUser()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader
          title="Golfer"
          subtitle="Public golfer cards can become clean native profile moments for invites, connections, and future badges."
          showBack
        />

        <View style={styles.card}>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          <Text style={styles.sectionEyebrow}>Golfer</Text>
          <Avatar label={displayName} size={104} uri={profile?.avatar_url} />
          <Text style={styles.name}>{displayName}</Text>
          <View style={styles.statusPill}>
            <Text style={styles.statusLabel}>{statusLabel}</Text>
          </View>
          {profile?.location ? <Text style={styles.meta}>{profile.location}</Text> : null}
          <Text style={styles.meta}>Handicap: {profile?.handicap ?? 'Not set yet'}</Text>
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
          <PrimaryButton
            disabled={status === 'connected' || status === 'pending' || status === 'incoming_pending'}
            label={actionLabel}
            loading={connecting}
            onPress={handleConnect}
          />
          {status === 'connected' ? (
            <PrimaryButton label="Message" variant="ghost" onPress={() => router.push(`/messages/${id}`)} />
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionEyebrow}>Connection</Text>
          <Text style={styles.sectionTitle}>What happens next</Text>
          <Text style={styles.bio}>
            Add this golfer to start building your network. Once connected, tee times, groups, and future score activity can flow between both players.
          </Text>
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
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.25)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  statusLabel: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700'
  },
  name: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '700'
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
  meta: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  bio: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  }
})
