'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Search, 
  MapPin,
  Calendar, 
  Clock,
  TrendingUp,
  Plus,
  Star,
  Zap,
  Flag,
  Home,
  Trophy,
  Target,
  Camera,
  X,
  QrCode
} from 'lucide-react'
import WeatherWidget from '@/components/WeatherWidget'
import GolfRoundForm from '@/components/GolfRoundForm'
import MessagingSystem from '@/components/MessagingSystem'
import BadgeManagement from '@/components/BadgeManagement'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import SimpleQRScanner from '@/components/SimpleQRScanner'

type ActiveTab = 'tee-times' | 'groups' | 'messages'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('tee-times')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  
  // Tee Times
  const [teeTimes, setTeeTimes] = useState<any[]>([])
  const [teeTimesLoading, setTeeTimesLoading] = useState(false)
  
  // Groups
  const [userGroups, setUserGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  
  // Messages
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageForm, setMessageForm] = useState({
    recipient: '',
    subject: '',
    message: ''
  })
  
  // Applications
  const [pendingApplications, setPendingApplications] = useState<any[]>([])
  const [pendingApplicationsLoading, setPendingApplicationsLoading] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Profile loading
  const [profileLoading, setProfileLoading] = useState(false)

  // Auto-load tee times when user logs in
  useEffect(() => {
      if (user?.id) {
      fetchTeeTimes()
      fetchUserGroups()
      fetchNotifications()
      fetchPendingApplications()
    }
  }, [user?.id])

  const fetchTeeTimes = async () => {
    if (!user?.id) return
    
      setTeeTimesLoading(true)
    try {
      const response = await fetch(`/api/tee-times?action=available&_cache_bust=${Math.random()}`)
        const data = await response.json()
      
      if (data.success) {
        const sortedTeeTimes = data.teeTimes
          .filter((tt: any) => new Date(tt.tee_time_date) >= new Date())
          .sort((a: any, b: any) => new Date(a.tee_time_date).getTime() - new Date(b.tee_time_date).getTime())
        
        setTeeTimes(sortedTeeTimes)
        console.log('🎯 Fetched and sorted tee times:', sortedTeeTimes)
      }
    } catch (error) {
      console.error('Error fetching tee times:', error)
    } finally {
      setTeeTimesLoading(false)
    }
  }

  const fetchUserGroups = async () => {
    if (!user?.id) return
  
    setGroupsLoading(true)
    try {
      const response = await fetch(`/api/groups?user_id=${user.id}&_cache_bust=${Math.random()}`)
        const data = await response.json()
      
      if (data.success) {
        setUserGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error fetching user groups:', error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const fetchNotifications = async () => {
    if (!user?.id) return
    
      setNotificationsLoading(true)
    try {
      const response = await fetch(`/api/notifications?user_id=${user.id}&_cache_bust=${Math.random()}`)
        const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setNotificationsLoading(false)
    }
  }

  const fetchPendingApplications = async () => {
    if (!user?.id) return
    
    setPendingApplicationsLoading(true)
    try {
      const response = await fetch(`/api/tee-times?action=get-pending-applications&user_id=${user.id}&_cache_bust=${Math.random()}`)
        const data = await response.json()
      
      if (data.success) {
        setPendingApplications(data.applications || [])
      }
    } catch (error) {
      console.error('Error fetching pending applications:', error)
    } finally {
      setPendingApplicationsLoading(false)
    }
  }


  const handleQRScan = (data: string) => {
    console.log('QR Code scanned:', data)
    setShowQRScanner(false)
  }

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: user.id,
          recipient_id: messageForm.recipient,
          message_content: messageForm.message
        }),
      })
      
        const data = await response.json()
      
      if (data.success) {
        setMessageForm({ recipient: '', subject: '', message: '' })
        setShowMessageModal(false)
        alert('Message sent successfully!')
      } else {
        alert('Failed to send message: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  const tabs = [
    { id: 'tee-times', label: 'Tee Times', icon: Calendar },
    { id: 'groups', label: 'Groups', icon: Trophy },
    { id: 'messages', label: 'Messages', icon: Flag },
  ]

  return (
    <div className="min-h-screen bg-theme-gradient transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 sticky top-0 z-50 shadow-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            {/* Logo */}
            <div className="flex-shrink-0 -ml-2 sm:-ml-1">
              <Logo size="md" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                        isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                      </span>
                  )}
                </button>
                
              {/* QR Code */}
                                  <button
                onClick={() => setShowQRCode(true)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                  >
                <QrCode className="h-5 w-5" />
                                  </button>

              {/* QR Scanner */}
                      <button 
                onClick={() => setShowQRScanner(true)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                <Camera className="h-5 w-5" />
                </button>

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Mobile menu button */}
                      <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
                      </button>
                  </div>
                  </div>

          {/* Mobile Navigation */}
      {showMobileMenu && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-slate-700">
              <div className="flex flex-col space-y-2">
                {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                        setActiveTab(tab.id as ActiveTab)
                    setShowMobileMenu(false)
                  }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Tee Times Tab */}
        {activeTab === 'tee-times' && (
          <div className="space-y-6">
            {/* Weather Widget */}
            <WeatherWidget />

            {/* Tee Times Section */}
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Available Tee Times</h2>
                <p className="text-gray-600">Join upcoming tee times with fellow golfers</p>
              </div>

              <div className="p-6">
                {teeTimesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <span className="ml-3 text-gray-600">Loading tee times...</span>
                  </div>
                ) : teeTimes.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Tee Times Available</h3>
                    <p className="text-gray-500">Check back later for new tee times or create your own!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teeTimes.map((teeTime) => (
                      <div key={teeTime.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-2">
                              {teeTime.course_name || 'Unknown Course'}
                          </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(teeTime.tee_time_date).toLocaleDateString()}</span>
                        </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{teeTime.tee_time_time}</span>
                      </div>
                              {teeTime.location && (
                                <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                                  <span>{teeTime.location}</span>
                  </div>
                )}
                                </div>
                            {teeTime.description && (
                              <p className="text-gray-600 text-sm mt-2">{teeTime.description}</p>
                            )}
                                </div>
                          <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            Join
                          </button>
                        </div>
                      </div>
                  ))}
                    </div>
                      )}
                    </div>
              </div>
            </div>
          )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
              <div className="space-y-6">
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">My Groups</h2>
                <p className="text-gray-600">Manage your golf groups and find new ones</p>
                  </div>
              
              <div className="p-6">
                {groupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <span className="ml-3 text-gray-600">Loading groups...</span>
                    </div>
                ) : userGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Groups Yet</h3>
                    <p className="text-gray-500">Join or create golf groups to connect with fellow golfers!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userGroups.map((group) => (
                      <div key={group.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h3 className="font-semibold text-gray-800 mb-2">{group.name}</h3>
                        <p className="text-gray-600 text-sm">{group.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
                </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            <MessagingSystem />
          </div>
        )}
      </div>

      {/* Modals */}

      {/* QR Code Display */}
      {showQRCode && user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-sm mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">My QR Code</h3>
              <button
                onClick={() => setShowQRCode(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="flex justify-center">
              <QRCodeGenerator
                userId={user.id}
                userName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Golfer'}
                size={200}
              />
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mt-4">
              Share this QR code with other golfers to connect instantly!
            </p>
          </div>
        </div>
      )}

      {/* QR Code Scanner */}
      {showQRScanner && (
        <SimpleQRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  )
}