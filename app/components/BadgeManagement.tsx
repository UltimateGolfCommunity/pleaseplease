'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Award, 
  Crown, 
  Star, 
  Trophy,
  Users,
  Plus,
  Check,
  X,
  Search
} from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  icon_name: string
  category: string
  rarity: string
  points: number
}

interface UserBadge {
  id: string
  earned_at: string
  earned_reason: string
  badge: Badge
}

interface User {
  id: string
  first_name: string
  last_name: string
  username: string
  email: string
}

export default function BadgeManagement() {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'award' | 'founding' | 'view'>('award')
  const [badges, setBadges] = useState<Badge[]>([])
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [foundingMembers, setFoundingMembers] = useState<any[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchBadges()
    fetchFoundingMembers()
    if (currentUser?.id) {
      fetchUserBadges(currentUser.id)
    }
  }, [currentUser?.id])

  const fetchBadges = async () => {
    try {
      const response = await fetch('/api/badges?action=all')
      if (response.ok) {
        const data = await response.json()
        setBadges(data)
      }
    } catch (error) {
      console.error('Error fetching badges:', error)
    }
  }

  const fetchUserBadges = async (userId: string) => {
    try {
      const response = await fetch(`/api/badges?action=user_badges&user_id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUserBadges(data)
      }
    } catch (error) {
      console.error('Error fetching user badges:', error)
    }
  }

  const fetchFoundingMembers = async () => {
    try {
      const response = await fetch('/api/badges?action=founding_members')
      if (response.ok) {
        const data = await response.json()
        setFoundingMembers(data)
      }
    } catch (error) {
      console.error('Error fetching founding members:', error)
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
        setSearchResults(data)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const awardBadge = async () => {
    if (!selectedUser || !selectedBadge) {
      setMessage('Please select both a user and a badge')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'award_badge',
          user_id: selectedUser.id,
          badge_name: selectedBadge.name,
          reason: `Manually awarded by admin`
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ ${selectedBadge.name} badge awarded to ${selectedUser.first_name} ${selectedUser.last_name}!`)
        setSelectedUser(null)
        setSelectedBadge(null)
        fetchFoundingMembers()
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error awarding badge:', error)
      setMessage('❌ Failed to award badge')
    } finally {
      setLoading(false)
    }
  }

  const awardFoundingMemberBadge = async (userId: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'award_founding_member',
          user_id: userId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ Founding Member badge awarded!`)
        fetchFoundingMembers()
      } else {
        setMessage(`❌ Error: ${data.error || data.message}`)
      }
    } catch (error) {
      console.error('Error awarding founding member badge:', error)
      setMessage('❌ Failed to award founding member badge')
    } finally {
      setLoading(false)
    }
  }

  const awardFirst20 = async () => {
    try {
      setLoading(true)
      setMessage('⏳ Awarding founding member badges to first 20 users...')
      
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'award_first_20'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ Founding Member badges processed! Badges awarded: ${data.badges_awarded || 0}`)
        fetchFoundingMembers()
      } else {
        setMessage(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error awarding first 20 badges:', error)
      setMessage('❌ Failed to award badges to first 20 users')
    } finally {
      setLoading(false)
    }
  }

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'crown': return <Crown className="h-5 w-5" />
      case 'star': return <Star className="h-5 w-5" />
      case 'trophy': return <Trophy className="h-5 w-5" />
      default: return <Award className="h-5 w-5" />
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-orange-400 bg-orange-500/20 border-orange-400/30'
      case 'epic': return 'text-purple-400 bg-purple-500/20 border-purple-400/30'
      case 'rare': return 'text-blue-400 bg-blue-500/20 border-blue-400/30'
      case 'uncommon': return 'text-green-400 bg-green-500/20 border-green-400/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30'
    }
  }

  return (
    <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Award className="h-6 w-6 mr-2 text-emerald-400" />
          Badge Management
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-700/30 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('award')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'award'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Award Badge
        </button>
        <button
          onClick={() => setActiveTab('founding')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'founding'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Founding Members
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'view'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          My Badges
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="mb-4 p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg">
          <p className="text-white text-sm">{message}</p>
        </div>
      )}

      {/* Award Badge Tab */}
      {activeTab === 'award' && (
        <div className="space-y-6">
          {/* User Search */}
          <div>
            <label className="block text-white font-medium mb-2">Search User</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchUsers(e.target.value)
                }}
                placeholder="Search users by name or username..."
                className="w-full bg-gray-700/50 text-white placeholder-gray-400 border border-gray-600/50 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto bg-gray-700/50 rounded-lg border border-gray-600/50">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUser(user)
                      setSearchQuery(`${user.first_name} ${user.last_name}`)
                      setSearchResults([])
                    }}
                    className="p-3 hover:bg-gray-600/50 cursor-pointer flex items-center space-x-3"
                  >
                    <Users className="h-4 w-4 text-emerald-400" />
                    <div className="text-white">
                      {user.first_name} {user.last_name} (@{user.username})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Badge Selection */}
          <div>
            <label className="block text-white font-medium mb-2">Select Badge</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadge(badge)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedBadge?.id === badge.id
                      ? 'bg-emerald-500/20 border-emerald-400/50'
                      : 'bg-gray-700/30 border-gray-600/50 hover:border-gray-500/50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getRarityColor(badge.rarity)}`}>
                      {getBadgeIcon(badge.icon_name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{badge.name}</h3>
                      <p className="text-gray-400 text-sm">{badge.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${getRarityColor(badge.rarity)}`}>
                          {badge.rarity}
                        </span>
                        <span className="text-xs text-gray-400">{badge.points} pts</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Award Button */}
          <button
            onClick={awardBadge}
            disabled={!selectedUser || !selectedBadge || loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <Plus className="h-5 w-5 mr-2" />
            )}
            Award Badge
          </button>
        </div>
      )}

      {/* Founding Members Tab */}
      {activeTab === 'founding' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-white">Founding Members</h3>
            <button
              onClick={awardFirst20}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <Crown className="h-4 w-4 mr-2" />
              Award to First 20
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foundingMembers.map((member, index) => (
              <div key={member.id} className="bg-gray-700/30 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-500/20 p-2 rounded-lg">
                    <Crown className="h-5 w-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">
                      {member.user?.first_name} {member.user?.last_name}
                    </h4>
                    <p className="text-gray-400 text-sm">@{member.user?.username}</p>
                    <p className="text-orange-400 text-xs">{member.earned_reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {foundingMembers.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <Crown className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p>No founding members yet</p>
            </div>
          )}
        </div>
      )}

      {/* My Badges Tab */}
      {activeTab === 'view' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white">My Badges</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userBadges.map((userBadge) => (
              <div key={userBadge.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/50">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getRarityColor(userBadge.badge.rarity)}`}>
                    {getBadgeIcon(userBadge.badge.icon_name)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{userBadge.badge.name}</h4>
                    <p className="text-gray-400 text-sm">{userBadge.badge.description}</p>
                    <p className="text-emerald-400 text-xs mt-1">{userBadge.earned_reason}</p>
                    <p className="text-gray-500 text-xs">
                      Earned: {new Date(userBadge.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {userBadges.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <Award className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <p>No badges earned yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
