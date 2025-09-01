'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
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
  Target
} from 'lucide-react'
import WeatherWidget from '@/app/components/WeatherWidget'
import GolfRoundForm from '@/app/components/GolfRoundForm'

export default function Dashboard() {
  const { user, profile, signOut, loading } = useAuth()
  const router = useRouter()
  

      const [activeTab, setActiveTab] = useState<'overview' | 'community' | 'golf' | 'achievements'>('overview')
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

  // Badge system state
  const [badgeCategoryFilter, setBadgeCategoryFilter] = useState('')
  const [availableBadges, setAvailableBadges] = useState<any[]>([])



  // Tee time loading state
  const [teeTimesLoading, setTeeTimesLoading] = useState(false)

  // Profile editing state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    avatar_url: '',
    handicap: 0,
    location: ''
  })
  const [profileSaving, setProfileSaving] = useState(false)

  // Notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'tee_time', message: 'New tee time available at Pebble Beach', time: '2 min ago', read: false },
    { id: 2, type: 'badge', message: 'Congratulations! You earned the "First Round" badge', time: '1 hour ago', read: false },
    { id: 3, type: 'message', message: 'John D. sent you a message about golfing this weekend', time: '3 hours ago', read: false }
  ])
  const [showNotifications, setShowNotifications] = useState(false)

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
        const response = await fetch('/api/tee-times')
        if (response.ok) {
          const data = await response.json()
          setAvailableTeeTimes(data)
        } else {
          setAvailableTeeTimes([])
        }
      } catch (error) {
        setAvailableTeeTimes([])
      } finally {
        setTeeTimesLoading(false)
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
        handicap: profile.handicap || 0,
        location: profile.location || ''
      })
    }
  }, [profile])

  // Handler functions
  const openTeeTimeModal = () => {
    setShowTeeTimeModal(true)
  }

  // Profile management functions
  const handleSaveProfile = async () => {
    if (!user?.id) {
      alert('You must be logged in to save your profile')
      return
    }

    try {
      setProfileSaving(true)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          ...profileForm
        })
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        
        // Update local profile state
        // Note: In a real app, you'd want to update the AuthContext profile as well
        alert('Profile saved successfully!')
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
        handicap: profile.handicap || 0,
        location: profile.location || ''
      })
    }
  }

  const handlePostTeeTime = async (teeTimeData: any) => {
    try {

      
      // Create real tee time in Supabase
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_id: teeTimeData.course,
          tee_time_date: teeTimeData.date,
          tee_time_time: teeTimeData.time,
          max_players: teeTimeData.players,
          handicap_requirement: teeTimeData.handicap,
          description: teeTimeData.description,
          creator_id: user?.id
        })
      })

      if (response.ok) {
        const newTeeTime = await response.json()

        
        // Refresh the tee times list
        const refreshResponse = await fetch('/api/tee-times')
        if (refreshResponse.ok) {
          const updatedTeeTimes = await refreshResponse.json()
          setAvailableTeeTimes(updatedTeeTimes)
        }
        
        // Close modal and show success
        setShowTeeTimeModal(false)
        alert('Tee time posted successfully!')
      } else {
        throw new Error('Failed to create tee time')
      }
    } catch (error) {
      console.error('❌ Error creating tee time:', error)
      alert('Failed to post tee time. Please try again.')
    }
  }

  const handleCreateGroup = () => {
    setShowGroupModal(true)
  }

  const handleApplyToTeeTime = async (teeTimeId: string) => {
    try {
      // In a real app, this would make an API call
      alert('Application submitted successfully! The creator will be notified.')
    } catch (error) {
      console.error('Error applying to tee time:', error)
      alert('Failed to submit application')
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
    if (!courseSearchQuery.trim()) return
    
    setCourseSearchLoading(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock course search results
      const mockResults = [
        {
          id: 'course-1',
          name: 'Pebble Beach Golf Links',
          location: 'Pebble Beach, CA',
          description: 'Iconic coastal golf course with stunning ocean views',
          par: 72,
          holes: 18,
          average_rating: 4.8,
          review_count: 1247,
          reviews: [
            {
              user: { first_name: 'John' },
              rating: 5,
              comment: 'Absolutely breathtaking course. Worth every penny!'
            },
            {
              user: { first_name: 'Sarah' },
              rating: 4,
              comment: 'Challenging but fair. The views are incredible.'
            }
          ]
        },
        {
          id: 'course-2',
          name: 'Augusta National Golf Club',
          location: 'Augusta, GA',
          description: 'Home of The Masters Tournament',
          par: 72,
          holes: 18,
          average_rating: 4.9,
          review_count: 892,
          reviews: [
            {
              user: { first_name: 'Mike' },
              rating: 5,
              comment: 'The most pristine course I\'ve ever played.'
            }
          ]
        },
        {
          id: 'course-3',
          name: 'St. Andrews Old Course',
          location: 'St. Andrews, Scotland',
          description: 'The oldest and most iconic golf course in the world',
          par: 72,
          holes: 18,
          average_rating: 4.7,
          review_count: 1563,
          reviews: [
            {
              user: { first_name: 'David' },
              rating: 5,
              comment: 'A pilgrimage every golfer should make.'
            }
          ]
        }
      ]
      
      setCourseSearchResults(mockResults)
    } catch (error) {
      console.error('Error searching courses:', error)
      setCourseSearchResults([])
    } finally {
      setCourseSearchLoading(false)
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
    
    setSearchLoading(true)
    setSearchPerformed(true)
    
    try {
              const response = await fetch(`/api/users?action=search&q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users)
      } else {
        console.error('Search failed:', response.statusText)
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`)
  }

  const handleConnect = async (userId: string) => {
    try {
              const response = await fetch('/api/users?action=connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId: userId }),
      })
          
          if (response.ok) {
            const data = await response.json()
        alert('Connection request sent successfully!')
          } else {
        const error = await response.json()
        alert(`Failed to send connection request: ${error.details}`)
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
              const response = await fetch('/api/tee-times?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...teeTimeForm,
          creator_id: user?.id,
          course_name: teeTimeForm.course,
          tee_time_date: teeTimeForm.date,
          tee_time_time: teeTimeForm.time,
          max_players: teeTimeForm.players,
          handicap_requirement: teeTimeForm.handicap,
          description: teeTimeForm.description
        }),
      })
      
      if (response.ok) {
        console.log('Tee time posted successfully')
        setShowTeeTimeModal(false)
        setTeeTimeForm({
          course: '',
          date: '',
          time: '',
          players: 4,
          handicap: 'any',
          description: ''
        })
      } else {
        console.error('Failed to post tee time')
      }
    } catch (error) {
      console.error('Error posting tee time:', error)
    }
  }
  
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
              const response = await fetch('/api/groups?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(groupForm),
      })
      
      if (response.ok) {
        console.log('Group created successfully')
        setShowGroupModal(false)
        setGroupForm({
          name: '',
          description: '',
          maxMembers: 8
        })
      } else {
        console.error('Failed to create group')
      }
    } catch (error) {
      console.error('Error creating group:', error)
    }
  }
  
  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
              const response = await fetch('/api/messages?action=send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageForm),
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
        if (activeTab === 'golf' && courseSearchQuery) {
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
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:animate-pulse"></div>
                <Target className="h-7 w-7 text-white relative z-10" />
                </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent">Golf Community</span>
            </div>

            {/* Navigation Tabs */}
            <div className="hidden md:flex items-center space-x-1 bg-gradient-to-r from-slate-700/90 to-slate-600/80 backdrop-blur-xl rounded-2xl p-2 shadow-lg border border-slate-600/40">
              {[
                { id: 'overview', label: 'Tee Times', icon: Home },
                { id: 'community', label: 'Community', icon: Users },
                { id: 'golf', label: 'Golf', icon: Target },
                { id: 'achievements', label: 'Achievements', icon: Trophy }
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

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="relative notifications-container">
                <button 
                  className="p-3 text-slate-600 hover:text-slate-800 transition-all duration-300 hover:scale-110 relative group"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <Bell className="h-6 w-6 relative z-10" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-lg animate-pulse"></div>
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">Notifications</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
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
                  <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12"></div>
                    <User className="h-5 w-5 text-white relative z-10" />
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

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
            <div className="bg-gradient-to-br from-slate-800 via-slate-700/30 to-slate-600/20 rounded-3xl p-8 shadow-xl border border-slate-600/40 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/20 to-transparent transform -skew-y-6"></div>
              <div className="relative flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">Available Tee Times</h2>
              <button 
                onClick={openTeeTimeModal}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
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
                ) : availableTeeTimes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-r from-slate-100 to-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No Tee Times Available</h3>
                    <p className="text-slate-500 mb-6">Be the first to post a tee time and start building the golf community!</p>
                    <button 
                      onClick={handlePostTeeTime}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Post First Tee Time
                    </button>
                  </div>
                ) : (
                  availableTeeTimes.map((teeTime) => (
                    <div key={teeTime.id} className="bg-gradient-to-br from-slate-700 to-slate-600/40 border border-slate-500/60 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-white font-bold text-xl mb-2">{teeTime.course_name}</h3>
                          <div className="space-y-1">
                            <p className="text-slate-300 text-sm flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-emerald-400" />
                              {teeTime.tee_time_date} at {teeTime.tee_time_time}
                            </p>
                            <p className="text-slate-300 text-sm flex items-center">
                              <User className="h-4 w-4 mr-2 text-blue-400" />
                              Created by {teeTime.creator.first_name} {teeTime.creator.last_name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-2">
                            {teeTime.current_players}/{teeTime.max_players} players
                          </div>
                          <div className="text-sm text-slate-300 bg-slate-600 px-3 py-1 rounded-full">
                            Handicap: {teeTime.handicap_requirement}
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-200 mb-6 text-lg leading-relaxed">{teeTime.description}</p>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleApplyToTeeTime(teeTime.id)}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 px-6 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                          Apply to Join
                        </button>
                        <button className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-6 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                          Message Creator
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-10 pt-8 border-t border-slate-600/30">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-6 text-center">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      <button 
                      onClick={openTeeTimeModal}
                      className="group bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-6 px-6 rounded-2xl transition-all duration-300 font-semibold flex flex-col items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105"
                    >
                      <div className="bg-white/20 p-3 rounded-full mb-3 group-hover:bg-white/30 transition-colors">
                        <Calendar className="h-6 w-6" />
                    </div>
                      <span className="text-lg">Post Tee Time</span>
                    </button>
                  <button className="group bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6 px-6 rounded-2xl transition-all duration-300 font-semibold flex flex-col items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
                    <div className="bg-white/20 p-3 rounded-full mb-3 group-hover:bg-white/30 transition-colors">
                      <Users className="h-6 w-6" />
                    </div>
                    <span className="text-lg">Find Golfers</span>
                  </button>
                  <button className="group bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-6 px-6 rounded-2xl transition-all duration-300 font-semibold flex flex-col items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-2 hover:scale-105">
                    <div className="bg-white/20 p-3 rounded-full mb-3 group-hover:bg-white/30 transition-colors">
                      <Flag className="h-6 w-6" />
                  </div>
                    <span className="text-lg">Record Round</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            {/* User Search & Connections */}
            <div className="bg-gradient-to-br from-slate-800 via-slate-700/30 to-slate-600/20 rounded-3xl p-8 shadow-xl border border-slate-600/40 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-600/20 to-transparent transform -skew-y-6"></div>
              <div className="relative">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent mb-8">Find Golfers</h2>
                <div className="flex space-x-4 mb-8">
                        <input
                          type="text"
                    placeholder="Search by name, location, or handicap..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-6 py-4 border border-white/60 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-lg"
                        />
                        <button
                          onClick={handleSearch}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-4 rounded-2xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Search
                  </button>
                            </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{user.first_name} {user.last_name}</h3>
                          <p className="text-slate-600 text-sm">{user.location} • Handicap: {user.handicap}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(user.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        Connect
                        </button>
                      </div>
                  ))}
                    </div>
              )}
                  </div>
                </div>
                
            {/* Groups Management */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">My Groups</h2>
                    <button
                  onClick={handleCreateGroup}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl transition-colors font-medium"
                >
                  Create Group
                    </button>
              </div>
              
              {/* Group Info */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Weekend Warriors</h3>
                <p className="text-slate-600 mb-4">Your active golf group with 8 members</p>
                
                {/* Group Chat */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-slate-800 mb-3">Group Chat</h4>
                  <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                    {groupMessages.map((message) => (
                      <div key={message.id} className="flex items-start space-x-2">
                        <div className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs font-medium text-emerald-700">
                          {message.sender.first_name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-800">{message.message_content}</p>
                          <p className="text-xs text-slate-500">{message.timestamp}</p>
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
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendGroupMessage}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Send
                    </button>
                  </div>
                </div>
                      </div>
                    </div>
                    </div>
        )}

        {/* Golf Tab */}
        {activeTab === 'golf' && (
          <div className="space-y-6">
            {/* Tee Times */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Tee Times</h2>
                <button
                  onClick={handlePostTeeTime}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl transition-colors font-medium"
                >
                  Post Tee Time
                </button>
                            </div>
              
              {/* Available Tee Times */}
              <div className="space-y-4">
                {availableTeeTimes.map((teeTime) => (
                  <div key={teeTime.id} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                            <div>
                        <h3 className="text-slate-800 font-semibold text-lg">{teeTime.course_name}</h3>
                        <p className="text-slate-600 text-sm">{teeTime.tee_time_date} at {teeTime.tee_time_time}</p>
                        <p className="text-slate-600 text-sm">Created by {teeTime.creator.first_name} {teeTime.creator.last_name}</p>
                            </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500">{teeTime.current_players}/{teeTime.max_players} players</div>
                        <div className="text-sm text-slate-500">Handicap: {teeTime.handicap_requirement}</div>
                          </div>
                    </div>
                    <p className="text-slate-700 mb-4">{teeTime.description}</p>
                    <div className="flex space-x-3">
                            <button 
                        onClick={() => handleApplyToTeeTime(teeTime.id)}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                      >
                        Apply to Join
                            </button>
                      <button className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-2 px-4 rounded-lg transition-colors font-medium">
                        Message Creator
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                      </div>

            {/* Golf Courses */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Golf Courses</h2>
                
                {/* Course Search */}
              <div className="flex space-x-3 mb-6">
                        <input
                          type="text"
                  placeholder="Search courses by name or location..."
                          value={courseSearchQuery}
                          onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleCourseSearch}
                          disabled={courseSearchLoading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white px-6 py-3 rounded-xl transition-colors font-medium"
                >
                  {courseSearchLoading ? 'Searching...' : 'Search'}
                        </button>
                </div>

              {/* Course Results */}
              {courseSearchResults.length > 0 && (
                <div className="space-y-4">
                  {courseSearchResults.map((course) => (
                    <div key={course.id} className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                        <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-slate-800 font-semibold text-xl">{course.name}</h3>
                          <p className="text-slate-600 text-sm">{course.location}</p>
                          <p className="text-slate-700 mt-2">{course.description}</p>
                            </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-600">{course.average_rating}</div>
                          <div className="text-sm text-slate-500">{course.review_count} reviews</div>
                          </div>
                            </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-slate-500">Par:</span>
                          <p className="text-slate-800 font-medium">{course.par}</p>
                          </div>
                        <div>
                          <span className="text-slate-500">Holes:</span>
                          <p className="text-slate-800 font-medium">{course.holes}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Recent Reviews:</span>
                          <p className="text-slate-800 font-medium">{course.reviews.length}</p>
                                      </div>
                                    </div>
                      <div className="flex space-x-3">
                          <button 
                            onClick={() => handleViewCourse(course.id)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                          >
                            View Details
                          </button>
                        <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors font-medium">
                            Write Review
                          </button>
                        </div>
                      </div>
                  ))}
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
            <div className="space-y-6">
            {/* Badges */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Badges & Achievements</h2>
              
              {/* Badge Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">12</div>
                  <div className="text-slate-600 text-sm font-medium">Badges Earned</div>
                  </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-1">3</div>
                  <div className="text-slate-600 text-sm font-medium">Rare Badges</div>
                  </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-1">450</div>
                  <div className="text-slate-600 text-sm font-medium">Total Points</div>
                  </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-1">8</div>
                  <div className="text-slate-600 text-sm font-medium">Achievements</div>
                  </div>
                </div>

                {/* Badge Categories */}
              <div className="mb-6">
                <div className="flex space-x-2 mb-4">
                  {['all', 'achievement', 'milestone', 'early_adopter'].map((category) => (
                      <button
                      key={category}
                      onClick={() => setBadgeCategoryFilter(category === 'all' ? '' : category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        badgeCategoryFilter === (category === 'all' ? '' : category)
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {category === 'all' ? 'All' : category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>

              {/* Badge Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(() => {
          
                  return !Array.isArray(availableBadges) ? (
                    <div className="col-span-full text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
                      <p className="text-slate-600">Loading badges...</p>
                    </div>
                  ) : availableBadges.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <div className="text-4xl mb-4">🏆</div>
                      <p className="text-slate-600">No badges available yet.</p>
                    </div>
                  ) : (
                    availableBadges
                      .filter(badge => !badgeCategoryFilter || badge.category === badgeCategoryFilter)
                      .map((badge) => (
                        <div key={badge.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="text-center">
                            <div className="text-3xl mb-2">🏆</div>
                            <h4 className="font-semibold text-slate-800 mb-1">{badge.name}</h4>
                            <p className="text-slate-600 text-sm mb-2">{badge.description}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className={`px-2 py-1 rounded-full ${
                                badge.rarity === 'common' ? 'bg-green-100 text-green-700' :
                                badge.rarity === 'uncommon' ? 'bg-blue-100 text-blue-700' :
                                badge.rarity === 'rare' ? 'bg-purple-100 text-purple-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {badge.rarity}
                              </span>
                              <span className="text-slate-500">{badge.points} pts</span>
                            </div>
                          </div>
                        </div>
                      ))
                  )
                })()}
              </div>
                          </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Community Leaderboard</h2>
              
              {/* Top 5 Leaderboard */}
              <div className="space-y-4">
                {leaderboard.map((player, index) => (
                  <div key={player.rank} className={`flex items-center space-x-4 p-4 rounded-xl border transition-all duration-200 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' :
                    index === 1 ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200' :
                    index === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200' :
                    'bg-slate-50 border-slate-200'
                  }`}>
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                      index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-slate-400 text-white' :
                      index === 2 ? 'bg-orange-400 text-white' :
                      'bg-slate-300 text-white'
                    }`}>
                      {player.rank}
                          </div>
                    <div className="text-3xl">{player.avatar}</div>
                    <div className="flex-1">
                      <h3 className="text-slate-800 font-semibold text-lg">{player.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span>Handicap: {player.handicap}</span>
                        <span>Rounds: {player.rounds}</span>
                          </div>
                        </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">{player.points}</div>
                      <div className="text-sm text-slate-500">points</div>
                    </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}


      </div>
      
      {/* Modals */}
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
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="time"
                    value={teeTimeForm.time}
                    onChange={(e) => setTeeTimeForm({...teeTimeForm, time: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Create Group</h3>
            <form onSubmit={handleGroupSubmit} className="space-y-4">
                <input
                  type="text"
                placeholder="Group name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <textarea
                placeholder="Description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="flex-1 py-3 px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
                >
                  Create
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
    </div>
  )
}
