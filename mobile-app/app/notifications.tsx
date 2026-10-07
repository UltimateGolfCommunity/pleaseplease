import { useCallback, useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
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
import { apiGet, apiPost } from '@/lib/api'
import { Avatar } from '@/components/Avatar'
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
    avatar_url?: string | null
  } | null
}

type PendingApplicationsPayload = {
  applications: PendingApplication[]
}

type GroupInvitation = {
  id: string
  group?: { id?: string; name?: string | null; logo_url?: string | null; image_url?: string | null } | null
  inviter?: { first_name?: string | null; last_name?: string | null; username?: string | null } | null
}

type ConnectionRequest = {
  id: string
  requester?: {
    id?: string
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
    location?: string | null
    handicap?: number | null
  } | null
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

function formatConnectionName(request: ConnectionRequest) {
  return [request.requester?.first_name, request.requester?.last_name].filter(Boolean).join(' ') || request.requester?.username || 'UGC Golfer'
}

function notificationIcon(type?: string): keyof typeof Ionicons.glyphMap {
  if (type?.includes('connection')) return 'people-outline'
  if (type?.includes('tee_time')) return 'golf-outline'
  if (type?.includes('tournament')) return 'trophy-outline'
  if (type?.includes('message')) return 'chatbubble-outline'
  if (type?.includes('group')) return 'people-circle-outline'
  return 'notifications-outline'
}

export default function NotificationsScreen() {
  const { loading, user } = useAuth()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([])
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([])
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([])
  const [reviewingApplicationId, setReviewingApplicationId] = useState<string | null>(null)
  const [reviewingInvitationId, setReviewingInvitationId] = useState<string | null>(null)
  const [reviewingConnectionId, setReviewingConnectionId] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      const [response, pendingResponse, invitationsResponse, connectionResponse] = await Promise.all([
        apiGet<NotificationsPayload>(`/api/notifications?user_id=${encodeURIComponent(user.id)}`),
        apiGet<PendingApplicationsPayload>(
          `/api/tee-times?action=get-pending-applications&user_id=${encodeURIComponent(user.id)}`
        ).catch(() => ({ applications: [] })),
        apiGet<{ success: boolean; invitations: GroupInvitation[] }>(`/api/groups/invitations?user_id=${encodeURIComponent(user.id)}`).catch(() => ({ success: true, invitations: [] })),
        apiGet<{ success: boolean; incoming: ConnectionRequest[] }>(`/api/users?action=requests&id=${encodeURIComponent(user.id)}`).catch(() => ({ success: true, incoming: [] }))
      ])
      setNotifications(response.notifications || [])
      setPendingApplications(pendingResponse.applications || [])
      setGroupInvitations(invitationsResponse.invitations || [])
      setConnectionRequests(connectionResponse.incoming || [])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [user?.id])

  const handleGroupInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    if (!user?.id) return
    setReviewingInvitationId(invitationId)
    try {
      await apiPost('/api/groups/invitations', { action, invitation_id: invitationId, user_id: user.id })
      await loadNotifications()
    } finally {
      setReviewingInvitationId(null)
    }
  }

  const handleConnectionRequest = async (connectionId: string, response: 'accept' | 'decline') => {
    if (!user?.id) return
    setReviewingConnectionId(connectionId)
    try {
      await apiPost('/api/users', { action: 'respond_connection', connection_id: connectionId, user_id: user.id, response })
      await loadNotifications()
    } finally {
      setReviewingConnectionId(null)
    }
  }

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

  const pendingCount = connectionRequests.length + groupInvitations.length + pendingApplications.length
  const unreadCount = notifications.filter((notification) => !(notification.is_read ?? notification.read)).length

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
        <View style={styles.hero}><View><Text style={styles.heroEyebrow}>YOUR GOLF WORLD</Text><Text style={styles.heroTitle}>Notifications</Text><Text style={styles.heroSubtitle}>{unreadCount ? `${unreadCount} new update${unreadCount === 1 ? '' : 's'} waiting for you` : 'You are all caught up.'}</Text></View><View style={styles.heroBell}><Ionicons color="#8be9f7" name="notifications-outline" size={24} /></View></View>
        {busy ? <ActivityIndicator color={palette.aqua} /> : null}
        {pendingCount ? <View style={styles.section}>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>ACTION CENTER</Text><Text style={styles.sectionTitle}>Pending requests</Text></View><View style={styles.countPill}><Text style={styles.countPillText}>{pendingCount}</Text></View></View>
          <View style={styles.requestStack}>
            {connectionRequests.map((request) => <View key={request.id} style={styles.requestCard}><View style={styles.requestIdentity}><Avatar label={formatConnectionName(request)} size={48} uri={request.requester?.avatar_url} /><View style={styles.requestCopy}><Text style={styles.title}>{formatConnectionName(request)}</Text><Text style={styles.message}>Wants to join your golf network.</Text></View></View><View style={styles.actionRow}><Pressable onPress={() => void handleConnectionRequest(request.id, 'accept')} style={[styles.actionButton, styles.actionButtonPrimary]}><Text style={styles.actionButtonPrimaryText}>{reviewingConnectionId === request.id ? 'Working…' : 'Accept'}</Text></Pressable><Pressable onPress={() => void handleConnectionRequest(request.id, 'decline')} style={styles.actionButton}><Text style={styles.actionButtonText}>Decline</Text></Pressable></View></View>)}
            {groupInvitations.map((invitation) => { const inviterName = [invitation.inviter?.first_name, invitation.inviter?.last_name].filter(Boolean).join(' ') || invitation.inviter?.username || 'A golfer'; return <View key={invitation.id} style={styles.requestCard}><View style={styles.requestIdentity}><Avatar label={invitation.group?.name || 'Group'} shape="rounded" size={48} uri={invitation.group?.logo_url || invitation.group?.image_url} /><View style={styles.requestCopy}><Text style={styles.title}>Join {invitation.group?.name || 'a golf group'}</Text><Text style={styles.message}>{inviterName} invited you to their community.</Text></View></View><View style={styles.actionRow}><Pressable onPress={() => void handleGroupInvitation(invitation.id, 'accept')} style={[styles.actionButton, styles.actionButtonPrimary]}><Text style={styles.actionButtonPrimaryText}>{reviewingInvitationId === invitation.id ? 'Working…' : 'Accept'}</Text></Pressable><Pressable onPress={() => void handleGroupInvitation(invitation.id, 'decline')} style={styles.actionButton}><Text style={styles.actionButtonText}>Decline</Text></Pressable></View></View> })}
            {pendingApplications.map((application) => <View key={application.id} style={styles.requestCard}><View style={styles.requestIdentity}><Avatar label={formatApplicantName(application)} size={48} uri={application.applicant?.avatar_url} /><View style={styles.requestCopy}><Text style={styles.title}>{formatApplicantName(application)}</Text><Text style={styles.message}>Wants to join {application.tee_times?.course_name || 'your tee time'} · {formatDisplayDate(application.tee_times?.tee_time_date, application.tee_times?.tee_time_time)}</Text></View></View><View style={styles.actionRow}><Pressable onPress={() => user?.id && void handleReviewApplication(application.id, user.id, 'accept')} style={[styles.actionButton, styles.actionButtonPrimary]}><Text style={styles.actionButtonPrimaryText}>{reviewingApplicationId === application.id ? 'Working…' : 'Accept'}</Text></Pressable><Pressable onPress={() => user?.id && void handleReviewApplication(application.id, user.id, 'reject')} style={styles.actionButton}><Text style={styles.actionButtonText}>Decline</Text></Pressable></View></View>)}
          </View>
        </View> : null}
        <View style={styles.section}>
          <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>RECENT</Text><Text style={styles.sectionTitle}>Your updates</Text></View>{notifications.length ? <Text style={styles.sectionMeta}>Tap to mark read</Text> : null}</View>
          {!busy && notifications.length === 0 ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><Ionicons color="#8be9f7" name="checkmark" size={24} /></View><Text style={styles.emptyTitle}>Nothing new right now</Text><Text style={styles.emptyBody}>Connection, tournament, tee-time, and message updates will appear here.</Text></View> : null}
          {notifications.map((notification) => { const unread = !(notification.is_read ?? notification.read); return <Pressable key={notification.id} onPress={() => void handleMarkRead(notification.id)} style={[styles.notificationCard, unread && styles.notificationCardUnread]}><View style={[styles.notificationIcon, unread && styles.notificationIconUnread]}><Ionicons color={unread ? palette.aqua : palette.textMuted} name={notificationIcon(notification.type)} size={21} /></View><View style={styles.notificationCopy}><View style={styles.notificationTop}><Text numberOfLines={1} style={styles.title}>{notification.title || 'Update'}</Text><Text style={styles.time}>{formatTimeAgo(notification.created_at)}</Text></View>{notification.message ? <Text style={styles.message}>{notification.message}</Text> : null}</View>{unread ? <View style={styles.unreadDot} /> : null}</Pressable> })}
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
  hero: {
    alignItems: 'center',
    backgroundColor: 'rgba(15,64,49,0.7)',
    borderColor: 'rgba(232,204,135,0.24)',
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18
  },
  heroEyebrow: {
    color: '#e8cc87',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4
  },
  heroTitle: {
    color: palette.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4
  },
  heroSubtitle: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 3
  },
  heroBell: {
    alignItems: 'center',
    backgroundColor: 'rgba(139,233,247,0.12)',
    borderColor: 'rgba(139,233,247,0.2)',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44
  },
  sectionCard: {
    gap: 14
  },
  section: {
    gap: 12
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  sectionEyebrow: {
    color: palette.aqua,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  sectionMeta: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700'
  },
  requestStack: {
    gap: 10
  },
  requestCard: {
    backgroundColor: 'rgba(20,71,55,0.9)',
    borderColor: 'rgba(232,204,135,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 13,
    padding: 14
  },
  requestIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11
  },
  requestCopy: {
    flex: 1,
    gap: 2
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
  notificationCard: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(14,59,46,0.64)',
    borderColor: 'rgba(232,216,178,0.14)',
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 13
  },
  notificationCardUnread: {
    backgroundColor: 'rgba(38,96,80,0.82)',
    borderColor: 'rgba(139,233,247,0.3)'
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  notificationIconUnread: {
    backgroundColor: 'rgba(139,233,247,0.13)'
  },
  notificationCopy: {
    flex: 1,
    gap: 3
  },
  notificationTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  unreadDot: {
    backgroundColor: palette.aqua,
    borderRadius: 4,
    height: 8,
    marginTop: 6,
    width: 8
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
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(139,233,247,0.1)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40
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
