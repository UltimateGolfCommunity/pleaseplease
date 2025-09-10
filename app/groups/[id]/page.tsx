'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { 
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  MessageCircle,
  Settings,
  Camera,
  Upload,
  Star,
  Trophy,
  Clock,
  Target,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Share2
} from 'lucide-react'

export default function GroupDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user, profile } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()
  
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showLogRoundModal, setShowLogRoundModal] = useState(false)
  const [groupId, setGroupId] = useState<string>('')
  
  // Log round form state
  const [roundForm, setRoundForm] = useState({
    course: '',
    date: '',
    score: '',
    par: '',
    handicap: '',
    notes: ''
  })

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setGroupId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (groupId) {
      fetchGroupDetails()
    }
  }, [groupId])

  const fetchGroupDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('golf_groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) throw groupError

      // Fetch group members with their profiles
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          user_profiles (
            id,
            first_name,
            last_name,
            username,
            avatar_url,
            location,
            handicap,
            home_club,
            favorite_course
          )
        `)
        .eq('group_id', groupId)

      if (membersError) throw membersError

      setGroup(groupData)
      setMembers(membersData || [])
    } catch (error) {
      console.error('Error fetching group details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !group) return

    setUploadingImage(true)
    try {
      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${group.id}-${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('group-images')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('group-images')
        .getPublicUrl(fileName)

      // Update group with new image URL
      const { error: updateError } = await supabase
        .from('golf_groups')
        .update({ image_url: publicUrl })
        .eq('id', group.id)

      if (updateError) throw updateError

      setGroup({ ...group, image_url: publicUrl })
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleLogRound = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !group) return

    try {
      const { error } = await supabase
        .from('golf_rounds')
        .insert({
          user_id: user.id,
          group_id: group.id,
          course: roundForm.course,
          date: roundForm.date,
          score: parseInt(roundForm.score),
          par: parseInt(roundForm.par),
          handicap: parseFloat(roundForm.handicap),
          notes: roundForm.notes,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      // Reset form and close modal
      setRoundForm({
        course: '',
        date: '',
        score: '',
        par: '',
        handicap: '',
        notes: ''
      })
      setShowLogRoundModal(false)
      alert('Round logged successfully!')
    } catch (error) {
      console.error('Error logging round:', error)
      alert('Failed to log round')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Group Not Found</h1>
          <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
              <button className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-4 py-2 rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Group Header */}
        <div className="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8 shadow-2xl overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 rounded-full translate-y-8 -translate-x-8"></div>
          
          <div className="relative">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Group Image */}
              <div className="flex-shrink-0">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-blue-500/30 shadow-2xl">
                    {group.image_url ? (
                      <img
                        src={group.image_url}
                        alt={group.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Users className="h-16 w-16 text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => document.getElementById('group-image-upload')?.click()}
                    disabled={uploadingImage}
                    className="absolute -bottom-2 -right-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-500 disabled:to-slate-600 text-white p-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:cursor-not-allowed"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </button>
                  <input
                    id="group-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Group Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-4">{group.name}</h1>
                <p className="text-slate-300 text-lg mb-6 leading-relaxed">{group.description}</p>
                
                <div className="flex flex-wrap gap-6 mb-6">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Users className="h-5 w-5 text-blue-400" />
                    <span className="font-medium">{members.length} members</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Calendar className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium">Created {new Date(group.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => setShowLogRoundModal(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Log Your Round</span>
                  </button>
                  <button
                    onClick={() => setShowMemberModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>Invite Members</span>
                  </button>
                  <button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Group Chat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="relative bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8 shadow-2xl overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
              <div className="p-3 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-xl mr-4">
                <Users className="h-6 w-6 text-emerald-400" />
              </div>
              Group Members
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <div key={member.id} className="group bg-slate-800/50 rounded-2xl p-6 border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-emerald-500/30 group-hover:border-emerald-400/60 transition-all duration-300">
                        <img
                          src={member.user_profiles?.avatar_url || '/default-avatar.svg'}
                          alt={`${member.user_profiles?.first_name} ${member.user_profiles?.last_name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = '/default-avatar.svg'
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">
                        {member.user_profiles?.first_name} {member.user_profiles?.last_name}
                      </h3>
                      <p className="text-slate-400 text-sm">@{member.user_profiles?.username}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {member.user_profiles?.location && (
                      <div className="flex items-center space-x-2 text-slate-300">
                        <MapPin className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium">{member.user_profiles.location}</span>
                      </div>
                    )}
                    {member.user_profiles?.handicap && (
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Trophy className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium">Handicap: {member.user_profiles.handicap}</span>
                      </div>
                    )}
                    {member.user_profiles?.home_club && (
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Target className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium">Home: {member.user_profiles.home_club}</span>
                      </div>
                    )}
                    {member.user_profiles?.favorite_course && (
                      <div className="flex items-center space-x-2 text-slate-300">
                        <Star className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium">Favorite: {member.user_profiles.favorite_course}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Log Round Modal */}
      {showLogRoundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Log Your Round</h3>
            <form onSubmit={handleLogRound} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Course</label>
                <input
                  type="text"
                  value={roundForm.course}
                  onChange={(e) => setRoundForm({ ...roundForm, course: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="Enter course name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Date</label>
                <input
                  type="date"
                  value={roundForm.date}
                  onChange={(e) => setRoundForm({ ...roundForm, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Score</label>
                  <input
                    type="number"
                    value={roundForm.score}
                    onChange={(e) => setRoundForm({ ...roundForm, score: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="85"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Par</label>
                  <input
                    type="number"
                    value={roundForm.par}
                    onChange={(e) => setRoundForm({ ...roundForm, par: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                    placeholder="72"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Handicap Used</label>
                <input
                  type="number"
                  step="0.1"
                  value={roundForm.handicap}
                  onChange={(e) => setRoundForm({ ...roundForm, handicap: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="12.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
                <textarea
                  value={roundForm.notes}
                  onChange={(e) => setRoundForm({ ...roundForm, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 text-white placeholder-gray-400 transition-all duration-300"
                  placeholder="How was your round?"
                  rows={3}
                />
              </div>
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLogRoundModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-xl transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-3 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                >
                  Log Round
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
