import { useCallback, useEffect, useState } from 'react'
import { Redirect, router } from 'expo-router'
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
import { Avatar } from '@/components/Avatar'
import { BrandHeader } from '@/components/BrandHeader'
import { apiGet } from '@/lib/api'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type MessageProfile = {
  id: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
}

type MessageRecord = {
  id: string
  sender: MessageProfile
  recipient: MessageProfile
  message_content: string
  created_at: string
  is_read?: boolean
}

type Conversation = {
  user: MessageProfile
  lastMessage: MessageRecord
  unreadCount: number
}

function formatName(user?: MessageProfile | null) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'UGC Golfer'
}

function formatTimeAgo(timestamp?: string) {
  if (!timestamp) return 'Now'

  const now = new Date()
  const messageTime = new Date(timestamp)
  const diffInMs = now.getTime() - messageTime.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m`
  if (diffInHours < 24) return `${diffInHours}h`
  if (diffInDays < 7) return `${diffInDays}d`
  return messageTime.toLocaleDateString()
}

export default function MessagesScreen() {
  const { loading, user } = useAuth()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])

  const loadInbox = useCallback(async () => {
    if (!user?.id) return

    try {
      const [inboxData, sentData] = await Promise.all([
        apiGet<MessageRecord[]>(`/api/messages?action=inbox&user_id=${encodeURIComponent(user.id)}`),
        apiGet<MessageRecord[]>(`/api/messages?action=sent&user_id=${encodeURIComponent(user.id)}`)
      ])

      const allMessages = [...(inboxData || []), ...(sentData || [])]
      const conversationMap = new Map<string, Conversation>()

      allMessages.forEach((message) => {
        const otherUser = message.sender?.id === user.id ? message.recipient : message.sender
        const otherUserId = otherUser?.id

        if (!otherUserId) return

        const existing = conversationMap.get(otherUserId)
        const unreadCount = allMessages.filter(
          (candidate) => candidate.sender?.id === otherUserId && candidate.recipient?.id === user.id && !candidate.is_read
        ).length

        if (!existing || new Date(message.created_at).getTime() > new Date(existing.lastMessage.created_at).getTime()) {
          conversationMap.set(otherUserId, {
            user: otherUser,
            lastMessage: message,
            unreadCount
          })
        }
      })

      setConversations(
        Array.from(conversationMap.values()).sort(
          (a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
        )
      )
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      setBusy(true)
      loadInbox()
    }
  }, [loadInbox, user?.id])

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
              loadInbox()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <BrandHeader
          title="Inbox"
          showBack
        />

        {busy ? <ActivityIndicator color={palette.aqua} /> : null}
        {!busy && conversations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyBody}>
              Start from a connection profile and your messages will show up here.
            </Text>
          </View>
        ) : null}

        {conversations.map((conversation) => (
          <Pressable
            key={conversation.user.id}
            onPress={() => router.push(`/messages/${conversation.user.id}`)}
            style={styles.card}
          >
            <View style={styles.row}>
              <Avatar label={formatName(conversation.user)} size={58} uri={conversation.user.avatar_url} />
              <View style={styles.copy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{formatName(conversation.user)}</Text>
                  <Text style={styles.time}>{formatTimeAgo(conversation.lastMessage.created_at)}</Text>
                </View>
                <Text style={styles.preview}>Conversation</Text>
              </View>
              {conversation.unreadCount ? (
                <View style={styles.unreadPill}>
                  <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ))}
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
    padding: 18
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14
  },
  copy: {
    flex: 1,
    gap: 6
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  name: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700'
  },
  time: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  preview: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  unreadPill: {
    alignItems: 'center',
    backgroundColor: palette.aqua,
    borderRadius: 999,
    height: 26,
    justifyContent: 'center',
    minWidth: 26,
    paddingHorizontal: 8
  },
  unreadText: {
    color: palette.bg,
    fontSize: 12,
    fontWeight: '800'
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
