'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  Send,
  User,
  UserPlus,
  Users,
  X
} from 'lucide-react'

interface ConnectionProfile {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
  location?: string | null
  handicap?: number | null
  bio?: string | null
}

interface ConnectionRecord {
  id: string
  requester_id: string
  recipient_id: string
  status: string
  requester?: ConnectionProfile | null
  recipient?: ConnectionProfile | null
}

interface GolfGroup {
  id: string
  name: string
  group_type?: string | null
}

interface ConnectionsHubProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onConnectionCountChange?: (count: number) => void
}

function getOtherProfile(connection: ConnectionRecord, userId: string) {
  return connection.requester_id === userId ? connection.recipient : connection.requester
}

function formatName(profile?: ConnectionProfile | null) {
  if (!profile) return 'Unknown golfer'
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
  return fullName || profile.username || 'Unknown golfer'
}

export default function ConnectionsHub({
  isOpen,
  onClose,
  userId,
  onConnectionCountChange
}: ConnectionsHubProps) {
  const router = useRouter()
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRecord[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRecord[]>([])
  const [userGroups, setUserGroups] = useState<GolfGroup[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ConnectionProfile[]>([])
  const [loadingHub, setLoadingHub] = useState(false)
  const [searching, setSearching] = useState(false)
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [messageTarget, setMessageTarget] = useState<ConnectionProfile | null>(null)
  const [messageBody, setMessageBody] = useState('')
  const [inviteTarget, setInviteTarget] = useState<ConnectionProfile | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')

  const connectionMap = useMemo(() => {
    const map = new Map<string, 'connected' | 'outgoing' | 'incoming'>()

    connections.forEach((connection) => {
      const profile = getOtherProfile(connection, userId)
      if (profile?.id) {
        map.set(profile.id, 'connected')
      }
    })

    outgoingRequests.forEach((connection) => {
      const profile = getOtherProfile(connection, userId)
      if (profile?.id) {
        map.set(profile.id, 'outgoing')
      }
    })

    incomingRequests.forEach((connection) => {
      const profile = getOtherProfile(connection, userId)
      if (profile?.id) {
        map.set(profile.id, 'incoming')
      }
    })

    return map
  }, [connections, incomingRequests, outgoingRequests, userId])

  const loadHubData = async () => {
    setLoadingHub(true)

    try {
      const [connectionsResponse, requestsResponse, groupsResponse] = await Promise.all([
        fetch(`/api/users?action=connections&id=${userId}`),
        fetch(`/api/users?action=requests&id=${userId}`),
        fetch(`/api/groups?user_id=${userId}`)
      ])

      const [connectionsData, requestsData, groupsData] = await Promise.all([
        connectionsResponse.json(),
        requestsResponse.json(),
        groupsResponse.json()
      ])

      const nextConnections = connectionsData.connections || []
      setConnections(nextConnections)
      setIncomingRequests(requestsData.incoming || [])
      setOutgoingRequests(requestsData.outgoing || [])
      setUserGroups(groupsData.groups || [])
      onConnectionCountChange?.(nextConnections.length)
    } catch (error) {
      console.error('Error loading connections hub:', error)
    } finally {
      setLoadingHub(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHubData()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = window.setTimeout(async () => {
      setSearching(true)

      try {
        const response = await fetch(`/api/users?action=search&q=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()
        const users = (data.users || []).filter((profile: ConnectionProfile) => profile.id !== userId)
        setSearchResults(users)
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setSearching(false)
      }
    }, 250)

    return () => window.clearTimeout(timer)
  }, [isOpen, searchQuery, userId])

  const handleSendConnectionRequest = async (targetUserId: string) => {
    setActionKey(`connect-${targetUserId}`)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          user_id: userId,
          connected_user_id: targetUserId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Unable to send connection request')
        return
      }

      await loadHubData()
    } catch (error) {
      console.error('Error sending connection request:', error)
      alert('Unable to send connection request right now')
    } finally {
      setActionKey(null)
    }
  }

  const handleRespondToRequest = async (connectionId: string, responseType: 'accept' | 'decline') => {
    setActionKey(`${responseType}-${connectionId}`)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond_connection',
          connection_id: connectionId,
          user_id: userId,
          response: responseType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Unable to update connection request')
        return
      }

      await loadHubData()
    } catch (error) {
      console.error('Error responding to request:', error)
      alert('Unable to update the request right now')
    } finally {
      setActionKey(null)
    }
  }

  const handleSendMessage = async () => {
    if (!messageTarget || !messageBody.trim()) return

    setActionKey(`message-${messageTarget.id}`)

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          sender_id: userId,
          recipient_id: messageTarget.id,
          message_content: messageBody.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Unable to send message')
        return
      }

      setMessageBody('')
      setMessageTarget(null)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Unable to send message right now')
    } finally {
      setActionKey(null)
    }
  }

  const handleInviteToGroup = async () => {
    if (!inviteTarget || !selectedGroupId) return

    setActionKey(`invite-${inviteTarget.id}`)

    try {
      const response = await fetch('/api/groups/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          group_id: selectedGroupId,
          invited_user_id: inviteTarget.id,
          user_id: userId,
          message: inviteMessage.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Unable to send group invite')
        return
      }

      setInviteTarget(null)
      setSelectedGroupId('')
      setInviteMessage('')
    } catch (error) {
      console.error('Error sending group invitation:', error)
      alert('Unable to send group invite right now')
    } finally {
      setActionKey(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
        <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_32%),linear-gradient(180deg,#0f172a,#020617)] shadow-2xl">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-300/75">Connections</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Your golf network</h2>
                <p className="mt-2 max-w-2xl text-sm text-white/65">
                  Search for players, accept requests, message your network, and invite the right people into your groups.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Connected</p>
                <p className="mt-2 text-2xl font-semibold text-white">{connections.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Incoming Requests</p>
                <p className="mt-2 text-2xl font-semibold text-white">{incomingRequests.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Groups You Can Invite To</p>
                <p className="mt-2 text-2xl font-semibold text-white">{userGroups.length}</p>
              </div>
            </div>
          </div>

          <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[1.1fr,0.9fr]">
            <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
              <div className="rounded-[1.6rem] border border-emerald-400/20 bg-emerald-400/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-200">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Find golfers</h3>
                    <p className="text-sm text-white/60">Search by name, username, or city and start building your local network.</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3">
                  <Search className="h-4 w-4 text-white/40" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search players..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                  {searching && <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />}
                </div>
              </div>

              <div className="mt-5 h-[calc(100%-10rem)] overflow-y-auto pr-1">
                {searchQuery && searchResults.length === 0 && !searching ? (
                  <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-white/5 px-6 py-10 text-center text-white/55">
                    No golfers found for that search yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((profile) => {
                      const status = connectionMap.get(profile.id) || 'none'
                      const loadingThis = actionKey === `connect-${profile.id}`

                      return (
                        <div
                          key={profile.id}
                          className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]"
                        >
                          <div className="flex items-start gap-4">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={formatName(profile)}
                                className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white">
                                <User className="h-6 w-6" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="truncate text-lg font-semibold text-white">{formatName(profile)}</h4>
                                {profile.handicap !== null && profile.handicap !== undefined && (
                                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                    HCP {profile.handicap}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white/45">@{profile.username || 'golfer'}</p>
                              {profile.location && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-white/45">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{profile.location}</span>
                                </div>
                              )}
                              {profile.bio && <p className="mt-3 line-clamp-2 text-sm text-white/60">{profile.bio}</p>}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => router.push(`/users/${profile.id}`)}
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                            >
                              View profile
                            </button>
                            {status === 'none' && (
                              <button
                                onClick={() => handleSendConnectionRequest(profile.id)}
                                disabled={loadingThis}
                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60"
                              >
                                {loadingThis ? 'Sending...' : 'Add connection'}
                              </button>
                            )}
                            {status === 'outgoing' && (
                              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-100">
                                Request pending
                              </div>
                            )}
                            {status === 'incoming' && (
                              <button
                                onClick={() => {
                                  const request = incomingRequests.find((item) => getOtherProfile(item, userId)?.id === profile.id)
                                  if (request) {
                                    handleRespondToRequest(request.id, 'accept')
                                  }
                                }}
                                className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white"
                              >
                                Accept request
                              </button>
                            )}
                            {status === 'connected' && (
                              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100">
                                <Check className="h-4 w-4" />
                                Connected
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid overflow-hidden lg:grid-rows-[0.8fr,1.2fr]">
              <div className="border-b border-white/10 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Pending requests</h3>
                    <p className="mt-1 text-sm text-white/55">Keep your network moving by accepting the right golfers.</p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/65">
                    {incomingRequests.length + outgoingRequests.length}
                  </div>
                </div>

                <div className="mt-4 max-h-[18rem] space-y-3 overflow-y-auto pr-1">
                  {incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
                    <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-white/5 px-5 py-8 text-center text-sm text-white/50">
                      No pending requests right now.
                    </div>
                  ) : (
                    <>
                      {incomingRequests.map((connection) => {
                        const profile = getOtherProfile(connection, userId)
                        const loadingAccept = actionKey === `accept-${connection.id}`
                        const loadingDecline = actionKey === `decline-${connection.id}`

                        return (
                          <div key={connection.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-base font-semibold text-white">{formatName(profile)}</p>
                                <p className="text-sm text-white/50">wants to connect with you</p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRespondToRequest(connection.id, 'decline')}
                                  disabled={loadingAccept || loadingDecline}
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70"
                                >
                                  {loadingDecline ? '...' : 'Decline'}
                                </button>
                                <button
                                  onClick={() => handleRespondToRequest(connection.id, 'accept')}
                                  disabled={loadingAccept || loadingDecline}
                                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-3 py-2 text-sm font-semibold text-white"
                                >
                                  {loadingAccept ? '...' : 'Accept'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {outgoingRequests.map((connection) => {
                        const profile = getOtherProfile(connection, userId)

                        return (
                          <div key={connection.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4">
                            <p className="text-base font-semibold text-white">{formatName(profile)}</p>
                            <p className="mt-1 text-sm text-white/50">Pending approval</p>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Your connections</h3>
                    <p className="mt-1 text-sm text-white/55">Message them, view their profile, or bring them into one of your groups.</p>
                  </div>
                  {loadingHub && <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />}
                </div>

                <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {!loadingHub && connections.length === 0 ? (
                    <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-white/5 px-5 py-10 text-center">
                      <Users className="mx-auto h-10 w-10 text-white/30" />
                      <p className="mt-3 text-sm text-white/55">Your accepted connections will show up here.</p>
                    </div>
                  ) : (
                    connections.map((connection) => {
                      const profile = getOtherProfile(connection, userId)

                      return (
                        <div key={connection.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4">
                          <div className="flex items-start gap-4">
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={formatName(profile)}
                                className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10"
                              />
                            ) : (
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white">
                                <User className="h-6 w-6" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="truncate text-lg font-semibold text-white">{formatName(profile)}</h4>
                                {profile?.handicap !== null && profile?.handicap !== undefined && (
                                  <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                    HCP {profile.handicap}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-white/45">@{profile?.username || 'golfer'}</p>
                              {profile?.location && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-white/45">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span>{profile.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => router.push(`/users/${profile?.id}`)}
                              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                            >
                              View profile
                            </button>
                            <button
                              onClick={() => {
                                setMessageTarget(profile || null)
                                setMessageBody('')
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/25 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-100"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Message
                            </button>
                            <button
                              onClick={() => {
                                setInviteTarget(profile || null)
                                setSelectedGroupId(userGroups[0]?.id || '')
                                setInviteMessage('')
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100"
                            >
                              <UserPlus className="h-4 w-4" />
                              Add to group
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {messageTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[1.8rem] border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-blue-200/70">Direct Message</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Message {formatName(messageTarget)}</h3>
              </div>
              <button
                onClick={() => setMessageTarget(null)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/65"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              placeholder="Send a note about a round, a new group, or a match..."
              className="mt-5 h-40 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none placeholder:text-white/35"
            />

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setMessageTarget(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageBody.trim() || actionKey === `message-${messageTarget.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {actionKey === `message-${messageTarget.id}` ? 'Sending...' : 'Send message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {inviteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[1.8rem] border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-200/70">Group Invite</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Invite {formatName(inviteTarget)}</h3>
              </div>
              <button
                onClick={() => setInviteTarget(null)}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/65"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {userGroups.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/12 bg-white/5 px-5 py-8 text-center text-sm text-white/55">
                Join or create a group first, then you can invite connections into it.
              </div>
            ) : (
              <>
                <select
                  value={selectedGroupId}
                  onChange={(event) => setSelectedGroupId(event.target.value)}
                  className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                >
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.id} className="bg-slate-950">
                      {group.name} {group.group_type ? `(${group.group_type === 'course' ? 'Course' : 'Community'})` : ''}
                    </option>
                  ))}
                </select>

                <textarea
                  value={inviteMessage}
                  onChange={(event) => setInviteMessage(event.target.value)}
                  placeholder="Optional note about why this group is a good fit..."
                  className="mt-4 h-32 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white outline-none placeholder:text-white/35"
                />
              </>
            )}

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setInviteTarget(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteToGroup}
                disabled={userGroups.length === 0 || !selectedGroupId || actionKey === `invite-${inviteTarget.id}`}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {actionKey === `invite-${inviteTarget.id}` ? 'Sending...' : 'Send invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
