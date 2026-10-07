import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
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
          keyboardShouldPersistTaps="handled"
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
        <View style={styles.conversationHeader}>
          <Pressable accessibilityLabel="Back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons color={palette.ink} name="chevron-back" size={23} />
          </Pressable>
          <View style={styles.headerIdentity}>
            <Avatar label={formatName(otherUser)} size={46} uri={otherUser?.avatar_url} />
            <Text numberOfLines={1} style={styles.headerName}>{formatName(otherUser)}</Text>
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
                <ActivityIndicator color="#fffdf5" size="small" />
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
    gap: 12,
    padding: 16,
    paddingBottom: 24
  },
  conversationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    position: 'relative'
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(21,59,45,0.1)',
    borderColor: 'rgba(21,59,45,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    width: 42
  },
  headerIdentity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    maxWidth: '72%'
  },
  headerName: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '700'
  },
  emptyCard: {
    backgroundColor: 'rgba(246, 242, 232, 0.9)',
    borderColor: 'rgba(255,255,255,0.56)',
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    padding: 18
  },
  emptyTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '700'
  },
  emptyBody: {
    color: '#597268',
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
    borderRadius: 20,
    gap: 8,
    maxWidth: '84%',
    paddingHorizontal: 15,
    paddingVertical: 11
  },
  messageBubbleMine: {
    backgroundColor: '#255f4c',
    borderBottomRightRadius: 6,
    shadowColor: '#153b2d',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 8
  },
  messageBubbleTheirs: {
    backgroundColor: 'rgba(246, 242, 232, 0.95)',
    borderBottomLeftRadius: 6,
    borderColor: 'rgba(255,255,255,0.56)',
    borderWidth: 1,
    shadowColor: '#153b2d',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 8
  },
  messageText: {
    color: palette.ink,
    fontSize: 15,
    lineHeight: 22
  },
  messageTextMine: {
    color: '#fffdf5'
  },
  messageTime: {
    color: '#668077',
    fontSize: 11
  },
  messageTimeMine: {
    color: 'rgba(255,253,245,0.68)'
  },
  composer: {
    backgroundColor: 'rgba(99,147,163,0.96)',
    padding: 12
  },
  composerField: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(246, 242, 232, 0.96)',
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 10
  },
  input: {
    color: palette.ink,
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
    backgroundColor: '#255f4c',
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
    color: '#fffdf5',
    fontSize: 14,
    fontWeight: '800'
  }
})
