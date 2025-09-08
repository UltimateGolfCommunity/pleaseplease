'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  User, 
  MapPin, 
  Calendar, 
  Trophy, 
  Flag, 
  ArrowLeft,
  MessageCircle,
  UserPlus,
  Users,
  Clock,
  Star,
  TrendingUp,
  Mail,
  Phone,
  Globe,
  QrCode
} from 'lucide-react'
import Logo from '@/app/components/Logo'
import QRCodeGenerator from '@/app/components/QRCodeGenerator'
import SimpleQRScanner from '@/app/components/SimpleQRScanner'

interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
  email: string | null
  bio: string | null
  handicap: number | null
  home_course: string | null
  location: string | null
  avatar_url: string | null
  header_image_url: string | null
  created_at: string
  updated_at: string
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none')
  const [showMessageForm, setShowMessageForm] = useState(false)
  const [message, setMessage] = useState('')
  const [showQRCode, setShowQRCode] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        console.log('🔍 Fetching user profile for ID:', params.id)
        
        // Try fetching by user ID first
        const response = await fetch(`/api/users?action=profile&id=${params.id}`)
        if (response.ok) {
          const userData = await response.json()
          if (userData && userData.id) {
            setUser(userData)
          } else {
            // If not found by ID, try searching by username
            const searchResponse = await fetch(`/api/users?action=search&q=${params.id}`)
            if (searchResponse.ok) {
              const searchData = await searchResponse.json()
              const foundUser = searchData.find((u: UserProfile) => 
                u.username === params.id || u.id === params.id
              )
              if (foundUser) {
                setUser(foundUser)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchUser()
    }
  }, [params.id])

  const handleConnect = async () => {
    if (!currentUser?.id) {
      alert('You must be logged in to send connection requests')
      return
    }

    try {
      setConnectionStatus('pending')
      
      console.log('🔗 Sending connection request from:', currentUser.id, 'to:', user?.id)
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          user_id: currentUser.id,
          connected_user_id: user?.id
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Connection request successful:', result)
        setConnectionStatus('connected')
        alert('Connection request sent successfully!')
      } else {
        const errorData = await response.json()
        console.error('❌ Connection request failed:', errorData)
        setConnectionStatus('none')
        alert('Failed to send connection request: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error connecting:', error)
      setConnectionStatus('none')
      alert('Failed to send connection request')
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    if (!currentUser?.id) {
      alert('You must be logged in to send messages')
      return
    }
    
    try {
      console.log('💬 Sending message from:', currentUser.id, 'to:', user?.id)
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          sender_id: currentUser.id,
          recipient_id: user?.id,
          message_content: message
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Message sent successfully:', result)
        setMessage('')
        setShowMessageForm(false)
        alert('Message sent successfully!')
      } else {
        const errorData = await response.json()
        console.error('❌ Message failed:', errorData)
        alert('Failed to send message: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    }
  }

  const handleQRScan = async (qrData: any) => {
    try {
      console.log('📱 QR Code scanned:', qrData)
      
      if (qrData.type !== 'golf_connection') {
        alert('Invalid QR code. Please scan a golf connection QR code.')
        return
      }

      if (qrData.userId === currentUser?.id) {
        alert('Cannot connect to yourself!')
        return
      }

      // Send connection request via QR code API
      const response = await fetch('/api/connections/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: qrData.userId,
          qrData: JSON.stringify(qrData)
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ QR connection request sent:', result)
        alert(`Connection request sent to ${qrData.userName}!`)
        setShowQRScanner(false)
        // Refresh connection status
        fetchConnectionStatus()
      } else {
        const errorData = await response.json()
        console.error('❌ QR connection failed:', errorData)
        alert('Failed to send connection request: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error processing QR scan:', error)
      alert('Failed to process QR code')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">User Not Found</h1>
          <p className="text-gray-400 mb-6">The user you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg transition-colors duration-300"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left - Back Button and Logo */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-300 hover:text-emerald-400 transition-colors duration-300 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="hidden sm:block">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
              <Logo size="lg" />
            </div>
            
            {/* Center - Page Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-xl font-semibold text-white">User Profile</h1>
            </div>
            
            {/* Right - Empty for balance */}
            <div></div>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl mb-8">
          {/* Background Header Image */}
          {user.header_image_url && (
            <div className="absolute inset-0">
              <img
                src={user.header_image_url}
                alt="Profile Header"
                className="w-full h-48 object-cover opacity-30"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 to-gray-800/60"></div>
            </div>
          )}
          <div className="relative p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
            {/* Profile Picture */}
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-4 border-emerald-500/30 bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-lg">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.first_name} ${user.last_name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/default-avatar.svg'
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-cyan-400 flex items-center justify-center">
                    <User className="h-12 w-12 text-black" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {user.first_name} {user.last_name}
                </h1>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {user.handicap && (
                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm border border-emerald-400/30">
                      Handicap: {user.handicap}
                    </span>
                  )}
                  <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-400/30">
                    @{user.username}
                  </span>
                </div>
              </div>
              
              {user.bio && (
                <p className="text-gray-300 text-lg mb-4">{user.bio}</p>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-6 text-sm text-gray-400 mb-6">
                {user.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {user.location}
                  </div>
                )}
                {user.home_course && (
                  <div className="flex items-center">
                    <Flag className="h-4 w-4 mr-2" />
                    {user.home_course}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                {connectionStatus === 'none' && (
                  <button
                    onClick={handleConnect}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center justify-center"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    Connect
                  </button>
                )}
                
                {connectionStatus === 'pending' && (
                  <button className="w-full sm:w-auto bg-gray-600/20 text-gray-300 border border-gray-600/30 px-6 py-3 rounded-lg flex items-center justify-center" disabled>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300 mr-2"></div>
                    Request Sent
                  </button>
                )}
                
                {connectionStatus === 'connected' && (
                  <button className="w-full sm:w-auto bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-6 py-3 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 mr-2" />
                    Connected
                  </button>
                )}

                <button
                  onClick={() => setShowMessageForm(!showMessageForm)}
                  className="w-full sm:w-auto bg-gray-600/20 text-gray-300 border border-gray-600/30 px-6 py-3 rounded-lg hover:bg-gray-600/30 transition-colors duration-300 flex items-center justify-center"
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Message
                </button>

                {/* QR Code Buttons */}
                <button
                  onClick={() => setShowQRCode(!showQRCode)}
                  className="w-full sm:w-auto bg-blue-600/20 text-blue-300 border border-blue-600/30 px-6 py-3 rounded-lg hover:bg-blue-600/30 transition-colors duration-300 flex items-center justify-center"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  My QR Code
                </button>

                <button
                  onClick={() => setShowQRScanner(true)}
                  className="w-full sm:w-auto bg-purple-600/20 text-purple-300 border border-purple-600/30 px-6 py-3 rounded-lg hover:bg-purple-600/30 transition-colors duration-300 flex items-center justify-center"
                >
                  <QrCode className="h-5 w-5 mr-2" />
                  Scan QR Code
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Message Form */}
        {showMessageForm && (
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Send Message to {user.first_name}</h3>
            <div className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                placeholder="Write your message here..."
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                >
                  Send Message
                </button>
                <button
                  onClick={() => setShowMessageForm(false)}
                  className="bg-gray-600/20 text-gray-300 border border-gray-600/30 px-6 py-3 rounded-lg hover:bg-gray-600/30 transition-colors duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QR Code Display */}
        {showQRCode && currentUser && (
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">My QR Code</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex justify-center">
              <QRCodeGenerator
                userId={currentUser.id}
                userName={`${currentUser.user_metadata?.first_name || ''} ${currentUser.user_metadata?.last_name || ''}`.trim()}
                size={200}
              />
            </div>
            <p className="text-center text-gray-400 text-sm mt-4">
              Share this QR code with other golfers to connect instantly!
            </p>
          </div>
        )}

        {/* QR Code Scanner */}
        {showQRScanner && (
          <SimpleQRScanner
            onScan={handleQRScan}
            onClose={() => setShowQRScanner(false)}
          />
        )}

        {/* Profile Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Golf Information */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-emerald-400" />
                Golf Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Handicap</label>
                  <p className="text-white">{user.handicap ? user.handicap : 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Home Course</label>
                  <p className="text-white">{user.home_course || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <p className="text-white">{user.location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
                  <p className="text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-emerald-400" />
                Recent Activity
              </h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-gray-300">
                  <span>Posted a tee time for Saturday</span>
                  <span className="text-gray-500">2 days ago</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Joined "Weekend Warriors" group</span>
                  <span className="text-gray-500">1 week ago</span>
                </div>
                <div className="flex items-center justify-between text-gray-300">
                  <span>Updated profile information</span>
                  <span className="text-gray-500">2 weeks ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-emerald-400" />
                Golf Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Rounds Played</span>
                  <span className="text-white font-semibold">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Best Score</span>
                  <span className="text-white font-semibold">78</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Average Score</span>
                  <span className="text-white font-semibold">84</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Birdies</span>
                  <span className="text-white font-semibold">12</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-emerald-400" />
                Contact Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <Mail className="h-4 w-4 mr-3" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Globe className="h-4 w-4 mr-3" />
                  <span className="text-sm">@{user.username}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-emerald-400" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors duration-300">
                  View Tee Times
                </button>
                <button className="w-full bg-gray-600/20 text-gray-300 border border-gray-600/30 px-4 py-2 rounded-lg hover:bg-gray-600/30 transition-colors duration-300">
                  Invite to Group
                </button>
                <button className="w-full bg-gray-600/20 text-gray-300 border border-gray-600/30 px-4 py-2 rounded-lg hover:bg-gray-600/30 transition-colors duration-300">
                  Report User
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
