'use client'

import React, { useState, useEffect, useRef } from 'react'
import { X, Send, MessageCircle, Users, Heart, Reply } from 'lucide-react'

interface GroupChatModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  userId: string
}

interface Message {
  id: string
  message_content: string
  created_at: string
  sender_id: string
  like_count?: number
  liked_by_user?: boolean
  parent_message_id?: string | null
  replies?: Message[]
  user_profiles: {
    id: string
    first_name: string
    last_name: string
    username: string
    avatar_url: string
  }
}

export default function GroupChatModal({ 
  isOpen, 
  onClose, 
  groupId, 
  groupName, 
  userId 
}: GroupChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [likingMessageId, setLikingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch messages when modal opens
  useEffect(() => {
    if (isOpen && groupId && userId) {
      fetchMessages()
    }
  }, [isOpen, groupId, userId])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/groups/message?group_id=${groupId}&user_id=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.messages)
      } else {
        console.error('Failed to fetch messages:', data.error)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitMessage = async (messageText: string, parentMessageId?: string | null) => {
    const trimmedMessage = messageText.trim()
    if (!trimmedMessage || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/groups/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          user_id: userId,
          message: trimmedMessage,
          parent_message_id: parentMessageId || null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        if (data.messages) {
          setMessages(data.messages)
        } else if (data.message) {
          setMessages(prev => [...prev, data.message])
        }
        if (parentMessageId) {
          setReplyDrafts((prev) => ({ ...prev, [parentMessageId]: '' }))
          setReplyingTo(null)
        } else {
          setNewMessage('')
        }
      } else {
        console.error('Failed to send message:', data.error)
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitMessage(newMessage)
  }

  const toggleLike = async (message: Message) => {
    setLikingMessageId(message.id)
    try {
      const response = await fetch('/api/groups/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: message.liked_by_user ? 'unlike' : 'like',
          group_id: groupId,
          user_id: userId,
          message_id: message.id
        })
      })

      const data = await response.json()

      if (data.success && data.messages) {
        setMessages(data.messages)
      } else {
        alert(data.error || 'Could not update like')
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      alert('Could not update like')
    } finally {
      setLikingMessageId(null)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (!isOpen) return null

  const renderMessage = (message: Message, isReply = false) => (
    <div
      key={message.id}
      className={`${isReply ? 'ml-10 border-l border-white/8 pl-5' : ''}`}
    >
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-slate-600/50">
            <img
              src={message.user_profiles?.avatar_url || '/default-avatar.svg'}
              alt={`${message.user_profiles?.first_name} ${message.user_profiles?.last_name}`}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-semibold text-white">
              {message.user_profiles?.first_name} {message.user_profiles?.last_name}
            </span>
            <span className="text-xs text-slate-400">
              {formatTime(message.created_at)}
            </span>
          </div>
          <div className="bg-slate-700/50 rounded-2xl px-4 py-3 border border-slate-600/30">
            <p className="text-slate-200 text-sm leading-relaxed">
              {message.message_content}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => toggleLike(message)}
              disabled={likingMessageId === message.id}
              className={`inline-flex items-center gap-1 transition ${
                message.liked_by_user ? 'text-rose-300' : 'hover:text-white'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${message.liked_by_user ? 'fill-current' : ''}`} />
              <span>{message.like_count || 0}</span>
            </button>
            {!isReply && (
              <button
                type="button"
                onClick={() => setReplyingTo(replyingTo === message.id ? null : message.id)}
                className="inline-flex items-center gap-1 transition hover:text-white"
              >
                <Reply className="h-3.5 w-3.5" />
                <span>Reply</span>
              </button>
            )}
          </div>
          {!isReply && replyingTo === message.id && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await submitMessage(replyDrafts[message.id] || '', message.id)
              }}
              className="mt-3 flex gap-2"
            >
              <input
                type="text"
                value={replyDrafts[message.id] || ''}
                onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [message.id]: e.target.value }))}
                placeholder="Write a reply..."
                className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!replyDrafts[message.id]?.trim() || sending}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                Reply
              </button>
            </form>
          )}
        </div>
      </div>
      {!!message.replies?.length && (
        <div className="mt-4 space-y-4">
          {message.replies.map((reply) => renderMessage(reply, true))}
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-xl">
                <MessageCircle className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{groupName} Board</h2>
                <p className="text-sm text-slate-300">Posts, replies, and group momentum</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl mb-4">
                <Users className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start the conversation!</h3>
              <p className="text-slate-400">Be the first to send a message in this group chat.</p>
            </div>
          ) : (
            messages.map((message) => renderMessage(message))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-slate-700/50">
          <form onSubmit={sendMessage} className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-500 disabled:to-slate-600 text-white p-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:transform-none"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
