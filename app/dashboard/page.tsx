'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { 
  Search, 
  Calendar, 
  Users, 
  MessageCircle, 
  Bell, 
  Settings,
  LogOut,
  User,
  MapPin,
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
import WeatherWidget from '@/app/components/WeatherWidget'
import GolfRoundForm from '@/app/components/GolfRoundForm'
import MessagingSystem from '@/app/components/MessagingSystem'
import BadgeManagement from '@/app/components/BadgeManagement'
import Logo from '@/app/components/Logo'
import ThemeToggle from '@/app/components/ThemeToggle'
import GolfCourseManagement from '@/app/components/GolfCourseManagement'
import QRCodeGenerator from '@/app/components/QRCodeGenerator'
import SimpleQRScanner from '@/app/components/SimpleQRScanner'

export default function Dashboard() {
  const { user, profile, signOut, loading } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()
  

      const [activeTab, setActiveTab] = useState<'overview' | 'find-someone' | 'courses' | 'groups' | 'messages' | 'badges' | 'applications' | 'my-rounds'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)
  
  // New state for modals and forms
  const [showTeeTimeModal, setShowTeeTimeModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [showGolfRoundModal, setShowGolfRoundModal] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  
  // Form states
  const [teeTimeForm, setTeeTimeForm] = useState({
    course: '',
    location: '',
    date: '',
    time: '',
    players: 4,
    handicap: 'any',
    description: ''
  })
  
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    maxMembers: 8
  })
  
  // Group invitation state
  const [groupInviteQuery, setGroupInviteQuery] = useState('')
  const [groupInviteResults, setGroupInviteResults] = useState<any[]>([])
  const [groupInviteLoading, setGroupInviteLoading] = useState(false)
  const [selectedInvitees, setSelectedInvitees] = useState<any[]>([])
  
  // Group invitations state
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [invitationsLoading, setInvitationsLoading] = useState(false)
  
  const [messageForm, setMessageForm] = useState({
    recipient: '',
    subject: '',
    message: ''
  })
  
  const [ratingForm, setRatingForm] = useState({
    course: '',
    rating: 5,
    review: ''
  })
  
  const [groupMessageText, setGroupMessageText] = useState('')
  
  // Course search state
  const [courseSearchQuery, setCourseSearchQuery] = useState('')
  const [courseSearchLoading, setCourseSearchLoading] = useState(false)
  const [courseSearchResults, setCourseSearchResults] = useState<any[]>([])
  
  // Location-based filtering state
  const [zipCode, setZipCode] = useState('')
  const [searchRadius, setSearchRadius] = useState(250)
  const [locationFilter, setLocationFilter] = useState('')
  
  // Groups state
  const [userGroups, setUserGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat: number, lon: number} | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [nearbyCourses, setNearbyCourses] = useState<any[]>([])
  const [showNearbyOnly, setShowNearbyOnly] = useState(false)
  
  // Course review state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<any>(null)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  
  // Course creation state
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false)
    const [createCourseForm, setCreateCourseForm] = useState({
    name: '',
    location: '',
    description: '',
    par: '',
    holes: 18
  })

  // Load courses when Courses tab is opened
  useEffect(() => {
    console.log('🔍 Courses tab useEffect triggered:', { activeTab, courseSearchResultsLength: courseSearchResults.length })
    if (activeTab === 'courses') {
      console.log('🔄 Loading courses for Courses tab...')
      handleCourseSearch()
      
      // Automatically get user location for nearby courses and tee times
      if (!userLocation && navigator.geolocation) {
        console.log('📍 Getting user location for nearby courses and tee times...')
        getUserLocation()
      }
    }
  }, [activeTab])

  // Load user groups when Groups tab is opened
  useEffect(() => {
    if (activeTab === 'groups') {
      console.log('🔄 Loading user groups for Groups tab...')
      fetchUserGroups()
    }
  }, [activeTab, user?.id])

  // Load rounds when My Rounds tab is opened
  useEffect(() => {
    if (activeTab === 'my-rounds') {
      console.log('🔄 Loading rounds for My Rounds tab...')
      fetchRounds()
    }
  }, [activeTab, user?.id])

  // Load tee times when Overview tab is opened
  useEffect(() => {
    if (activeTab === 'overview') {
      console.log('🔄 Loading tee times for Overview tab...')
      fetchTeeTimes()
      
      // Automatically get user location for nearby tee times
      if (!userLocation && navigator.geolocation) {
        console.log('📍 Getting user location for nearby tee times...')
        getUserLocation()
      }
    }
  }, [activeTab])
  const [createCourseSubmitting, setCreateCourseSubmitting] = useState(false)

  // Badge system state
  const [badgeCategoryFilter, setBadgeCategoryFilter] = useState('')
  const [availableBadges, setAvailableBadges] = useState<any[]>([])



  // Tee time loading state
  const [teeTimesLoading, setTeeTimesLoading] = useState(false)
  
  // Tee time location filtering state
  const [teeTimeLocationFilter, setTeeTimeLocationFilter] = useState('')
  const [nearbyTeeTimes, setNearbyTeeTimes] = useState<any[]>([])
  const [showNearbyTeeTimesOnly, setShowNearbyTeeTimesOnly] = useState(false)
  
  // Applications state
  const [applications, setApplications] = useState<any[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  
  // My rounds state
  const [rounds, setRounds] = useState<any[]>([])
  const [roundsLoading, setRoundsLoading] = useState(false)
  const [logRoundForm, setLogRoundForm] = useState({
    course: '',
    date: '',
    score: '',
    par: '',
    handicap: '',
    notes: ''
  })
  const [logRoundSubmitting, setLogRoundSubmitting] = useState(false)
  
  // Pending applications to user's posted tee times
  const [pendingApplications, setPendingApplications] = useState<any[]>([])
  const [pendingApplicationsLoading, setPendingApplicationsLoading] = useState(false)

  // Connections state
  const [connections, setConnections] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)
  const [showConnectionsModal, setShowConnectionsModal] = useState(false)

  // Profile editing state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    avatar_url: '',
    header_image_url: '',
    handicap: 0,
    location: ''
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)

  // Recent activity state
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'round', message: 'Recorded a round at St. Andrews - Score: 78', time: '2 hours ago' },
    { id: 2, type: 'connection', message: 'Connected with Sarah M.', time: '1 day ago' },
    { id: 3, type: 'badge', message: 'Earned "Early Bird" badge', time: '2 days ago' },
    { id: 4, type: 'tee_time', message: 'Booked tee time at Augusta National', time: '3 days ago' }
  ])

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Tiger Woods', points: 2840, handicap: 2, rounds: 156, avatar: '🐯' },
    { rank: 2, name: 'Rory McIlroy', points: 2710, handicap: 3, rounds: 142, avatar: '🦅' },
    { rank: 3, name: 'Jon Rahm', points: 2650, handicap: 4, rounds: 138, avatar: '🦁' },
    { rank: 4, name: 'Scottie Scheffler', points: 2580, handicap: 5, rounds: 125, avatar: '🐺' },
    { rank: 5, name: 'Viktor Hovland', points: 2510, handicap: 6, rounds: 118, avatar: '🦊' }
  ])

  // Achievements state
  const [achievements, setAchievements] = useState([
    { id: 1, name: 'First Birdie', description: 'Score your first birdie', earned: true, date: '2024-01-15', icon: '🐦' },
    { id: 2, name: 'Eagle Eye', description: 'Score an eagle on any hole', earned: false, icon: '🦅' },
    { id: 3, name: 'Hole in One', description: 'Achieve the ultimate golf shot', earned: false, icon: '🏆' },
    { id: 4, name: 'Consistency King', description: 'Play 10 rounds under par', earned: false, icon: '👑' },
    { id: 5, name: 'Social Butterfly', description: 'Connect with 25 golfers', earned: true, date: '2024-01-20', icon: '🦋' }
  ])

  // Weather preferences state
  const [weatherPreferences, setWeatherPreferences] = useState({
    minTemp: 65,
    maxTemp: 85,
    maxWind: 15,
    rainTolerance: 'moderate'
  })

  // Tournament state
  const [tournaments, setTournaments] = useState([
    {
      id: 1,
      name: 'Spring Championship 2024',
      course: 'Pebble Beach Golf Links',
      date: '2024-04-15',
      entryFee: 150,
      maxPlayers: 120,
      currentPlayers: 89,
      prizePool: 25000,
      status: 'registration',
      category: 'championship'
    },
    {
      id: 2,
      name: 'Weekend Warriors Cup',
      course: 'Local Municipal Course',
      date: '2024-03-30',
      entryFee: 50,
      maxPlayers: 64,
      currentPlayers: 64,
      prizePool: 5000,
      status: 'full',
      category: 'amateur'
    },
    {
      id: 3,
      name: 'Senior Masters',
      course: 'Augusta National',
      date: '2024-05-20',
      entryFee: 200,
      maxPlayers: 80,
      currentPlayers: 45,
      prizePool: 15000,
      status: 'registration',
      category: 'senior'
    }
  ])

  // Statistics state
  const [statistics, setStatistics] = useState({
    roundsPlayed: 24,
    averageScore: 78.5,
    bestRound: 72,
    worstRound: 89,
    fairwaysHit: 68.2,
    greensInRegulation: 45.8,
    puttsPerRound: 31.2,
    sandSaves: 42.1,
    upAndDowns: 38.7
  })

  // Mock data for simplified tabs
  const [groupMessages] = useState([
    { id: 1, sender: { first_name: 'John' }, message_content: 'Anyone up for a round this weekend?', timestamp: '2 hours ago' },
    { id: 2, sender: { first_name: 'Sarah' }, message_content: 'I\'m in! What time works for everyone?', timestamp: '1 hour ago' },
    { id: 3, sender: { first_name: 'Mike' }, message_content: 'Early morning works best for me', timestamp: '30 min ago' }
  ])

  const [availableTeeTimes, setAvailableTeeTimes] = useState<any[]>([])

  // Click outside handler for notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications && !(event.target as Element).closest('.notifications-container')) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  // Memoized mock badges to prevent recreation
  const mockBadges = useMemo(() => [
    {
      id: 'badge-1',
      name: 'First Round',
      description: 'Complete your first golf round',
      icon_name: 'flag',
      category: 'achievement',
      points: 10,
      rarity: 'common',
      criteria: 'Play 18 holes'
    },
    {
      id: 'badge-2',
      name: 'Early Adopter',
      description: 'One of the first users',
      icon_name: 'star',
      category: 'early_adopter',
      points: 50,
      rarity: 'rare',
      criteria: 'Join in first month'
    },
    {
      id: 'badge-3',
      name: 'Social Butterfly',
      description: 'Connect with 10 golfers',
      icon_name: 'users',
      category: 'milestone',
      points: 25,
      rarity: 'uncommon',
      criteria: 'Make 10 connections'
    }
  ], [])

  // Fetch available badges and tee times
  useEffect(() => {
    const fetchData = async () => {
      // Fetch badges
      try {
        const response = await fetch('/api/badges')
        if (response.ok) {
          const data = await response.json()
          setAvailableBadges(data)
        } else {
          setAvailableBadges(mockBadges)
        }
      } catch (error) {
        setAvailableBadges(mockBadges)
      }

      // Fetch real tee times from Supabase
      try {
        setTeeTimesLoading(true)
        const response = await fetch('/api/tee-times?action=available')
        if (response.ok) {
          const data = await response.json()
          // Handle both array format and object format
          const teeTimes = Array.isArray(data) ? data : (data.tee_times || [])
          // Sort by date (earliest first)
          const sortedTeeTimes = teeTimes.sort((a: any, b: any) => {
            const dateA = new Date(a.tee_time_date + ' ' + a.tee_time_time)
            const dateB = new Date(b.tee_time_date + ' ' + b.tee_time_time)
            return dateA.getTime() - dateB.getTime()
          })
          setAvailableTeeTimes(sortedTeeTimes)
          console.log('Fetched and sorted tee times:', sortedTeeTimes)
        } else {
          setAvailableTeeTimes([])
        }
      } catch (error) {
        console.error('Error fetching tee times:', error)
        setAvailableTeeTimes([])
      } finally {
        setTeeTimesLoading(false)
      }
      
      // Fetch applications
      if (user?.id) {
        try {
          setApplicationsLoading(true)
          const response = await fetch('/api/tee-times?action=get-applications&user_id=' + user.id)
          if (response.ok) {
            const data = await response.json()
            setApplications(data.applications || [])
          } else {
            setApplications([])
          }
        } catch (error) {
          setApplications([])
        } finally {
          setApplicationsLoading(false)
        }
      }
    }
    
    fetchData()
  }, [mockBadges])

  // Initialize profile form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        header_image_url: profile.header_image_url || '',
        handicap: profile.handicap || 0,
        location: profile.location || ''
      })
    }
  }, [profile])

  // Fetch connections when user loads
  useEffect(() => {
    if (user?.id) {
      fetchConnections()
      fetchPendingInvitations()
      fetchNotifications()
      fetchPendingApplications()
      // Check if user profile exists
      checkUserProfile()
      
      // Set up periodic refresh for notifications and applications (every 30 seconds)
      const refreshInterval = setInterval(() => {
        fetchNotifications()
        fetchPendingApplications()
      }, 30000)
      
      return () => clearInterval(refreshInterval)
    }
  }, [user?.id])

  const checkUserProfile = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/check-user-profile?user_id=${user.id}`)
      if (response.ok) {
        const result = await response.json()
        if (!result.exists && result.created) {
          console.log('✅ User profile created successfully')
          // Refresh the profile data
          window.location.reload()
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to check user profile:', errorData)
        
        // If it's a fallback error, don't show it to the user
        if (errorData.fallback) {
          console.log('Profile check failed, continuing with existing profile')
        }
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
    }
  }

  // Handler functions
  const openTeeTimeModal = () => {
    setShowTeeTimeModal(true)
  }

  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser')
      return null
    }

    return new Promise<{lat: number, lon: number} | null>((resolve) => {
      setLocationLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }
          setUserLocation(location)
          setLocationLoading(false)
          resolve(location)
        },
        (error) => {
          console.log('Error getting location:', error)
          setLocationLoading(false)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  const fetchTeeTimes = async () => {
    try {
      setTeeTimesLoading(true)
      
      // Get today's date for filtering
      const today = new Date().toISOString().split('T')[0]
      
      // Check if we should fetch nearby tee times
      if (showNearbyTeeTimesOnly && userLocation) {
        const response = await fetch(`/api/tee-times?action=nearby&user_lat=${userLocation.lat}&user_lon=${userLocation.lon}&radius_km=50`)
        if (response.ok) {
          const data = await response.json()
          const teeTimes = Array.isArray(data) ? data : (data.tee_times || [])
          
          // Filter to only show tee times from today forward (client-side backup)
          const filteredTeeTimes = teeTimes.filter((teeTime: any) => {
            return teeTime.tee_time_date >= today
          })
          
          // Sort by distance first, then by date
          const sortedTeeTimes = filteredTeeTimes.sort((a: any, b: any) => {
            if (a.distance_km !== undefined && b.distance_km !== undefined) {
              return a.distance_km - b.distance_km
            }
            const dateA = new Date(a.tee_time_date + ' ' + a.tee_time_time)
            const dateB = new Date(b.tee_time_date + ' ' + b.tee_time_time)
            return dateA.getTime() - dateB.getTime()
          })
          setAvailableTeeTimes(sortedTeeTimes)
          console.log('Fetched nearby tee times (today+):', sortedTeeTimes)
        } else {
          console.error('Failed to fetch nearby tee times')
          setAvailableTeeTimes([])
        }
      } else {
        // Fetch all available tee times
        const response = await fetch('/api/tee-times?action=available')
        if (response.ok) {
          const data = await response.json()
          // Handle both array format and object format
          const teeTimes = Array.isArray(data) ? data : (data.tee_times || [])
          
          // Filter to only show tee times from today forward (client-side backup)
          const filteredTeeTimes = teeTimes.filter((teeTime: any) => {
            return teeTime.tee_time_date >= today
          })
          
          // Sort by date (earliest first)
          const sortedTeeTimes = filteredTeeTimes.sort((a: any, b: any) => {
            const dateA = new Date(a.tee_time_date + ' ' + a.tee_time_time)
            const dateB = new Date(b.tee_time_date + ' ' + b.tee_time_time)
            return dateA.getTime() - dateB.getTime()
          })
          setAvailableTeeTimes(sortedTeeTimes)
          console.log('Fetched and sorted tee times (today+):', sortedTeeTimes)
        } else {
          console.error('Failed to fetch tee times')
          setAvailableTeeTimes([])
        }
      }
    } catch (error) {
      console.error('Error fetching tee times:', error)
      setAvailableTeeTimes([])
    } finally {
      setTeeTimesLoading(false)
    }
  }

  // Filter tee times by location
  const handleTeeTimeLocationFilter = (location: string) => {
    setTeeTimeLocationFilter(location)
    if (location === '') {
      setShowNearbyTeeTimesOnly(false)
      return
    }
    
    // For now, just set the filter - the actual filtering will be handled by the API
    // This is a simple implementation that can be enhanced later
    console.log('Filtering tee times by location:', location)
  }

  // Filter courses by location
  const handleLocationFilter = (location: string) => {
    setLocationFilter(location)
    if (location === '') {
      setShowNearbyOnly(false)
      return
    }
    
    // For now, just set the filter - the actual filtering will be handled by the API
    // This is a simple implementation that can be enhanced later
    console.log('Filtering courses by location:', location)
  }
  
  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true)
      const response = await fetch('/api/tee-times?action=get-applications&user_id=' + user?.id)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications || [])
      } else {
        console.error('Failed to fetch applications')
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setApplicationsLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  const fetchPendingApplications = async () => {
    if (!user?.id) return
    
    try {
      setPendingApplicationsLoading(true)
      console.log('📋 Fetching pending applications for user tee times:', user.id)
      
      const response = await fetch(`/api/tee-times?action=get-pending-applications&user_id=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Fetched pending applications:', data.applications?.length || 0)
        setPendingApplications(data.applications || [])
      } else {
        console.error('Failed to fetch pending applications:', response.status)
        setPendingApplications([])
      }
    } catch (error) {
      console.error('Error fetching pending applications:', error)
      setPendingApplications([])
    } finally {
      setPendingApplicationsLoading(false)
    }
  }

  const fetchNotifications = async () => {
    if (!user?.id) return
    
    try {
      setNotificationsLoading(true)
      console.log('🔔 Fetching notifications for user:', user.id)
      
      const response = await fetch(`/api/notifications?user_id=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔔 Fetched notifications:', data.notifications?.length || 0)
        
        // Convert API notifications to dashboard format
        const formattedNotifications = (data.notifications || []).map((notif: any) => ({
          id: notif.id,
          type: notif.type,
          message: notif.message,
          time: formatTimeAgo(notif.created_at),
          read: notif.is_read || false,
          related_id: notif.related_id,
          title: notif.title
        }))
        
        setNotifications(formattedNotifications)
      } else {
        console.error('Failed to fetch notifications:', response.status)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setNotificationsLoading(false)
    }
  }

  const fetchConnections = async () => {
    if (!user?.id) return
    
    try {
      setConnectionsLoading(true)
      const response = await fetch(`/api/users?action=connections&user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        // Filter connections based on status and who initiated them
        const acceptedConnections = data.filter((conn: any) => 
          conn.status === 'accepted'
        )
        const pendingRequests = data.filter((conn: any) => 
          conn.status === 'pending' && conn.recipient_id === user.id
        )
        
        setConnections(acceptedConnections)
        setPendingRequests(pendingRequests)
      } else {
        console.error('Failed to fetch connections')
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setConnectionsLoading(false)
    }
  }

  const handleAcceptConnection = async (connectionId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'accept_connection',
          connection_id: connectionId
        }),
      })
      
      if (response.ok) {
        alert('Connection accepted!')
        fetchConnections() // Refresh connections
      } else {
        const error = await response.json()
        alert(`Failed to accept connection: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error accepting connection:', error)
      alert('Failed to accept connection. Please try again.')
    }
  }

  const handleRejectConnection = async (connectionId: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject_connection',
          connection_id: connectionId
        }),
      })
      
      if (response.ok) {
        alert('Connection rejected')
        fetchConnections() // Refresh connections
      } else {
        const error = await response.json()
        alert(`Failed to reject connection: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error rejecting connection:', error)
      alert('Failed to reject connection. Please try again.')
    }
  }

  // Profile management functions
  const handleSaveProfile = async () => {
    if (!user?.id) {
      alert('You must be logged in to save your profile')
      return
    }

    // Validate required fields
    if (!profileForm.first_name?.trim() || !profileForm.last_name?.trim()) {
      alert('Please fill in your first and last name')
      return
    }

    try {
      setProfileSaving(true)

      console.log('🔍 Mobile-friendly profile save with data:', { id: user.id, ...profileForm })
      
      // Add timeout for mobile networks
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          ...profileForm
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      console.log('🔍 Profile save response status:', response.status)

      if (response.ok) {
        const updatedProfile = await response.json()
        
        // Show success message that works well on mobile
        if (window.confirm('Profile saved successfully! Continue editing or view profile?')) {
          // Stay in edit mode
        } else {
          setIsEditingProfile(false) // Exit edit mode
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      const isTimeout = error instanceof Error && error.name === 'AbortError'
      
      if (isTimeout) {
        alert('Profile save timed out. Please check your connection and try again.')
      } else {
        alert('Failed to save profile. Please check your connection and try again.')
      }
    } finally {
      setProfileSaving(false)
    }
  }

  const handleResetProfile = () => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
        header_image_url: profile.header_image_url || '',
        handicap: profile.handicap || 0,
        location: profile.location || ''
      })
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    try {
      setUploadingImage(true)
      
      // Convert to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setProfileForm(prev => ({ ...prev, avatar_url: base64String }))
      }
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleHeaderImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (10MB limit for header images)
    if (file.size > 10 * 1024 * 1024) {
      alert('Header image size must be less than 10MB')
      return
    }

    try {
      setUploadingHeaderImage(true)
      
      // Convert to base64
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64String = e.target?.result as string
        setProfileForm(prev => ({ ...prev, header_image_url: base64String }))
      }
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('Error uploading header image:', error)
      alert('Failed to upload header image. Please try again.')
    } finally {
      setUploadingHeaderImage(false)
    }
  }

  const handleCreateGroup = () => {
    setShowGroupModal(true)
    setSelectedInvitees([])
    setGroupInviteQuery('')
    setGroupInviteResults([])
  }
  
  const handleGroupInviteSearch = async () => {
    if (!groupInviteQuery.trim()) {
      setGroupInviteResults([])
      return
    }
    
    setGroupInviteLoading(true)
    try {
      console.log('🔍 Searching for users to invite:', groupInviteQuery)
      console.log('🔍 Current user ID:', user?.id)
      console.log('🔍 Selected invitees:', selectedInvitees.map(i => i.id))
      
      const response = await fetch(`/api/users?action=search&q=${encodeURIComponent(groupInviteQuery)}`)
      console.log('📡 Group invite search response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Group invite search results (raw):', data)
        console.log('📊 Group invite search results count:', data?.length || 0)
        
        // Filter out the current user and already selected users
        const filteredUsers = data.filter((searchedUser: any) => {
          const isNotCurrentUser = searchedUser.id !== user?.id
          const isNotAlreadySelected = !selectedInvitees.some(invitee => invitee.id === searchedUser.id)
          console.log(`🔍 User ${searchedUser.first_name} ${searchedUser.last_name}:`, {
            id: searchedUser.id,
            isNotCurrentUser,
            isNotAlreadySelected,
            willInclude: isNotCurrentUser && isNotAlreadySelected
          })
          return isNotCurrentUser && isNotAlreadySelected
        })
        console.log('🔍 Filtered group invite results:', filteredUsers)
        console.log('🔍 Filtered group invite results count:', filteredUsers?.length || 0)
        setGroupInviteResults(filteredUsers)
      } else {
        const errorText = await response.text()
        console.error('❌ Group invite search failed:', response.status, errorText)
        setGroupInviteResults([])
      }
    } catch (error) {
      console.error('Error searching for users:', error)
      setGroupInviteResults([])
    } finally {
      setGroupInviteLoading(false)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user?.id) {
      alert('You must be logged in to join groups')
      return
    }
    
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
          group_id: groupId,
          user_id: user.id
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Joined group successfully:', result)
        alert('Successfully joined the group!')
        
        // Refresh search results to update the UI
        if (searchPerformed) {
          handleSearch()
        }
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to join group:', errorData)
        alert('Failed to join group: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group. Please try again.')
    }
  }
  
  const handleAddInvitee = (user: any) => {
    if (!selectedInvitees.some(invitee => invitee.id === user.id)) {
      setSelectedInvitees([...selectedInvitees, user])
      setGroupInviteQuery('')
      setGroupInviteResults([])
    }
  }
  
  const handleRemoveInvitee = (userId: string) => {
    setSelectedInvitees(selectedInvitees.filter(invitee => invitee.id !== userId))
  }
  
  const fetchPendingInvitations = async () => {
    if (!user?.id) return
    
    setInvitationsLoading(true)
    try {
      const response = await fetch(`/api/groups/invitations?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setPendingInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setInvitationsLoading(false)
    }
  }
  
  const handleInvitationResponse = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch('/api/groups/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          invitation_id: invitationId,
          user_id: user?.id
        }),
      })
      
      if (response.ok) {
        // Refresh invitations
        fetchPendingInvitations()
        alert(action === 'accept' ? 'Invitation accepted!' : 'Invitation declined.')
      } else {
        const errorData = await response.json()
        alert('Failed to respond to invitation: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error responding to invitation:', error)
      alert('Failed to respond to invitation')
    }
  }

  const handleApplicationAction = async (applicationId: string, action: 'accept' | 'reject') => {
    try {
      console.log(`🔍 ${action.toUpperCase()}ING application:`, applicationId)
      
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'manage_application',
          application_id: applicationId,
          action_type: action,
          tee_time_creator_id: user?.id
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`Application ${action}ed successfully:`, result)
        
        // Refresh pending applications
        fetchPendingApplications()
        
        // Add notification for feedback
        setNotifications(prev => [{
          id: Date.now(),
          type: 'application_action',
          message: `Application ${action}ed successfully`,
          time: 'Just now',
          read: false
        }, ...prev.slice(0, 9)])
        
        alert(`Application ${action}ed successfully!`)
      } else {
        const errorData = await response.json()
        console.error(`Failed to ${action} application:`, errorData)
        alert(`Failed to ${action} application: ` + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error(`Error ${action}ing application:`, error)
      alert(`Failed to ${action} application`)
    }
  }

  const handleApplyToTeeTime = async (teeTimeId: string) => {
    // Check if user is logged in
    if (!user?.id) {
      alert('You must be logged in to apply for tee times')
      return
    }
    
    console.log('🏌️ Applying to tee time:', teeTimeId, 'for user:', user.id)
    
    try {
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apply',
          tee_time_id: teeTimeId,
          applicant_id: user.id
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Application submitted successfully:', result)
        
        // Add to recent activity for immediate feedback
        setRecentActivity(prev => [{
          id: Date.now(),
          type: 'application',
          message: `Applied to tee time on ${new Date().toLocaleDateString()}`,
          time: 'Just now'
        }, ...prev.slice(0, 3)])
        
        // Note: Backend handles creating notification for tee time creator
        
        alert('Application submitted successfully! The creator will be notified.')
        
        // Refresh tee times to show updated status
        fetchTeeTimes()
        
        // Refresh notifications and pending applications for all users
        fetchNotifications()
        fetchPendingApplications()
      } else {
        const errorData = await response.json()
        console.error('Failed to submit application:', errorData)
        
        // Handle duplicate application specifically
        if (response.status === 409) {
          alert('You have already applied to this tee time. Check the Applications tab to see your application status.')
        } else {
          alert('Failed to submit application: ' + (errorData.details || errorData.error || 'Unknown error'))
        }
      }
    } catch (error) {
      console.error('Error applying to tee time:', error)
      alert('Failed to submit application')
    }
  }

  const handleMessageCreator = (creator: any) => {
    if (!user?.id) {
      alert('You must be logged in to send messages')
      return
    }
    
    if (!creator) {
      alert('Creator information not available')
      return
    }
    
    console.log('📧 Opening message composer for:', creator.first_name, creator.last_name, '(User ID:', user.id, ')')
    
    // Switch to messages tab and pre-select the creator for messaging
    setActiveTab('messages')
    
    // Add a small delay to ensure the messaging component is mounted
    setTimeout(() => {
      // The MessagingSystem component should handle pre-selecting this user
      // We could pass this via a prop or state if needed
      console.log('📧 Message composer opened for:', creator.first_name, creator.last_name)
    }, 100)
  }

  const handleDeleteTeeTime = async (teeTimeId: string) => {
    if (!confirm('Are you sure you want to delete this tee time? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/tee-times', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          tee_time_id: teeTimeId,
          user_id: user?.id
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Tee time deleted successfully:', result)
        
        // Add to recent activity for immediate feedback
        setRecentActivity(prev => [{
          id: Date.now(),
          type: 'delete',
          message: `Deleted tee time on ${new Date().toLocaleDateString()}`,
          time: 'Just now'
        }, ...prev.slice(0, 3)])
        
        alert('Tee time deleted successfully!')
        
        // Refresh tee times to show updated status
        fetchTeeTimes()
      } else {
        const errorData = await response.json()
        console.error('Failed to delete tee time:', errorData)
        alert('Failed to delete tee time: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting tee time:', error)
      alert('Failed to delete tee time')
    }
  }

  const handleViewCourse = (courseId: string) => {
    // In a real app, this would navigate to course details
    alert(`Viewing course details for ${courseId}`)
  }

  const handleSendGroupMessage = async () => {
    if (!groupMessageText.trim()) return
    
    try {
      // In a real app, this would make an API call
      const newMessage = {
        id: Date.now(),
        sender: { first_name: profile?.first_name || 'You' },
        message_content: groupMessageText,
        timestamp: new Date().toISOString()
      }
      
      // Add to local state for immediate feedback
      setRecentActivity(prev => [{
        id: Date.now(),
        type: 'message',
        message: `Sent group message: "${groupMessageText.substring(0, 30)}${groupMessageText.length > 30 ? '...' : ''}"`,
        time: 'Just now'
      }, ...prev.slice(0, 3)])
      
      setGroupMessageText('')
      alert('Message sent to group!')
    } catch (error) {
      console.error('Error sending group message:', error)
      alert('Failed to send message')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
      alert('Failed to sign out. Please try again.')
    }
  }

  // Course search functionality
  const handleCourseSearch = async () => {
    try {
      setCourseSearchLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (courseSearchQuery) {
        params.append('query', courseSearchQuery)
      }
      if (zipCode) {
        params.append('zipCode', zipCode)
        params.append('radius', searchRadius.toString())
      }
      
      const queryString = params.toString()
      const url = queryString ? `/api/golf-courses?${queryString}` : '/api/golf-courses'
      
      console.log('🔍 Course search URL:', url)
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Course search results:', data.courses?.length || 0, 'courses found')
        setCourseSearchResults(data.courses || [])
      } else {
        console.error('Failed to search courses')
        setCourseSearchResults([])
      }
    } catch (error) {
      console.error('Error searching courses:', error)
      setCourseSearchResults([])
    } finally {
      setCourseSearchLoading(false)
    }
  }


  const handleWriteReview = (course: any) => {
    setSelectedCourse(course)
    setReviewForm({ rating: 5, comment: '' })
    setShowReviewModal(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedCourse || !user?.id) return

    try {
      setReviewSubmitting(true)
      const response = await fetch('/api/golf-courses/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: selectedCourse.id,
          user_id: user.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Review submitted successfully!')
        setShowReviewModal(false)
        // Refresh course search results to show updated ratings
        if (courseSearchQuery) {
          handleCourseSearch()
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  const handleCreateCourse = async () => {
    console.log('🔍 handleCreateCourse called with form data:', createCourseForm)
    
    if (!createCourseForm.name || !createCourseForm.location) {
      alert('Course name and location are required')
      return
    }

    try {
      setCreateCourseSubmitting(true)
      console.log('🔍 Making API call to /api/golf-courses')
      const response = await fetch('/api/golf-courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createCourseForm.name,
          location: createCourseForm.location,
          description: createCourseForm.description,
          par: createCourseForm.par ? parseInt(createCourseForm.par) : null,
          holes: parseInt(createCourseForm.holes.toString())
        })
      })

      console.log('🔍 API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Course created successfully:', data)
        alert('Course created successfully!')
        setShowCreateCourseModal(false)
        setCreateCourseForm({ name: '', location: '', description: '', par: '', holes: 18 })
        // Refresh course search results to show the new course
        console.log('🔄 Refreshing course list after creation...')
        handleCourseSearch()
      } else {
        const errorData = await response.json()
        console.error('❌ Failed to create course:', errorData)
        alert(errorData.error || 'Failed to create course')
      }
    } catch (error) {
      console.error('❌ Error creating course:', error)
      alert('Failed to create course. Please try again.')
    } finally {
      setCreateCourseSubmitting(false)
    }
  }

  // Golf round recording functionality
  const handleRecordGolfRound = async (roundData: any) => {
    try {
      // In a real app, this would make an API call
      const response = await fetch('/api/golf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'round',
          ...roundData
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert('Golf round recorded successfully! Your achievements have been updated.')
        
        // Add to recent activity
        setRecentActivity(prev => [{
          id: Date.now(),
          type: 'round',
          message: `Recorded a round at ${roundData.course_name} - Score: ${roundData.total_score}`,
          time: 'Just now'
        }, ...prev.slice(0, 3)])
        
        // Close modal
        setShowGolfRoundModal(false)
      } else {
        const error = await response.json()
        alert(`Failed to record golf round: ${error.error}`)
      }
    } catch (error) {
      console.error('Error recording golf round:', error)
      alert('Failed to record golf round. Please try again.')
    }
  }
  
  // Fetch user's groups
  const fetchUserGroups = async () => {
    if (!user?.id) return
    
    setGroupsLoading(true)
    try {
      const response = await fetch(`/api/groups?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('👥 Raw groups data:', data)
        
        // Extract group data from the nested structure
        const groups = (data.groups || []).map((membership: any) => ({
          ...membership.group,
          membership_id: membership.id,
          membership_status: membership.status
        }))
        
        setUserGroups(groups)
        console.log('👥 Processed user groups:', groups?.length || 0, groups)
      } else {
        console.error('❌ Failed to fetch user groups')
        setUserGroups([])
      }
    } catch (error) {
      console.error('❌ Error fetching user groups:', error)
      setUserGroups([])
    } finally {
      setGroupsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    console.log('🔍 Starting search for:', searchQuery)
    setSearchLoading(true)
    setSearchPerformed(true)
    
    try {
      let response
      
      // If we're in the groups tab, search for groups instead of users
      if (activeTab === 'groups') {
        response = await fetch(`/api/groups?action=search&q=${encodeURIComponent(searchQuery)}`)
      } else {
        response = await fetch(`/api/users?action=search&q=${encodeURIComponent(searchQuery)}`)
      }
      
      console.log('📡 Search response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Search results:', data?.length || 0)
        
        if (activeTab === 'groups') {
          // For groups, no filtering needed
          setSearchResults(data || [])
        } else {
          // Filter out the current user from user search results
          const filteredData = data.filter((searchedUser: any) => searchedUser.id !== user?.id)
          console.log('🔍 Filtered results:', filteredData?.length || 0)
          setSearchResults(filteredData)
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Search failed:', response.status, errorText)
        setSearchResults([])
      }
    } catch (error) {
      console.error('❌ Search error:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`)
  }

  const handleConnect = async (userId: string) => {
    if (!user?.id) {
      alert('You must be logged in to connect with users')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          user_id: user.id,
          connected_user_id: userId
        }),
      })
          
      if (response.ok) {
        const data = await response.json()
        alert('Connection request sent successfully!')
        
        // Add to recent activity
        setRecentActivity(prev => [{
          id: Date.now(),
          type: 'connection',
          message: `Sent connection request to ${searchResults.find(u => u.id === userId)?.first_name || 'user'}`,
          time: 'Just now'
        }, ...prev.slice(0, 3)])
        
      } else {
        const error = await response.json()
        alert(`Failed to send connection request: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Connection error:', error)
      alert('Failed to send connection request. Please try again.')
    }
  }
  
  // Form submission handlers
  const handleTeeTimeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          creator_id: user?.id,
          course: teeTimeForm.course,
          location: teeTimeForm.location,
          tee_time_date: teeTimeForm.date,
          tee_time_time: teeTimeForm.time,
          max_players: teeTimeForm.players,
          handicap_requirement: teeTimeForm.handicap,
          description: teeTimeForm.description
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Tee time posted successfully:', result)
        
        // Add notification for successful tee time creation
        setNotifications(prev => [{
          id: Date.now(),
          type: 'tee_time_created',
          message: `Your tee time for ${teeTimeForm.date} at ${teeTimeForm.time} has been posted successfully!`,
          time: 'Just now',
          read: false
        }, ...prev.slice(0, 9)]) // Keep max 10 notifications
        
        setShowTeeTimeModal(false)
        setTeeTimeForm({
          course: '',
          location: '',
          date: '',
          time: '',
          players: 4,
          handicap: 'any',
          description: ''
        })
        // Refresh tee times list
        fetchTeeTimes()
      } else {
        const errorData = await response.json()
        console.error('Failed to post tee time:', errorData)
        alert('Failed to post tee time: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error posting tee time:', error)
      alert('Error posting tee time. Please try again.')
    }
  }
  
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          user_id: user?.id,
          ...groupForm,
          invitees: selectedInvitees.map(invitee => invitee.id)
        }),
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Group created successfully:', result)
        setShowGroupModal(false)
        setGroupForm({
          name: '',
          description: '',
          maxMembers: 8
        })
        setSelectedInvitees([])
        setGroupInviteQuery('')
        setGroupInviteResults([])
        alert('Group created successfully!' + (selectedInvitees.length > 0 ? ` Invitations sent to ${selectedInvitees.length} user(s).` : ''))
      } else {
        const errorData = await response.json()
        console.error('Failed to create group:', errorData)
        alert('Failed to create group: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }
  
  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
              const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          ...messageForm
        }),
      })
      
      if (response.ok) {
        console.log('Message sent successfully')
        setShowMessageModal(false)
        setMessageForm({
          recipient: '',
          subject: '',
          message: ''
        })
      } else {
        console.error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }
  
  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Find the course ID by name
      const courseResponse = await fetch(`/api/golf?action=courses&q=${encodeURIComponent(ratingForm.course)}`)
      if (!courseResponse.ok) {
        alert('Course not found')
        return
      }
      
      const courseData = await courseResponse.json()
      const course = courseData.courses?.[0]
      
      if (!course) {
        alert('Course not found')
        return
      }

      // Submit the review
      const response = await fetch('/api/golf-courses/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: course.id,
          user_id: user?.id,
          rating: ratingForm.rating,
          comment: ratingForm.review
        }),
      })
      
      if (response.ok) {
        alert('Review submitted successfully!')
        setShowRatingModal(false)
        setRatingForm({
          course: '',
          rating: 5,
          review: ''
        })
        // Refresh course search results if we're on the golf courses tab
        if (activeTab === 'courses' && courseSearchQuery) {
          handleCourseSearch()
        }
      } else {
        alert('Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error submitting review')
    }
  }

  const fetchRounds = async () => {
    if (!user) return
    
    setRoundsLoading(true)
    try {
      const { data, error } = await supabase
        .from('golf_rounds')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setRounds(data || [])
    } catch (error) {
      console.error('Error fetching rounds:', error)
    } finally {
      setRoundsLoading(false)
    }
  }

  const handleLogRound = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLogRoundSubmitting(true)
    try {
      const { error } = await supabase
        .from('golf_rounds')
        .insert({
          user_id: user.id,
          course: logRoundForm.course,
          date: logRoundForm.date,
          score: parseInt(logRoundForm.score),
          par: parseInt(logRoundForm.par),
          handicap: parseFloat(logRoundForm.handicap) || 0,
          notes: logRoundForm.notes,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      // Reset form and refresh rounds
      setLogRoundForm({
        course: '',
        date: '',
        score: '',
        par: '',
        handicap: '',
        notes: ''
      })
      await fetchRounds()
      alert('Round logged successfully!')
    } catch (error) {
      console.error('Error logging round:', error)
      alert('Failed to log round')
    } finally {
      setLogRoundSubmitting(false)
    }
  }

  const handleQRScan = async (qrData: any) => {
    try {
      console.log('📱 QR Code scanned:', qrData)
      
      if (qrData.type !== 'golf_connection') {
        alert('Invalid QR code. Please scan a golf connection QR code.')
        return
      }

      if (qrData.userId === user?.id) {
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
        // Refresh connections
        fetchConnections()
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

  return (
    <div className="min-h-screen bg-theme-gradient transition-colors duration-300">
      {/* Clean Navigation */}
      <nav className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 sticky top-0 z-50 shadow-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            {/* Logo - Far Left */}
            <div className="flex-shrink-0 -ml-2 sm:-ml-1">
              <Logo size="md" />
            </div>

            {/* Navigation Tabs - Absolute Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="hidden md:flex items-center space-x-2 bg-gray-100/90 dark:bg-gradient-to-r dark:from-slate-700/90 dark:to-slate-600/80 backdrop-blur-xl rounded-xl p-2 shadow-lg border border-gray-300/40 dark:border-slate-600/40 transition-colors duration-300">
                          {[
              { id: 'overview', label: 'Tee Times', icon: Home },
              { id: 'courses', label: 'Courses', icon: Target },
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'messages', label: 'Messages', icon: MessageCircle }
            ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                        isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-slate-600/60 hover:scale-105'
                      }`}
                    >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500 dark:text-slate-400'}`} />
                    <span className="font-semibold text-sm">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
              </div>
              
            {/* Right Side Container */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Mobile Navigation */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50 touch-manipulation"
                  aria-label="Toggle navigation menu"
                >
                  {showMobileMenu ? (
                    <X className="w-5 h-5" />
                  ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  )}
                </button>
              </div>

              {/* User Menu - Far Right */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <button 
                  className="p-2 sm:p-3 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:scale-110 relative group"
                  onClick={() => setActiveTab('find-someone')}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
                </button>
                
                {/* Theme Toggle */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <ThemeToggle className="relative z-10 bg-transparent border-slate-600/50 hover:bg-slate-700/50" size="sm" />
                </div>
                
                {/* Notifications */}
              <div className="relative notifications-container">
                <button 
                    className="p-2 sm:p-3 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all duration-300 hover:scale-110 relative group"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
                  {(pendingInvitations.length > 0 || notifications.filter(n => !n.read).length > 0) && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-lg animate-pulse flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {pendingInvitations.length + notifications.filter(n => !n.read).length}
                      </span>
                    </div>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Notifications</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {/* Pending Group Invitations */}
                        {pendingInvitations.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Group Invitations</h4>
                            {pendingInvitations.map((invitation) => (
                              <div 
                                key={invitation.id} 
                                className="p-3 rounded-lg border bg-blue-50 border-blue-200 mb-2"
                              >
                                <p className="text-slate-700 text-sm mb-2">
                                  <span className="font-semibold">{invitation.inviter?.first_name} {invitation.inviter?.last_name}</span> invited you to join <span className="font-semibold">{invitation.group?.name}</span>
                                </p>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded transition-colors"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                                  >
                                    Decline
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-3 rounded-lg border transition-colors ${
                              notification.read ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'
                            }`}
                          >
                            <p className="text-slate-700 text-sm mb-1">{notification.message}</p>
                            <p className="text-slate-500 text-xs">{notification.time}</p>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                        className="w-full mt-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        Mark all as read
                </button>
                    </div>
                  </div>
                )}
              </div>
                
                {/* User Profile */}
                <div className="relative group">
                <button className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gradient-to-r hover:from-slate-700/80 hover:to-slate-600/60 transition-all duration-300 group-hover:scale-105">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full overflow-hidden shadow-lg relative">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-700 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"></div>
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-white relative z-10" />
                      </div>
                    )}
                  </div>
                  <span className="hidden sm:block text-white font-semibold text-lg">
                      {profile?.first_name || user?.email?.split('@')[0] || 'Golfer'}
                    </span>
                  </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-lg border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                      <button
                        onClick={() => {
                          router.push('/profile')
                        }}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        My Profile
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('badges')
                        }}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <Trophy className="h-4 w-4 mr-3" />
                        Badges
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('applications')
                          fetchPendingApplications()
                          fetchNotifications()
                        }}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <Bell className="h-4 w-4 mr-3" />
                        Applications
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('my-rounds')
                        }}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <Target className="h-4 w-4 mr-3" />
                        My Rounds
                      </button>
                      <button
                        onClick={() => setShowQRCode(true)}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <QrCode className="h-4 w-4 mr-3" />
                        My QR Code
                      </button>
                      <button
                        onClick={() => setShowQRScanner(true)}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <QrCode className="h-4 w-4 mr-3" />
                        Scan QR Code
                      </button>
                      <div className="border-t border-slate-700 my-2"></div>
                      <button
                        onClick={() => {
                          handleSignOut()
                        }}
                        className="flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/60">
          <div className="px-4 py-3 space-y-2 max-h-screen overflow-y-auto">
            {[
              { id: 'overview', label: 'Tee Times', icon: Home },
              { id: 'courses', label: 'Courses', icon: Target },
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'messages', label: 'Messages', icon: MessageCircle }
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any)
                    setShowMobileMenu(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 font-medium touch-manipulation ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600/60'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="font-semibold text-base">{tab.label}</span>
                </button>
              )
            })}
            
            {/* User Menu Links for Mobile */}
            <div className="border-t border-slate-700 pt-2 mt-2 space-y-2">
              <button
                onClick={() => {
                  router.push('/profile')
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 font-medium touch-manipulation text-slate-300 hover:text-white hover:bg-slate-600/60"
              >
                <User className="h-5 w-5 text-slate-400" />
                <span className="font-semibold">My Profile</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('badges')
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 font-medium touch-manipulation text-slate-300 hover:text-white hover:bg-slate-600/60"
              >
                <Trophy className="h-5 w-5 text-slate-400" />
                <span className="font-semibold">Badges</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('applications')
                  setShowMobileMenu(false)
                  fetchPendingApplications()
                  fetchNotifications()
                }}
                className="w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-300 font-medium touch-manipulation text-slate-300 hover:text-white hover:bg-slate-600/60"
              >
                <Bell className="h-5 w-5 text-slate-400" />
                <span className="font-semibold">Applications</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Weather Widget at Top */}
            <WeatherWidget />

            {/* Tee Time Feed */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-700/30 to-slate-600/20 rounded-3xl p-4 sm:p-8 shadow-xl border border-slate-600/40 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/20 to-transparent transform -skew-y-6"></div>
              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Available Tee Times</h2>
                <button 
                  onClick={openTeeTimeModal}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto"
                >
                  Post Tee Time
                </button>
              </div>

              {/* Tee Time Location Filtering */}
              <div className="relative mb-6">
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-emerald-400" />
                    <span className="text-white font-medium">Filter Tee Times by Location:</span>
                  </div>
                  
                  <select
                    value={teeTimeLocationFilter}
                    onChange={(e) => handleTeeTimeLocationFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all duration-300"
                  >
                    <option value="">All Locations</option>
                    <option value="california">California</option>
                    <option value="florida">Florida</option>
                    <option value="texas">Texas</option>
                    <option value="new york">New York</option>
                    <option value="georgia">Georgia</option>
                    <option value="washington">Washington</option>
                    <option value="oregon">Oregon</option>
                    <option value="illinois">Illinois</option>
                    <option value="minnesota">Minnesota</option>
                    <option value="north carolina">North Carolina</option>
                    <option value="pennsylvania">Pennsylvania</option>
                    <option value="scotland">Scotland</option>
                    <option value="ireland">Ireland</option>
                    <option value="australia">Australia</option>
                  </select>

                  <button
                    onClick={getUserLocation}
                    disabled={locationLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {locationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Getting Location...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        <span>Find Nearby</span>
                      </>
                    )}
                  </button>

                  {userLocation && (
                    <button
                      onClick={async () => {
                        const newValue = !showNearbyTeeTimesOnly
                        setShowNearbyTeeTimesOnly(newValue)
                        
                        if (newValue && !userLocation) {
                          // Get user's location if not already available
                          await getUserLocation()
                        }
                        
                        // Refresh tee times with new filter
                        setTimeout(() => {
                          fetchTeeTimes()
                        }, 100)
                      }}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2 ${
                        showNearbyTeeTimesOnly 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      }`}
                    >
                      <span>{showNearbyTeeTimesOnly ? 'Show All' : 'Show Nearby Only'}</span>
                      {nearbyTeeTimes.length > 0 && (
                        <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                          {nearbyTeeTimes.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Location Status for Tee Times */}
                {userLocation && (
                  <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-emerald-300">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        Location: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-sm">
                        {nearbyTeeTimes.length} tee times within 50 miles
                      </span>
                    </div>
                  </div>
                )}
              </div>
            
              {/* Tee Times List */}
              <div className="space-y-6">
                {teeTimesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-slate-600 text-lg">Loading tee times...</p>
                  </div>
                ) : !availableTeeTimes || availableTeeTimes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-r from-slate-100 to-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No Tee Times Available</h3>
                    <p className="text-slate-500 mb-6">Be the first to post a tee time and start building the golf community!</p>
                    <button 
                      onClick={openTeeTimeModal}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Post First Tee Time
                    </button>
                  </div>
                ) : (
                  (showNearbyTeeTimesOnly ? nearbyTeeTimes : availableTeeTimes)?.map((teeTime) => {
                    const daysUntilTeeTime = Math.ceil((new Date(teeTime.tee_time_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    const isToday = new Date(teeTime.tee_time_date).toDateString() === new Date().toDateString()
                    const isTomorrow = daysUntilTeeTime === 1
                    const spotsRemaining = teeTime.max_players - (teeTime.current_players || 1)
                    const isAlmostFull = spotsRemaining <= 1
                    
                    return (
                    <div key={teeTime.id} className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden relative">
                      
                      {/* Course Image Header */}
                      <div className="relative h-32 sm:h-40 bg-gradient-to-r from-emerald-500 to-teal-600">
                        {(teeTime.golf_courses?.course_image_url || teeTime.golf_courses?.logo_url) ? (
                          <>
                            <img
                              src={teeTime.golf_courses?.course_image_url || teeTime.golf_courses?.logo_url}
                              alt={teeTime.course_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            <div className="absolute inset-0 bg-black/20"></div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center text-white">
                              <Flag className="h-12 w-12 mx-auto mb-2 opacity-80" />
                              <p className="text-lg font-semibold opacity-90">{teeTime.course_name}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Course Logo Overlay */}
                        {teeTime.golf_courses?.logo_url && (
                          <div className="absolute top-3 left-3">
                            <div className="h-12 w-12 bg-white/90 rounded-lg p-2 shadow-lg">
                              <img
                                src={teeTime.golf_courses.logo_url}
                                alt={`${teeTime.course_name} logo`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
                        {isToday && (
                          <div className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                            TODAY
                          </div>
                        )}
                        {isTomorrow && (
                          <div className="bg-orange-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                            TOMORROW
                          </div>
                        )}
                        {isAlmostFull && (
                          <div className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-medium">
                            ALMOST FULL
                          </div>
                        )}
                      </div>

                      <div className="relative p-4 sm:p-6">
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {/* Course Icon/Logo */}
                              <div className="flex-shrink-0">
                                {teeTime.golf_courses?.logo_url ? (
                                  <div className="h-12 w-12 bg-white rounded-lg p-2 shadow-md border border-gray-200">
                                    <img
                                      src={teeTime.golf_courses.logo_url}
                                      alt={`${teeTime.course_name} logo`}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-emerald-500 rounded flex items-center justify-center"><svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>'
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="h-12 w-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                                    <Flag className="h-6 w-6 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-gray-900 font-bold text-lg sm:text-xl">{teeTime.course_name}</h3>
                                {teeTime.golf_courses?.location && (
                                  <p className="text-gray-600 text-sm mt-1">{teeTime.golf_courses.location}</p>
                                )}
                                {(teeTime.distance_km || teeTime.distance) && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <MapPin className="h-3 w-3 text-emerald-500" />
                                    <span className="text-emerald-600 text-xs font-medium">
                                      {teeTime.distance_km ? `${teeTime.distance_km.toFixed(1)} km away` : `${teeTime.distance.toFixed(1)} miles away`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {/* Date and Time */}
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <Calendar className="h-4 w-4 text-emerald-500" />
                                <div>
                                  <p className="text-gray-900 font-medium text-sm">{new Date(teeTime.tee_time_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                  <p className="text-gray-500 text-xs">{teeTime.tee_time_time} • {daysUntilTeeTime > 0 ? `${daysUntilTeeTime} days away` : isToday ? 'Today' : 'Past date'}</p>
                                </div>
                              </div>

                              {/* Creator Info */}
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="relative">
                                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-emerald-500/50">
                                <img
                                  src={teeTime.creator?.avatar_url || '/default-avatar.svg'}
                                  alt={`${teeTime.creator?.first_name || 'Unknown'} ${teeTime.creator?.last_name || ''}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/default-avatar.svg'
                                  }}
                                />
                              </div>
                                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                                <div>
                                  <p className="text-gray-500 text-xs">Hosted by</p>
                                  <button
                                    onClick={() => router.push(`/users/${teeTime.creator?.id}`)}
                                    className="text-emerald-600 hover:text-emerald-700 transition-colors duration-200 font-medium hover:underline text-sm"
                                  >
                                    {teeTime.creator?.first_name || 'Unknown'} {teeTime.creator?.last_name || ''}
                                  </button>
                          </div>
                        </div>
                          </div>
                          </div>

                          {/* Player and Handicap Info */}
                          <div className="flex flex-col gap-2 sm:text-right sm:min-w-[140px]">
                            <div className="relative">
                              <div className={`${isAlmostFull ? 'bg-red-500' : 'bg-emerald-500'} text-white px-3 py-2 rounded-lg text-center`}>
                                <div className="text-base font-bold">{teeTime.current_players || 1}/{teeTime.max_players}</div>
                                <div className="text-xs opacity-90">Players</div>
                        </div>
                              {spotsRemaining > 0 && (
                                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
                                  {spotsRemaining}
                      </div>
                              )}
                            </div>
                            
                            <div className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-center">
                              <div className="text-gray-500 text-xs">Skill Level</div>
                              <div className="text-gray-900 font-medium text-sm capitalize">{teeTime.handicap_requirement}</div>
                            </div>

                            {/* Weather Widget Placeholder */}
                            <div className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg text-center">
                              <div className="text-xs text-blue-600 mb-1">Weather</div>
                              <div className="text-blue-900 text-xs font-medium">☀️ 72°F</div>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {teeTime.description && (
                          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-gray-700 text-sm leading-relaxed italic">&quot;{teeTime.description}&quot;</p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {teeTime.creator_id === user?.id ? (
                            <>
                              <button
                                onClick={() => {
                                  setActiveTab('applications')
                                  fetchPendingApplications()
                                  fetchNotifications()
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                <Bell className="h-4 w-4" />
                                Manage Applications
                              </button>
                          <button
                            onClick={() => handleDeleteTeeTime(teeTime.id)}
                            className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                          >
                            <X className="h-4 w-4" />
                            Delete Tee Time
                          </button>
                            </>
                        ) : (
                            <>
                          <button
                            onClick={() => handleApplyToTeeTime(teeTime.id)}
                                disabled={spotsRemaining <= 0}
                                className={`${spotsRemaining <= 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'} text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2`}
                          >
                                <Plus className="h-4 w-4" />
                                {spotsRemaining <= 0 ? 'Tee Time Full' : 'Apply to Join'}
                          </button>
                              <button 
                                onClick={() => handleMessageCreator(teeTime.creator)}
                                className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                              >
                                <MessageCircle className="h-4 w-4" />
                                Message Host
                        </button>
                            </>
                          )}
                      </div>
                    </div>
                    </div>
                    )
                  })
                )}
              </div>


            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'find-someone' && (
          <div className="space-y-6">
            {/* User Search & Connections */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6">Find Golfers</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex space-x-4 mb-6">
                <input
                  type="text"
                  placeholder="Search by name, location, or handicap..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300"
                />
                <button
                  type="submit"
                  disabled={searchLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-6 py-3 rounded-lg transition-all duration-300 font-medium disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
              
              {/* Search Results */}
              {searchResults && searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition-colors duration-300">
                      <div 
                        onClick={() => router.push(`/users/${user.id}`)}
                        className="flex items-center space-x-3 flex-1 cursor-pointer"
                      >
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-emerald-500/30">
                          <img
                            src={user.avatar_url || '/default-avatar.svg'}
                            alt={`${user.first_name} ${user.last_name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/default-avatar.svg'
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white hover:text-emerald-400 transition-colors">
                            {user.first_name} {user.last_name}
                          </h3>
                          <p className="text-slate-300 text-sm">{user.location} • Handicap: {user.handicap}</p>
                          {user.bio && <p className="text-slate-400 text-xs mt-1">{user.bio}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => router.push(`/users/${user.id}`)}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          View Profile
                        </button>
                      <button
                        onClick={() => handleConnect(user.id)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        Connect
                      </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {searchPerformed && (!searchResults || searchResults.length === 0) && !searchLoading && (
                <div className="text-center py-8">
                  <p className="text-slate-400 mb-4">No users found matching your search.</p>
                  <p className="text-slate-500 text-sm">Try searching for common names like "John", "Sarah", or "Mike"</p>
                  <button
                    onClick={() => {
                      setSearchQuery('John')
                      handleSearch()
                    }}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium"
                  >
                    Try Example Search
                  </button>
                </div>
              )}
            </div>



            {/* Pending Requests */}
            {pendingRequests && pendingRequests.length > 0 && (
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">Pending Requests</h2>
                <div className="space-y-4">
                  {pendingRequests?.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-emerald-500/30">
                          <img
                            src={request.connected_user?.avatar_url || '/default-avatar.svg'}
                            alt={`${request.connected_user?.first_name} ${request.connected_user?.last_name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/default-avatar.svg'
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{request.connected_user?.first_name} {request.connected_user?.last_name}</h3>
                          <p className="text-slate-300 text-sm">Wants to connect with you</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptConnection(request.id)}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectConnection(request.id)}
                          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-3 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

                  {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-6">

            {/* Golf Courses */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Golf Courses</h2>
                <button
                  onClick={() => setShowCreateCourseModal(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Course</span>
                </button>
              </div>
                
                {/* Course Search */}
              <div className="space-y-4 mb-6">
                {/* Search Input */}
                <div className="flex space-x-3">
                  <input
                    type="text"
                    placeholder="Search courses by name or location..."
                    value={courseSearchQuery}
                    onChange={(e) => setCourseSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300"
                  />
                  <button
                    onClick={handleCourseSearch}
                    disabled={courseSearchLoading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed"
                  >
                    {courseSearchLoading ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    onClick={() => {
                      setCourseSearchQuery('')
                      setZipCode('')
                      handleCourseSearch()
                    }}
                    disabled={courseSearchLoading}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed"
                  >
                    Show All
                  </button>
                </div>

                {/* Location Filter */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <span className="text-slate-300 font-medium whitespace-nowrap">Find courses near:</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Enter ZIP code (e.g., 12345)"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300 w-full sm:w-48"
                    />
                    <select
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                      className="px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white transition-all duration-300 w-full sm:w-32"
                    >
                      <option value={50}>50 miles</option>
                      <option value={100}>100 miles</option>
                      <option value={150}>150 miles</option>
                      <option value={200}>200 miles</option>
                      <option value={250}>250 miles</option>
                      <option value={500}>500 miles</option>
                    </select>
                    <button
                      onClick={handleCourseSearch}
                      disabled={courseSearchLoading || !zipCode}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed whitespace-nowrap w-full sm:w-auto"
                    >
                      Find Nearby
                    </button>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(courseSearchQuery || zipCode) && (
                  <div className="flex flex-wrap gap-2">
                    {courseSearchQuery && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                        Search: "{courseSearchQuery}"
                        <button
                          onClick={() => {
                            setCourseSearchQuery('')
                            handleCourseSearch()
                          }}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                    {zipCode && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
                        Within {searchRadius}mi of {zipCode}
                        <button
                          onClick={() => {
                            setZipCode('')
                            handleCourseSearch()
                          }}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </div>
                )}
              </div>

                {/* Location Filtering */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-emerald-400" />
                    <span className="text-white font-medium">Filter by Location:</span>
                  </div>
                  
                  <select
                    value={locationFilter}
                    onChange={(e) => handleLocationFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 transition-all duration-300"
                  >
                    <option value="">All Locations</option>
                    <option value="california">California</option>
                    <option value="florida">Florida</option>
                    <option value="texas">Texas</option>
                    <option value="new york">New York</option>
                    <option value="georgia">Georgia</option>
                    <option value="washington">Washington</option>
                    <option value="oregon">Oregon</option>
                    <option value="illinois">Illinois</option>
                    <option value="minnesota">Minnesota</option>
                    <option value="north carolina">North Carolina</option>
                    <option value="pennsylvania">Pennsylvania</option>
                    <option value="scotland">Scotland</option>
                    <option value="ireland">Ireland</option>
                    <option value="australia">Australia</option>
                  </select>

                  <button
                    onClick={getUserLocation}
                    disabled={locationLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {locationLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Getting Location...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        <span>Find Nearby</span>
                      </>
                    )}
                  </button>

                  {userLocation && (
                    <button
                      onClick={() => setShowNearbyOnly(!showNearbyOnly)}
                      className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2 ${
                        showNearbyOnly 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white' 
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      }`}
                    >
                      <span>{showNearbyOnly ? 'Show All' : 'Show Nearby Only'}</span>
                      {nearbyCourses.length > 0 && (
                        <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                          {nearbyCourses.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Location Status */}
                {userLocation && (
                  <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-emerald-300">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        Location: {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-sm">
                        {nearbyCourses.length} courses within 50 miles
                      </span>
                    </div>
                  </div>
                )}

              {/* Course Results */}
              {(showNearbyOnly ? nearbyCourses : courseSearchResults) && (showNearbyOnly ? nearbyCourses : courseSearchResults).length > 0 ? (
                <div className="space-y-4">
                  {(showNearbyOnly ? nearbyCourses : courseSearchResults)?.map((course) => (
                    <div key={course.id} className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            {/* Golf Course Logo */}
                            {(course.course_image_url || course.logo_url) ? (
                              <div className="flex-shrink-0 mx-auto sm:mx-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-emerald-500/30 shadow-lg">
                                  <img
                                    src={course.course_image_url || course.logo_url}
                                    alt={`${course.name} logo`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                      e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><svg class="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>'
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex-shrink-0 mx-auto sm:mx-0">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center border-2 border-emerald-500/30 shadow-lg">
                                  <Flag className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="flex-1 text-center sm:text-left">
                              <h3 className="text-white font-bold text-xl sm:text-2xl mb-2">{course.name}</h3>
                              
                              {/* Location and Distance */}
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-slate-300 text-sm mb-3">
                                <div className="flex items-center justify-center sm:justify-start space-x-1">
                                  <MapPin className="h-4 w-4 text-emerald-400" />
                                  <span>{course.location}</span>
                                </div>
                                {course.distance && (
                                  <div className="flex items-center justify-center sm:justify-start space-x-1">
                                    <span className="text-purple-400 font-medium">
                                      {Math.round(course.distance * 10) / 10} mi away
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Course Stats */}
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 mb-3">
                                {/* Par */}
                                <div className="flex items-center justify-center sm:justify-start space-x-2">
                                  <Flag className="h-4 w-4 text-blue-400" />
                                  <span className="text-slate-400 text-sm">Par:</span>
                                  <span className="text-white font-semibold text-lg">{course.par || 'N/A'}</span>
                                </div>
                                
                                {/* Public/Private Status */}
                                <div className="flex items-center justify-center sm:justify-start space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${course.course_type === 'private' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                  <span className="text-slate-400 text-sm">Type:</span>
                                  <span className={`font-semibold text-sm ${course.course_type === 'private' ? 'text-red-400' : 'text-green-400'}`}>
                                    {course.course_type === 'private' ? 'Private' : 'Public'}
                                  </span>
                                </div>
                                
                                {/* Holes */}
                                {course.holes && (
                                  <div className="flex items-center justify-center sm:justify-start space-x-2">
                                    <Target className="h-4 w-4 text-purple-400" />
                                    <span className="text-slate-400 text-sm">Holes:</span>
                                    <span className="text-white font-semibold">{course.holes}</span>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-slate-200 leading-relaxed text-sm sm:text-base">{course.description}</p>
                            </div>
                          </div>
                            </div>
                        <div className="text-center sm:text-right">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-center shadow-lg inline-block">
                            <div className="flex items-center justify-center space-x-1 mb-1">
                              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                              <span className="text-white font-bold text-lg sm:text-xl">{course.average_rating || 'N/A'}</span>
                            </div>
                            <div className="text-emerald-100 text-xs">
                              {course.review_count || 0} reviews
                            </div>
                          </div>
                          </div>
                            </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-slate-400">Par:</span>
                          <p className="text-white font-medium">{course.par}</p>
                          </div>
                        <div>
                          <span className="text-slate-400">Holes:</span>
                          <p className="text-white font-medium">{course.holes}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Recent Reviews:</span>
                          <p className="text-white font-medium">{course.reviews?.length || 0}</p>
                                      </div>
                                    </div>
                      {/* Recent Reviews */}
                      {course.recent_reviews && course.recent_reviews.length > 0 && (
                        <div className="mt-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/30">
                          <h4 className="text-sm font-medium text-slate-300 mb-3">Recent Reviews</h4>
                          <div className="space-y-3">
                            {course.recent_reviews.map((review: any, index: number) => (
                              <div key={index} className="flex items-start space-x-3">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-slate-500'}`} 
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-slate-400">
                                    {review.user_profiles?.first_name || 'Anonymous'}
                                  </span>
                                </div>
                                {review.comment && (
                                  <p className="text-sm text-slate-300 flex-1">{review.comment}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex space-x-3 mt-4">
                          <Link 
                            href={`/courses/${course.id}`}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2 px-4 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-center"
                          >
                            View Details
                          </Link>
                        <button 
                          onClick={() => handleWriteReview(course)}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 px-4 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Write Review
                          </button>
                        </div>
                      </div>
                  ))}
                    </div>
                  ) : courseSearchResults && courseSearchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gradient-to-r from-slate-100 to-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <Target className="h-10 w-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-700 mb-2">No Courses Found</h3>
                      <p className="text-slate-600 mb-4">
                        {courseSearchQuery ? `No courses found for "${courseSearchQuery}"` : 'No courses available yet'}
                      </p>
                      {courseSearchQuery && (
                        <button
                          onClick={() => {
                            setCourseSearchQuery('')
                            handleCourseSearch()
                          }}
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          Show All Courses
                        </button>
                      )}
                    </div>
                  ) : null}
              </div>
            </div>
          )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            {/* Groups Management */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">My Groups</h2>
                <button
                  onClick={handleCreateGroup}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Create Group
                </button>
              </div>
              
              {/* Search Groups */}
              <div className="mb-6">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                    className="flex-1 p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searchLoading}
                    className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {searchLoading ? '...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchPerformed && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Search Results</h3>
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                      <span className="ml-3 text-slate-300">Searching...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-slate-300 mb-2">No Groups Found</h4>
                      <p className="text-slate-400">Try a different search term or create a new group.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.map((group: any) => (
                        <div key={group.id} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-white">{group.name}</h4>
                            <span className="text-xs text-slate-400">{group.member_count || 0} members</span>
                          </div>
                          <p className="text-slate-300 text-sm mb-3">{group.description}</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleJoinGroup(group.id)}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Join Group
                            </button>
                            <button
                              onClick={() => router.push(`/groups/${group.id}`)}
                              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* My Groups */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">My Groups</h3>
                
                {groupsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    <span className="ml-3 text-slate-300">Loading groups...</span>
                  </div>
                ) : userGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-slate-300 mb-2">No Groups Yet</h4>
                    <p className="text-slate-400 mb-4">You haven't joined any groups yet. Create one or search for existing groups.</p>
                    <button
                      onClick={handleCreateGroup}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Create Your First Group
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userGroups.map((group: any) => {
                      console.log('🔍 Rendering group:', group)
                      return (
                      <div key={group.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {group.logo_url ? (
                              <img
                                src={group.logo_url}
                                alt={`${group.name} logo`}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                                <Users className="h-4 w-4 text-slate-300" />
                              </div>
                            )}
                            <h4 className="text-lg font-semibold text-white">{group.name || 'Unnamed Group'}</h4>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-400">{group.member_count || 0} members</span>
                            <button
                              onClick={() => setShowGroupModal(true)}
                              className="text-emerald-400 hover:text-emerald-300 text-sm font-medium"
                            >
                              Manage
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-300 mb-4">{group.description || 'No description available'}</p>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              console.log('🔍 View Group clicked for:', group)
                              console.log('🔍 Group ID:', group.id)
                              console.log('🔍 Navigating to:', `/groups/${group.id}`)
                              router.push(`/groups/${group.id}`)
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            View Group
                          </button>
                          <button className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            Leave Group
                          </button>
                        </div>
                      </div>
                      )
                    })}
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

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="space-y-6">
            <BadgeManagement />
          </div>
        )}

        {/* My Rounds Tab */}
        {activeTab === 'my-rounds' && (
          <div className="space-y-8">
            {/* Log Round Header */}
            <div className="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full -translate-y-12 translate-x-12"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-full translate-y-8 -translate-x-8"></div>
              
              <div className="relative">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl mr-4">
                    <Target className="h-6 w-6 text-emerald-400" />
                  </div>
                  My Rounds
                </h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  Track your golf rounds, monitor your progress, and view your round history.
                </p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg">
                        <Trophy className="h-5 w-5 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Total Rounds</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">{rounds.length}</p>
                    <p className="text-slate-400 text-sm">Total rounds</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-lg">
                        <Target className="h-5 w-5 text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Average Score</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {rounds.length > 0 ? Math.round(rounds.reduce((sum, round) => sum + round.score, 0) / rounds.length) : '--'}
                    </p>
                    <p className="text-slate-400 text-sm">Overall average</p>
                  </div>
                  
                  <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600/50">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                        <Star className="h-5 w-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Best Round</h3>
                    </div>
                    <p className="text-3xl font-bold text-white">
                      {rounds.length > 0 ? Math.min(...rounds.map(round => round.score)) : '--'}
                    </p>
                    <p className="text-slate-400 text-sm">Personal best</p>
                  </div>
                </div>

                {/* Log Round Form */}
                <div className="bg-slate-800/30 rounded-2xl p-8 border border-slate-600/30">
                  <h3 className="text-2xl font-bold text-white mb-6">Log New Round</h3>
                  <form onSubmit={handleLogRound} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Course</label>
                        <input
                          type="text"
                          placeholder="Enter course name"
                          value={logRoundForm.course}
                          onChange={(e) => setLogRoundForm({ ...logRoundForm, course: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Date</label>
                        <input
                          type="date"
                          value={logRoundForm.date}
                          onChange={(e) => setLogRoundForm({ ...logRoundForm, date: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Score</label>
                        <input
                          type="number"
                          placeholder="85"
                          value={logRoundForm.score}
                          onChange={(e) => setLogRoundForm({ ...logRoundForm, score: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Par</label>
                        <input
                          type="number"
                          placeholder="72"
                          value={logRoundForm.par}
                          onChange={(e) => setLogRoundForm({ ...logRoundForm, par: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-3">Handicap Used</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="12.5"
                          value={logRoundForm.handicap}
                          onChange={(e) => setLogRoundForm({ ...logRoundForm, handicap: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-3">Notes</label>
                      <textarea
                        placeholder="How was your round? Any highlights or areas for improvement?"
                        rows={4}
                        value={logRoundForm.notes}
                        onChange={(e) => setLogRoundForm({ ...logRoundForm, notes: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10 resize-none"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={logRoundSubmitting}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-8 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {logRoundSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Logging...</span>
                          </>
                        ) : (
                          <>
                            <Target className="h-5 w-5" />
                            <span>Log Round</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Recent Rounds */}
            <div className="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              
              <div className="relative">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg mr-3">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  Recent Rounds
                </h3>
                
                {roundsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading your rounds...</p>
                  </div>
                ) : rounds.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Target className="h-10 w-10 text-slate-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-4">No Rounds Yet</h4>
                    <p className="text-slate-400 mb-6">Start logging your rounds to track your progress and see your improvement over time.</p>
                    <button 
                      onClick={() => {
                        const formElement = document.querySelector('form[onSubmit]')
                        if (formElement) {
                          formElement.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                      className="bg-gradient-to-r from-emerald-500/20 to-teal-600/20 text-emerald-400 border border-emerald-400/30 px-6 py-3 rounded-xl hover:from-emerald-500/30 hover:to-teal-600/30 transition-all duration-300 font-semibold shadow-lg hover:shadow-emerald-500/20"
                    >
                      Log Your First Round
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rounds.map((round, index) => (
                      <div key={round.id || index} className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50 hover:border-emerald-400/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-600/20 rounded-lg p-3">
                              <Target className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-white">{round.course}</h4>
                              <p className="text-slate-400 text-sm">{new Date(round.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{round.score}</div>
                            <div className="text-slate-400 text-sm">Par {round.par}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">Handicap:</span>
                              <span className="text-white font-medium">{round.handicap || 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400">Score vs Par:</span>
                              <span className={`font-medium ${round.score - round.par > 0 ? 'text-red-400' : round.score - round.par < 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                                {round.score - round.par > 0 ? '+' : ''}{round.score - round.par}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {round.notes && (
                          <div className="mt-4 pt-4 border-t border-slate-600/50">
                            <p className="text-slate-300 text-sm italic">"{round.notes}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Applications Header */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-md rounded-2xl border border-blue-700/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Tee Time Applications</h2>
                  <p className="text-blue-300">Manage applications to your posted tee times</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{pendingApplications.length}</div>
                    <div className="text-blue-300 text-sm">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{notifications.filter(n => n.type === 'tee_time_application').length}</div>
                    <div className="text-blue-300 text-sm">Notifications</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Applications */}
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Pending Applications</h3>
                <p className="text-gray-600 mt-1">Review and manage applications to your tee times</p>
              </div>
              
              <div className="p-6">
                {pendingApplicationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading applications...</span>
                  </div>
                ) : pendingApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">No Pending Applications</h4>
                    <p className="text-gray-500">You don't have any pending applications for your tee times.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApplications.map((application: any) => (
                      <div key={application.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {application.applicant?.first_name?.[0] || '?'}
                                </span>
                              </div>
                              <div>
                                <button
                                  onClick={() => router.push(`/users/${application.applicant?.id}`)}
                                  className="font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-200 text-left"
                                >
                                  {application.applicant?.first_name} {application.applicant?.last_name}
                                </button>
                                <p className="text-sm text-gray-600">@{application.applicant?.username}</p>
                              </div>
                            </div>
                            
                            <div className="ml-13">
                              <div className="text-sm text-gray-700 mb-2">
                                <strong>Tee Time:</strong> {application.tee_times?.course_name} on {application.tee_times?.tee_time_date} at {application.tee_times?.tee_time_time}
                              </div>
                              {application.message && (
                                <div className="text-sm text-gray-600 bg-white rounded-lg p-3 border">
                                  <strong>Message:</strong> {application.message}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                Applied {formatTimeAgo(application.applied_at)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => handleApplicationAction(application.id, 'accept')}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleApplicationAction(application.id, 'reject')}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-xl">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800">Recent Notifications</h3>
                <p className="text-gray-600 mt-1">Stay updated on tee time applications</p>
              </div>
              
              <div className="p-6">
                {notificationsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification: any) => (
                      <div key={notification.id} className={`p-3 rounded-lg border transition-colors ${
                        notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-700 text-sm font-medium">{notification.title}</p>
                            <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                            <p className="text-gray-500 text-xs mt-2">{notification.time}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab - Removed (Now accessible via user dropdown menu) */}
        {false && (
          <div className="space-y-8">
            {/* Profile Header */}
            <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
              {/* Background Image */}
              {(profile?.header_image_url || profileForm.header_image_url) && (
                <div className="absolute inset-0">
                  <img
                    src={profileForm.header_image_url || profile?.header_image_url || ''}
                    alt="Profile Header"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40"></div>
                </div>
              )}
              
              <div className="relative p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-500/30 bg-slate-700/50 shadow-lg">
                      <img
                        src={profile?.avatar_url || '/default-avatar.svg'}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.svg'
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        {(profile as any)?.first_name && (profile as any)?.last_name 
                          ? `${(profile as any).first_name} ${(profile as any).last_name}`
                          : 'Your Profile'
                        }
                      </h2>
                      <p className="text-slate-300 text-lg">
                        {(profile as any)?.location ? `${(profile as any).location} • Handicap: ${(profile as any).handicap || 0}` : 'Complete your profile to get started'}
                      </p>
                    </div>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Profile Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Personal Information Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                    <User className="h-5 w-5 text-emerald-400" />
                    <span>Personal Information</span>
                  </h3>
                  
                  {!isEditingProfile ? (
                    // View Mode
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
                          <div className="px-4 py-3 bg-slate-800/30 border border-slate-600/30 rounded-lg text-white font-medium">
                            {profile?.first_name || 'Not set'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
                          <div className="px-4 py-3 bg-slate-800/30 border border-slate-600/30 rounded-lg text-white font-medium">
                            {profile?.last_name || 'Not set'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Handicap</label>
                          <div className="px-4 py-3 bg-slate-800/30 border border-slate-600/30 rounded-lg text-white font-medium">
                            {(profile as any)?.handicap ? `${(profile as any).handicap}` : 'Not set'}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Location</label>
                          <div className="px-4 py-3 bg-slate-800/30 border border-slate-600/30 rounded-lg text-white font-medium">
                            {profile?.location || 'Not set'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Bio</label>
                          <div className="px-4 py-3 bg-slate-800/30 border border-slate-600/30 rounded-lg text-white font-medium min-h-[80px] leading-relaxed">
                            {profile?.bio || 'No bio added yet. Tell us about your golf journey!'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-6">
                      <div className="flex flex-col items-center space-y-4 mb-6">
                        <div className="relative">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/30 bg-slate-700/50 shadow-lg">
                            <img
                              src={profileForm.avatar_url || profile?.avatar_url || '/default-avatar.svg'}
                              alt="Profile"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/default-avatar.svg'
                              }}
                            />
                          </div>
                          {uploadingImage && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                            </div>
                          )}
                        </div>
                        <label className="cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2">
                          <Camera className="h-4 w-4" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Header Image Upload */}
                      <div className="flex flex-col items-center space-y-4 mb-6">
                        <div className="relative w-full max-w-md">
                          <div className="w-full h-32 rounded-xl overflow-hidden border-2 border-emerald-500/30 bg-slate-700/50 shadow-lg">
                            <img
                              src={profileForm.header_image_url || profile?.header_image_url || '/default-avatar.svg'}
                              alt="Header"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/default-avatar.svg'
                              }}
                            />
                          </div>
                          {uploadingHeaderImage && (
                            <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                            </div>
                          )}
                        </div>
                        <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2">
                          <Camera className="h-4 w-4" />
                          <span>Upload Header Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleHeaderImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                          <input
                            type="text"
                            value={profileForm.first_name || ''}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                            className="w-full px-4 py-4 text-lg sm:text-base sm:py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300 touch-manipulation"
                            placeholder="Enter your first name"
                            autoComplete="given-name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profileForm.last_name || ''}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                            className="w-full px-4 py-4 text-lg sm:text-base sm:py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300 touch-manipulation"
                            placeholder="Enter your last name"
                            autoComplete="family-name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Handicap</label>
                          <input
                            type="number"
                            value={profileForm.handicap || ''}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, handicap: parseInt(e.target.value) || 0 }))}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300"
                            placeholder="Enter your handicap"
                            min="0"
                            max="54"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                          <input
                            type="text"
                            value={profileForm.location || ''}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300"
                            placeholder="Enter your location"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                        <textarea
                          value={profileForm.bio || ''}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300 resize-none"
                          placeholder="Tell us about your golf journey, favorite courses, or what you're working on..."
                          rows={4}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics Card */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    <span>Statistics</span>
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <Flag className="h-4 w-4 text-emerald-400" />
                        </div>
                        <span className="text-slate-300">Rounds Played</span>
                      </div>
                      <span className="font-bold text-white text-lg">{statistics.roundsPlayed}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Target className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-slate-300">Average Score</span>
                      </div>
                      <span className="font-bold text-white text-lg">{statistics.averageScore}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <Trophy className="h-4 w-4 text-purple-400" />
                        </div>
                        <span className="text-slate-300">Best Round</span>
                      </div>
                      <span className="font-bold text-white text-lg">{statistics.bestRound}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                          <Zap className="h-4 w-4 text-orange-400" />
                        </div>
                        <span className="text-slate-300">Total Points</span>
                      </div>
                      <span className="font-bold text-white text-lg">450</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-600/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <span className="text-slate-300">Connections</span>
                      </div>
                      <button
                        onClick={() => setShowConnectionsModal(true)}
                        className="font-bold text-white text-lg hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {connections?.length || 0}
                      </button>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Action Buttons */}
            {isEditingProfile && (
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4 sm:gap-0">
                <button 
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-8 py-4 rounded-xl transition-all duration-300 font-medium disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center space-x-2 min-h-[56px] touch-manipulation"
                >
                  {profileSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setIsEditingProfile(false)
                    handleResetProfile()
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-4 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 min-h-[56px] touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-700/50 transition-colors">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-emerald-900/50 border border-emerald-500/30">
                      <Flag className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-200 text-sm">{activity.message}</p>
                      <p className="text-slate-400 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Modals */}
      
      {/* Review Modal */}
      {showReviewModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-600">
            <h3 className="text-xl font-bold text-white mb-4">Write Review for {selectedCourse.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      <Star 
                        className={`h-8 w-8 ${star <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-slate-500'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Comment (Optional)</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400 resize-none"
                  placeholder="Share your experience with this course..."
                  rows={4}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-500 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={reviewSubmitting}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-500 text-white rounded-lg transition-colors font-semibold disabled:cursor-not-allowed"
                >
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Course Modal */}
      {showCreateCourseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-600">
            <h3 className="text-xl font-bold text-white mb-4">Add New Golf Course</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Course Name *</label>
                <input
                  type="text"
                  value={createCourseForm.name}
                  onChange={(e) => setCreateCourseForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400"
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Location *</label>
                <input
                  type="text"
                  value={createCourseForm.location}
                  onChange={(e) => setCreateCourseForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400"
                  placeholder="Enter location (City, State)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={createCourseForm.description}
                  onChange={(e) => setCreateCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400 resize-none"
                  placeholder="Describe the course..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Par</label>
                  <input
                    type="number"
                    value={createCourseForm.par}
                    onChange={(e) => setCreateCourseForm(prev => ({ ...prev, par: e.target.value }))}
                    className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white"
                    placeholder="72"
                    min="54"
                    max="80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Holes</label>
                  <select
                    value={createCourseForm.holes}
                    onChange={(e) => setCreateCourseForm(prev => ({ ...prev, holes: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white"
                  >
                    <option value={9}>9 Holes</option>
                    <option value={18}>18 Holes</option>
                    <option value={27}>27 Holes</option>
                    <option value={36}>36 Holes</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreateCourseModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-500 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  disabled={createCourseSubmitting}
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-500 text-white rounded-lg transition-colors font-semibold disabled:cursor-not-allowed"
                >
                  {createCourseSubmitting ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTeeTimeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] border-2 border-emerald-500/20 shadow-2xl relative overflow-hidden flex flex-col">
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-teal-500/5 animate-pulse"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full transform translate-x-16 -translate-y-16"></div>
            
            <div className="relative flex flex-col min-h-0 flex-1">
              {/* Header */}
              <div className="text-center mb-6 flex-shrink-0">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                    <Flag className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">Create Tee Time</h3>
                </div>
                <p className="text-slate-400">Set up your perfect golf outing and invite others to join</p>
              </div>

              <form onSubmit={handleTeeTimeSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="overflow-y-auto pr-2 space-y-5" style={{ maxHeight: 'calc(100% - 80px)' }}>
                {/* Course Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-400 mb-2">Golf Course</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Flag className="h-5 w-5 text-emerald-500" />
                    </div>
                <input
                  type="text"
                      placeholder="Enter course name (e.g., Pebble Beach Golf Links)"
                  value={teeTimeForm.course}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, course: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700/50 text-white placeholder-slate-400 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-400 mb-2">Location</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-emerald-500" />
                    </div>
                <input
                  type="text"
                      placeholder="Enter city, state (e.g., Pebble Beach, CA)"
                  value={teeTimeForm.location}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, location: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700/50 text-white placeholder-slate-400 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-emerald-400 mb-2">Date</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-emerald-500" />
                      </div>
                <input
                  type="date"
                  value={teeTimeForm.date}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700/50 text-white transition-all duration-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-emerald-400 mb-2">Tee Time</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-emerald-500" />
                      </div>
                <input
                  type="time"
                  value={teeTimeForm.time}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, time: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700/50 text-white transition-all duration-300"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Players and Skill Level */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-emerald-400 mb-2">Group Size</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Users className="h-5 w-5 text-emerald-500" />
                      </div>
                    <select
                      value={teeTimeForm.players}
                      onChange={(e) => setTeeTimeForm({...teeTimeForm, players: parseInt(e.target.value)})}
                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700/50 text-white text-lg transition-all duration-300 appearance-none"
                    >
                      <option value={2}>2 Players</option>
                      <option value={3}>3 Players</option>
                        <option value={4}>4 Players (Foursome)</option>
                      <option value={5}>5 Players</option>
                      <option value={6}>6 Players</option>
                      <option value={7}>7 Players</option>
                      <option value={8}>8 Players</option>
                    </select>
                  </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-emerald-400 mb-2">Skill Level</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                      </div>
                    <select
                      value={teeTimeForm.handicap}
                      onChange={(e) => setTeeTimeForm({...teeTimeForm, handicap: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700/50 text-white text-lg transition-all duration-300 appearance-none"
                      >
                        <option value="any">All Skill Levels Welcome</option>
                        <option value="beginner">Beginner Friendly (30+ Handicap)</option>
                        <option value="intermediate">Intermediate (15-30 Handicap)</option>
                        <option value="advanced">Advanced Players (Under 15)</option>
                    </select>
                  </div>
                </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-400 mb-2">Description (Optional)</label>
                  <div className="relative">
                <textarea
                      placeholder="Tell potential players about your round... (e.g., Casual Saturday morning round, looking for friendly players to enjoy a great course!)"
                  value={teeTimeForm.description}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, description: e.target.value})}
                      className="w-full p-3 border-2 border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-700/50 text-white placeholder-slate-400 transition-all duration-300 resize-none"
                  rows={3}
                      maxLength={300}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                      {teeTimeForm.description.length}/300
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <h4 className="text-base font-semibold text-white mb-3">Preview</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-emerald-400" />
                      <span className="text-slate-300">{teeTimeForm.course || 'Course name'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-400" />
                      <span className="text-slate-300">{teeTimeForm.location || 'Location'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-emerald-400" />
                      <span className="text-slate-300">
                        {teeTimeForm.date ? new Date(teeTimeForm.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select date'}
                        {teeTimeForm.time && ` at ${teeTimeForm.time}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-emerald-400" />
                      <span className="text-slate-300">Looking for {teeTimeForm.players - 1} more player{teeTimeForm.players - 1 !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <span className="text-slate-300 capitalize">{teeTimeForm.handicap} skill level</span>
                    </div>
                  </div>
                </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 flex-shrink-0 border-t border-slate-600/30 mt-4">
                <button
                  type="button"
                  onClick={() => setShowTeeTimeModal(false)}
                    className="flex-1 py-3 px-4 border-2 border-slate-500 rounded-xl text-slate-300 hover:bg-slate-600/30 hover:border-slate-400 transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                    disabled={!teeTimeForm.course || !teeTimeForm.date || !teeTimeForm.time}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Create Tee Time
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
      
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-slate-600">
            <h3 className="text-xl font-bold text-white mb-6">Create Group</h3>
            <form onSubmit={handleGroupSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Group Details */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Group Details</h4>
                  <input
                    type="text"
                    placeholder="Group name"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                    className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400"
                  />
                  <textarea
                    placeholder="Description"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                    className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400"
                    rows={3}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Max Members</label>
                    <select
                      value={groupForm.maxMembers}
                      onChange={(e) => setGroupForm({...groupForm, maxMembers: parseInt(e.target.value)})}
                      className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white"
                    >
                      <option value={4}>4 Members</option>
                      <option value={6}>6 Members</option>
                      <option value={8}>8 Members</option>
                      <option value={10}>10 Members</option>
                      <option value={12}>12 Members</option>
                      <option value={15}>15 Members</option>
                      <option value={20}>20 Members</option>
                    </select>
                  </div>
                </div>

                {/* Invite Users */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Invite Users</h4>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Search users to invite..."
                        value={groupInviteQuery}
                        onChange={(e) => setGroupInviteQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleGroupInviteSearch())}
                        className="flex-1 p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleGroupInviteSearch}
                        disabled={groupInviteLoading}
                        className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {groupInviteLoading ? '...' : 'Search'}
                      </button>
                    </div>

                    {/* Search Results */}
                    {groupInviteResults.length > 0 && (
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {groupInviteResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 bg-slate-700 rounded-lg border border-slate-600"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/30">
                                <img
                                  src={user.avatar_url || '/default-avatar.svg'}
                                  alt={`${user.first_name} ${user.last_name}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/default-avatar.svg'
                                  }}
                                />
                              </div>
                              <span className="text-white text-sm">{user.first_name} {user.last_name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddInvitee(user)}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded transition-colors"
                            >
                              Invite
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Selected Invitees */}
                    {selectedInvitees.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-slate-300">Selected Invitees ({selectedInvitees.length})</h5>
                        <div className="max-h-32 overflow-y-auto space-y-2">
                          {selectedInvitees.map((invitee) => (
                            <div
                              key={invitee.id}
                              className="flex items-center justify-between p-2 bg-slate-700 rounded-lg border border-slate-600"
                            >
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden border border-emerald-500/30">
                                  <img
                                    src={invitee.avatar_url || '/default-avatar.svg'}
                                    alt={`${invitee.first_name} ${invitee.last_name}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = '/default-avatar.svg'
                                    }}
                                  />
                                </div>
                                <span className="text-white text-sm">{invitee.first_name} {invitee.last_name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveInvitee(invitee.id)}
                                className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-500 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Create Group {selectedInvitees.length > 0 && `& Invite ${selectedInvitees.length} User(s)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Send Message</h3>
            <form onSubmit={handleMessageSubmit} className="space-y-4">
                <input
                  type="text"
                placeholder="Recipient"
                  value={messageForm.recipient}
                  onChange={(e) => setMessageForm({...messageForm, recipient: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                placeholder="Subject"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                placeholder="Message"
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={4}
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Rate Course</h3>
            <form onSubmit={handleRatingSubmit} className="space-y-4">
                <input
                  type="text"
                placeholder="Course name"
                  value={ratingForm.course}
                  onChange={(e) => setRatingForm({...ratingForm, course: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={ratingForm.rating}
                onChange={(e) => setRatingForm({...ratingForm, rating: parseInt(e.target.value)})}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={5}>5 Stars - Excellent</option>
                <option value={4}>4 Stars - Very Good</option>
                <option value={3}>3 Stars - Good</option>
                <option value={2}>2 Stars - Fair</option>
                <option value={1}>1 Star - Poor</option>
              </select>
                <textarea
                placeholder="Review"
                  value={ratingForm.review}
                  onChange={(e) => setRatingForm({...ratingForm, review: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={4}
              />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGolfRoundModal && (
        <GolfRoundForm
          onClose={() => setShowGolfRoundModal(false)}
          onSave={handleRecordGolfRound}
          userId={user?.id || ''}
        />
      )}

      {/* Connections Modal */}
      {showConnectionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-slate-600">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">My Connections</h3>
              <button
                onClick={() => setShowConnectionsModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {connectionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="text-slate-400 mt-2">Loading connections...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {connections && connections.length > 0 ? (
                  connections?.map((connection) => (
                    <div key={connection.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-emerald-500/30">
                          <img
                            src={connection.connected_user?.avatar_url || '/default-avatar.svg'}
                            alt={`${connection.connected_user?.first_name} ${connection.connected_user?.last_name}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/default-avatar.svg'
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{connection.connected_user?.first_name} {connection.connected_user?.last_name}</h3>
                          <p className="text-slate-300 text-sm">{connection.connected_user?.location} • Handicap: {connection.connected_user?.handicap}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/users/${connection.connected_user?.id}`)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        View Profile
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">👥</div>
                    <p className="text-slate-400 mb-2">No connections yet</p>
                    <p className="text-slate-500 text-sm">Search for golfers in the "Find Someone" tab to start connecting!</p>
                    <button
                      onClick={() => {
                        setShowConnectionsModal(false)
                        setActiveTab('find-someone')
                      }}
                      className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-2 rounded-lg transition-all duration-300 font-medium"
                    >
                      Find Golfers
                    </button>
                  </div>
                )}
              </div>
            )}
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
