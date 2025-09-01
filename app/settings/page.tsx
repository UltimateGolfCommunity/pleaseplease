'use client'

import { useState, useEffect } from 'react'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Smartphone, 
  Save,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import GolfGrassFooter from '@/components/GolfGrassFooter'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  
  // Profile settings
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    bio: '',
    handicap: 15,
    location: 'San Francisco, CA'
  })
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    marketing: false
  })
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showHandicap: true,
    showLocation: false,
    allowMessages: true
  })
  
  // Appearance settings
  const [theme, setTheme] = useState('auto')
  const [language, setLanguage] = useState('en')
  
  // Preferences
  const [preferences, setPreferences] = useState({
    timezone: 'utc-8',
    dateFormat: 'mm-dd-yyyy',
    units: 'imperial'
  })

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings?userId=user-123')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile || profile)
        setNotifications(data.notifications || notifications)
        setPrivacy(data.privacy || privacy)
        setTheme(data.appearance?.theme || theme)
        setLanguage(data.appearance?.language || language)
        setPreferences(data.preferences || preferences)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handlePreferenceChange = (field: string, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handlePasswordChange = async () => {
    setPasswordError('')
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      return
    }
    
    try {
      // Here you would typically update the password via API
      // For now, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordForm(false)
      setPasswordError('')
      
      // Show success message
      alert('Password updated successfully!')
    } catch (error) {
      setPasswordError('Failed to update password. Please try again.')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const settingsData = {
        profile,
        notifications,
        privacy,
        appearance: { theme, language },
        preferences
      }
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-123',
          settings: settingsData
        })
      })
      
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="p-2 text-slate-600 hover:text-slate-800 transition-colors rounded-lg hover:bg-slate-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <span className="text-xl font-bold text-slate-800">Settings</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-slate-600 text-lg">Loading your settings...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/40">
              <nav className="space-y-2">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'notifications', label: 'Notifications', icon: Bell },
                  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
                  { id: 'appearance', label: 'Appearance', icon: Palette },
                  { id: 'preferences', label: 'Preferences', icon: Globe }
                ].map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100/50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-6">
                  Profile Settings
                </h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                       <input
                         type="text"
                         value={profile.firstName}
                         onChange={(e) => handleProfileChange('firstName', e.target.value)}
                         className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                       <input
                         type="text"
                         value={profile.lastName}
                         onChange={(e) => handleProfileChange('lastName', e.target.value)}
                         className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                     <input
                       type="email"
                       value={profile.email}
                       onChange={(e) => handleProfileChange('email', e.target.value)}
                       className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                     <textarea
                       rows={3}
                       placeholder="Tell us about yourself..."
                       value={profile.bio}
                       onChange={(e) => handleProfileChange('bio', e.target.value)}
                       className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
                     />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Handicap</label>
                       <input
                         type="number"
                         value={profile.handicap}
                         onChange={(e) => handleProfileChange('handicap', parseInt(e.target.value) || 0)}
                         className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                       <input
                         type="text"
                         placeholder="City, State"
                         value={profile.location}
                         onChange={(e) => handleProfileChange('location', e.target.value)}
                         className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
                       />
                     </div>
                   </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-6">
                  Notification Preferences
                </h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                        <div className="flex items-center space-x-3">
                          <Bell className="h-5 w-5 text-emerald-500" />
                          <div>
                            <h3 className="font-medium text-slate-800 capitalize">
                              {key === 'email' ? 'Email Notifications' : 
                               key === 'push' ? 'Push Notifications' :
                               key === 'sms' ? 'SMS Notifications' :
                               'Marketing Communications'}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {key === 'email' ? 'Receive updates via email' :
                               key === 'push' ? 'Get notified on your device' :
                               key === 'sms' ? 'Receive text message alerts' :
                               'Receive promotional content and offers'}
                            </p>
                          </div>
                        </div>
                                                 <button
                           onClick={() => handleNotificationChange(key, !value)}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                             value ? 'bg-emerald-500' : 'bg-slate-300'
                           }`}
                         >
                           <span
                             className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                               value ? 'translate-x-6' : 'translate-x-1'
                             }`}
                           />
                         </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Privacy & Security */}
            {activeTab === 'privacy' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-6">
                  Privacy & Security
                </h2>
                <div className="space-y-6">
                  <div className="space-y-4">
                    {Object.entries(privacy).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                        <div className="flex items-center space-x-3">
                          <Shield className="h-5 w-5 text-blue-500" />
                          <div>
                            <h3 className="font-medium text-slate-800">
                              {key === 'profileVisible' ? 'Profile Visibility' :
                               key === 'showHandicap' ? 'Show Handicap' :
                               key === 'showLocation' ? 'Show Location' :
                               'Allow Messages'}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {key === 'profileVisible' ? 'Make your profile visible to other golfers' :
                               key === 'showHandicap' ? 'Display your handicap on your profile' :
                               key === 'showLocation' ? 'Show your location to other users' :
                               'Allow other users to send you messages'}
                            </p>
                          </div>
                        </div>
                                                 <button
                           onClick={() => handlePrivacyChange(key, !value)}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                             value ? 'bg-emerald-500' : 'bg-slate-300'
                           }`}
                         >
                           <span
                             className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                               value ? 'translate-x-6' : 'translate-x-1'
                             }`}
                           />
                         </button>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Account Security</h3>
                    <div className="space-y-3">
                                             <button 
                         onClick={() => setShowPasswordForm(!showPasswordForm)}
                         className="w-full text-left p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 hover:bg-slate-100/50 transition-colors"
                       >
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                             <Shield className="h-5 w-5 text-red-500" />
                             <span className="font-medium text-slate-800">Change Password</span>
                           </div>
                           <span className="text-sm text-slate-500">Last changed 30 days ago</span>
                         </div>
                       </button>
                       
                                                {showPasswordForm && (
                           <div className="mt-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
                             <div className="space-y-3">
                               {passwordError && (
                                 <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                   <p className="text-red-600 text-sm">{passwordError}</p>
                                 </div>
                               )}
                               <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                 <input
                                   type="password"
                                   value={passwordData.currentPassword}
                                   onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                   placeholder="Enter current password"
                                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                 />
                               </div>
                               <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                 <input
                                   type="password"
                                   value={passwordData.newPassword}
                                   onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                   placeholder="Enter new password"
                                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                 />
                               </div>
                               <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                 <input
                                   type="password"
                                   value={passwordData.confirmPassword}
                                   onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                   placeholder="Confirm new password"
                                   className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                 />
                               </div>
                               <div className="flex space-x-2">
                                 <button 
                                   onClick={handlePasswordChange}
                                   className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                 >
                                   Update Password
                                 </button>
                                 <button 
                                   onClick={() => {
                                     setShowPasswordForm(false)
                                     setPasswordData({
                                       currentPassword: '',
                                       newPassword: '',
                                       confirmPassword: ''
                                     })
                                     setPasswordError('')
                                   }}
                                   className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                 >
                                   Cancel
                                 </button>
                               </div>
                             </div>
                           </div>
                         )}
                      <button className="w-full text-left p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 hover:bg-slate-100/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="h-5 w-5 text-purple-500" />
                            <span className="font-medium text-slate-800">Two-Factor Authentication</span>
                          </div>
                          <span className="text-sm text-emerald-600 font-medium">Enabled</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === 'appearance' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-6">
                  Appearance
                </h2>
                <div className="space-y-6">
                  <div>
                                         <label className="block text-sm font-medium text-slate-700 mb-3">Theme</label>
                     <div className="grid grid-cols-3 gap-3">
                       {['light', 'dark', 'auto'].map((option) => (
                         <button
                           key={option}
                           onClick={() => {
                             setTheme(option)
                             setSaved(false)
                           }}
                           className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                             theme === option
                               ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                               : 'border-slate-200 bg-white hover:border-slate-300'
                           }`}
                         >
                           <div className="text-center">
                             <div className="text-lg font-medium capitalize">{option}</div>
                             <div className="text-sm text-slate-500">
                               {option === 'auto' ? 'System' : option === 'light' ? 'Light' : 'Dark'}
                             </div>
                           </div>
                         </button>
                       ))}
                     </div>
                     <p className="text-sm text-slate-500 mt-2">
                       Theme changes will be applied immediately. Choose "Auto" to follow your system preference.
                     </p>
                  </div>
                                       <div>
                       <label className="block text-sm font-medium text-slate-700 mb-3">Language</label>
                       <select
                         value={language}
                         onChange={(e) => {
                           setLanguage(e.target.value)
                           setSaved(false)
                         }}
                         className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
                       >
                         <option value="en">English</option>
                         <option value="es">Español</option>
                         <option value="fr">Français</option>
                         <option value="de">Deutsch</option>
                       </select>
                     </div>
                </div>
              </div>
            )}

            {/* Preferences */}
            {activeTab === 'preferences' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/40">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent mb-6">
                  Preferences
                </h2>
                <div className="space-y-6">
                                     <div>
                     <label className="block text-sm font-medium text-slate-700 mb-3">Time Zone</label>
                     <select 
                       value={preferences.timezone}
                       onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                       className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
                     >
                       <option value="utc-8">Pacific Time (UTC-8)</option>
                       <option value="utc-7">Mountain Time (UTC-7)</option>
                       <option value="utc-6">Central Time (UTC-6)</option>
                       <option value="utc-5">Eastern Time (UTC-5)</option>
                       <option value="utc+0">UTC</option>
                       <option value="utc+1">Central European Time (UTC+1)</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-3">Date Format</label>
                     <select 
                       value={preferences.dateFormat}
                       onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                       className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/80"
                     >
                       <option value="mm-dd-yyyy">MM/DD/YYYY</option>
                       <option value="dd-mm-yyyy">DD/MM/YYYY</option>
                       <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-slate-700 mb-3">Units</label>
                     <div className="grid grid-cols-2 gap-3">
                       <button 
                         onClick={() => handlePreferenceChange('units', 'imperial')}
                         className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                           preferences.units === 'imperial'
                             ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                             : 'border-slate-200 bg-white hover:border-slate-300'
                         }`}
                       >
                         <div className="text-center">
                           <div className="text-lg font-medium">Imperial</div>
                           <div className="text-sm">Miles, Yards, Fahrenheit</div>
                         </div>
                       </button>
                       <button 
                         onClick={() => handlePreferenceChange('units', 'metric')}
                         className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                           preferences.units === 'metric'
                             ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                             : 'border-slate-200 bg-white hover:border-slate-300'
                         }`}
                       >
                         <div className="text-center">
                           <div className="text-lg font-medium">Metric</div>
                           <div className="text-sm">Kilometers, Meters, Celsius</div>
                         </div>
                       </button>
                     </div>
                   </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Reset to default values
                    setProfile({
                      firstName: 'John',
                      lastName: 'Doe',
                      email: 'john.doe@example.com',
                      bio: '',
                      handicap: 15,
                      location: 'San Francisco, CA'
                    })
                    setNotifications({
                      email: true,
                      push: false,
                      sms: false,
                      marketing: false
                    })
                    setPrivacy({
                      profileVisible: true,
                      showHandicap: true,
                      showLocation: false,
                      allowMessages: true
                    })
                    setTheme('auto')
                    setLanguage('en')
                    setPreferences({
                      timezone: 'utc-8',
                      dateFormat: 'mm-dd-yyyy',
                      units: 'imperial'
                    })
                    setSaved(false)
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  Reset to Defaults
                </button>
                <button
                  onClick={() => {
                    // Export settings as JSON
                    const settingsData = {
                      profile,
                      notifications,
                      privacy,
                      theme,
                      language,
                      preferences,
                      exportedAt: new Date().toISOString()
                    }
                    const blob = new Blob([JSON.stringify(settingsData, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'golf-community-settings.json'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Export Settings
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                {saved && (
                  <div className="flex items-center space-x-2 text-emerald-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Settings saved successfully!</span>
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2 disabled:transform-none"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
      
      {/* Golf Grass Footer */}
      <GolfGrassFooter />
    </div>
  )
}
