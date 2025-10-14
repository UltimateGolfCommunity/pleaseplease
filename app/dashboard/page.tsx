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
  QrCode,
  User
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
import WelcomeAnimation from '@/components/WelcomeAnimation'

type ActiveTab = 'tee-times' | 'groups' | 'messages' | 'profile'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('tee-times')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showCreateTeeTimeModal, setShowCreateTeeTimeModal] = useState(false)
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  
  // Tee Time Form
  const [teeTimeForm, setTeeTimeForm] = useState({
    course_name: '',
    location: '', // zip code
    tee_time_date: '',
    tee_time_time: '',
    max_players: 4,
    handicap_requirement: 'weekend-warrior'
  })
  const [teeTimeSubmitting, setTeeTimeSubmitting] = useState(false)
  
  // Group Form
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: ''
  })
  const [groupSubmitting, setGroupSubmitting] = useState(false)
  
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
        // Show welcome animation after data is loaded
        setShowWelcome(true)
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

  const handleSignOut = async () => {
    try {
      await signOut()
      // Redirect to home page
      router.push('/')
    } catch (error) {
      console.error('❌ Error signing out:', error)
      alert('Failed to sign out. Please try again.')
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      alert('You must be logged in to create a group')
      return
    }
    
    if (!groupForm.name) {
      alert('Please enter a group name')
      return
    }

    setGroupSubmitting(true)
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          name: groupForm.name,
          description: groupForm.description,
          creator_id: user.id,
          status: 'active'
        }),
      })

        const data = await response.json()
      
      if (data.success) {
        alert('Group created successfully!')
        setShowCreateGroupModal(false)
        setGroupForm({
          name: '',
          description: ''
        })
        // Refresh groups list
        fetchUserGroups()
      } else {
        alert('Failed to create group: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group. Please try again.')
    } finally {
      setGroupSubmitting(false)
    }
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
          handicap_requirement: teeTimeForm.handicap_requirement,
          max_players: teeTimeForm.max_players
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Tee time created successfully!')
        setShowCreateTeeTimeModal(false)
        setTeeTimeForm({
          course_name: '',
          location: '',
          tee_time_date: '',
          tee_time_time: '',
          max_players: 4,
          handicap_requirement: 'weekend-warrior'
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
    { id: 'profile', label: 'Profile', icon: User },
  ]

  // Show welcome animation while loading and after
  if (initialLoading || showWelcome) {
    return <WelcomeAnimation onComplete={() => setShowWelcome(false)} />
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

              {/* Sign Out Button */}
                      <button 
                onClick={handleSignOut}
                className="hidden md:block px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300 border border-red-600/30 text-sm font-medium"
                      >
                Sign Out
                </button>

              {/* Mobile menu button - Profile Picture */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden relative"
              >
                <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-lg hover:border-emerald-400 transition-all">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                      </span>
                      </div>
                    )}
                  </div>
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
            
            {/* Mobile Sign Out Button */}
              <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 font-medium bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 border border-red-600/30"
            >
              <span>Sign Out</span>
              </button>
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
                        {/* Course Name */}
                        <h3 className="font-bold text-white text-xl mb-4">
                          {teeTime.golf_courses?.name || teeTime.course_name || 'Unknown Course'}
                        </h3>

                        {/* Creator Info with Profile Picture */}
                        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-white/10">
                          {/* Profile Picture */}
                          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-lg">
                            {teeTime.creator?.avatar_url ? (
                              <img
                                src={teeTime.creator.avatar_url}
                                alt={`${teeTime.creator.first_name} ${teeTime.creator.last_name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">
                                  {teeTime.creator?.first_name?.[0] || 'U'}
                                    </span>
                                  </div>
                                )}
                            </div>
                            
                          {/* Name and Handicap */}
                                <div className="flex-1">
                            <p className="text-white font-semibold">
                              {teeTime.creator?.first_name} {teeTime.creator?.last_name}
                            </p>
                            <p className="text-emerald-400 text-sm">
                              Handicap: {teeTime.creator?.handicap || 'Not set'}
                            </p>
                          </div>
                          </div>

                        {/* Tee Time Details */}
                <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(teeTime.tee_time_date).toLocaleDateString()}</span>
                        </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{teeTime.tee_time_time}</span>
                        </div>
                            {teeTime.course_location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{teeTime.course_location}</span>
                </div>
              )}
            </div>

                          {/* Skill Level */}
                          {teeTime.handicap_requirement && (
                            <p className="text-gray-300 text-sm">
                              <span className="text-emerald-400 font-semibold">Skill Level:</span> {teeTime.handicap_requirement}
                            </p>
                          )}
                          
                          {/* Bottom Row: Players Info and Join Button */}
                          <div className="flex items-center justify-between gap-4 pt-2">
                            <p className="text-gray-300 text-sm">
                              <span className="text-emerald-400 font-semibold">Spots:</span> {teeTime.available_spots || teeTime.max_players - teeTime.current_players} of {teeTime.max_players}
                            </p>
                            
                            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg hover:shadow-emerald-500/50 whitespace-nowrap">
                              Join
                </button>
              </div>
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">My Profile</h2>
              <p className="text-gray-300">Manage your golf profile and settings</p>
          </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Profile Picture */}
              <div className="flex justify-center">
              <div className="relative">
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                        <span className="text-white font-bold text-5xl">
                          {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                              </span>
                          </div>
                        )}
                      </div>
                  </div>
              </div>

              {/* User Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="space-y-4">
                              <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                    <p className="text-white text-lg font-semibold">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                            </div>
                            
                    <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                    <p className="text-white">{user?.email}</p>
            </div>

                  {profile?.bio && (
                        <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Bio</label>
                      <p className="text-gray-300">{profile.bio}</p>
                            </div>
                          )}
                  
                  {profile?.handicap && (
                        <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Handicap</label>
                      <p className="text-white font-semibold">{profile.handicap}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Profile Button */}
              <div className="flex justify-center">
                      <button
                  onClick={() => router.push('/profile')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-emerald-500/50"
                      >
                  Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
        )}
      </div>
      
      {/* Modals */}
      
      {/* Create Tee Time Modal - Modern Design */}
      {showCreateTeeTimeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 max-w-lg w-full border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-bold text-white mb-1">Post a Tee Time</h3>
                <p className="text-gray-400 text-sm">Find golfers to fill your group</p>
                </div>
                <button
                onClick={() => setShowCreateTeeTimeModal(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="h-6 w-6" />
                </button>
              </div>
            
            <form onSubmit={handleCreateTeeTime} className="space-y-6">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-semibold text-emerald-400 mb-2">Course Name *</label>
                <input
                  type="text"
                  value={teeTimeForm.course_name}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, course_name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="e.g., Pebble Beach Golf Links"
                      required
                    />
                </div>

              {/* Location (Zip Code) */}
              <div>
                <label className="block text-sm font-semibold text-emerald-400 mb-2">Location (Zip Code) *</label>
                <input
                  type="text"
                  value={teeTimeForm.location}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, location: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-all"
                  placeholder="e.g., 90210"
                      required
                    />
                </div>

                {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-emerald-400 mb-2">Date *</label>
                <input
                  type="date"
                    value={teeTimeForm.tee_time_date}
                    onChange={(e) => setTeeTimeForm({...teeTimeForm, tee_time_date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-all"
                        required
                      />
                    </div>
                <div>
                  <label className="block text-sm font-semibold text-emerald-400 mb-2">Time *</label>
                <input
                  type="time"
                    value={teeTimeForm.tee_time_time}
                    onChange={(e) => setTeeTimeForm({...teeTimeForm, tee_time_time: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-all"
                        required
                      />
                  </div>
                </div>

              {/* Number of Players Needed */}
              <div>
                <label className="block text-sm font-semibold text-emerald-400 mb-2">Players Needed *</label>
                    <select
                  value={teeTimeForm.max_players}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, max_players: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-all"
                >
                  <option value={2}>1 Player Needed (2 total)</option>
                  <option value={3}>2 Players Needed (3 total)</option>
                  <option value={4}>3 Players Needed (4 total)</option>
                    </select>
                  </div>

              {/* Skill Level */}
              <div>
                <label className="block text-sm font-semibold text-emerald-400 mb-2">Skill Level *</label>
                    <select
                  value={teeTimeForm.handicap_requirement}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, handicap_requirement: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-all"
                >
                  <option value="hack">Hack - Just here for fun!</option>
                  <option value="weekend-warrior">Weekend Warrior - Casual player</option>
                  <option value="pro">Pro - Serious golfer</option>
                    </select>
                </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateTeeTimeModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-xl transition-all font-medium"
                  disabled={teeTimeSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold transition-all duration-300 disabled:opacity-50 shadow-lg shadow-emerald-500/30"
                  disabled={teeTimeSubmitting}
                >
                  {teeTimeSubmitting ? 'Posting...' : 'Post Tee Time'}
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

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Group Name *</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter group name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Describe your group..."
              />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateGroupModal(false)}
                  className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  disabled={groupSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50"
                  disabled={groupSubmitting}
                >
                  {groupSubmitting ? 'Creating...' : 'Create Group'}
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