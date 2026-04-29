import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

function formatName(user?: MessageProfile | null) {
  return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'UGC Golfer'
}

function formatMessageTime(timestamp?: string) {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

export default function ConversationScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [busy, setBusy] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [draft, setDraft] = useState('')

  const loadConversation = useCallback(async () => {
    if (!id || !user?.id) return

    try {
      const data = await apiGet<MessageRecord[]>(`/api/messages?action=conversation&conversation_id=${encodeURIComponent(id)}`)
      const filtered = (data || []).filter(
        (message) =>
          (message.sender?.id === user.id && message.recipient?.id === id) ||
          (message.sender?.id === id && message.recipient?.id === user.id)
      )

      setMessages(filtered)

      const unread = filtered.filter((message) => message.recipient?.id === user.id && !message.is_read)
      await Promise.all(
        unread.map((message) =>
          apiPost('/api/messages', {
            action: 'mark_read',
            message_id: message.id
          }).catch(() => null)
        )
      )
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    if (id && user?.id) {
      setBusy(true)
      loadConversation()
    }
  }, [id, loadConversation, user?.id])

  const otherUser = useMemo(() => {
    const seen = messages.find((message) => message.sender?.id === id || message.recipient?.id === id)
    if (!seen) return null
    return seen.sender?.id === id ? seen.sender : seen.recipient
  }, [id, messages])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

  const handleSend = async () => {
    if (!user?.id || !id || !draft.trim()) return

    setSending(true)

    try {
      await apiPost('/api/messages', {
        action: 'send',
        sender_id: user.id,
        recipient_id: id,
        message_content: draft.trim()
      })
      setDraft('')
      await loadConversation()
    } catch (error) {
      Alert.alert('Unable to send message', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.safeArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                loadConversation()
              }}
              tintColor={palette.aqua}
            />
          }
        >
        <BrandHeader
          title={formatName(otherUser)}
          showBack
        />

        <View style={styles.headerCard}>
          <Avatar label={formatName(otherUser)} size={68} uri={otherUser?.avatar_url} />
            <View style={styles.headerCopy}>
              <Text style={styles.headerName}>{formatName(otherUser)}</Text>
              <Text style={styles.headerMeta}>Conversation</Text>
            </View>
          </View>

          {busy ? <ActivityIndicator color={palette.aqua} /> : null}

          {!busy && messages.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyBody}>Say hello and get a round on the books.</Text>
            </View>
          ) : null}

          {messages.map((message) => {
            const mine = message.sender?.id === user?.id
            const otherParticipant = mine ? message.recipient : message.sender

            return (
              <View key={message.id} style={[styles.messageRow, mine && styles.messageRowMine]}>
                {!mine ? (
                  <Avatar
                    label={formatName(otherParticipant)}
                    size={34}
                    uri={otherParticipant?.avatar_url}
                  />
                ) : null}
                <View style={[styles.messageBubble, mine ? styles.messageBubbleMine : styles.messageBubbleTheirs]}>
                  <Text style={[styles.messageText, mine && styles.messageTextMine]}>{message.message_content}</Text>
                  <Text style={[styles.messageTime, mine && styles.messageTimeMine]}>
                    {formatMessageTime(message.created_at)}
                  </Text>
                </View>
              </View>
            )
          })}
        </ScrollView>

        <View style={styles.composer}>
          <View style={styles.composerField}>
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder="Write a message"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              value={draft}
            />
            <Pressable disabled={sending || !draft.trim()} onPress={() => void handleSend()} style={[styles.sendButton, (sending || !draft.trim()) && styles.sendButtonDisabled]}>
              {sending ? (
                <ActivityIndicator color={palette.bg} size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    padding: 20,
    paddingBottom: 120
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 18
  },
  headerCopy: {
    flex: 1,
    gap: 4
  },
  headerName: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  headerMeta: {
    color: palette.textMuted,
    fontSize: 14
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
  },
  messageRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10
  },
  messageRowMine: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  messageBubble: {
    borderRadius: 22,
    gap: 8,
    maxWidth: '84%',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  messageBubbleMine: {
    backgroundColor: palette.white
  },
  messageBubbleTheirs: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderWidth: 1
  },
  messageText: {
    color: palette.text,
    fontSize: 15,
    lineHeight: 22
  },
  messageTextMine: {
    color: palette.bg
  },
  messageTime: {
    color: palette.textMuted,
    fontSize: 12
  },
  messageTimeMine: {
    color: 'rgba(2, 6, 23, 0.62)'
  },
  composer: {
    backgroundColor: palette.bg,
    borderTopColor: palette.border,
    borderTopWidth: 1,
    padding: 16
  },
  composerField: {
    alignItems: 'flex-end',
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10
  },
  input: {
    color: palette.text,
    flex: 1,
    maxHeight: 120,
    minHeight: 56,
    paddingHorizontal: 8,
    paddingTop: 10,
    textAlignVertical: 'top'
  },
  sendButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: palette.white,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
    minWidth: 72,
    paddingHorizontal: 16
  },
  sendButtonDisabled: {
    opacity: 0.5
  },
  sendButtonText: {
    color: palette.bg,
    fontSize: 14,
    fontWeight: '800'
  }
})
