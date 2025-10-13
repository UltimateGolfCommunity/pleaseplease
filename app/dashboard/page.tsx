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
import LoadingScreen from '@/components/LoadingScreen'

type ActiveTab = 'tee-times' | 'groups' | 'messages'

export default function Dashboard() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('tee-times')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showCreateTeeTimeModal, setShowCreateTeeTimeModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  // Tee Time Form
  const [teeTimeForm, setTeeTimeForm] = useState({
    course_name: '',
    tee_time_date: '',
    tee_time_time: '',
    location: '',
    description: ''
  })
  const [teeTimeSubmitting, setTeeTimeSubmitting] = useState(false)
  
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

  // Auto-load data when user logs in
  useEffect(() => {
      if (user?.id) {
      const loadInitialData = async () => {
        setInitialLoading(true)
        await Promise.all([
          fetchTeeTimes(),
          fetchUserGroups(),
          fetchNotifications(),
      fetchPendingApplications()
        ])
        setInitialLoading(false)
      }
      loadInitialData()
    }
  }, [user?.id])

  const fetchTeeTimes = async () => {
    if (!user?.id) return
    
    console.log('🔄 Starting to fetch tee times...')
    setTeeTimesLoading(true)
    try {
      const response = await fetch(`/api/tee-times?action=available&_cache_bust=${Math.random()}`)
      const data = await response.json()
      
      console.log('📊 Tee times API response:', data)
      
      // Handle both array response and object response formats
      let teeTimesArray = []
      if (data.success && data.teeTimes) {
        teeTimesArray = data.teeTimes
      } else if (Array.isArray(data)) {
        teeTimesArray = data
      }
      
      const sortedTeeTimes = teeTimesArray
        .filter((tt: any) => new Date(tt.tee_time_date) >= new Date())
        .sort((a: any, b: any) => new Date(a.tee_time_date).getTime() - new Date(b.tee_time_date).getTime())
      
      setTeeTimes(sortedTeeTimes)
      console.log('🎯 Fetched and sorted tee times:', sortedTeeTimes)
          } catch (error) {
      console.error('❌ Error fetching tee times:', error)
    } finally {
      setTeeTimesLoading(false)
    }
  }

  const fetchUserGroups = async () => {
    if (!user?.id) return
  
    console.log('🔄 Starting to fetch groups...')
    setGroupsLoading(true)
    try {
      const response = await fetch(`/api/groups?user_id=${user.id}&_cache_bust=${Math.random()}`)
        const data = await response.json()
      
      console.log('📊 Groups API response:', data)
      
      if (data.success) {
        setUserGroups(data.groups || [])
        console.log('🎯 Fetched groups:', data.groups)
      } else {
        console.log('❌ Groups fetch failed:', data)
      }
    } catch (error) {
      console.error('❌ Error fetching user groups:', error)
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

  const handleCreateTeeTime = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      alert('You must be logged in to create a tee time')
      return
    }

    if (!teeTimeForm.course_name || !teeTimeForm.tee_time_date || !teeTimeForm.tee_time_time) {
      alert('Please fill in all required fields')
      return
    }

    setTeeTimeSubmitting(true)
    try {
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          creator_id: user.id,
          course_name: teeTimeForm.course_name,
          tee_time_date: teeTimeForm.tee_time_date,
          tee_time_time: teeTimeForm.tee_time_time,
          location: teeTimeForm.location,
          description: teeTimeForm.description,
          max_players: 4
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Tee time created successfully!')
        setShowCreateTeeTimeModal(false)
        setTeeTimeForm({
          course_name: '',
          tee_time_date: '',
          tee_time_time: '',
          location: '',
          description: ''
        })
        // Refresh tee times list
        fetchTeeTimes()
      } else {
        alert('Failed to create tee time: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating tee time:', error)
      alert('Failed to create tee time. Please try again.')
    } finally {
      setTeeTimeSubmitting(false)
    }
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

  // Show loading screen while initial data is being fetched
  if (initialLoading) {
    return <LoadingScreen message="Loading your golf community..." />
  }

  return (
    <div className="min-h-screen bg-theme-gradient transition-colors duration-300 animate-fade-in">
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
          <div className="space-y-6 animate-fade-in">
            {/* Weather Widget */}
            <WeatherWidget />

            {/* Tee Times Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Available Tee Times</h2>
                <p className="text-gray-300">Join upcoming tee times with fellow golfers</p>
                <button 
                  onClick={() => setShowCreateTeeTimeModal(true)}
                  className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-emerald-500/50 flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Tee Time</span>
                </button>
              </div>

              <div className="space-y-4">
                {teeTimesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                    <span className="ml-3 text-gray-300">Loading tee times...</span>
                  </div>
                ) : teeTimes.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No Tee Times Available</h3>
                    <p className="text-gray-400">Check back later for new tee times or create your own!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teeTimes.map((teeTime) => (
                      <div key={teeTime.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                        <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-semibold text-white mb-2">
                              {teeTime.course_name || 'Unknown Course'}
                          </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-300">
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
                              <p className="text-gray-300 text-sm mt-2">{teeTime.description}</p>
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
          <div className="space-y-6 animate-fade-in">
                    <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">My Groups</h2>
              <p className="text-gray-300">Manage your golf groups and find new ones</p>
                    <button
                onClick={() => setShowCreateGroupModal(true)}
                className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-emerald-500/50 flex items-center space-x-2 mx-auto"
                    >
                      <Plus className="h-5 w-5" />
                <span>Create Group</span>
                    </button>
                        </div>

                  <div className="space-y-4">
              {groupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                  <span className="ml-3 text-gray-300">Loading groups...</span>
                  </div>
              ) : userGroups.length === 0 ? (
                  <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Groups Yet</h3>
                  <p className="text-gray-400">Join or create golf groups to connect with fellow golfers!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                  {userGroups.map((group) => (
                    <div key={group.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                      <h3 className="font-semibold text-white mb-2">{group.name}</h3>
                      <p className="text-gray-300 text-sm">{group.description}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-fade-in">
            <MessagingSystem />
                </div>
              )}
      </div>
      
      {/* Modals */}
      
      {/* Create Tee Time Modal */}
      {showCreateTeeTimeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-emerald-500/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Create Tee Time</h3>
                    <button
                onClick={() => setShowCreateTeeTimeModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                    >
                <X className="h-6 w-6" />
                    </button>
                </div>
            
            <form onSubmit={handleCreateTeeTime} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Course Name *</label>
                <input
                  type="text"
                  value={teeTimeForm.course_name}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, course_name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter course name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                  <input
                    type="date"
                    value={teeTimeForm.tee_time_date}
                    onChange={(e) => setTeeTimeForm({...teeTimeForm, tee_time_date: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Time *</label>
                <input
                    type="time"
                    value={teeTimeForm.tee_time_time}
                    onChange={(e) => setTeeTimeForm({...teeTimeForm, tee_time_time: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location (Optional)</label>
                <input
                  type="text"
                  value={teeTimeForm.location}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, location: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter location"
                    />
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={teeTimeForm.description}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Add details about the tee time..."
                    />
                </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTeeTimeModal(false)}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  disabled={teeTimeSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
                  disabled={teeTimeSubmitting}
                >
                  {teeTimeSubmitting ? 'Creating...' : 'Create Tee Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-emerald-500/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Create Group</h3>
                      <button
                onClick={() => setShowCreateGroupModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
                      </button>
                    </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Group Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter group name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Describe your group..."
              />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all duration-300"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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