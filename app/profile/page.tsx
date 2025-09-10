'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  User, 
  MapPin, 
  Calendar, 
  Trophy, 
  Flag, 
  Edit3, 
  Save, 
  X,
  Camera,
  Settings,
  ArrowLeft,
  Star,
  TrendingUp,
  Users,
  Clock,
  QrCode,
  Menu,
  Home,
  Search,
  MessageCircle,
  Bell
} from 'lucide-react'
import Logo from '@/app/components/Logo'
import QRCodeGenerator from '@/app/components/QRCodeGenerator'
import QRCodeScanner from '@/app/components/QRCodeScanner'


interface ProfileFormData {
  first_name: string
  last_name: string
  username: string
  bio: string
  handicap: number | null
  location: string
  experience_level: string
  preferred_playing_days: string[]
  preferred_playing_times: string[]
  golf_goals: string[]
  avatar_url: string
  header_image_url: string
  home_club: string
  years_playing: number | null
  favorite_course: string
  playing_style: string
  goals: string
}

export default function ProfilePage() {
  const { user, profile, updateProfile, loading } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    handicap: null,
    location: '',
    experience_level: '',
    preferred_playing_days: [],
    preferred_playing_times: [],
    golf_goals: [],
    avatar_url: '',
    header_image_url: '',
    home_club: '',
    years_playing: null,
    favorite_course: '',
    playing_style: '',
    goals: ''
  })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingHeaderImage, setUploadingHeaderImage] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showNavigationMenu, setShowNavigationMenu] = useState(false)
  const [connectionCount, setConnectionCount] = useState(0)
  const [connectionsLoading, setConnectionsLoading] = useState(false)
  const [connections, setConnections] = useState<any[]>([])
  const [showConnectionsModal, setShowConnectionsModal] = useState(false)
  const [connectionsModalLoading, setConnectionsModalLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (profile) {
      console.log('🔍 Profile data loaded:', profile)
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        handicap: profile.handicap,
        location: profile.location || '',
        experience_level: profile.experience_level || '',
        preferred_playing_days: profile.preferred_playing_days || [],
        preferred_playing_times: profile.preferred_playing_times || [],
        golf_goals: profile.golf_goals || [],
        avatar_url: profile.avatar_url || '',
        header_image_url: profile.header_image_url || '',
        home_club: profile.home_club || '',
        years_playing: profile.years_playing || null,
        favorite_course: profile.favorite_course || '',
        playing_style: profile.playing_style || '',
        goals: profile.goals || ''
      })
    }
  }, [user, profile, loading, router])

  // Fetch connections when user loads
  useEffect(() => {
    if (user?.id) {
      fetchConnections()
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 2MB for better performance)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB')
      return
    }

    setUploadingImage(true)
    try {
      // Compress image before converting to base64
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Set canvas size (max 200x200 for profile pictures)
        const maxSize = 200
        let { width, height } = img
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to base64 with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7) // 70% quality
        
        console.log('🔍 Compressed image uploaded:', compressedDataUrl.substring(0, 50) + '...')
        setFormData(prev => ({ ...prev, avatar_url: compressedDataUrl }))
        setUploadingImage(false)
      }
      
      img.onerror = () => {
        console.error('Error loading image')
        alert('Failed to process image. Please try again.')
        setUploadingImage(false)
      }
      
      // Load image from file
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
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

    // Validate file size (max 5MB for header images)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploadingHeaderImage(true)
    try {
      // Compress image before converting to base64
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Set canvas size (max 1200x400 for header images)
        const maxWidth = 1200
        const maxHeight = 400
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to base64 with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8) // 80% quality
        
        console.log('🔍 Compressed header image uploaded:', compressedDataUrl.substring(0, 50) + '...')
        setFormData(prev => ({ ...prev, header_image_url: compressedDataUrl }))
        setUploadingHeaderImage(false)
      }
      
      img.onerror = () => {
        console.error('Error loading header image')
        alert('Failed to process header image. Please try again.')
        setUploadingHeaderImage(false)
      }
      
      // Load image from file
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading header image:', error)
      alert('Failed to upload header image. Please try again.')
      setUploadingHeaderImage(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      
      
      if (!user || !user.id) {
        throw new Error('No user ID available for profile update')
      }
      
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        bio: formData.bio,
        handicap: formData.handicap,
        location: formData.location,
        avatar_url: formData.avatar_url,
        header_image_url: formData.header_image_url,
        home_club: formData.home_club,
        years_playing: formData.years_playing,
        favorite_course: formData.favorite_course,
        playing_style: formData.playing_style,
        goals: formData.goals,
        experience_level: formData.experience_level,
        preferred_playing_days: formData.preferred_playing_days,
        preferred_playing_times: formData.preferred_playing_times,
        golf_goals: formData.golf_goals
      })
      
      
      setIsEditing(false)
    } catch (error) {
      console.error('❌ Failed to update profile:', error)
      // Show user-friendly error message
      alert(`Failed to save profile: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const fetchConnections = async () => {
    if (!user?.id) return
    
    setConnectionsLoading(true)
    try {
      const { createBrowserClient } = await import('@/lib/supabase')
      const supabase = createBrowserClient()
      
      const { data, error } = await supabase
        .from('user_connections')
        .select('*')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted')

      if (error) throw error
      setConnectionCount(data?.length || 0)
      setConnections(data || [])
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setConnectionsLoading(false)
    }
  }

  const fetchConnectionProfiles = async () => {
    if (!user?.id || connections.length === 0) return
    
    setConnectionsModalLoading(true)
    try {
      const { createBrowserClient } = await import('@/lib/supabase')
      const supabase = createBrowserClient()
      
      // Get all connection user IDs
      const connectionUserIds = connections.map(conn => 
        conn.requester_id === user.id ? conn.recipient_id : conn.requester_id
      )
      
      // Fetch profiles for all connections
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, username, avatar_url, handicap, location, bio')
        .in('id', connectionUserIds)

      if (error) throw error
      
      // Combine connection data with profile data
      const connectionsWithProfiles = connections.map(conn => {
        const otherUserId = conn.requester_id === user.id ? conn.recipient_id : conn.requester_id
        const profile = data?.find((p: any) => p.id === otherUserId)
        return {
          ...conn,
          profile
        }
      })
      
      setConnections(connectionsWithProfiles)
    } catch (error) {
      console.error('Error fetching connection profiles:', error)
    } finally {
      setConnectionsModalLoading(false)
    }
  }

  const handleConnectionsClick = () => {
    if (connectionCount > 0) {
      setShowConnectionsModal(true)
      fetchConnectionProfiles()
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        handicap: profile.handicap,
        location: profile.location || '',
        experience_level: profile.experience_level || '',
        preferred_playing_days: profile.preferred_playing_days || [],
        preferred_playing_times: profile.preferred_playing_times || [],
        golf_goals: profile.golf_goals || [],
        avatar_url: profile.avatar_url || '',
        header_image_url: profile.header_image_url || '',
        home_club: profile.home_club || '',
        years_playing: profile.years_playing || null,
        favorite_course: profile.favorite_course || '',
        playing_style: profile.playing_style || '',
        goals: profile.goals || ''
      })
    }
    setIsEditing(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Modern Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-emerald-400/60 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-40 w-3 h-3 bg-cyan-400/60 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-emerald-300/60 rounded-full animate-bounce"></div>
        <div className="absolute bottom-40 right-1/4 w-2 h-2 bg-cyan-300/60 rounded-full animate-ping"></div>
        <div className="absolute top-1/2 left-10 w-1 h-1 bg-purple-400/60 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-1.5 h-1.5 bg-blue-400/60 rounded-full animate-bounce"></div>
      </div>
      {/* Modern Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-300 hover:text-emerald-400 transition-all duration-300 group"
              >
                <div className="p-2 rounded-lg bg-gray-800/50 group-hover:bg-emerald-500/20 transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </div>
                <span className="ml-3 font-medium">Back to Dashboard</span>
              </button>
              <div className="h-8 w-px bg-gray-600"></div>
              <Logo size="lg" />
            </div>
            
            <div className="flex items-center space-x-3">
              {/* QR Code Buttons */}
              <button
                onClick={() => setShowQRCode(true)}
                className="flex items-center bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-blue-400 border border-blue-400/30 px-4 py-2.5 rounded-xl hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 shadow-lg hover:shadow-blue-500/20 group"
              >
                <QrCode className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">My QR Code</span>
              </button>
              
              <button
                onClick={() => setShowQRScanner(true)}
                className="flex items-center bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-400 border border-purple-400/30 px-4 py-2.5 rounded-xl hover:from-purple-500/30 hover:to-purple-600/30 transition-all duration-300 shadow-lg hover:shadow-purple-500/20 group"
              >
                <QrCode className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Scan QR</span>
              </button>

              {/* Navigation Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowNavigationMenu(!showNavigationMenu)}
                  className="flex items-center bg-gradient-to-r from-gray-500/20 to-gray-600/20 text-gray-300 border border-gray-400/30 px-4 py-2.5 rounded-xl hover:from-gray-500/30 hover:to-gray-600/30 transition-all duration-300 shadow-lg hover:shadow-gray-500/20 group"
                >
                  <Menu className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Menu</span>
                </button>
                
                {showNavigationMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-xl shadow-lg border border-slate-700 z-50">
                    <div className="p-2">
                      <button
                        onClick={() => {
                          router.push('/dashboard')
                          setShowNavigationMenu(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <Home className="h-4 w-4 mr-3" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          router.push('/dashboard?tab=find-someone')
                          setShowNavigationMenu(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <Search className="h-4 w-4 mr-3" />
                        Find Golfers
                      </button>
                      <button
                        onClick={() => {
                          router.push('/dashboard?tab=courses')
                          setShowNavigationMenu(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <Flag className="h-4 w-4 mr-3" />
                        Golf Courses
                      </button>
                      <button
                        onClick={() => {
                          router.push('/dashboard?tab=messages')
                          setShowNavigationMenu(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <MessageCircle className="h-4 w-4 mr-3" />
                        Messages
                      </button>
                      <button
                        onClick={() => {
                          router.push('/dashboard?tab=badges')
                          setShowNavigationMenu(false)
                        }}
                        className="flex items-center w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                      >
                        <Trophy className="h-4 w-4 mr-3" />
                        Badges
                      </button>
                      <div className="border-t border-slate-700 my-2"></div>
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleCancel}
                            className="flex items-center w-full px-3 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4 mr-3" />
                            Cancel Edit
                          </button>
                          <button
                            onClick={() => {
                              handleSave()
                              setShowNavigationMenu(false)
                            }}
                            disabled={saving}
                            className="flex items-center w-full px-3 py-2 text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {saving ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400 mr-3"></div>
                            ) : (
                              <Save className="h-4 w-4 mr-3" />
                            )}
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setIsEditing(true)
                            setShowNavigationMenu(false)
                          }}
                          className="flex items-center w-full px-3 py-2 text-emerald-400 hover:bg-emerald-900/20 rounded-lg transition-colors"
                        >
                          <Edit3 className="h-4 w-4 mr-3" />
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Image */}
        {(formData.header_image_url || profile?.header_image_url) && (
          <div className="relative mb-8 rounded-2xl overflow-hidden">
            <img 
              src={formData.header_image_url || profile?.header_image_url || ''} 
              alt="Profile Header" 
              className="w-full h-64 object-cover"
            />
            {isEditing && (
              <div className="absolute top-4 right-4">
                <label className="bg-emerald-500/90 hover:bg-emerald-600/90 text-white p-3 rounded-full transition-colors duration-300 cursor-pointer backdrop-blur-sm">
                  <Camera className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeaderImageUpload}
                    className="hidden"
                    disabled={uploadingHeaderImage}
                  />
                </label>
                {uploadingHeaderImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Header Image Button (when no header image) */}
        {isEditing && !(formData.header_image_url || profile?.header_image_url) && (
          <div className="mb-8">
            <label className="block w-full h-32 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-emerald-400 transition-colors duration-300 bg-gray-800/50 backdrop-blur-sm">
              <div className="flex flex-col items-center justify-center h-full text-gray-400 hover:text-emerald-400">
                <Camera className="h-8 w-8 mb-2" />
                <span className="text-lg font-medium">Add Header Photo</span>
                <span className="text-sm">Click to upload a header image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderImageUpload}
                  className="hidden"
                  disabled={uploadingHeaderImage}
                />
              </div>
              {uploadingHeaderImage && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Modern Profile Header */}
        <div className="relative bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-800/80 backdrop-blur-2xl border border-slate-700/30 rounded-3xl p-8 mb-8 shadow-2xl overflow-hidden">
          {/* Enhanced Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 rounded-full -translate-y-20 translate-x-20 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/15 to-blue-500/10 rounded-full translate-y-16 -translate-x-16 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          
          {/* Floating Particles */}
          <div className="absolute top-8 left-8 w-2 h-2 bg-emerald-400/60 rounded-full animate-bounce"></div>
          <div className="absolute top-16 right-16 w-1 h-1 bg-cyan-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-12 left-12 w-1.5 h-1.5 bg-purple-400/60 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center space-y-6 sm:space-y-0 sm:space-x-8">
            {/* Enhanced Profile Picture */}
            <div className="relative group">
              <div className="relative">
                {(formData.avatar_url || profile?.avatar_url) ? (
                  <div className="h-36 w-36 rounded-3xl overflow-hidden border-4 border-emerald-400/40 shadow-2xl group-hover:border-emerald-400/70 transition-all duration-500 group-hover:shadow-emerald-500/25">
                    <img 
                      src={formData.avatar_url || profile?.avatar_url || '/default-avatar.svg'} 
                      alt="Profile" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ) : (
                  <div className="h-36 w-36 bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-400 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 group-hover:shadow-emerald-500/25">
                    <User className="h-20 w-20 text-white drop-shadow-lg" />
                  </div>
                )}
                
                {/* Animated ring */}
                <div className="absolute inset-0 rounded-3xl border-2 border-emerald-400/20 group-hover:border-emerald-400/50 transition-all duration-500 group-hover:scale-105"></div>
                
                {/* Status indicator */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              {isEditing && (
                <label className="absolute -bottom-3 -right-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-4 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg hover:shadow-emerald-500/30 group-hover:scale-110 hover:-translate-y-1">
                  <Camera className="h-6 w-6" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Enhanced Profile Info */}
            <div className="flex-1 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                  <div className="space-y-2">
                    <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-white via-emerald-100 to-cyan-100 bg-clip-text text-transparent leading-tight">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : user.email?.split('@')[0] || 'Golfer'
                      }
                    </h1>
                    {profile?.username && (
                      <p className="text-xl text-slate-300 font-medium">@{profile.username}</p>
                    )}
                  </div>
                  {profile?.handicap && (
                    <div className="inline-flex items-center bg-gradient-to-r from-emerald-500/25 to-emerald-600/25 text-emerald-300 px-6 py-3 rounded-2xl text-lg font-bold border border-emerald-400/40 shadow-xl hover:shadow-emerald-500/20 transition-all duration-300">
                      <Trophy className="h-5 w-5 mr-3" />
                      Handicap: {profile.handicap}
                    </div>
                  )}
                </div>
                
                {/* Edit Profile Button */}
                <div className="flex items-center space-x-3">
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
                    >
                      <Edit3 className="h-5 w-5" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-500 disabled:to-slate-600 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
                      >
                        <X className="h-5 w-5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile Badges */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Member Since Badge */}
                <div className="inline-flex items-center bg-gray-700/50 text-gray-300 px-3 py-2 rounded-lg text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}
                </div>
                
                {/* Connections Badge */}
                <button 
                  onClick={handleConnectionsClick}
                  disabled={connectionCount === 0 || connectionsLoading}
                  className="inline-flex items-center bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-400 px-3 py-2 rounded-lg text-sm border border-blue-400/30 hover:from-blue-500/30 hover:to-indigo-600/30 hover:border-blue-400/50 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {connectionsLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-400"></div>
                  ) : (
                    `${connectionCount} Connection${connectionCount !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
              
              {/* Enhanced Bio Section */}
              <div className="relative">
                {profile?.bio ? (
                  <div className="bg-gradient-to-r from-slate-700/30 to-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300">
                    <p className="text-slate-200 text-lg leading-relaxed">{profile.bio}</p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-slate-700/20 to-slate-800/20 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/20 hover:border-slate-500/30 transition-all duration-300">
                    <p className="text-slate-400 text-lg italic">No bio yet. Add one to tell other golfers about yourself!</p>
                  </div>
                )}
              </div>

              {/* Enhanced Info Badges */}
              <div className="flex flex-wrap items-center gap-4">
                {profile?.location && (
                  <div className="flex items-center bg-gradient-to-r from-slate-700/40 to-slate-800/40 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-600/30 hover:border-emerald-400/50 transition-all duration-300 group">
                    <MapPin className="h-5 w-5 mr-3 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                    <span className="text-slate-200 font-medium">{profile.location}</span>
                  </div>
                )}
                {profile?.home_club && (
                  <div className="flex items-center bg-gradient-to-r from-slate-700/40 to-slate-800/40 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-600/30 hover:border-blue-400/50 transition-all duration-300 group">
                    <Flag className="h-5 w-5 mr-3 text-blue-400 group-hover:text-blue-300 transition-colors" />
                    <span className="text-slate-200 font-medium">{profile.home_club}</span>
                  </div>
                )}
                {profile?.playing_style && (
                  <div className="flex items-center bg-gradient-to-r from-slate-700/40 to-slate-800/40 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-600/30 hover:border-purple-400/50 transition-all duration-300 group">
                    <TrendingUp className="h-5 w-5 mr-3 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    <span className="text-slate-200 font-medium">{profile.playing_style}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Badge Display */}
        {profile?.badges && profile.badges.length > 0 && (
          <div className="relative bg-gradient-to-br from-yellow-900/40 via-orange-900/30 to-red-900/40 backdrop-blur-2xl border border-yellow-400/50 rounded-3xl p-8 mb-8 shadow-2xl overflow-hidden">
            {/* Enhanced Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/15 to-orange-500/10 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-gradient-to-tr from-orange-500/15 to-red-500/10 rounded-full translate-y-14 -translate-x-14 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-r from-yellow-500/10 to-red-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            
            {/* Floating Badge Particles */}
            <div className="absolute top-6 left-6 w-2 h-2 bg-yellow-400/60 rounded-full animate-bounce"></div>
            <div className="absolute top-12 right-12 w-1.5 h-1.5 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
            <div className="absolute bottom-8 left-8 w-1 h-1 bg-red-400/60 rounded-full animate-bounce" style={{ animationDelay: '1.4s' }}></div>
            
            <div className="relative">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl mr-3">
                  <Star className="h-6 w-6 text-yellow-400" />
                </div>
                Badges Earned ({profile.badges.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {profile.badges.map((userBadge: any) => (
                  <div 
                    key={userBadge.id}
                    className={`relative group cursor-pointer ${
                      userBadge.badge?.name === 'Founding Member' ? 'animate-pulse' : ''
                    }`}
                    title={`${userBadge.badge?.name} - ${userBadge.badge?.description}`}
                  >
                    <div className={`backdrop-blur-xl border rounded-2xl px-4 py-4 text-center transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl ${
                      userBadge.badge?.name === 'Founding Member' 
                        ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-400/50 group-hover:border-purple-400/80 group-hover:shadow-purple-500/20' 
                        : 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30 group-hover:border-yellow-400/50 group-hover:shadow-yellow-500/20'
                    }`}>
                      <div className="text-3xl mb-3">
                        {userBadge.badge?.icon_name === 'crown' && '👑'}
                        {userBadge.badge?.icon_name === 'star' && '⭐'}
                        {userBadge.badge?.icon_name === 'trophy' && '🏆'}
                        {userBadge.badge?.icon_name === 'medal' && '🥇'}
                        {userBadge.badge?.icon_name === 'flag' && '🏁'}
                        {userBadge.badge?.icon_name === 'golf' && '⛳'}
                        {userBadge.badge?.icon_name === 'sunrise' && '🌅'}
                        {userBadge.badge?.icon_name === 'zap' && '⚡'}
                        {userBadge.badge?.icon_name === 'lightning' && '⚡'}
                        {userBadge.badge?.icon_name === 'target' && '🎯'}
                        {userBadge.badge?.icon_name === 'award' && '🏅'}
                        {userBadge.badge?.icon_name === 'users' && '👥'}
                        {userBadge.badge?.icon_name === 'shield' && '🛡️'}
                        {userBadge.badge?.icon_name === 'edit' && '✏️'}
                        {userBadge.badge?.icon_name === 'map' && '🗺️'}
                        {userBadge.badge?.icon_name === 'calendar' && '📅'}
                        {userBadge.badge?.icon_name === 'cloud-rain' && '🌧️'}
                        {userBadge.badge?.icon_name === 'sun' && '☀️'}
                      </div>
                      <div className="text-yellow-200 text-sm font-semibold mb-1">{userBadge.badge?.name}</div>
                      <div className="text-yellow-400 text-xs font-medium">{userBadge.badge?.points} pts</div>
                      {userBadge.badge?.name === 'Founding Member' && (
                        <div className="text-purple-300 text-xs mt-2 font-bold">🏆 Pioneer!</div>
                      )}
                    </div>
                    {/* Rarity indicator */}
                    <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                      userBadge.badge?.rarity === 'legendary' ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' :
                      userBadge.badge?.rarity === 'epic' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' :
                      userBadge.badge?.rarity === 'rare' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' :
                      userBadge.badge?.rarity === 'uncommon' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' :
                      'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                    }`}>
                      {userBadge.badge?.rarity?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modern Profile Sections */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              
              <div className="relative">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl mr-3">
                    <User className="h-6 w-6 text-emerald-400" />
                  </div>
                  Personal Information
                </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <p className="text-white font-medium">{profile?.first_name || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <p className="text-white font-medium">{profile?.last_name || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                      placeholder="Choose a username"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <p className="text-white font-medium">{profile?.username || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Email</label>
                  <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                    <p className="text-white font-medium">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10 resize-none"
                    placeholder="Tell other golfers about yourself..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30 min-h-[100px]">
                    <p className="text-white font-medium leading-relaxed">{profile?.bio || 'No bio yet'}</p>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Golf Information */}
            <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full -translate-y-10 translate-x-10"></div>
              
              <div className="relative">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl mr-3">
                    <Flag className="h-6 w-6 text-blue-400" />
                  </div>
                  Golf Information
                </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Handicap</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={formData.handicap || ''}
                      onChange={(e) => handleInputChange('handicap', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                      placeholder="Enter your handicap"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <p className="text-white font-medium">{profile?.handicap ? profile.handicap : 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Years Playing</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.years_playing || ''}
                      onChange={(e) => handleInputChange('years_playing', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                      placeholder="How many years?"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <p className="text-white font-medium">{profile?.years_playing ? `${profile.years_playing} years` : 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Home Club</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.home_club}
                      onChange={(e) => handleInputChange('home_club', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                      placeholder="Your home golf club"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <p className="text-white font-medium">{profile?.home_club || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Favorite Course</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.favorite_course}
                      onChange={(e) => handleInputChange('favorite_course', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                      placeholder="Your favorite golf course"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <p className="text-white font-medium">{profile?.favorite_course || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Playing Style</label>
                  {isEditing ? (
                    <select
                      value={formData.playing_style}
                      onChange={(e) => handleInputChange('playing_style', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                    >
                      <option value="">Select playing style</option>
                      <option value="competitive">Competitive</option>
                      <option value="casual">Casual</option>
                      <option value="social">Social</option>
                      <option value="beginner">Beginner</option>
                      <option value="professional">Professional</option>
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <p className="text-white font-medium">{profile?.playing_style || 'Not set'}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10"
                      placeholder="Enter your city/area"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                      <p className="text-white font-medium">{profile?.location || 'Not set'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Golf Goals</label>
                {isEditing ? (
                  <textarea
                    value={formData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300 shadow-lg hover:shadow-emerald-500/10 resize-none"
                    placeholder="What are your golf goals and aspirations?"
                  />
                ) : (
                  <div className="px-4 py-3 bg-gray-700/30 rounded-xl border border-gray-600/30 min-h-[100px]">
                    <p className="text-white font-medium leading-relaxed">{profile?.goals || 'No goals set yet'}</p>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>

          {/* Modern Sidebar */}
          <div className="space-y-8">
            {/* Stats Card */}
            <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full -translate-y-8 translate-x-8"></div>
              
              <div className="relative">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl mr-3">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  Golf Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                    <span className="text-gray-300 font-medium">Rounds Played</span>
                    <span className="text-white font-bold text-lg">0</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                    <span className="text-gray-300 font-medium">Best Score</span>
                    <span className="text-white font-bold text-lg">--</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                    <span className="text-gray-300 font-medium">Average Score</span>
                    <span className="text-white font-bold text-lg">--</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-xl border border-gray-600/30">
                    <span className="text-gray-300 font-medium">Birdies</span>
                    <span className="text-white font-bold text-lg">0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full -translate-y-8 translate-x-8"></div>
              
              <div className="relative">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl mr-3">
                    <Clock className="h-5 w-5 text-blue-400" />
                  </div>
                  Recent Activity
                </h3>
                <div className="p-4 bg-gray-700/30 rounded-xl border border-gray-600/30">
                  <div className="text-center text-gray-400">
                    <p className="font-medium mb-2">No recent activity</p>
                    <p className="text-sm">Start playing to see your stats!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="relative bg-gradient-to-r from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -translate-y-8 translate-x-8"></div>
              
              <div className="relative">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl mr-3">
                    <Settings className="h-5 w-5 text-purple-400" />
                  </div>
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 text-emerald-400 border border-emerald-400/30 px-4 py-3 rounded-xl hover:from-emerald-500/30 hover:to-emerald-600/30 transition-all duration-300 font-semibold shadow-lg hover:shadow-emerald-500/20">
                    Post Tee Time
                  </button>
                  <button className="w-full bg-gradient-to-r from-gray-600/20 to-gray-700/20 text-gray-300 border border-gray-600/30 px-4 py-3 rounded-xl hover:from-gray-600/30 hover:to-gray-700/30 transition-all duration-300 font-semibold shadow-lg hover:shadow-gray-500/20">
                    View Connections
                  </button>
                  <button className="w-full bg-gradient-to-r from-gray-600/20 to-gray-700/20 text-gray-300 border border-gray-600/30 px-4 py-3 rounded-xl hover:from-gray-600/30 hover:to-gray-700/30 transition-all duration-300 font-semibold shadow-lg hover:shadow-gray-500/20">
                    Privacy Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
        <QRCodeScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Connections Modal */}
      {showConnectionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg mr-3">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                My Connections
              </h3>
              <button
                onClick={() => setShowConnectionsModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>
            
            {connectionsModalLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-slate-400">Loading connections...</p>
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-10 w-10 text-slate-400" />
                </div>
                <h4 className="text-xl font-bold text-white mb-4">No Connections Yet</h4>
                <p className="text-slate-400 mb-6">Start connecting with other golfers to build your network!</p>
                <button
                  onClick={() => {
                    setShowConnectionsModal(false)
                    setShowQRScanner(true)
                  }}
                  className="bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-400 border border-blue-400/30 px-6 py-3 rounded-xl hover:from-blue-500/30 hover:to-indigo-600/30 transition-all duration-300 font-semibold shadow-lg hover:shadow-blue-500/20"
                >
                  Scan QR Code to Connect
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {connections.map((connection, index) => (
                  <div key={connection.id || index} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/50 hover:border-blue-400/30 transition-all duration-300">
                    <div className="flex items-center space-x-4">
                      {/* Profile Picture */}
                      <div className="relative">
                        {connection.profile?.avatar_url ? (
                          <div className="h-12 w-12 rounded-xl overflow-hidden border-2 border-blue-400/30">
                            <img 
                              src={connection.profile.avatar_url} 
                              alt={`${connection.profile.first_name} ${connection.profile.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl flex items-center justify-center border-2 border-blue-400/30">
                            <User className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Profile Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-lg font-semibold text-white truncate">
                            {connection.profile?.first_name} {connection.profile?.last_name}
                          </h4>
                          {connection.profile?.handicap && (
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-lg text-xs font-medium">
                              HCP {connection.profile.handicap}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm truncate">
                          @{connection.profile?.username || 'No username'}
                        </p>
                        {connection.profile?.location && (
                          <div className="flex items-center space-x-1 mt-1">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            <span className="text-slate-500 text-xs">{connection.profile.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Button */}
                      <button
                        onClick={() => {
                          setShowConnectionsModal(false)
                          router.push(`/users/${connection.profile?.id}`)
                        }}
                        className="bg-gradient-to-r from-blue-500/20 to-indigo-600/20 text-blue-400 border border-blue-400/30 px-4 py-2 rounded-lg hover:from-blue-500/30 hover:to-indigo-600/30 transition-all duration-300 font-medium text-sm"
                      >
                        View Profile
                      </button>
                    </div>
                    
                    {/* Bio Preview */}
                    {connection.profile?.bio && (
                      <div className="mt-3 pt-3 border-t border-slate-600/50">
                        <p className="text-slate-300 text-sm line-clamp-2">{connection.profile.bio}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
