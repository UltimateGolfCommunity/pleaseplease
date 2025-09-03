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
  X
} from 'lucide-react'
import WeatherWidget from '@/app/components/WeatherWidget'
import GolfRoundForm from '@/app/components/GolfRoundForm'
import Logo from '@/app/components/Logo'

export default function Dashboard() {
  const { user, profile, signOut, loading } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()
  

      const [activeTab, setActiveTab] = useState<'overview' | 'find-someone' | 'courses' | 'groups' | 'profile' | 'applications'>('overview')
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
  
  // Form states
  const [teeTimeForm, setTeeTimeForm] = useState({
    course: '',
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
    if (activeTab === 'courses' && courseSearchResults.length === 0) {
      handleCourseSearch()
    }
  }, [activeTab])
  const [createCourseSubmitting, setCreateCourseSubmitting] = useState(false)

  // Badge system state
  const [badgeCategoryFilter, setBadgeCategoryFilter] = useState('')
  const [availableBadges, setAvailableBadges] = useState<any[]>([])



  // Tee time loading state
  const [teeTimesLoading, setTeeTimesLoading] = useState(false)
  
  // Applications state
  const [applications, setApplications] = useState<any[]>([])
  const [applicationsLoading, setApplicationsLoading] = useState(false)
  
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

  const fetchTeeTimes = async () => {
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
        console.error('Failed to fetch tee times')
        setAvailableTeeTimes([])
      }
    } catch (error) {
      console.error('Error fetching tee times:', error)
      setAvailableTeeTimes([])
    } finally {
      setTeeTimesLoading(false)
    }
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

    try {
      setProfileSaving(true)

      console.log('🔍 Saving profile with data:', { id: user.id, ...profileForm })
      
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          ...profileForm
        })
      })
      
      console.log('🔍 Profile save response status:', response.status)

      if (response.ok) {
        const updatedProfile = await response.json()
        
        // Update local profile state
        // Note: In a real app, you'd want to update the AuthContext profile as well
        alert('Profile saved successfully!')
        setIsEditingProfile(false) // Exit edit mode after successful save
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save profile')
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
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
      const response = await fetch(`/api/users?search=${encodeURIComponent(groupInviteQuery)}`)
      if (response.ok) {
        const data = await response.json()
        // Filter out the current user and already selected users
        const filteredUsers = data.users?.filter((user: any) => 
          user.id !== profile?.id && 
          !selectedInvitees.some(invitee => invitee.id === user.id)
        ) || []
        setGroupInviteResults(filteredUsers)
      } else {
        setGroupInviteResults([])
      }
    } catch (error) {
      console.error('Error searching for users:', error)
      setGroupInviteResults([])
    } finally {
      setGroupInviteLoading(false)
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
    try {
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apply',
          tee_time_id: teeTimeId,
          applicant_id: user?.id
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
        
        // Add notification for the tee time creator
        const teeTime = availableTeeTimes.find(tt => tt.id === teeTimeId)
        if (teeTime && teeTime.creator_id !== user?.id) {
          setNotifications(prev => [{
            id: Date.now(),
            type: 'tee_time_application',
            message: `${profile?.first_name || 'Someone'} applied to join your tee time on ${teeTime.tee_time_date}`,
            time: 'Just now',
            read: false
          }, ...prev.slice(0, 9)]) // Keep max 10 notifications
        }
        
        alert('Application submitted successfully! The creator will be notified.')
        
        // Refresh tee times to show updated status
        fetchTeeTimes()
      } else {
        const errorData = await response.json()
        console.error('Failed to submit application:', errorData)
        alert('Failed to submit application: ' + (errorData.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error applying to tee time:', error)
      alert('Failed to submit application')
    }
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
      const response = await fetch(`/api/golf-courses?query=${encodeURIComponent(courseSearchQuery)}`)
      
      if (response.ok) {
        const data = await response.json()
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
    if (!createCourseForm.name || !createCourseForm.location) {
      alert('Course name and location are required')
      return
    }

    try {
      setCreateCourseSubmitting(true)
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

      if (response.ok) {
        const data = await response.json()
        alert('Course created successfully!')
        setShowCreateCourseModal(false)
        setCreateCourseForm({ name: '', location: '', description: '', par: '', holes: 18 })
        // Refresh course search results to show the new course
        handleCourseSearch()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to create course')
      }
    } catch (error) {
      console.error('Error creating course:', error)
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
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    console.log('🔍 Starting search for:', searchQuery)
    setSearchLoading(true)
    setSearchPerformed(true)
    
    try {
      const response = await fetch(`/api/users?action=search&q=${encodeURIComponent(searchQuery)}`)
      console.log('📡 Search response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Search results:', data?.length || 0)
        
        // Filter out the current user from search results
        const filteredData = data.filter((searchedUser: any) => searchedUser.id !== user?.id)
        console.log('🔍 Filtered results:', filteredData?.length || 0)
        
        setSearchResults(filteredData)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Clean Navigation */}
      <nav className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/60 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-0">
          <div className="flex justify-between items-center h-24">
            {/* Logo */}
            <div className="pl-6">
              <Logo size="lg" />
            </div>

            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-1 bg-gradient-to-r from-slate-700/90 to-slate-600/80 backdrop-blur-xl rounded-2xl p-2 shadow-lg border border-slate-600/40">
                          {[
              { id: 'overview', label: 'Tee Times', icon: Home },
              { id: 'find-someone', label: 'Find Someone', icon: Users },
              { id: 'courses', label: 'Courses', icon: Target },
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'applications', label: 'Applications', icon: Bell },
              { id: 'profile', label: 'Profile', icon: User }
            ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-300 font-medium ${
                        isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transform scale-105'
                        : 'text-slate-300 hover:text-white hover:bg-slate-600/60 hover:scale-105'
                      }`}
                    >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="font-semibold text-sm">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
              
              {/* Mobile Navigation */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 text-slate-300 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="relative notifications-container">
                <button 
                  className="p-3 text-slate-600 hover:text-slate-800 transition-all duration-300 hover:scale-110 relative group"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <Bell className="h-6 w-6 relative z-10" />
                  {(pendingInvitations.length > 0 || notifications.filter(n => !n.read).length > 0) && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-lg animate-pulse flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {pendingInvitations.length + notifications.filter(n => !n.read).length}
                      </span>
                    </div>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
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
                
                <div className="relative group">
                <button className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-700/80 hover:to-slate-600/60 transition-all duration-300 group-hover:scale-105">
                  <div className="h-10 w-10 rounded-full overflow-hidden shadow-lg relative">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-700 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"></div>
                        <User className="h-5 w-5 text-white relative z-10" />
                      </div>
                    )}
                  </div>
                  <span className="text-white font-semibold text-lg">
                      {profile?.first_name || user?.email?.split('@')[0] || 'Golfer'}
                    </span>
                  </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-lg border border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <Link href="/settings" className="flex items-center px-3 py-2 text-slate-200 hover:bg-slate-700 rounded-lg transition-colors">
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                    </Link>
                    <hr className="my-2 border-slate-700" />
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
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/60">
          <div className="px-4 py-2 space-y-1">
            {[
              { id: 'overview', label: 'Tee Times', icon: Home },
              { id: 'find-someone', label: 'Find Someone', icon: Users },
              { id: 'courses', label: 'Courses', icon: Target },
              { id: 'groups', label: 'Groups', icon: Users },
              { id: 'profile', label: 'Profile', icon: User }
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
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600/60'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Weather Widget at Top */}
            <div className="bg-gradient-to-br from-blue-600/10 via-indigo-500/15 to-purple-600/10 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12"></div>
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400/30 border-t-blue-600 shadow-lg"></div>
                <span className="ml-4 text-blue-700 font-semibold text-lg">Loading weather...</span>
          </div>
        </div>

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
                  availableTeeTimes?.map((teeTime) => (
                    <div key={teeTime.id} className="bg-gradient-to-br from-slate-700 to-slate-600/40 border border-slate-500/60 rounded-2xl p-4 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex flex-col sm:flex-row sm:items-start justify-between mb-4 sm:mb-6 gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg sm:text-xl mb-2">{teeTime.course_name}</h3>
                          <div className="space-y-1">
                            <p className="text-slate-300 text-sm flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-emerald-400" />
                              {teeTime.tee_time_date} at {teeTime.tee_time_time}
                            </p>
                            <div className="flex items-center space-x-2">
                              <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-emerald-500/30">
                                <img
                                  src={teeTime.creator?.avatar_url || '/default-avatar.svg'}
                                  alt={`${teeTime.creator?.first_name || 'Unknown'} ${teeTime.creator?.last_name || ''}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = '/default-avatar.svg'
                                  }}
                                />
                              </div>
                              <p className="text-slate-300 text-sm flex items-center">
                                <User className="h-4 w-4 mr-2 text-blue-400" />
                                Created by {teeTime.creator?.first_name || 'Unknown'} {teeTime.creator?.last_name || ''}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right sm:text-right">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 sm:px-4 py-2 rounded-full text-sm font-semibold mb-2">
                            {teeTime.current_players}/{teeTime.max_players} players
                          </div>
                          <div className="text-sm text-slate-300 bg-slate-600 px-3 py-1 rounded-full">
                            Handicap: {teeTime.handicap_requirement}
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-200 mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed">{teeTime.description}</p>
                      <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
                        {teeTime.creator_id === user?.id ? (
                          // Show delete button for tee time creator
                          <button
                            onClick={() => handleDeleteTeeTime(teeTime.id)}
                            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            Delete Tee Time
                          </button>
                        ) : (
                          // Show apply button for other users
                          <button
                            onClick={() => handleApplyToTeeTime(teeTime.id)}
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 px-6 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            Apply to Join
                          </button>
                        )}
                        <button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                          Message Creator
                        </button>
                      </div>
                    </div>
                  ))
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
                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600/50">
                      <div className="flex items-center space-x-3">
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
                          <h3 className="font-semibold text-white">{user.first_name} {user.last_name}</h3>
                          <p className="text-slate-300 text-sm">{user.location} • Handicap: {user.handicap}</p>
                          {user.bio && <p className="text-slate-400 text-xs mt-1">{user.bio}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(user.id)}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        Connect
                      </button>
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
              <div className="flex space-x-3 mb-6">
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
                            handleCourseSearch()
                          }}
                          disabled={courseSearchLoading}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-6 py-3 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed"
                >
                  Show All
                        </button>
                </div>

              {/* Course Results */}
              {courseSearchResults && courseSearchResults.length > 0 ? (
                <div className="space-y-4">
                  {courseSearchResults?.map((course) => (
                    <div key={course.id} className="bg-slate-800/50 border border-slate-600/50 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold text-xl">{course.name}</h3>
                          <p className="text-slate-300 text-sm">{course.location}</p>
                          <p className="text-slate-200 mt-2">{course.description}</p>
                            </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-400">{course.average_rating}</div>
                          <div className="text-sm text-slate-400">{course.review_count} reviews</div>
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
                          <button 
                            onClick={() => handleViewCourse(course.id)}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2 px-4 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                          >
                            View Details
                          </button>
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
              
              {/* Group Info */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/50">
                <h3 className="text-lg font-semibold text-white mb-3">Weekend Warriors</h3>
                <p className="text-slate-300 mb-4">Your active golf group with 8 members</p>
                
                {/* Group Chat */}
                <div className="bg-slate-700/50 rounded-lg p-4 mb-4 border border-slate-600/50">
                  <h4 className="font-medium text-white mb-3">Group Chat</h4>
                  <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                    {groupMessages.map((message) => (
                      <div key={message.id} className="flex items-start space-x-2">
                        <div className="h-6 w-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs font-medium text-emerald-400">
                          {message.sender.first_name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-200">{message.message_content}</p>
                          <p className="text-xs text-slate-400">{message.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={groupMessageText}
                      onChange={(e) => setGroupMessageText(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300"
                    />
                    <button
                      onClick={handleSendGroupMessage}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Send
                    </button>
                  </div>
                </div>
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
                                <h4 className="font-semibold text-gray-800">
                                  {application.applicant?.first_name} {application.applicant?.last_name}
                                </h4>
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
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
                        {profile?.first_name && profile?.last_name 
                          ? `${profile.first_name} ${profile.last_name}`
                          : 'Your Profile'
                        }
                      </h2>
                      <p className="text-slate-300 text-lg">
                        {profile?.location ? `${profile.location} • Handicap: ${profile.handicap}` : 'Complete your profile to get started'}
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
                            {profile?.handicap ? `${profile.handicap}` : 'Not set'}
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
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300"
                            placeholder="Enter your first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                          <input
                            type="text"
                            value={profileForm.last_name || ''}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, last_name: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-slate-400 transition-all duration-300"
                            placeholder="Enter your last name"
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
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-8 py-4 rounded-xl transition-all duration-300 font-medium disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
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
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8 py-4 rounded-xl transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-600">
            <h3 className="text-xl font-bold text-white mb-4">Post Tee Time</h3>
            <form onSubmit={handleTeeTimeSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Course name"
                  value={teeTimeForm.course}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, course: e.target.value})}
                  className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400"
                />
                <input
                  type="date"
                  value={teeTimeForm.date}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, date: e.target.value})}
                  className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white"
                />
                <input
                  type="time"
                  value={teeTimeForm.time}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, time: e.target.value})}
                  className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white"
                />
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Number of Players</label>
                    <select
                      value={teeTimeForm.players}
                      onChange={(e) => setTeeTimeForm({...teeTimeForm, players: parseInt(e.target.value)})}
                      className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white"
                    >
                      <option value={2}>2 Players</option>
                      <option value={3}>3 Players</option>
                      <option value={4}>4 Players</option>
                      <option value={5}>5 Players</option>
                      <option value={6}>6 Players</option>
                      <option value={7}>7 Players</option>
                      <option value={8}>8 Players</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Handicap Level</label>
                    <select
                      value={teeTimeForm.handicap}
                      onChange={(e) => setTeeTimeForm({...teeTimeForm, handicap: e.target.value})}
                      className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white"
                    >
                      <option value="any">Any Level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={teeTimeForm.description}
                  onChange={(e) => setTeeTimeForm({...teeTimeForm, description: e.target.value})}
                  className="w-full p-3 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-700 text-white placeholder-slate-400"
                  rows={3}
                />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTeeTimeModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-semibold"
                >
                  Post to Feed
                </button>
              </div>
            </form>
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
    </div>
  )
}
