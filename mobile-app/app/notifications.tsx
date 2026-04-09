import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable
} from 'react-native'
import { BrandHeader } from '@/components/BrandHeader'
import { apiGet, apiPost } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type NotificationRecord = {
  id: string
  type?: string
  title?: string
  message?: string
  created_at?: string
  is_read?: boolean
  read?: boolean
}

type NotificationsPayload = {
  notifications: NotificationRecord[]
}

function formatTimeAgo(timestamp?: string) {
  if (!timestamp) return 'Now'

  const now = new Date()
  const noteTime = new Date(timestamp)
  const diffInMs = now.getTime() - noteTime.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  if (diffInHours < 24) return `${diffInHours}h`
  if (diffInDays < 7) return `${diffInDays}d`
  return noteTime.toLocaleDateString()
}

export default function NotificationsScreen() {
  const { loading, user } = useAuth()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !(notification.is_read ?? notification.read)).length,
    [notifications]
  )

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      const response = await apiGet<NotificationsPayload>(`/api/notifications?user_id=${encodeURIComponent(user.id)}`)
      setNotifications(response.notifications || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      loadNotifications()
    }
  }, [loadNotifications, user?.id])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleMarkRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, is_read: true, read: true } : notification
      )
    )

    await apiPost('/api/notifications', {
      action: 'mark_read',
      notification_id: notificationId
    }).catch(() => null)
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
              loadNotifications()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader
          title="Notifications"
          subtitle={`Updates from tee times, groups, and your network all land here.${unreadCount ? ` ${unreadCount} unread.` : ''}`}
          showBack
        />

        {busy ? <ActivityIndicator color={palette.aqua} /> : null}
        {!busy && notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyBody}>When people interact with your golf world, updates will show up here.</Text>
          </View>
        ) : null}

        {notifications.map((notification) => {
          const unread = !(notification.is_read ?? notification.read)

          return (
            <Pressable
              key={notification.id}
              onPress={() => void handleMarkRead(notification.id)}
              style={[styles.card, unread && styles.cardUnread]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.title}>{notification.title || 'Update'}</Text>
                <Text style={styles.time}>{formatTimeAgo(notification.created_at)}</Text>
              </View>
              {notification.message ? <Text style={styles.message}>{notification.message}</Text> : null}
              <View style={styles.metaRow}>
                {notification.type ? <Text style={styles.typePill}>{notification.type.replace(/_/g, ' ')}</Text> : null}
                {unread ? <Text style={styles.unreadLabel}>Unread</Text> : <Text style={styles.readLabel}>Read</Text>}
              </View>
            </Pressable>
          )
        })}
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
    gap: 18,
    padding: 20
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    padding: 18
  },
  cardUnread: {
    borderColor: 'rgba(103,232,249,0.28)'
  },
  cardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  title: {
    color: palette.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '700'
  },
  time: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  message: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10
  },
  typePill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    color: palette.textMuted,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'capitalize'
  },
  unreadLabel: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700'
  },
  readLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700'
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
