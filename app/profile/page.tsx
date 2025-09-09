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
import SimpleQRScanner from '@/app/components/SimpleQRScanner'


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
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-40 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-1/3 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-bounce"></div>
        <div className="absolute bottom-40 right-1/4 w-1 h-1 bg-cyan-300 rounded-full animate-ping"></div>
      </div>
      {/* Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-300 hover:text-emerald-400 transition-colors duration-300 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <Logo size="lg" />
            </div>
            
            <div className="flex items-center space-x-4">
              {/* QR Code Buttons */}
              <button
                onClick={() => setShowQRCode(true)}
                className="flex items-center bg-blue-500/20 text-blue-400 border border-blue-400/30 px-3 py-2 rounded-lg hover:bg-blue-500/30 transition-all duration-300"
              >
                <QrCode className="h-4 w-4 mr-2" />
                My QR Code
              </button>
              
              <button
                onClick={() => setShowQRScanner(true)}
                className="flex items-center bg-purple-500/20 text-purple-400 border border-purple-400/30 px-3 py-2 rounded-lg hover:bg-purple-500/30 transition-all duration-300"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR
              </button>

              {/* Navigation Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowNavigationMenu(!showNavigationMenu)}
                  className="flex items-center bg-gray-500/20 text-gray-300 border border-gray-400/30 px-3 py-2 rounded-lg hover:bg-gray-500/30 transition-all duration-300"
                >
                  <Menu className="h-4 w-4 mr-2" />
                  Menu
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
              src={formData.header_image_url || profile?.header_image_url} 
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

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8">
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              {(formData.avatar_url || profile?.avatar_url) ? (
                <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-emerald-400/30">
                  <img 
                                            src={formData.avatar_url || profile?.avatar_url || '/default-avatar.svg'} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-24 w-24 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-black" />
                </div>
              )}
              {isEditing && (
                <label className="absolute -bottom-2 -right-2 bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-full transition-colors duration-300 cursor-pointer">
                  <Camera className="h-4 w-4" />
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
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-white">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : user.email?.split('@')[0] || 'Golfer'
                  }
                </h1>
                {profile?.handicap && (
                  <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm border border-emerald-400/30">
                    Handicap: {profile.handicap}
                  </span>
                )}
              </div>
              
              {profile?.bio ? (
                <p className="text-gray-300 text-lg mb-4">{profile.bio}</p>
              ) : (
                <p className="text-gray-400 text-lg mb-4 italic">No bio yet. Add one to tell other golfers about yourself!</p>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-400">
                {profile?.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Display */}
        {profile?.badges && profile.badges.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400" />
              Badges Earned ({profile.badges.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map((userBadge: any) => (
                <div 
                  key={userBadge.id}
                  className={`relative group cursor-pointer ${
                    userBadge.badge?.name === 'Founding Member' ? 'animate-pulse' : ''
                  }`}
                  title={`${userBadge.badge?.name} - ${userBadge.badge?.description}`}
                >
                  <div className={`backdrop-blur-xl border rounded-xl px-4 py-3 text-center transform transition-all duration-300 group-hover:scale-110 ${
                    userBadge.badge?.name === 'Founding Member' 
                      ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-purple-400/50 group-hover:border-purple-400/80' 
                      : 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30 group-hover:border-yellow-400/50'
                  }`}>
                    <div className="text-2xl mb-2">
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
                    <div className="text-yellow-200 text-sm font-medium">{userBadge.badge?.name}</div>
                    <div className="text-yellow-400 text-xs">{userBadge.badge?.points} pts</div>
                    {userBadge.badge?.name === 'Founding Member' && (
                      <div className="text-purple-300 text-xs mt-1 font-medium">🏆 Pioneer!</div>
                    )}
                  </div>
                  {/* Rarity indicator */}
                  <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${
                    userBadge.badge?.rarity === 'legendary' ? 'bg-purple-500 text-white' :
                    userBadge.badge?.rarity === 'epic' ? 'bg-blue-500 text-white' :
                    userBadge.badge?.rarity === 'rare' ? 'bg-green-500 text-white' :
                    userBadge.badge?.rarity === 'uncommon' ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {userBadge.badge?.rarity?.charAt(0).toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Sections */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-emerald-400" />
                Personal Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <p className="text-white">{profile?.first_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <p className="text-white">{profile?.last_name || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="Choose a username"
                    />
                  ) : (
                    <p className="text-white">{profile?.username || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <p className="text-white">{user.email}</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                {isEditing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="Tell other golfers about yourself..."
                  />
                ) : (
                  <p className="text-white">{profile?.bio || 'No bio yet'}</p>
                )}
              </div>
            </div>

            {/* Golf Information */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Flag className="h-5 w-5 mr-2 text-emerald-400" />
                Golf Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Handicap</label>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={formData.handicap || ''}
                      onChange={(e) => handleInputChange('handicap', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="Enter your handicap"
                    />
                  ) : (
                    <p className="text-white">{profile?.handicap ? profile.handicap : 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Years Playing</label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.years_playing || ''}
                      onChange={(e) => handleInputChange('years_playing', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="How many years?"
                    />
                  ) : (
                    <p className="text-white">{profile?.years_playing ? `${profile.years_playing} years` : 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Home Club</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.home_club}
                      onChange={(e) => handleInputChange('home_club', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="Your home golf club"
                    />
                  ) : (
                    <p className="text-white">{profile?.home_club || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Favorite Course</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.favorite_course}
                      onChange={(e) => handleInputChange('favorite_course', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="Your favorite golf course"
                    />
                  ) : (
                    <p className="text-white">{profile?.favorite_course || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Playing Style</label>
                  {isEditing ? (
                    <select
                      value={formData.playing_style}
                      onChange={(e) => handleInputChange('playing_style', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white transition-all duration-300"
                    >
                      <option value="">Select playing style</option>
                      <option value="competitive">Competitive</option>
                      <option value="casual">Casual</option>
                      <option value="social">Social</option>
                      <option value="beginner">Beginner</option>
                      <option value="professional">Professional</option>
                    </select>
                  ) : (
                    <p className="text-white">{profile?.playing_style || 'Not set'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="Enter your city/area"
                    />
                  ) : (
                    <p className="text-white">{profile?.location || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Golf Goals</label>
                {isEditing ? (
                  <textarea
                    value={formData.goals}
                    onChange={(e) => handleInputChange('goals', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="What are your golf goals and aspirations?"
                  />
                ) : (
                  <p className="text-white">{profile?.goals || 'No goals set yet'}</p>
                )}
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
                  <span className="text-white font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Best Score</span>
                  <span className="text-white font-semibold">--</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Average Score</span>
                  <span className="text-white font-semibold">--</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Birdies</span>
                  <span className="text-white font-semibold">0</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-emerald-400" />
                Recent Activity
              </h3>
              <div className="space-y-3 text-sm">
                <div className="text-gray-400">
                  <p>No recent activity</p>
                  <p className="text-xs mt-1">Start playing to see your stats!</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-emerald-400" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors duration-300">
                  Post Tee Time
                </button>
                <button className="w-full bg-gray-600/20 text-gray-300 border border-gray-600/30 px-4 py-2 rounded-lg hover:bg-gray-600/30 transition-colors duration-300">
                  View Connections
                </button>
                <button className="w-full bg-gray-600/20 text-gray-300 border border-gray-600/30 px-4 py-2 rounded-lg hover:bg-gray-600/30 transition-colors duration-300">
                  Privacy Settings
                </button>
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
        <SimpleQRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  )
}
