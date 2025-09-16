'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, UserPlus, Users, Send, Check, XCircle } from 'lucide-react'

interface InviteMembersModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
  userId: string
}

interface User {
  id: string
  first_name: string
  last_name: string
  username: string
  avatar_url: string
  location: string
  handicap: number
}

interface Invitation {
  id: string
  invited_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  message: string
  created_at: string
  user_profiles: User
}

export default function InviteMembersModal({ 
  isOpen, 
  onClose, 
  groupId, 
  groupName, 
  userId 
}: InviteMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)
  const [inviteMessage, setInviteMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)

  // Fetch sent invitations when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSentInvitations()
    }
  }, [isOpen])

  const fetchSentInvitations = async () => {
    setLoadingInvitations(true)
    try {
      const response = await fetch(`/api/groups/invitations?group_id=${groupId}&user_id=${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setSentInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching sent invitations:', error)
    } finally {
      setLoadingInvitations(false)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/users?action=search&q=${encodeURIComponent(query)}&_t=${Date.now()}`)
      const data = await response.json()
      
      if (data.success) {
        console.log('🔍 Search API response:', data)
        console.log('👥 Raw users from API:', data.users)
        
        // Filter out current user and already invited users
        const filteredUsers = data.users.filter((user: User) => 
          user.id !== userId && 
          !sentInvitations.some(inv => inv.invited_user_id === user.id)
        )
        
        console.log('✅ Filtered users:', filteredUsers)
        console.log('🎯 Setting search results:', filteredUsers.length, 'users')
        setSearchResults(filteredUsers)
      } else {
        console.log('❌ Search failed:', data)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const sendInvitation = async (user: User) => {
    setSending(true)
    try {
      const response = await fetch('/api/groups/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          group_id: groupId,
          invited_user_id: user.id,
          user_id: userId,
          message: inviteMessage.trim() || null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Add to sent invitations
        setSentInvitations(prev => [...prev, data.invitation])
        // Remove from search results
        setSearchResults(prev => prev.filter(u => u.id !== user.id))
        setInviteMessage('')
        alert('Invitation sent successfully!')
      } else {
        alert(`Failed to send invitation: ${data.error}`)
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      alert('Failed to send invitation. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="h-4 w-4 text-green-400" />
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-400" />
      case 'pending':
        return <div className="h-4 w-4 rounded-full bg-yellow-400 animate-pulse" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Accepted'
      case 'declined':
        return 'Declined'
      case 'pending':
        return 'Pending'
      default:
        return 'Unknown'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 w-full max-w-4xl h-[700px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-xl">
                <UserPlus className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invite Members</h2>
                <p className="text-sm text-slate-300">Add new members to {groupName}</p>
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

        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Search and Invite */}
          <div className="w-1/2 p-6 border-r border-slate-700/50 flex flex-col">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                Search for users to invite
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    searchUsers(e.target.value)
                  }}
                  placeholder="Search by name or username..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {(() => {
                console.log('🎨 Rendering search results:', { searching, searchResults: searchResults.length, searchQuery })
                return null
              })()}
              {searching ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : searchResults.length === 0 && searchQuery ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Users className="h-12 w-12 text-slate-500 mb-2" />
                  <p className="text-slate-400">No users found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <div key={user.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-slate-600/50">
                          <img
                            src={user.avatar_url || '/default-avatar.svg'}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {user.first_name} {user.last_name}
                          </h4>
                          <p className="text-xs text-slate-400">@{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-slate-400 mb-3">
                        {user.location && (
                          <span>📍 {user.location}</span>
                        )}
                        <span>🏌️ Handicap: {user.handicap || 'N/A'}</span>
                      </div>
                      <button
                        onClick={() => sendInvitation(user)}
                        disabled={sending}
                        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-4 py-2 rounded-lg transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Send Invitation</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invite Message */}
            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Personal message (optional)
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Add a personal message to your invitation..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Right Panel - Sent Invitations */}
          <div className="w-1/2 p-6 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-emerald-400" />
              Sent Invitations
            </h3>
            
            <div className="flex-1 overflow-y-auto">
              {loadingInvitations ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : sentInvitations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <UserPlus className="h-12 w-12 text-slate-500 mb-2" />
                  <p className="text-slate-400">No invitations sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sentInvitations.map((invitation) => (
                    <div key={invitation.id} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="h-8 w-8 rounded-lg overflow-hidden border-2 border-slate-600/50">
                          <img
                            src={invitation.user_profiles?.avatar_url || '/default-avatar.svg'}
                            alt={`${invitation.user_profiles?.first_name} ${invitation.user_profiles?.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {invitation.user_profiles?.first_name} {invitation.user_profiles?.last_name}
                          </h4>
                          <p className="text-xs text-slate-400">@{invitation.user_profiles?.username}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(invitation.status)}
                          <span className="text-xs text-slate-400">
                            {getStatusText(invitation.status)}
                          </span>
                        </div>
                      </div>
                      {invitation.message && (
                        <p className="text-xs text-slate-300 bg-slate-800/50 rounded-lg p-2 mt-2">
                          "{invitation.message}"
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-2">
                        Sent {new Date(invitation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
