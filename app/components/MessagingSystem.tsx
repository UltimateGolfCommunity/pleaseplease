'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  MessageCircle, 
  Send, 
  Search, 
  Inbox, 
  Mail, 
  User,
  Clock,
  CheckCircle,
  X,
  MoreVertical
} from 'lucide-react'

interface Message {
  id: string
  sender: {
    id: string
    first_name: string
    last_name: string
  }
  recipient: {
    id: string
    first_name: string
    last_name: string
  }
  message_content: string
  created_at: string
  is_read: boolean
}

interface Conversation {
  user: {
    id: string
    first_name: string
    last_name: string
  }
  lastMessage: Message
  unreadCount: number
}

export default function MessagingSystem() {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'conversations' | 'compose'>('conversations')
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [conversationMessages, setConversationMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [composeMessage, setComposeMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showMobileConversation, setShowMobileConversation] = useState(false)

  useEffect(() => {
    if (currentUser?.id) {
      fetchMessages()
    }
  }, [currentUser?.id])

  const fetchMessages = async () => {
    if (!currentUser?.id) return

    try {
      setLoading(true)
      
      // Fetch inbox and sent messages
      const [inboxResponse, sentResponse] = await Promise.all([
        fetch(`/api/messages?action=inbox&user_id=${currentUser.id}`),
        fetch(`/api/messages?action=sent&user_id=${currentUser.id}`)
      ])

      const [inboxData, sentData] = await Promise.all([
        inboxResponse.json(),
        sentResponse.json()
      ])

      const allMessages = [...inboxData, ...sentData]
      setMessages(allMessages)
      
      // Group messages into conversations
      const conversationMap = new Map<string, Conversation>()
      
      allMessages.forEach((message: Message) => {
        const otherUserId = message.sender.id === currentUser.id 
          ? message.recipient.id 
          : message.sender.id
        const otherUser = message.sender.id === currentUser.id 
          ? message.recipient 
          : message.sender

        const existing = conversationMap.get(otherUserId)
        if (!existing || new Date(message.created_at) > new Date(existing.lastMessage.created_at)) {
          const unreadCount = allMessages.filter(m => 
            m.sender.id === otherUserId && 
            m.recipient.id === currentUser.id && 
            !m.is_read
          ).length

          conversationMap.set(otherUserId, {
            user: otherUser,
            lastMessage: message,
            unreadCount
          })
        }
      })

      setConversations(Array.from(conversationMap.values()).sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      ))

    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConversation = async (userId: string) => {
    if (!currentUser?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/messages?action=conversation&conversation_id=${userId}`)
      const data = await response.json()
      
      // Filter to only show messages between current user and selected user
      const filteredMessages = data.filter((msg: Message) => 
        (msg.sender.id === currentUser.id && msg.recipient.id === userId) ||
        (msg.sender.id === userId && msg.recipient.id === currentUser.id)
      )
      
      setConversationMessages(filteredMessages)
      setSelectedConversation(userId)
      setShowMobileConversation(true)

      // Mark messages as read
      const unreadMessages = filteredMessages.filter((msg: Message) => 
        msg.recipient.id === currentUser.id && !msg.is_read
      )
      
      for (const msg of unreadMessages) {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'mark_read',
            message_id: msg.id
          })
        })
      }

      // Refresh conversations to update unread counts
      fetchMessages()

    } catch (error) {
      console.error('Error fetching conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUser?.id) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          sender_id: currentUser.id,
          recipient_id: selectedConversation,
          message_content: newMessage
        })
      })

      if (response.ok) {
        setNewMessage('')
        fetchConversation(selectedConversation)
        fetchMessages() // Refresh conversations
      } else {
        const errorData = await response.json()
        alert('Failed to send message: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const sendNewMessage = async () => {
    if (!composeMessage.trim() || !selectedRecipient || !currentUser?.id) return

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          sender_id: currentUser.id,
          recipient_id: selectedRecipient.id,
          message_content: composeMessage
        })
      })

      if (response.ok) {
        setComposeMessage('')
        setSelectedRecipient(null)
        setActiveTab('conversations')
        fetchMessages()
        alert('Message sent successfully!')
      } else {
        const errorData = await response.json()
        alert('Failed to send message: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: query
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.filter((user: any) => user.id !== currentUser?.id))
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const messageTime = new Date(timestamp)
    const diffInMs = now.getTime() - messageTime.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`
    return messageTime.toLocaleDateString()
  }

  if (!currentUser) {
    return (
      <div className="text-center text-gray-400 py-8">
        Please log in to access messaging
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 sm:p-6 h-[600px] sm:h-[700px] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center">
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-emerald-400" />
          Messages
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm sm:text-base ${
              activeTab === 'conversations'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                : 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/30'
            }`}
          >
            <Inbox className="h-4 w-4 mr-1 sm:mr-2 inline" />
            <span className="hidden sm:inline">Inbox</span>
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-2 sm:px-4 rounded-lg transition-colors text-sm sm:text-base ${
              activeTab === 'compose'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                : 'bg-gray-600/20 text-gray-300 hover:bg-gray-600/30'
            }`}
          >
            <Mail className="h-4 w-4 mr-1 sm:mr-2 inline" />
            <span className="hidden sm:inline">Compose</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <>
            {/* Mobile: Show conversation list or conversation detail */}
            {showMobileConversation && selectedConversation ? (
              /* Mobile Conversation Detail View */
              <div className="w-full flex flex-col">
                {/* Mobile Header with Back Button */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/50">
                  <button
                    onClick={() => setShowMobileConversation(false)}
                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                    <span className="text-sm">Back</span>
                  </button>
                  <div className="text-white font-medium">
                    {conversations.find(c => c.user.id === selectedConversation)?.user.first_name} {conversations.find(c => c.user.id === selectedConversation)?.user.last_name}
                  </div>
                  <div className="w-16"></div> {/* Spacer for centering */}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-6 px-2">
                  {conversationMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-3 rounded-lg ${
                          message.sender.id === currentUser.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <div className="text-sm sm:text-base leading-relaxed">{message.message_content}</div>
                        <div className="text-xs opacity-75 mt-2 flex items-center justify-between">
                          <span>{formatTimeAgo(message.created_at)}</span>
                          {message.sender.id === currentUser.id && (
                            <span className="ml-2">
                              {message.is_read ? <CheckCircle className="h-3 w-3 inline text-emerald-200" /> : <Clock className="h-3 w-3 inline text-emerald-200" />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex space-x-3 bg-gray-800/30 rounded-xl p-3 border border-gray-600/30">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center min-w-[50px]"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Desktop: Side-by-side layout OR Mobile: Conversation list only */
              <>
                {/* Conversations List */}
                <div className="w-full sm:w-1/3 border-r-0 sm:border-r border-gray-700/50 pr-0 sm:pr-4 mb-4 sm:mb-0">
                  {loading ? (
                    <div className="text-center text-gray-400 py-6 text-sm sm:text-base">Loading conversations...</div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center text-gray-400 py-6 text-sm sm:text-base">No conversations yet</div>
                  ) : (
                    <div className="space-y-3 max-h-40 sm:max-h-full overflow-y-auto px-1">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.user.id}
                          onClick={() => fetchConversation(conversation.user.id)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation === conversation.user.id
                              ? 'bg-emerald-500/20 border border-emerald-400/30'
                              : 'bg-gray-700/30 hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-black" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-white font-medium text-sm sm:text-base truncate">
                                  {conversation.user.first_name} {conversation.user.last_name}
                                </div>
                                <div className="text-gray-400 text-xs sm:text-sm truncate max-w-28 sm:max-w-36">
                                  {conversation.lastMessage.message_content}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs text-gray-400 mb-1">
                                {formatTimeAgo(conversation.lastMessage.created_at)}
                              </div>
                              {conversation.unreadCount > 0 && (
                                <div className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Messages View - Desktop Only */}
                <div className="hidden sm:flex flex-1 pl-4 flex-col">
                  {selectedConversation ? (
                    <>
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto space-y-4 mb-6 px-2">
                        {conversationMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 py-3 rounded-lg ${
                                message.sender.id === currentUser.id
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-700 text-white'
                              }`}
                            >
                              <div className="text-sm sm:text-base leading-relaxed">{message.message_content}</div>
                              <div className="text-xs opacity-75 mt-2 flex items-center justify-between">
                                <span>{formatTimeAgo(message.created_at)}</span>
                                {message.sender.id === currentUser.id && (
                                  <span className="ml-2">
                                    {message.is_read ? <CheckCircle className="h-3 w-3 inline text-emerald-200" /> : <Clock className="h-3 w-3 inline text-emerald-200" />}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div className="flex space-x-3 bg-gray-800/30 rounded-xl p-3 border border-gray-600/30">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..."
                          className="flex-1 bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center min-w-[50px]"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      Select a conversation to start messaging
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Compose Tab */}
        {activeTab === 'compose' && (
          <div className="w-full flex flex-col">
            {/* User Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  placeholder="Search for users to message..."
                  className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg pl-10 pr-4 py-2 sm:py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-32 sm:max-h-40 overflow-y-auto bg-gray-700/50 rounded-lg border border-gray-600/50">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => {
                        setSelectedRecipient(user)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                      className="p-2 sm:p-3 hover:bg-gray-600/50 cursor-pointer flex items-center space-x-2 sm:space-x-3"
                    >
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                      </div>
                      <div className="text-white text-sm sm:text-base truncate">
                        {user.first_name} {user.last_name} (@{user.username})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Recipient */}
            {selectedRecipient && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-black" />
                  </div>
                  <div className="text-emerald-400">
                    To: {selectedRecipient.first_name} {selectedRecipient.last_name}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecipient(null)}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Message Compose */}
            <div className="flex-1 flex flex-col">
              <textarea
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                placeholder={selectedRecipient ? "Type your message..." : "Select a recipient first"}
                disabled={!selectedRecipient}
                className="flex-1 bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={sendNewMessage}
                  disabled={!composeMessage.trim() || !selectedRecipient}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
