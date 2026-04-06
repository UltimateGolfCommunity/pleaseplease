'use client'

import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { uploadGroupLogo } from '@/lib/group-logo-upload'
import { uploadGroupImage } from '@/lib/group-image-upload'
import GroupChatModal from '@/app/components/GroupChatModal'
import InviteMembersModal from '@/app/components/InviteMembersModal'
import { 
  ArrowLeft,
  Users,
  MapPin,
  Calendar,
  MessageCircle,
  Camera,
  Upload,
  Trophy,
  Plus,
  UserPlus,
  Sparkles
} from 'lucide-react'

export default function GroupDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient()
  
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingHeader, setUploadingHeader] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showLogRoundModal, setShowLogRoundModal] = useState(false)
  const [showGroupChat, setShowGroupChat] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
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

  const founder = useMemo(
    () => members.find((member) => member.role === 'admin' || member.role === 'owner') || members[0],
    [members]
  )

  const locationLabel = group?.location || founder?.user_profiles?.location || 'Online and local golfers'

  const fetchGroupDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/groups/${groupId}`, { cache: 'no-store' })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to load group')
      }

      setGroup(data.group)
      setMembers(data.members || [])
    } catch (error) {
      console.error('Error fetching group details:', error)
      setGroup(null)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !group) return

    setUploadingImage(true)
    try {
      const result = await uploadGroupImage(file, group.id, 'profile')
      
      if (result.success) {
        setGroup((prev: any) => prev ? { ...prev, image_url: result.imageUrl } : null)
        alert('Group profile image uploaded successfully!')
      } else {
        alert(`Failed to upload image: ${result.error}`)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleHeaderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !group) return

    setUploadingHeader(true)
    try {
      const result = await uploadGroupImage(file, group.id, 'header')
      
      if (result.success) {
        setGroup((prev: any) => prev ? { ...prev, header_image_url: result.imageUrl } : null)
        alert('Group header image uploaded successfully!')
      } else {
        alert(`Failed to upload header: ${result.error}`)
      }
    } catch (error) {
      console.error('Error uploading header:', error)
      alert('Failed to upload header image')
    } finally {
      setUploadingHeader(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !group) return

    setUploadingLogo(true)
    try {
      const result = await uploadGroupLogo(file, group.id)
      
      if (result.success) {
        // Update local state with new logo URL
        setGroup((prev: any) => prev ? { ...prev, logo_url: result.logoUrl } : null)
        alert('Group logo uploaded successfully!')
      } else {
        alert(`Failed to upload logo: ${result.error}`)
      }
    } catch (error) {
      console.error('Error uploading group logo:', error)
      alert('Failed to upload group logo')
    } finally {
      setUploadingLogo(false)
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(24,111,76,0.26),transparent_28%),linear-gradient(180deg,#07140f,#0d1f18_44%,#09130f)] text-white">
      {/* Navigation */}
      <div className="sticky top-0 z-40 border-b border-white/8 bg-[#07140f]/82 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="flex items-center space-x-2 text-white/66 transition-colors hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => document.getElementById('group-header-upload')?.click()}
                disabled={uploadingHeader}
                className="hidden rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50 md:flex md:items-center md:space-x-2"
              >
                {uploadingHeader ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span>{uploadingHeader ? 'Uploading...' : 'Header'}</span>
              </button>
              <input
                id="group-header-upload"
                type="file"
                accept="image/*"
                onChange={handleHeaderUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(12,33,25,0.96),rgba(8,21,16,0.98))] p-6 shadow-2xl shadow-black/25 sm:p-8">
          {group?.header_image_url && (
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <img
                src={group.header_image_url}
                alt={`${group.name} header`}
                className="w-full h-full object-cover opacity-18"
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,20,15,0.92),rgba(7,20,15,0.62),rgba(7,20,15,0.9))]"></div>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.18),transparent_55%)]" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="flex flex-wrap items-start gap-5">
                <div className="relative">
                  <div className="h-28 w-28 overflow-hidden rounded-[1.75rem] border border-white/14 bg-white/8 shadow-xl">
                    {group.image_url ? (
                      <img src={group.image_url} alt={group.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(16,185,129,0.32),rgba(59,130,246,0.22))]">
                        <Users className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => document.getElementById('group-image-upload')?.click()}
                    disabled={uploadingImage}
                    className="absolute -bottom-2 -right-2 rounded-full border border-white/14 bg-white px-3 py-3 text-slate-950 transition hover:bg-emerald-100 disabled:opacity-60"
                  >
                    {uploadingImage ? <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-900"></div> : <Camera className="h-4 w-4" />}
                  </button>
                  <input
                    id="group-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100/85">
                      Group Community
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/60">
                      Created {new Date(group.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
                    {group.name}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
                    {group.description || 'A place for golfers to coordinate tee times, talk strategy, and keep the group active between rounds.'}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowGroupChat(true)}
                      className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-100"
                    >
                      Open Message Board
                    </button>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      Invite Members
                    </button>
                    <button
                      onClick={() => setShowLogRoundModal(true)}
                      className="rounded-full border border-emerald-400/16 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/18"
                    >
                      Log Round
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Members</p>
                <p className="mt-3 text-3xl font-semibold text-white">{members.length}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Based In</p>
                <p className="mt-3 text-lg font-semibold text-white">{locationLabel}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Founder</p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {founder?.user_profiles?.first_name
                    ? `${founder.user_profiles.first_name} ${founder.user_profiles.last_name || ''}`.trim()
                    : 'Community host'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Community Members</h2>
                <p className="mt-2 text-sm leading-7 text-white/60">
                  See who is in the room, who is local, and who you can coordinate rounds with next.
                </p>
              </div>
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 md:block">
                {members.length} golfers
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-[1.4rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-5 transition hover:border-white/18 hover:bg-white/9"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/8">
                      <img
                        src={member.user_profiles?.avatar_url || '/default-avatar.svg'}
                        alt={`${member.user_profiles?.first_name} ${member.user_profiles?.last_name}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.svg'
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-white">
                        {member.user_profiles?.first_name} {member.user_profiles?.last_name}
                      </h3>
                      <p className="truncate text-sm text-white/48">@{member.user_profiles?.username || 'member'}</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-white/65">
                    {member.user_profiles?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-300" />
                        <span>{member.user_profiles.location}</span>
                      </div>
                    )}
                    {member.user_profiles?.handicap && (
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-300" />
                        <span>Handicap {member.user_profiles.handicap}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-sky-300" />
                      <span className="capitalize">{member.role || 'member'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white">Keep The Group Moving</h3>
              <p className="mt-3 text-sm leading-7 text-white/62">
                Use the message board for updates, post group tee times from the dashboard, and invite more golfers when the community needs fresh energy.
              </p>
              <div className="mt-5 space-y-3">
                <button
                  onClick={() => setShowGroupChat(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <span>Open group board</span>
                  <MessageCircle className="h-4 w-4 text-emerald-300" />
                </button>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <span>Invite new members</span>
                  <UserPlus className="h-4 w-4 text-sky-300" />
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <span>Post a tee time</span>
                  <Plus className="h-4 w-4 text-amber-300" />
                </button>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/8">
                    {group.logo_url ? (
                      <img src={group.logo_url} alt={`${group.name} logo`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(250,204,21,0.22),rgba(249,115,22,0.22))]">
                        <Trophy className="h-8 w-8 text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => document.getElementById('group-logo-upload')?.click()}
                    disabled={uploadingLogo}
                    className="absolute -bottom-2 -right-2 rounded-full border border-white/12 bg-white px-2.5 py-2.5 text-slate-950 transition hover:bg-amber-100 disabled:opacity-60"
                  >
                    {uploadingLogo ? <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-900"></div> : <Upload className="h-4 w-4" />}
                  </button>
                  <input
                    id="group-logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/42">Branding</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Group visuals</h3>
                  <p className="mt-2 text-sm leading-6 text-white/58">
                    Update the logo or header to make this community feel more intentional.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {members.length === 0 && (
        <div className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-8 text-center text-white/65 backdrop-blur-sm">
            <Users className="mx-auto h-10 w-10 text-white/35" />
            <p className="mt-4">This group is ready for its first members.</p>
          </div>
        </div>
      )}

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

      {/* Group Chat Modal */}
      {group && user && (
        <GroupChatModal
          isOpen={showGroupChat}
          onClose={() => setShowGroupChat(false)}
          groupId={group.id}
          groupName={group.name}
          userId={user.id}
        />
      )}

      {/* Invite Members Modal */}
      {group && user && (
        <InviteMembersModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          groupId={group.id}
          groupName={group.name}
          userId={user.id}
        />
      )}
    </div>
  )
}
