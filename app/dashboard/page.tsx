'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Search, 
  MapPin,
  Calendar, 
  Clock,
  Plus,
  Flag,
  Trophy,
  Camera,
  X,
  QrCode,
  User,
  ArrowUpRight,
  Users
} from 'lucide-react'
import WeatherWidget from '@/components/WeatherWidget'
import MessagingSystem from '@/components/MessagingSystem'
import Logo from '@/components/Logo'
import QRCodeGenerator from '@/components/QRCodeGenerator'
import SimpleQRScanner from '@/components/SimpleQRScanner'
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
  const [showApplicantModal, setShowApplicantModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [applicantProfile, setApplicantProfile] = useState<any>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)
  
  // Tee Time Form
  const [teeTimeForm, setTeeTimeForm] = useState({
    course_name: '',
    location: '', // zip code
    tee_time_date: '',
    tee_time_time: '',
    max_players: 4,
    handicap_requirement: 'weekend-warrior',
    visibility_scope: 'public',
    group_id: ''
  })
  const [teeTimeSubmitting, setTeeTimeSubmitting] = useState(false)
  
  // Group Form
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    location: '',
    group_type: 'community'
  })
  const [groupLogo, setGroupLogo] = useState<File | null>(null)
  const [groupLogoPreview, setGroupLogoPreview] = useState<string>('')
  const [groupSubmitting, setGroupSubmitting] = useState(false)
  
  // Tee Times
  const [teeTimes, setTeeTimes] = useState<any[]>([])
  const [teeTimesLoading, setTeeTimesLoading] = useState(false)
  
  // Groups
  const [userGroups, setUserGroups] = useState<any[]>([])
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [allGroups, setAllGroups] = useState<any[]>([])
  const [groupSearchQuery, setGroupSearchQuery] = useState('')
  const [groupSearchLoading, setGroupSearchLoading] = useState(false)
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null)
  
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

  // Auto-refresh tee times and notifications every 60 seconds
  useEffect(() => {
    if (!user?.id) return

    console.log('⏰ Setting up auto-refresh intervals (60 seconds)')

    // Refresh tee times every 60 seconds (silent mode to avoid UI flashing)
    const teeTimesInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing tee times...')
      fetchTeeTimes(true) // true = silent mode
    }, 60000) // 60 seconds

    // Refresh notifications every 60 seconds (silent mode to avoid UI flashing)
    const notificationsInterval = setInterval(() => {
      console.log('🔔 Auto-refreshing notifications...')
      fetchNotifications(true) // true = silent mode
    }, 60000) // 60 seconds

    // Cleanup intervals on unmount or when user changes
    return () => {
      console.log('🛑 Clearing auto-refresh intervals')
      clearInterval(teeTimesInterval)
      clearInterval(notificationsInterval)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      searchGroups('')
    }
  }, [user?.id])

  const fetchTeeTimes = async (silent = false) => {
    if (!user?.id) return
    
    if (!silent) {
      console.log('🔄 Starting to fetch tee times...')
      setTeeTimesLoading(true)
    }
    
    try {
      const response = await fetch(`/api/tee-times?action=available&user_id=${user.id}&_cache_bust=${Math.random()}`)
      const data = await response.json()
      
      if (!silent) {
        console.log('📊 Tee times API response:', data)
        console.log('📊 Response type:', typeof data, 'Is array:', Array.isArray(data))
        console.log('📊 Has success property:', 'success' in data)
        console.log('📊 Has teeTimes property:', 'teeTimes' in data)
      }
      
      // Handle both array response and object response formats
      let teeTimesArray = []
      if (data.success && data.teeTimes) {
        teeTimesArray = data.teeTimes
        if (!silent) console.log('✅ Extracted from data.teeTimes:', teeTimesArray.length, 'items')
      } else if (Array.isArray(data)) {
        teeTimesArray = data
        if (!silent) console.log('✅ Extracted from array response:', teeTimesArray.length, 'items')
      } else {
        if (!silent) console.warn('⚠️ Unexpected response format:', Object.keys(data))
      }
      
      // Get today's date as YYYY-MM-DD string for comparison
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Normalize to midnight
      const todayString = today.toISOString().split('T')[0]
      
      if (!silent) {
        console.log('📅 Today\'s date for filtering:', todayString)
        console.log('📊 Raw tee times array length:', teeTimesArray.length)
      }
      
      const sortedTeeTimes = teeTimesArray
        .filter((tt: any) => {
          if (!tt.tee_time_date) {
            if (!silent) console.log('⚠️ Tee time missing date:', tt)
            return false
          }
          // Compare date strings directly (YYYY-MM-DD format)
          const teeTimeDate = tt.tee_time_date.split('T')[0] // Handle datetime strings
          const isFuture = teeTimeDate >= todayString
          if (!silent && !isFuture) {
            console.log('⏭️ Filtered out past tee time:', teeTimeDate, '<', todayString)
          }
          return isFuture
        })
        .sort((a: any, b: any) => {
          const dateA = a.tee_time_date.split('T')[0]
          const dateB = b.tee_time_date.split('T')[0]
          if (dateA !== dateB) {
            return dateA.localeCompare(dateB)
          }
          // If same date, sort by time
          const timeA = a.tee_time_time || '00:00:00'
          const timeB = b.tee_time_time || '00:00:00'
          return timeA.localeCompare(timeB)
        })
      
      setTeeTimes(sortedTeeTimes)
      
      if (!silent) {
        console.log('🎯 Fetched and sorted tee times:', sortedTeeTimes)
        
        // Debug each tee time's course name
        sortedTeeTimes.forEach((tt: any, index: number) => {
          console.log(`🏌️ Tee Time ${index + 1}:`, {
            course_name: tt.course_name,
            golf_courses_name: tt.golf_courses?.name,
            course_location: tt.course_location,
            creator: tt.creator
          })
        })
      }
    } catch (error) {
      if (!silent) {
        console.error('❌ Error fetching tee times:', error)
      }
    } finally {
      if (!silent) {
        setTeeTimesLoading(false)
      }
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
        const normalizedGroups = (data.groups || []).map((group: any) => ({
          ...group,
          member_count: group.member_count || 0,
          is_member: true
        }))
        setUserGroups(normalizedGroups)
        console.log('🎯 Fetched groups:', normalizedGroups)
      } else {
        console.log('❌ Groups fetch failed:', data)
      }
    } catch (error) {
      console.error('❌ Error fetching user groups:', error)
    } finally {
      setGroupsLoading(false)
    }
  }

  const fetchNotifications = async (silent = false) => {
    if (!user?.id) return
    
    if (!silent) {
      setNotificationsLoading(true)
    }
    
    try {
      const response = await fetch(`/api/notifications?user_id=${user.id}&_cache_bust=${Math.random()}`)
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching notifications:', error)
      }
    } finally {
      if (!silent) {
        setNotificationsLoading(false)
      }
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
      let logoUrl = ''
      
      // Upload logo if provided
      if (groupLogo) {
        try {
          console.log('📤 Uploading group logo...')
          const formData = new FormData()
          formData.append('file', groupLogo)
          formData.append('folder', 'group-logos')
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
          
          const uploadData = await uploadResponse.json()
          console.log('📤 Upload response:', uploadData)
          
          if (uploadData.success) {
            logoUrl = uploadData.url
            console.log('✅ Logo uploaded successfully:', logoUrl)
          } else {
            console.warn('⚠️ Logo upload failed, continuing without logo:', uploadData.error)
          }
        } catch (uploadError) {
          console.error('❌ Error uploading logo:', uploadError)
          console.log('⚠️ Continuing group creation without logo')
        }
      }

      console.log('🏌️ Creating group with data:', {
        name: groupForm.name,
        description: groupForm.description,
        location: groupForm.location,
        group_type: groupForm.group_type,
        logo_url: logoUrl,
        user_id: user.id
      })

      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          name: groupForm.name,
          description: groupForm.description,
          location: groupForm.location,
          group_type: groupForm.group_type,
          logo_url: logoUrl,
          user_id: user.id,
          status: 'active'
        }),
      })

      const data = await response.json()
      console.log('🏌️ Group creation response:', data)
      
      if (data.success) {
        alert('Group created successfully!')
        setShowCreateGroupModal(false)
        setGroupForm({
          name: '',
          description: '',
          location: '',
          group_type: 'community'
        })
        setGroupLogo(null)
        setGroupLogoPreview('')
        // Refresh groups list
        fetchUserGroups()
        searchGroups('')
      } else {
        console.error('❌ Group creation failed:', data)
        alert('Failed to create group: ' + (data.error || data.details || 'Unknown error'))
      }
    } catch (error) {
      console.error('❌ Error creating group:', error)
      alert('Failed to create group. Please check the console for details.')
    } finally {
      setGroupSubmitting(false)
    }
  }

  const handleGroupLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setGroupLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setGroupLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const searchGroups = async (query: string) => {
    setGroupSearchQuery(query)
    setGroupSearchLoading(true)
    
    try {
      const searchUser = user?.id ? `&user_id=${user.id}` : ''
      const response = await fetch(`/api/groups?action=search&query=${encodeURIComponent(query)}${searchUser}`)
      const data = await response.json()
      
      if (data.success) {
        setAllGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error searching groups:', error)
    } finally {
      setGroupSearchLoading(false)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!user?.id) {
      alert('You must be logged in to join a group')
      return
    }

    setJoiningGroupId(groupId)
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

      const data = await response.json()

      if (data.success) {
        alert('You joined the group successfully!')
        await Promise.all([fetchUserGroups(), searchGroups(groupSearchQuery)])
      } else {
        alert(data.error || 'Failed to join group')
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group. Please try again.')
    } finally {
      setJoiningGroupId(null)
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
          max_players: teeTimeForm.max_players,
          visibility_scope: teeTimeForm.visibility_scope,
          group_id: teeTimeForm.visibility_scope === 'group' ? teeTimeForm.group_id : null
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
          handicap_requirement: 'weekend-warrior',
          visibility_scope: 'public',
          group_id: ''
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

  const handleDeleteTeeTime = async (teeTimeId: string) => {
    if (!user?.id) {
      alert('You must be logged in to delete a tee time')
      return
    }
    
    if (!confirm('Are you sure you want to delete this tee time? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          tee_time_id: teeTimeId,
          user_id: user.id
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Tee time deleted successfully!')
        fetchTeeTimes()
      } else {
        alert('Failed to delete tee time: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting tee time:', error)
      alert('Failed to delete tee time')
    }
  }

  const handleJoinTeeTime = async (teeTimeId: string) => {
    if (!user?.id) {
      alert('You must be logged in to join a tee time')
      return
    }

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

        const data = await response.json()
      
      if (data.success) {
        alert('Application submitted successfully! The tee time creator will review your request.')
        fetchTeeTimes()
      } else {
        alert('Failed to apply: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error applying to tee time:', error)
      alert('Failed to apply to tee time')
    }
  }

  const handleViewApplicant = async (notification: any) => {
    console.log('📋 Viewing applicant from notification:', notification)
    
    if (!notification.notification_data?.applicant_id) {
      alert('Cannot view applicant - missing applicant information')
      return
    }

    try {
      const response = await fetch(`/api/users?action=profile&user_id=${notification.notification_data.applicant_id}`)
        const data = await response.json()
      
      if (data.success && data.profile) {
        setApplicantProfile(data.profile)
        setSelectedApplication(notification.notification_data)
        setShowApplicantModal(true)
        } else {
        alert('Failed to load applicant profile')
      }
    } catch (error) {
      console.error('Error loading applicant profile:', error)
      alert('Failed to load applicant profile')
    }
  }

  const handleAcceptApplicant = async () => {
    if (!selectedApplication?.application_id) {
      alert('No application selected')
      return
    }

    try {
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'manage_application',
          application_id: selectedApplication.application_id,
          action_type: 'accept'
        }),
      })
          
        const data = await response.json()
      
      if (data.success) {
        alert('Applicant accepted successfully!')
        setShowApplicantModal(false)
        setSelectedApplication(null)
        setApplicantProfile(null)
        fetchNotifications()
      } else {
        alert('Failed to accept applicant: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error accepting applicant:', error)
      alert('Failed to accept applicant')
    }
  }

  const handleRejectApplicant = async () => {
    if (!selectedApplication?.application_id) {
      alert('No application selected')
      return
    }

    if (!confirm('Are you sure you want to reject this applicant?')) {
      return
    }

    try {
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'manage_application',
          application_id: selectedApplication.application_id,
          action_type: 'reject'
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Applicant rejected')
        setShowApplicantModal(false)
        setSelectedApplication(null)
        setApplicantProfile(null)
        fetchNotifications()
      } else {
        alert('Failed to reject applicant: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error rejecting applicant:', error)
      alert('Failed to reject applicant')
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

  const joinedGroupIds = useMemo(
    () => new Set(userGroups.map((group) => group.id)),
    [userGroups]
  )

  const topGroups = useMemo(
    () =>
      [...allGroups]
        .sort((a, b) => (b.member_count || 0) - (a.member_count || 0))
        .slice(0, 6),
    [allGroups]
  )

  const localGroups = useMemo(() => {
    const profileLocation = (profile?.location || '').toLowerCase().trim()
    if (!profileLocation) {
      return topGroups.slice(0, 3)
    }

    const locationTokens = profileLocation
      .split(/[,\s]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)

    return topGroups
      .filter((group) => {
        const groupLocation = (group.location || '').toLowerCase()
        return locationTokens.some((token) => groupLocation.includes(token))
      })
      .slice(0, 3)
  }, [profile?.location, topGroups])

  const dashboardActivity = useMemo(() => {
    const today = new Date()
    const thisWeekEnd = new Date()
    thisWeekEnd.setDate(today.getDate() + 7)

    const upcomingThisWeek = teeTimes.filter((teeTime) => {
      const teeDate = new Date(teeTime.tee_time_date)
      return teeDate >= today && teeDate <= thisWeekEnd
    })

    const groupTeeTimes = teeTimes.filter((teeTime) => teeTime.visibility_scope === 'group')
    const connectionTeeTimes = teeTimes.filter((teeTime) => teeTime.visibility_scope === 'connections')
    const hostedByYou = teeTimes.filter((teeTime) => teeTime.creator_id === user?.id)
    const nextOpenTeeTime = upcomingThisWeek[0] || teeTimes[0] || null

    return {
      upcomingThisWeek,
      groupTeeTimes,
      connectionTeeTimes,
      hostedByYou,
      nextOpenTeeTime,
    }
  }, [teeTimes, user?.id])

  const spotlightCards = useMemo(
    () => [
      {
        label: 'This Week',
        value: dashboardActivity.upcomingThisWeek.length,
        description: 'tee times getting close',
        accent: 'from-emerald-300/20 to-cyan-300/10',
      },
      {
        label: 'Group Boards',
        value: userGroups.length,
        description: 'communities you can jump into',
        accent: 'from-sky-300/22 to-blue-300/10',
      },
      {
        label: 'Connections Only',
        value: dashboardActivity.connectionTeeTimes.length,
        description: 'private rounds in your network',
        accent: 'from-amber-300/20 to-orange-300/10',
      },
      {
        label: 'Requests Waiting',
        value: pendingApplications.length,
        description: 'people waiting on your response',
        accent: 'from-rose-300/20 to-pink-300/10',
      },
    ],
    [dashboardActivity.connectionTeeTimes.length, dashboardActivity.upcomingThisWeek.length, pendingApplications.length, userGroups.length]
  )

  // Show welcome animation while loading and after
  if (initialLoading || showWelcome) {
    return <WelcomeAnimation onComplete={() => setShowWelcome(false)} />
  }

  return (
    <div className="min-h-screen animate-fade-in bg-[#07140f] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/8 bg-[#07140f]/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 sm:h-24">
            {/* Logo */}
            <div className="flex-shrink-0 -ml-2 sm:-ml-1">
              <Logo size="md" />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2 rounded-full border border-white/8 bg-white/5 p-1">
              {tabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`flex items-center space-x-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                        isActive
                        ? 'bg-white text-slate-950 shadow-lg'
                        : 'text-white/72 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    </button>
                  )
                })}
              </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-3">
                {/* Notifications */}
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                className="relative rounded-full border border-white/8 bg-white/5 p-2.5 text-white/80 transition hover:bg-white/10"
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
                className="rounded-full border border-white/8 bg-white/5 p-2.5 text-white/80 transition hover:bg-white/10"
                                  >
                <QrCode className="h-5 w-5" />
                                  </button>

              {/* QR Scanner */}
                <button
                onClick={() => setShowQRScanner(true)}
                className="rounded-full border border-white/8 bg-white/5 p-2.5 text-white/80 transition hover:bg-white/10"
                                  >
                <Camera className="h-5 w-5" />
                                  </button>

              {/* Sign Out Button */}
                      <button 
                onClick={handleSignOut}
                className="hidden rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 md:block"
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
            <div className="border-t border-white/8 py-4 md:hidden">
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
                      className={`flex items-center space-x-3 rounded-2xl px-4 py-3 transition-all duration-300 font-medium ${
                    isActive
                      ? 'bg-white text-slate-950 shadow-lg'
                          : 'text-white/72 hover:bg-white/8 hover:text-white'
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
              className="flex items-center space-x-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 font-medium text-red-200 transition hover:bg-red-500/20"
            >
              <span>Sign Out</span>
              </button>
          </div>
        </div>
      )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-8">
          <WeatherWidget />
        </div>

        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),linear-gradient(135deg,rgba(14,35,29,0.96),rgba(8,20,15,0.98))] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_420px] xl:items-stretch">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-200/75">
                Activity Hub
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                Welcome back, {profile?.first_name || user?.email?.split('@')[0] || 'Golfer'}.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
                Keep your next round moving. The most active tee times, group chatter, and pending
                requests are all surfaced here so the dashboard feels alive the second you land.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {spotlightCards.map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-[1.5rem] border border-white/8 bg-gradient-to-br ${card.accent} p-5`}
                  >
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
                    <p className="mt-2 text-sm text-white/58">{card.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => setShowCreateTeeTimeModal(true)}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-100"
                >
                  Post a Tee Time
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open My Groups
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Next Best Opening</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      {dashboardActivity.nextOpenTeeTime?.golf_courses?.name || dashboardActivity.nextOpenTeeTime?.course_name || 'No active tee times yet'}
                    </h2>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 p-3">
                    <ArrowUpRight className="h-5 w-5 text-emerald-200" />
                  </div>
                </div>
                {dashboardActivity.nextOpenTeeTime ? (
                  <>
                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/62">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {new Date(dashboardActivity.nextOpenTeeTime.tee_time_date).toLocaleDateString()}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {dashboardActivity.nextOpenTeeTime.tee_time_time}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {dashboardActivity.nextOpenTeeTime.available_spots || dashboardActivity.nextOpenTeeTime.max_players - dashboardActivity.nextOpenTeeTime.current_players} spots open
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/56">
                      {dashboardActivity.nextOpenTeeTime.visibility_scope === 'group'
                        ? `This one is tied to ${dashboardActivity.nextOpenTeeTime.group?.name || 'a group community'}.`
                        : dashboardActivity.nextOpenTeeTime.visibility_scope === 'connections'
                          ? 'This round is limited to connections in your network.'
                          : 'This public tee time is visible to the whole community.'}
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-white/56">
                    Post the next round and turn this dashboard into a live board again.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-emerald-500/12 p-3">
                      <Calendar className="h-5 w-5 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Hosted By You</p>
                      <p className="text-sm text-white/52">rounds you need to manage</p>
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-semibold text-white">{dashboardActivity.hostedByYou.length}</p>
                </div>

                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-sky-500/12 p-3">
                      <Users className="h-5 w-5 text-sky-200" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Group Tee Times</p>
                      <p className="text-sm text-white/52">community-driven rounds</p>
                    </div>
                  </div>
                  <p className="mt-5 text-3xl font-semibold text-white">{dashboardActivity.groupTeeTimes.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tee Times Tab */}
        {activeTab === 'tee-times' && (
          <div className="space-y-6 animate-fade-in">
            {/* Tee Times Section */}
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="rounded-[1.8rem] border border-white/8 bg-white/5 p-6 backdrop-blur-sm">
                  <h2 className="text-3xl font-bold text-white">Available Tee Times</h2>
                  <p className="mt-2 text-white/62">
                    Fresh rounds, private connection invites, and group-posted tee times all in one place.
                  </p>
                </div>
                <button 
                  onClick={() => setShowCreateTeeTimeModal(true)}
                  className="flex items-center justify-center space-x-2 rounded-[1.8rem] border border-emerald-300/14 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(125,211,252,0.08))] px-6 py-6 font-semibold text-white transition-all duration-300 hover:border-emerald-200/25 hover:bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(125,211,252,0.14))]"
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
                      <div key={teeTime.id} className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10">
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

                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                              {teeTime.visibility_scope === 'connections'
                                ? 'Connections'
                                : teeTime.visibility_scope === 'group'
                                  ? 'Group'
                                  : 'Public'}
                            </span>
                            {teeTime.group?.name && (
                              <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200">
                                {teeTime.group.name}
                              </span>
                            )}
                          </div>
                          
                          {/* Bottom Row: Players Info and Action Buttons */}
                          <div className="flex items-center justify-between gap-4 pt-2">
                            <p className="text-gray-300 text-sm">
                              <span className="text-emerald-400 font-semibold">Spots:</span> {teeTime.available_spots || teeTime.max_players - teeTime.current_players} of {teeTime.max_players}
                            </p>
                            
                            <div className="flex items-center gap-2">
                        {teeTime.creator_id === user?.id ? (
                          <button
                            onClick={() => handleDeleteTeeTime(teeTime.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg hover:shadow-red-500/50 whitespace-nowrap"
                          >
                                  Delete
                          </button>
                        ) : (
                          <button
                                  onClick={() => handleJoinTeeTime(teeTime.id)}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg hover:shadow-emerald-500/50 whitespace-nowrap"
                          >
                                  Join
                          </button>
                          )}
                      </div>
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
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_340px]">
              <div className="rounded-[1.9rem] border border-white/8 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_30%),linear-gradient(135deg,rgba(14,35,29,0.96),rgba(8,20,15,0.98))] p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
                <h2 className="text-3xl font-bold text-white">Golf Groups</h2>
                <p className="mt-3 max-w-2xl text-white/62">
                  Find the communities with real momentum, join the best local rooms, and jump into message boards that keep rounds and conversation alive.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowCreateGroupModal(true)}
                    className="flex items-center space-x-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition-all duration-300 hover:bg-emerald-100"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create Group</span>
                  </button>
                  <button
                    onClick={() => setGroupSearchQuery('')}
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Explore All
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Top Nearby</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{localGroups.length}</p>
                  <p className="mt-2 text-sm text-white/56">
                    strongest groups around {profile?.location || 'your area'}
                  </p>
                </div>
                <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/45">Top By Members</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{topGroups[0]?.member_count || 0}</p>
                  <p className="mt-2 text-sm text-white/56">
                    current size of the biggest active community
                  </p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups by name or location..."
                  value={groupSearchQuery}
                  onChange={(e) => searchGroups(e.target.value)}
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Top Local Groups</h3>
                    <p className="mt-2 text-sm text-white/56">
                      Communities with the strongest pull near you.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {localGroups.length === 0 ? (
                    <div className="rounded-2xl border border-white/8 bg-white/5 p-4 text-sm text-white/56">
                      Add your location in your profile to surface local communities here.
                    </div>
                  ) : (
                    localGroups.map((group, index) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between rounded-[1.4rem] border border-white/8 bg-white/5 p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(16,185,129,0.24),rgba(56,189,248,0.16))] text-sm font-semibold text-white">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{group.name}</p>
                            <p className="text-sm text-white/50">
                              {(group.group_type === 'course' ? 'Course' : 'Community')} • {group.location || 'Community hub'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-200">{group.member_count || 0} members</p>
                          <button
                            onClick={() => (joinedGroupIds.has(group.id) || group.is_member ? router.push(`/groups/${group.id}`) : handleJoinGroup(group.id))}
                            className="mt-2 text-sm font-semibold text-white/74 transition hover:text-white"
                          >
                            {joinedGroupIds.has(group.id) || group.is_member ? 'Open board' : 'Join group'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Top Groups Right Now</h3>
                    <p className="mt-2 text-sm text-white/56">
                      Sorted by active member base so the biggest communities surface first.
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {topGroups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))] p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{group.name}</p>
                          <p className="truncate text-sm text-white/50">
                            {(group.group_type === 'course' ? 'Course' : 'Community')} • {group.description || 'Ongoing member activity and conversation.'}
                          </p>
                        </div>
                        <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-emerald-200">
                          {group.member_count || 0}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* My Groups Section */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">My Groups</h3>
              {groupsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                  <span className="ml-3 text-gray-300">Loading groups...</span>
                </div>
              ) : userGroups.length === 0 ? (
                <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-300 mb-2">No Groups Yet</h3>
                  <p className="text-gray-400">Join or create golf groups to connect with fellow golfers!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userGroups.map((group) => (
                    <div key={group.id} className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                      {/* Group Logo */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-emerald-500 flex-shrink-0">
                          {group.logo_url ? (
                            <img src={group.logo_url} alt={group.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                              <span className="text-white font-bold text-xl">{group.name?.[0] || 'G'}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-lg truncate">{group.name}</h3>
                          <div className="mt-1 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/58">
                            {group.group_type === 'course' ? 'Course' : 'Community'}
                          </div>
                          {group.location && (
                            <div className="flex items-center text-gray-400 text-sm mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate">{group.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Description */}
                      <p className="text-gray-300 text-sm mb-4 line-clamp-2">{group.description || 'No description'}</p>
                      
                      {/* Members Count */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center text-emerald-400 text-sm">
                          <User className="h-4 w-4 mr-1" />
                          <span>{group.member_count || 0} members</span>
                        </div>
                        <button
                          onClick={() => router.push(`/groups/${group.id}`)}
                          className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold"
                        >
                          Open Community
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search Results / All Groups */}
            {groupSearchQuery && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Search Results</h3>
                {groupSearchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                    <span className="ml-3 text-gray-300">Searching...</span>
                  </div>
                ) : allGroups.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No Groups Found</h3>
                    <p className="text-gray-400">Try a different search term</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allGroups.map((group) => (
                      <div key={group.id} className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10">
                        {/* Group Logo */}
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-emerald-500 flex-shrink-0">
                            {group.logo_url ? (
                              <img src={group.logo_url} alt={group.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                                <span className="text-white font-bold text-xl">{group.name?.[0] || 'G'}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg truncate">{group.name}</h3>
                            <div className="mt-1 inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/58">
                              {group.group_type === 'course' ? 'Course' : 'Community'}
                            </div>
                            {group.location && (
                              <div className="flex items-center text-gray-400 text-sm mt-1">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span className="truncate">{group.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-gray-300 text-sm mb-4 line-clamp-2">{group.description || 'No description'}</p>
                        
                        {/* Members Count and Join Button */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center text-emerald-400 text-sm">
                            <User className="h-4 w-4 mr-1" />
                            <span>{group.member_count || 0} members</span>
                          </div>
                          {joinedGroupIds.has(group.id) || group.is_member ? (
                            <button
                              onClick={() => router.push(`/groups/${group.id}`)}
                              className="rounded-lg border border-white/10 bg-white/5 px-4 py-1 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
                            >
                              Open
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoinGroup(group.id)}
                              disabled={joiningGroupId === group.id}
                              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white px-4 py-1 rounded-lg text-sm font-semibold transition-colors"
                            >
                              {joiningGroupId === group.id ? 'Joining...' : 'Join'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-[1.8rem] border border-white/8 bg-white/5 p-6 text-center backdrop-blur-sm">
              <h2 className="mb-2 text-3xl font-bold text-white">Messages</h2>
              <p className="text-white/62">Stay in touch with your golf community and keep conversations moving.</p>
            </div>
            <MessagingSystem />
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-8 rounded-[1.8rem] border border-white/8 bg-white/5 p-6 text-center backdrop-blur-sm">
              <h2 className="mb-2 text-3xl font-bold text-white">My Profile</h2>
              <p className="text-white/62">Manage your golf profile and settings</p>
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
              <div className="rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-6 backdrop-blur-sm">
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

              <div>
                <label className="block text-sm font-semibold text-emerald-400 mb-2">Who can see this?</label>
                <select
                  value={teeTimeForm.visibility_scope}
                  onChange={(e) => setTeeTimeForm({
                    ...teeTimeForm,
                    visibility_scope: e.target.value,
                    group_id: e.target.value === 'group' ? teeTimeForm.group_id : ''
                  })}
                  className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-all"
                >
                  <option value="public">Public</option>
                  <option value="connections">Connections only</option>
                  <option value="group">Inside one of my groups</option>
                </select>
              </div>

              {teeTimeForm.visibility_scope === 'group' && (
                <div>
                  <label className="block text-sm font-semibold text-emerald-400 mb-2">Choose Group *</label>
                  <select
                    value={teeTimeForm.group_id}
                    onChange={(e) => setTeeTimeForm({ ...teeTimeForm, group_id: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-all"
                    required
                  >
                    <option value="">Select a group</option>
                    {userGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-400">
                    Group tee times double as community posts for that group board.
                  </p>
                </div>
              )}

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

            <form onSubmit={handleCreateGroup} className="space-y-6">
              {/* Group Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Group Logo</label>
                <div className="flex items-center space-x-4">
                  {groupLogoPreview ? (
                    <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg">
                      <img src={groupLogoPreview} alt="Group logo preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-slate-700 border-2 border-dashed border-slate-600 flex items-center justify-center">
                      <User className="h-10 w-10 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGroupLogoChange}
                      className="hidden"
                      id="group-logo-upload"
                    />
                    <label
                      htmlFor="group-logo-upload"
                      className="cursor-pointer inline-block px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all border border-emerald-500/30"
                    >
                      {groupLogoPreview ? 'Change Logo' : 'Upload Logo'}
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Recommended: Square image, at least 200x200px</p>
                  </div>
                </div>
              </div>

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
                <label className="block text-sm font-medium text-gray-300 mb-2">Group Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGroupForm({ ...groupForm, group_type: 'community' })}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      groupForm.group_type === 'community'
                        ? 'border-emerald-400/50 bg-emerald-500/12 text-white'
                        : 'border-slate-600 bg-slate-700/40 text-gray-300 hover:border-slate-500'
                    }`}
                  >
                    <p className="font-semibold">Community</p>
                    <p className="mt-2 text-sm opacity-80">
                      Like-minded golfers in the same area.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupForm({ ...groupForm, group_type: 'course' })}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      groupForm.group_type === 'course'
                        ? 'border-emerald-400/50 bg-emerald-500/12 text-white'
                        : 'border-slate-600 bg-slate-700/40 text-gray-300 hover:border-slate-500'
                    }`}
                  >
                    <p className="font-semibold">Course</p>
                    <p className="mt-2 text-sm opacity-80">
                      Golf course or club members and regular players.
                    </p>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={groupForm.location}
                  onChange={(e) => setGroupForm({...groupForm, location: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g., Nashville, TN"
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

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-20 right-4 md:right-8 w-96 max-w-[calc(100vw-2rem)] bg-slate-800 rounded-xl shadow-2xl border border-emerald-500/20 z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b border-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Notifications</h3>
                              <button
                onClick={() => setShowNotifications(false)}
                className="text-gray-400 hover:text-white transition-colors"
                              >
                <X className="h-5 w-5" />
                              </button>
                            </div>
                        </div>
          
          <div className="divide-y divide-slate-700">
            {notificationsLoading ? (
              <div className="p-4 text-center text-gray-400">
                Loading notifications...
                      </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
                  </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-slate-700/50 transition-colors ${
                    notification.type === 'tee_time_application' ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (notification.type === 'tee_time_application') {
                      handleViewApplicant(notification)
                      setShowNotifications(false)
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'tee_time_application' ? (
                        <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-emerald-400" />
                </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Bell className="h-5 w-5 text-blue-400" />
                        </div>
                      )}
              </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                      {notification.type === 'tee_time_application' && (
                        <p className="text-xs text-emerald-400 mt-2 font-semibold">
                          Click to review applicant
                        </p>
                      )}
              </div>
          </div>
        </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Applicant Review Modal */}
      {showApplicantModal && applicantProfile && selectedApplication && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-emerald-500/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Review Applicant</h3>
                <button
                onClick={() => {
                  setShowApplicantModal(false)
                  setSelectedApplication(null)
                  setApplicantProfile(null)
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
                </button>
              </div>

            {/* Tee Time Info */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
              <h4 className="text-sm font-semibold text-emerald-400 mb-2">Tee Time Details</h4>
              <p className="text-white font-bold text-lg">{selectedApplication.course_name}</p>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-300">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(selectedApplication.tee_time_date).toLocaleDateString()}</span>
          </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{selectedApplication.tee_time_time}</span>
        </div>
              </div>
            </div>

            {/* Applicant Profile */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg">
                  {applicantProfile.avatar_url ? (
                    <img
                      src={applicantProfile.avatar_url}
                      alt={`${applicantProfile.first_name} ${applicantProfile.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center">
                      <span className="text-white font-bold text-2xl">
                        {applicantProfile.first_name?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-2xl font-bold text-white">
                    {applicantProfile.first_name} {applicantProfile.last_name}
                  </h4>
                  <p className="text-gray-400">@{applicantProfile.username || 'user'}</p>
                </div>
            </div>
            
              {/* Profile Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Handicap</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {applicantProfile.handicap || 'Not set'}
                  </p>
              </div>
                
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Email</p>
                  <p className="text-sm text-white truncate">
                    {applicantProfile.email || 'Not available'}
                  </p>
                        </div>
                        </div>

              {applicantProfile.bio && (
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">Bio</p>
                  <p className="text-white">{applicantProfile.bio}</p>
                      </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                      <button
                  onClick={handleRejectApplicant}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300 border border-red-500/30 font-semibold"
                      >
                  Reject
                      </button>
                    <button
                  onClick={handleAcceptApplicant}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-emerald-500/50"
                >
                  Accept to Tee Time
                    </button>
                  </div>
              </div>
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
