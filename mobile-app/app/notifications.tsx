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

type PendingApplication = {
  id: string
  tee_time_id?: string
  applicant_id?: string
  status?: string
  tee_times?: {
    id?: string
    course_name?: string
    tee_time_date?: string
    tee_time_time?: string
  } | null
  applicant?: {
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    handicap?: number | null
  } | null
}

type PendingApplicationsPayload = {
  applications: PendingApplication[]
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

function formatDisplayDate(date?: string, time?: string) {
  if (!date) return 'No date set'

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })

  if (!time) return dateLabel
  return `${dateLabel} at ${time.slice(0, 5)}`
}

function formatApplicantName(application: PendingApplication) {
  return (
    [application.applicant?.first_name, application.applicant?.last_name].filter(Boolean).join(' ') ||
    application.applicant?.username ||
    'UGC Golfer'
  )
}

export default function NotificationsScreen() {
  const { loading, user } = useAuth()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([])
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !(notification.is_read ?? notification.read)).length,
    [notifications]
  )

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      const [response, pendingResponse] = await Promise.all([
        apiGet<NotificationsPayload>(`/api/notifications?user_id=${encodeURIComponent(user.id)}`),
        apiGet<PendingApplicationsPayload>(
          `/api/tee-times?action=get-pending-applications&user_id=${encodeURIComponent(user.id)}`
        ).catch(() => ({ applications: [] }))
      ])
      setNotifications(response.notifications || [])
      setPendingApplications(pendingResponse.applications || [])
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

  const handleReviewApplication = async (
    applicationId: string,
    teeTimeCreatorId: string,
    actionType: 'accept' | 'reject'
  ) => {
    setReviewingApplicationId(applicationId)

    try {
      await apiPost('/api/tee-times', {
        action: 'manage_application',
        application_id: applicationId,
        action_type: actionType,
        tee_time_creator_id: teeTimeCreatorId
      })

      setNotifications((current) => [
        {
          id: `${actionType}-${applicationId}-${Date.now()}`,
          type: actionType === 'accept' ? 'tee_time_request_accepted' : 'tee_time_request_declined',
          title: actionType === 'accept' ? 'Request accepted' : 'Request declined',
          message:
            actionType === 'accept'
              ? 'That golfer has been added to the tee time.'
              : 'That join request was declined.',
          created_at: new Date().toISOString(),
          is_read: false
        },
        ...current
      ])

      await loadNotifications()
    } finally {
      setReviewingApplicationId(null)
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

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending requests</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{pendingApplications.length}</Text>
            </View>
          </View>
          {busy ? <ActivityIndicator color={palette.aqua} /> : null}
          {!busy && pendingApplications.length === 0 ? (
            <Text style={styles.emptyBody}>Tee time join requests that need your review will show up here.</Text>
          ) : null}
          {pendingApplications.map((application) => (
            <View key={application.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.title}>{formatApplicantName(application)}</Text>
                <Text style={styles.time}>Handicap {application.applicant?.handicap ?? 'N/A'}</Text>
              </View>
              <Text style={styles.message}>
                Wants to join {application.tee_times?.course_name || 'your tee time'} on{' '}
                {formatDisplayDate(application.tee_times?.tee_time_date, application.tee_times?.tee_time_time)}.
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => user?.id && handleReviewApplication(application.id, user.id, 'accept')}
                  style={[styles.actionButton, styles.actionButtonPrimary]}
                >
                  <Text style={styles.actionButtonPrimaryText}>
                    {reviewingApplicationId === application.id ? 'Working...' : 'Accept'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => user?.id && handleReviewApplication(application.id, user.id, 'reject')}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>
                    {reviewingApplicationId === application.id ? 'Working...' : 'Decline'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{notifications.length}</Text>
            </View>
          </View>

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
    gap: 18,
    padding: 20
  },
  sectionCard: {
    gap: 14
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  countPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  countPillText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800'
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
  actionRow: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14
  },
  actionButtonPrimary: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  actionButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700'
  },
  actionButtonPrimaryText: {
    color: palette.aqua,
    fontSize: 14,
    fontWeight: '700'
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
