import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as Sharing from 'expo-sharing'
import Ionicons from '@expo/vector-icons/Ionicons'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import ViewShot from 'react-native-view-shot'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { Avatar } from '@/components/Avatar'
import { PrimaryButton } from '@/components/PrimaryButton'
import { apiGet, apiPost } from '@/lib/api'
import { getShareableGroupLink, mobileSupabase, uploadImageToStorage } from '@/lib/supabase'
import { palette } from '@/lib/theme'
import { useAuth } from '@/providers/AuthProvider'

type GroupDetail = {
  id: string
  name: string
  description?: string | null
  slogan?: string | null
  location?: string | null
  group_type?: string | null
  logo_url?: string | null
  image_url?: string | null
  header_image_url?: string | null
  creator_id?: string | null
  is_private?: boolean | null
  tournament_date?: string | null
  tournament_end_date?: string | null
  tournament_format?: string | null
  tournament_type?: string | null
  tournament_matchups?: string | null
}

type Member = {
  id: string
  user_id?: string
  role?: string | null
  user_profiles?: {
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
    location?: string | null
    handicap?: number | null
  } | null
}

type GroupMessage = {
  id: string
  message_content?: string
  created_at?: string
  like_count?: number
  liked_by_user?: boolean
  parent_message_id?: string | null
  replies?: GroupMessage[]
  user_profiles?: {
    id?: string
    first_name?: string | null
    last_name?: string | null
    username?: string | null
    avatar_url?: string | null
    location?: string | null
  } | null
}

type GroupPostPhoto = Pick<ImagePicker.ImagePickerAsset, 'uri' | 'fileName' | 'mimeType'>

const GROUP_POST_PHOTO_PREFIX = '[[ugc-photo:'
const TOURNAMENT_UPDATE_POST_PREFIX = '[[ugc-tournament-update:'

function unpackGroupPost(value?: string) {
  const content = value || ''
  if (content.startsWith(TOURNAMENT_UPDATE_POST_PREFIX)) {
    const end = content.indexOf(']]')
    const kind = content.slice(TOURNAMENT_UPDATE_POST_PREFIX.length, end < 0 ? undefined : end).trim()
    return { text: end < 0 ? content : content.slice(end + 2).trim(), imageUrl: null as string | null, tournamentUpdate: kind || null }
  }
  if (!content.startsWith(GROUP_POST_PHOTO_PREFIX)) return { text: content, imageUrl: null as string | null, tournamentUpdate: null as string | null }
  const end = content.indexOf(']]')
  if (end < 0) return { text: content, imageUrl: null as string | null, tournamentUpdate: null as string | null }
  const imageUrl = content.slice(GROUP_POST_PHOTO_PREFIX.length, end).trim()
  return { imageUrl: imageUrl || null, text: content.slice(end + 2).trim(), tournamentUpdate: null as string | null }
}

type UserCard = {
  id: string
  first_name?: string | null
  last_name?: string | null
  username?: string | null
  avatar_url?: string | null
  location?: string | null
  handicap?: number | null
}

type ConnectionRecord = {
  id: string
  requester_id?: string
  recipient_id?: string
  requester?: UserCard | null
  recipient?: UserCard | null
}

type GroupActivity = {
  id: string
  title?: string
  description?: string | null
  created_at?: string
  actor?: {
    first_name?: string | null
    username?: string | null
    avatar_url?: string | null
  } | null
}

type TournamentScore = {
  id: string
  total_score: number
  score_label?: string | null
  user_id: string
  user_profiles?: UserCard | null
}

const dateFromIso = (value?: string | null) => {
  if (!value) return new Date()
  const [year, month, day] = value.split('-').map(Number)
  return Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)
    ? new Date(year, month - 1, day)
    : new Date()
}

const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const readableDate = (value?: string | null) => value
  ? dateFromIso(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  : 'Select date'

type TournamentMatchup = {
  id: string
  leftUserId: string
  rightUserId: string
  leftPartnerUserId?: string | null
  rightPartnerUserId?: string | null
  format?: string
  day?: string | null
  courseName?: string | null
  teeTime?: string | null
  throughHole?: number | null
  leftScore?: number | null
  rightScore?: number | null
  holeWinners?: Record<string, 'left' | 'right' | 'halve'>
  leftHoleScores?: Record<string, number>
  rightHoleScores?: Record<string, number>
}

const isTournamentMatchComplete = (matchup: TournamentMatchup) => {
  const format = (matchup.format || '').toLowerCase()
  const allHolesRecorded = (scores?: Record<string, unknown>) =>
    Array.from({ length: 18 }, (_, index) => String(index + 1)).every((hole) => scores?.[hole] !== undefined && scores?.[hole] !== null)

  if (format.includes('match play')) return allHolesRecorded(matchup.holeWinners)
  if (['scramble', 'best ball', 'alternate shot'].includes(format)) {
    return allHolesRecorded(matchup.leftHoleScores) && allHolesRecorded(matchup.rightHoleScores)
  }

  // Individual stroke-play matchups currently use final totals rather than
  // hole-by-hole entry, so both recorded totals are the completed card.
  return matchup.leftScore !== null && matchup.leftScore !== undefined && matchup.rightScore !== null && matchup.rightScore !== undefined
}

type TournamentTeam = {
  id: string
  name: string
  logoUrl?: string | null
  memberIds: string[]
}

type ManualTournamentParticipant = {
  id: string
  name: string
  avatarUrl?: string | null
  handicap?: number | null
}

type ClosestToPinDay = {
  day: string
  distances: string[]
  holeNumbers?: string[]
  courseName?: string
}

type ClosestToPinSetup = {
  par3Count: number
  distances: string[]
  holeNumbers?: string[]
  courseName?: string
  multipleDays: boolean
  days?: ClosestToPinDay[]
}

type TournamentSetup = {
  matchups: TournamentMatchup[]
  teams: TournamentTeam[]
  manualParticipants: ManualTournamentParticipant[]
  closestToPin?: boolean
  closestToPinSetup?: ClosestToPinSetup
  closestToPinWinners?: Record<string, string>
  longestDrive?: boolean
}

function parseTournamentMatchups(value?: string | null): TournamentMatchup[] {
  return parseTournamentSetup(value).matchups
}

function parseTournamentSetup(value?: string | null): TournamentSetup {
  const empty = { matchups: [], teams: [], manualParticipants: [], closestToPin: false, closestToPinSetup: { par3Count: 1, distances: [''], holeNumbers: ['1'], courseName: '', multipleDays: false }, closestToPinWinners: {}, longestDrive: false } as TournamentSetup
  if (!value) return empty
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return { ...empty, matchups: parsed.filter((matchup) => matchup?.leftUserId && matchup?.rightUserId) }
    return {
      matchups: Array.isArray(parsed?.matchups) ? parsed.matchups.filter((matchup: TournamentMatchup) => matchup?.leftUserId && matchup?.rightUserId) : [],
      teams: Array.isArray(parsed?.teams) ? parsed.teams.filter((team: TournamentTeam) => team?.id) : [],
      manualParticipants: Array.isArray(parsed?.manualParticipants) ? parsed.manualParticipants.filter((participant: ManualTournamentParticipant) => participant?.id && participant?.name) : [],
      closestToPin: Boolean(parsed?.closestToPin),
      closestToPinSetup: {
        par3Count: Math.max(1, Number(parsed?.closestToPinSetup?.par3Count) || 1),
        distances: Array.isArray(parsed?.closestToPinSetup?.distances) ? parsed.closestToPinSetup.distances : [''],
        holeNumbers: Array.isArray(parsed?.closestToPinSetup?.holeNumbers) ? parsed.closestToPinSetup.holeNumbers : [],
        courseName: typeof parsed?.closestToPinSetup?.courseName === 'string' ? parsed.closestToPinSetup.courseName : '',
        multipleDays: Boolean(parsed?.closestToPinSetup?.multipleDays),
        days: Array.isArray(parsed?.closestToPinSetup?.days)
          ? parsed.closestToPinSetup.days.filter((item: ClosestToPinDay) => item?.day && Array.isArray(item.distances)).map((item: ClosestToPinDay) => ({ day: item.day, distances: item.distances, holeNumbers: Array.isArray(item.holeNumbers) ? item.holeNumbers : [], courseName: typeof item.courseName === 'string' ? item.courseName : '' }))
          : []
      },
      closestToPinWinners: parsed?.closestToPinWinners && typeof parsed.closestToPinWinners === 'object' ? parsed.closestToPinWinners : {},
      longestDrive: Boolean(parsed?.longestDrive)
    }
  } catch {
    return empty
  }
}

function getTournamentDays(start?: string | null, end?: string | null) {
  if (!start) return []
  const first = new Date(`${start}T12:00:00`)
  const last = new Date(`${end || start}T12:00:00`)
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()) || last < first) return [start]
  const days: string[] = []
  for (let cursor = new Date(first); cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
    days.push(cursor.toISOString().slice(0, 10))
  }
  return days.slice(0, 31)
}

function getAdjustedTournamentScore(score?: number | null, handicap?: number | null) {
  if (score === null || score === undefined || !Number.isFinite(score)) return null
  const numericHandicap = Number(handicap)
  const adjusted = score - (Number.isFinite(numericHandicap) ? numericHandicap : 0)
  return Math.round(adjusted * 10) / 10
}

export default function GroupScreen() {
  const { loading, user } = useAuth()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState(true)
  const [joining, setJoining] = useState(false)
  const [posting, setPosting] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [pendingInviteUserIds, setPendingInviteUserIds] = useState<Set<string>>(new Set())
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingMatchups, setIsEditingMatchups] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const qrCardRef = useRef<ViewShot>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [pendingMembers, setPendingMembers] = useState<Member[]>([])
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [groupFeed, setGroupFeed] = useState<GroupActivity[]>([])
  const [connections, setConnections] = useState<ConnectionRecord[]>([])
  const [tournamentScores, setTournamentScores] = useState<TournamentScore[]>([])
  const [scoreDraft, setScoreDraft] = useState('')
  const [scoreSaving, setScoreSaving] = useState(false)
  const [savingMatchupId, setSavingMatchupId] = useState<string | null>(null)
  const [isEditingMatchupScores, setIsEditingMatchupScores] = useState(false)
  const [scorecardMatchupId, setScorecardMatchupId] = useState<string | null>(null)
  const [matchupSettingsId, setMatchupSettingsId] = useState<string | null>(null)
  const [matchups, setMatchups] = useState<TournamentMatchup[]>([])
  const [leftMatchupUserId, setLeftMatchupUserId] = useState('')
  const [rightMatchupUserId, setRightMatchupUserId] = useState('')
  const [leftPartnerUserId, setLeftPartnerUserId] = useState('')
  const [rightPartnerUserId, setRightPartnerUserId] = useState('')
  const [matchupFormat, setMatchupFormat] = useState('Match Play')
  const [matchupDay, setMatchupDay] = useState('')
  const [matchupCourseName, setMatchupCourseName] = useState('')
  const [matchupTeeTime, setMatchupTeeTime] = useState('')
  const [teams, setTeams] = useState<TournamentTeam[]>([
    { id: 'team-a', name: 'Team One', logoUrl: null, memberIds: [] },
    { id: 'team-b', name: 'Team Two', logoUrl: null, memberIds: [] }
  ])
  const [manualParticipants, setManualParticipants] = useState<ManualTournamentParticipant[]>([])
  const [manualParticipantName, setManualParticipantName] = useState('')
  const [manualParticipantHandicap, setManualParticipantHandicap] = useState('')
  const [manualParticipantPhotoUrl, setManualParticipantPhotoUrl] = useState<string | null>(null)
  const [closestToPin, setClosestToPin] = useState(false)
  const [closestToPinSetup, setClosestToPinSetup] = useState<ClosestToPinSetup>({ par3Count: 1, distances: [''], holeNumbers: ['1'], courseName: '', multipleDays: false, days: [] })
  const [closestToPinWinners, setClosestToPinWinners] = useState<Record<string, string>>({})
  const [closestToPinPickerKey, setClosestToPinPickerKey] = useState<string | null>(null)
  const [longestDrive, setLongestDrive] = useState(false)
  const [datePickerTarget, setDatePickerTarget] = useState<'start' | 'end' | null>(null)
  const [draft, setDraft] = useState('')
  const [postPhoto, setPostPhoto] = useState<GroupPostPhoto | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'board' | 'members' | 'info' | 'scores'>('board')
  const [editForm, setEditForm] = useState({
    name: '',
    slogan: '',
    description: '',
    location: '',
    group_type: 'community',
    is_private: false,
    tournament_date: '',
    tournament_end_date: '',
    tournament_format: 'Stroke Play',
    tournament_type: '',
    tournament_matchups: ''
  })

  const handleTournamentDateChange = (_event: DateTimePickerEvent, value?: Date) => {
    const target = datePickerTarget
    setDatePickerTarget(null)
    if (!target || !value) return
    const nextDate = isoDate(value)
    setEditForm((current) => {
      if (target === 'start') {
        return {
          ...current,
          tournament_date: nextDate,
          tournament_end_date: current.tournament_end_date && current.tournament_end_date < nextDate ? nextDate : current.tournament_end_date
        }
      }
      return { ...current, tournament_end_date: nextDate }
    })
  }

  const loadGroup = useCallback(async () => {
    if (!id) return

    try {
      const response = await apiGet<{ success: boolean; group: GroupDetail; members: Member[]; pending_members?: Member[] }>(
        `/api/groups/${encodeURIComponent(id)}${user?.id ? `?user_id=${encodeURIComponent(user.id)}` : ''}`
      )
      setGroup(response.group)
      setMembers(response.members || [])
      setPendingMembers(response.pending_members || [])
      // Start fetching the hero art before React reaches the image render.
      // Cached images make repeated tournament visits feel substantially faster.
      const coverUrl = response.group.header_image_url || response.group.image_url
      if (coverUrl) void Image.prefetch(coverUrl)
      if (response.group.logo_url) void Image.prefetch(response.group.logo_url)
      setBusy(false)
      setRefreshing(false)

      void (async () => {
        const [connectionsResponse, directConnections] = await Promise.all([
          user?.id
            ? apiGet<{ success: boolean; connections: ConnectionRecord[] }>(`/api/users?action=connections&id=${encodeURIComponent(user.id)}`).catch(() => ({ success: true, connections: [] }))
            : Promise.resolve({ success: true, connections: [] as ConnectionRecord[] }),
          user?.id
            ? (async () => {
                const { data: edges } = await mobileSupabase.from('user_connections').select('id, requester_id, recipient_id, status').or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).in('status', ['accepted', 'active'])
                const counterpartIds = Array.from(new Set((edges || []).map((edge: any) => edge.requester_id === user.id ? edge.recipient_id : edge.requester_id).filter(Boolean)))
                const { data: profiles } = counterpartIds.length ? await mobileSupabase.from('user_profiles').select('id, first_name, last_name, username, avatar_url, location, handicap').in('id', counterpartIds) : { data: [] as UserCard[] }
                const profileById = new Map((profiles || []).map((profile: UserCard) => [profile.id, profile]))
                return (edges || []).map((edge: any) => ({ ...edge, requester: edge.requester_id === user.id ? null : profileById.get(edge.requester_id) || null, recipient: edge.recipient_id === user.id ? null : profileById.get(edge.recipient_id) || null })) as ConnectionRecord[]
              })().catch(() => [] as ConnectionRecord[])
            : Promise.resolve([] as ConnectionRecord[])
        ])
        const mergedConnections = [...(connectionsResponse.connections || []), ...directConnections]
        setConnections(Array.from(new Map(mergedConnections.map((connection) => [connection.id, connection])).values()))
      })()

      void Promise.all([
        (response.group.group_type || '').toLowerCase() === 'tournament'
          ? apiGet<{ success: boolean; scores: TournamentScore[] }>(`/api/groups/scores?group_id=${encodeURIComponent(id)}`).then((scores) => setTournamentScores(scores.scores || [])).catch(() => setTournamentScores([]))
          : Promise.resolve(setTournamentScores([])),
        user?.id
          ? Promise.all([
              apiGet<{ success: boolean; messages: GroupMessage[] }>(`/api/groups/message?group_id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}`).then((board) => setMessages(board.messages || [])),
              apiGet<{ success: boolean; activities: GroupActivity[] }>(`/api/activities?action=group_detail&group_id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}&limit=8`).then((feed) => setGroupFeed(feed.activities || []))
            ]).catch(() => { setMessages([]); setGroupFeed([]) })
          : Promise.resolve()
      ])
    } finally {
      setBusy(false)
      setRefreshing(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    if (id) {
      setBusy(true)
      loadGroup()
    }
  }, [id, loadGroup])

  useEffect(() => {
    if (!group) return

    setEditForm({
      name: group.name || '',
      slogan: group.slogan || '',
      description: group.description || '',
      location: group.location || '',
      group_type: group.group_type || 'community',
      is_private: Boolean(group.is_private),
      tournament_date: group.tournament_date || '',
      tournament_end_date: group.tournament_end_date || '',
      tournament_format: group.tournament_format || 'Stroke Play',
      tournament_type: group.tournament_type || '',
      tournament_matchups: group.tournament_matchups || ''
    })
    const setup = parseTournamentSetup(group.tournament_matchups)
    setMatchups(setup.matchups)
    setManualParticipants(setup.manualParticipants)
    setManualParticipantName('')
    setManualParticipantHandicap('')
    setManualParticipantPhotoUrl(null)
    setClosestToPin(Boolean(setup.closestToPin))
    setClosestToPinSetup(setup.closestToPinSetup || { par3Count: 1, distances: [''], multipleDays: false })
    setClosestToPinWinners(setup.closestToPinWinners || {})
    setLongestDrive(Boolean(setup.longestDrive))
    setTeams(setup.teams.length ? setup.teams : [
      { id: 'team-a', name: 'Team One', logoUrl: null, memberIds: [] },
      { id: 'team-b', name: 'Team Two', logoUrl: null, memberIds: [] }
    ])
    setLeftMatchupUserId('')
    setRightMatchupUserId('')
    setLeftPartnerUserId('')
    setRightPartnerUserId('')
    setMatchupFormat('Match Play')
    setMatchupDay(group.tournament_date || '')
    setMatchupCourseName('')
    setMatchupTeeTime('')
  }, [group])

  const founder = members.find((member) => member.user_id === group?.creator_id)?.user_profiles
  const founderName =
    founder?.first_name ||
    founder?.username ||
    (group?.creator_id ? 'Group founder' : 'Ultimate Golf Community')
  const myMembership = members.find((member) => member.user_id === user?.id)
  const isMember = !!myMembership
  const groupTypeLabel = (group?.group_type || 'community').replace(/^./, (char) => char.toUpperCase())
  const groupLink = group?.id ? getShareableGroupLink(group.id) : ''
  const groupQrUrl = groupLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(groupLink)}`
    : ''
  const handleShareQrCard = async () => {
    try {
      const uri = await qrCardRef.current?.capture?.()
      if (!uri) throw new Error('The group card is not ready yet.')
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: `Share ${groupTypeLabel} card` })
      } else {
        await Share.share({ message: groupLink, url: groupLink })
      }
    } catch (error) {
      Alert.alert('Unable to share card', error instanceof Error ? error.message : 'Please try again.')
    }
  }
  const isOwner =
    group?.creator_id === user?.id ||
    ['admin', 'owner', 'creator'].includes((myMembership?.role || '').toLowerCase())
  const isTournament = (group?.group_type || '').toLowerCase() === 'tournament'
  const tournamentDays = getTournamentDays(editForm.tournament_date, editForm.tournament_end_date)
  const heroStory = [group?.description, group?.slogan]
    .find((value) => value?.trim() && value.trim().toLowerCase() !== (group?.name || '').trim().toLowerCase())
  const tournamentLeaderboard = useMemo(() => {
    const scoresByUserId = new Map(tournamentScores.map((score) => [score.user_id, score]))

    return members
      .map((member) => ({
        member,
        score: member.user_id ? scoresByUserId.get(member.user_id) || null : null,
        name:
          [member.user_profiles?.first_name, member.user_profiles?.last_name].filter(Boolean).join(' ') ||
          member.user_profiles?.username ||
          'Participant'
      }))
      .sort((left, right) => {
        if (left.score && right.score) return left.score.total_score - right.score.total_score
        if (left.score) return -1
        if (right.score) return 1
        return left.name.localeCompare(right.name)
      })
  }, [members, tournamentScores])
  const teamScoreboard = useMemo(() => teams.slice(0, 2).map((team) => ({
    ...team,
    points: matchups.reduce((total, matchup) => {
      if (!isTournamentMatchComplete(matchup)) return total
      const isMatchPlay = (matchup.format || '').toLowerCase() === 'match play'
      const holeResults = Object.values(matchup.holeWinners || {})
      const leftHoleWins = holeResults.filter((winner) => winner === 'left').length
      const rightHoleWins = holeResults.filter((winner) => winner === 'right').length
      const resultExists = isMatchPlay
        ? leftHoleWins !== rightHoleWins
        : matchup.leftScore !== null && matchup.leftScore !== undefined && matchup.rightScore !== null && matchup.rightScore !== undefined && matchup.leftScore !== matchup.rightScore
      const winnerId = resultExists
        ? (isMatchPlay ? (leftHoleWins > rightHoleWins ? matchup.leftUserId : matchup.rightUserId) : (matchup.leftScore! < matchup.rightScore! ? matchup.leftUserId : matchup.rightUserId))
        : null
      return total + (winnerId && team.memberIds.includes(winnerId) ? 1 : 0)
    }, 0)
  })), [matchups, teams])
  const matchupsByDay = useMemo(() => {
    const grouped = new Map<string, TournamentMatchup[]>()
    matchups.forEach((matchup) => {
      const key = matchup.day || group?.tournament_date || 'Unscheduled'
      grouped.set(key, [...(grouped.get(key) || []), matchup])
    })
    return Array.from(grouped.entries())
  }, [group?.tournament_date, matchups])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }
  const acceptedConnections = connections
    .map((connection) =>
      connection.requester_id === user?.id ? connection.recipient : connection.requester
    )
    .filter(Boolean) as UserCard[]
  const memberIds = new Set(members.map((member) => member.user_id).filter(Boolean))
  const inviteableConnections = acceptedConnections.filter((connection) => !memberIds.has(connection.id))
  const participantOptions = [
    ...members
    .filter((member) => member.user_id && member.user_profiles)
    .map((member) => ({
      id: member.user_id as string,
      name:
        [member.user_profiles?.first_name, member.user_profiles?.last_name].filter(Boolean).join(' ') ||
        member.user_profiles?.username ||
        'Golfer',
      avatarUrl: member.user_profiles?.avatar_url,
      handicap: member.user_profiles?.handicap
    })),
    ...manualParticipants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      avatarUrl: participant.avatarUrl,
      handicap: participant.handicap
    }))
  ]
  const participantById = new Map(participantOptions.map((participant) => [participant.id, participant]))
  const closestToPinEntries = useMemo(() => {
    if (!closestToPin) return []
    const contestDays = closestToPinSetup.multipleDays && tournamentDays.length
      ? tournamentDays
      : [tournamentDays[0] || group?.tournament_date || '']
    return contestDays.flatMap((day, dayIndex) => {
      const daySetup = closestToPinSetup.days?.find((item) => item.day === day)
      const distances = closestToPinSetup.multipleDays
        ? daySetup?.distances || closestToPinSetup.distances
        : closestToPinSetup.distances
      const holeNumbers = closestToPinSetup.multipleDays
        ? daySetup?.holeNumbers || closestToPinSetup.holeNumbers || []
        : closestToPinSetup.holeNumbers || []
      return distances.map((distance, index) => ({
      key: `${day || 'tournament'}-ctp-${index + 1}`,
      day,
      dayIndex,
      holeNumber: holeNumbers[index]?.trim() || String(index + 1),
      courseName: daySetup?.courseName || closestToPinSetup.courseName || '',
      distance: distance || ''
      }))
    })
  }, [closestToPin, closestToPinSetup, group?.tournament_date, tournamentDays])
  const closestToPinEntriesByDay = useMemo(() => {
    const grouped = new Map<string, typeof closestToPinEntries>()
    closestToPinEntries.forEach((entry) => grouped.set(entry.day || 'tournament', [...(grouped.get(entry.day || 'tournament') || []), entry]))
    return Array.from(grouped.values())
  }, [closestToPinEntries])
  const closestToPinPickerEntry = closestToPinPickerKey ? closestToPinEntries.find((entry) => entry.key === closestToPinPickerKey) || null : null
  const scorecardMatchup = scorecardMatchupId ? matchups.find((matchup) => matchup.id === scorecardMatchupId) || null : null
  const matchupSettings = matchupSettingsId ? matchups.find((matchup) => matchup.id === matchupSettingsId) || null : null
  const scorecardLeft = scorecardMatchup ? participantById.get(scorecardMatchup.leftUserId) : null
  const scorecardRight = scorecardMatchup ? participantById.get(scorecardMatchup.rightUserId) : null
  const scorecardIsMatchPlay = (scorecardMatchup?.format || group?.tournament_format || '').toLowerCase().includes('match play')
  const scorecardIsTeamFormat = ['scramble', 'best ball', 'alternate shot'].includes((scorecardMatchup?.format || '').toLowerCase())
  const scorecardLeftPartner = scorecardMatchup?.leftPartnerUserId ? participantById.get(scorecardMatchup.leftPartnerUserId) : null
  const scorecardRightPartner = scorecardMatchup?.rightPartnerUserId ? participantById.get(scorecardMatchup.rightPartnerUserId) : null
  const scorecardLeftTeam = scorecardMatchup ? teams.find((team) => team.memberIds.includes(scorecardMatchup.leftUserId)) : null
  const scorecardRightTeam = scorecardMatchup ? teams.find((team) => team.memberIds.includes(scorecardMatchup.rightUserId)) : null
  const scorecardLeftLabel = scorecardLeftTeam?.name || [scorecardLeft?.name, scorecardLeftPartner?.name].filter(Boolean).join(' & ')
  const scorecardRightLabel = scorecardRightTeam?.name || [scorecardRight?.name, scorecardRightPartner?.name].filter(Boolean).join(' & ')
  const matchupLeftOptions = editForm.tournament_format === 'Ryder Cup'
    ? participantOptions.filter((participant) => teams[0]?.memberIds.includes(participant.id))
    : participantOptions
  const matchupRightOptions = editForm.tournament_format === 'Ryder Cup'
    ? participantOptions.filter((participant) => teams[1]?.memberIds.includes(participant.id))
    : participantOptions

  const getClosestToPinDayDistances = (day: string) =>
    closestToPinSetup.days?.find((item) => item.day === day)?.distances || closestToPinSetup.distances

  const updateClosestToPinDayDistances = (day: string, update: (distances: string[]) => string[]) => {
    setClosestToPinSetup((current) => {
      const currentDays = current.days || []
      const existing = currentDays.find((item) => item.day === day)
      const nextDistances = update(existing?.distances || current.distances)
      const nextDays = [
        ...currentDays.filter((item) => item.day !== day),
        { day, distances: nextDistances, holeNumbers: existing?.holeNumbers || current.holeNumbers || [], courseName: existing?.courseName || current.courseName || '' }
      ]
      return { ...current, days: nextDays }
    })
  }

  const updateClosestToPinHoleNumber = (day: string, index: number, value: string) => {
    setClosestToPinSetup((current) => {
      if (!day) {
        const holeNumbers = [...(current.holeNumbers || [])]
        holeNumbers[index] = value
        return { ...current, holeNumbers }
      }
      const existing = current.days?.find((item) => item.day === day)
      const holeNumbers = [...(existing?.holeNumbers || current.holeNumbers || [])]
      holeNumbers[index] = value
      return {
        ...current,
        days: [...(current.days || []).filter((item) => item.day !== day), { day, distances: existing?.distances || current.distances, holeNumbers, courseName: existing?.courseName || current.courseName || '' }]
      }
    })
  }

  const updateClosestToPinCourse = (day: string, courseName: string) => {
    setClosestToPinSetup((current) => {
      if (!day) return { ...current, courseName }
      const existing = current.days?.find((item) => item.day === day)
      return {
        ...current,
        days: [...(current.days || []).filter((item) => item.day !== day), {
          day,
          distances: existing?.distances || current.distances,
          holeNumbers: existing?.holeNumbers || current.holeNumbers || [],
          courseName
        }]
      }
    })
  }

  const addMatchup = () => {
    if (!leftMatchupUserId || !rightMatchupUserId) {
      Alert.alert('Choose two golfers', 'Select one golfer for each side of the matchup.')
      return
    }
    if (leftMatchupUserId === rightMatchupUserId) {
      Alert.alert('Choose two different golfers', 'A golfer cannot play against themselves.')
      return
    }

    if (editForm.tournament_format === 'Ryder Cup' && (!teams[0]?.memberIds.includes(leftMatchupUserId) || !teams[1]?.memberIds.includes(rightMatchupUserId))) {
      Alert.alert('Use the team rosters', 'Choose one golfer from each Ryder Cup team.')
      return
    }

    const teamFormat = ['scramble', 'best ball'].includes(matchupFormat.toLowerCase())
    if (teamFormat && (!leftPartnerUserId || !rightPartnerUserId)) {
      Alert.alert('Add both teams', 'Scramble and Best Ball matchups need two golfers on each side.')
      return
    }
    const selectedPlayers = [leftMatchupUserId, rightMatchupUserId, leftPartnerUserId, rightPartnerUserId].filter(Boolean)
    if (new Set(selectedPlayers).size !== selectedPlayers.length) {
      Alert.alert('Choose different golfers', 'A golfer can only be on one side of a matchup.')
      return
    }

    const alreadyAdded = matchups.some(
      (matchup) =>
        (matchup.leftUserId === leftMatchupUserId && matchup.rightUserId === rightMatchupUserId) ||
        (matchup.leftUserId === rightMatchupUserId && matchup.rightUserId === leftMatchupUserId)
    )
    if (!alreadyAdded) {
      setMatchups((current) => [
        ...current,
        { id: `matchup-${Date.now()}`, leftUserId: leftMatchupUserId, rightUserId: rightMatchupUserId, leftPartnerUserId: teamFormat ? leftPartnerUserId : null, rightPartnerUserId: teamFormat ? rightPartnerUserId : null, format: matchupFormat, day: matchupDay || editForm.tournament_date || null, courseName: matchupCourseName.trim() || null, teeTime: matchupTeeTime.trim() || null }
      ])
    }
    setLeftMatchupUserId('')
    setRightMatchupUserId('')
    setLeftPartnerUserId('')
    setRightPartnerUserId('')
    setMatchupCourseName('')
    setMatchupTeeTime('')
  }

  const handlePickManualParticipantPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to add a golfer photo.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 })
    if (result.canceled || !result.assets[0]) return
    try {
      const asset = result.assets[0]
      const upload = await uploadImageToStorage({
        folder: 'tournament-participants',
        fileName: asset.fileName || `participant-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        uri: asset.uri
      })
      setManualParticipantPhotoUrl(upload.publicUrl)
    } catch (error) {
      Alert.alert('Unable to upload photo', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const addManualParticipant = () => {
    const name = manualParticipantName.trim()
    if (!name) {
      Alert.alert('Name needed', 'Enter the golfer’s name before adding them.')
      return
    }
    setManualParticipants((current) => [
      ...current,
      {
        id: `guest-${Date.now()}`,
        name,
        avatarUrl: manualParticipantPhotoUrl,
        handicap: Number.isFinite(Number(manualParticipantHandicap)) && manualParticipantHandicap.trim() ? Number(manualParticipantHandicap) : null
      }
    ])
    setManualParticipantName('')
    setManualParticipantHandicap('')
    setManualParticipantPhotoUrl(null)
  }

  const getMatchupWinner = (matchup: TournamentMatchup) => {
    if (!isTournamentMatchComplete(matchup)) return null
    if ((matchup.format || '').toLowerCase() === 'match play') return getMatchPlayStatus(matchup)?.leader || null
    if (matchup.leftScore === null || matchup.leftScore === undefined || matchup.rightScore === null || matchup.rightScore === undefined || matchup.leftScore === matchup.rightScore) return null
    const teamFormat = ['scramble', 'best ball', 'alternate shot'].includes((matchup.format || '').toLowerCase())
    // A side's team score is already the comparison score. Never apply an
    // individual player's handicap to a two-person team result.
    if (teamFormat) return matchup.leftScore < matchup.rightScore ? 'left' : 'right'
    const left = participantById.get(matchup.leftUserId)
    const right = participantById.get(matchup.rightUserId)
    const leftAdjusted = getAdjustedTournamentScore(matchup.leftScore, left?.handicap)
    const rightAdjusted = getAdjustedTournamentScore(matchup.rightScore, right?.handicap)
    if (leftAdjusted === null || rightAdjusted === null || leftAdjusted === rightAdjusted) return null

    // Tournament results are based on net score: gross total minus handicap.
    return leftAdjusted < rightAdjusted ? 'left' : 'right'
  }

  const getMatchPlayStatus = (matchup: TournamentMatchup) => {
    const holeEntries = Object.entries(matchup.holeWinners || {})
    const results = holeEntries.map(([, winner]) => winner)
    if (!results.length) return null
    const leftWins = results.filter((winner) => winner === 'left').length
    const rightWins = results.filter((winner) => winner === 'right').length
    if (leftWins === rightWins) return { leader: null, label: 'EVEN' }
    const leader = leftWins > rightWins ? 'left' : 'right'
    const margin = Math.abs(leftWins - rightWins)
    // Matches are intentionally not completed early. A leader can be shown
    // during play, but it becomes a result only after all 18 holes are scored.
    return { leader, label: `${margin} UP` }
  }

  const setScorecardHoleWinner = (matchupId: string, hole: number, winner: 'left' | 'right' | 'halve') => {
    setMatchups((current) => current.map((item) => {
      if (item.id !== matchupId) return item
      const holeWinners = { ...item.holeWinners }
      if (holeWinners[String(hole)] === winner) {
        delete holeWinners[String(hole)]
      } else {
        holeWinners[String(hole)] = winner
      }
      return { ...item, holeWinners }
    }))
  }

  const setScorecardHoleScore = (matchupId: string, hole: number, side: 'left' | 'right', value: string) => {
    setMatchups((current) => current.map((item) => {
      if (item.id !== matchupId) return item
      const key = side === 'left' ? 'leftHoleScores' : 'rightHoleScores'
      const scores = { ...(item[key] || {}) }
      const nextScore = Number(value)
      if (!value.trim() || !Number.isFinite(nextScore)) delete scores[String(hole)]
      else scores[String(hole)] = nextScore
      return { ...item, [key]: scores }
    }))
  }

  const handleSaveMatchupScore = async (matchupId: string) => {
    if (!user?.id || !group?.id || !isOwner) return
    const nextMatchups = matchups.map((matchup) => {
      const next = { ...matchup }
      if (['scramble', 'best ball', 'alternate shot'].includes((next.format || '').toLowerCase())) {
        const leftScores = Object.values(next.leftHoleScores || {})
        const rightScores = Object.values(next.rightHoleScores || {})
        next.leftScore = leftScores.length ? leftScores.reduce((total, score) => total + score, 0) : null
        next.rightScore = rightScores.length ? rightScores.reduce((total, score) => total + score, 0) : null
      }
      return next
    })
    setSavingMatchupId(matchupId)
    try {
      const response = await apiPost<{ success?: boolean; group?: GroupDetail }>('/api/groups', {
        action: 'update',
        group_id: group.id,
        user_id: user.id,
        name: group.name,
        description: group.description || '',
        slogan: group.slogan || '',
        location: group.location || '',
        group_type: 'tournament',
        is_private: Boolean(group.is_private),
        tournament_date: group.tournament_date || null,
        tournament_end_date: group.tournament_end_date || null,
        tournament_format: group.tournament_format || 'Match Play',
        tournament_type: group.tournament_type || null,
        tournament_matchups: JSON.stringify({ matchups: nextMatchups, teams, manualParticipants, closestToPin, closestToPinSetup, closestToPinWinners, longestDrive })
      })
      if (response.group) setGroup((current) => current ? { ...current, ...response.group } : current)
      await loadGroup()
    } catch (error) {
      Alert.alert('Unable to save matchup score', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSavingMatchupId(null)
    }
  }

  const handleSelectClosestToPinWinner = async (entryKey: string, winnerId?: string) => {
    if (!group?.id || !user?.id || !isOwner) return
    const previousWinners = closestToPinWinners
    const nextWinners = { ...previousWinners }
    if (winnerId) nextWinners[entryKey] = winnerId
    else delete nextWinners[entryKey]
    setClosestToPinWinners(nextWinners)
    setClosestToPinPickerKey(null)
    try {
      const response = await apiPost<{ group?: GroupDetail }>('/api/groups', {
        action: 'update',
        group_id: group.id,
        user_id: user.id,
        name: group.name,
        description: group.description || '',
        slogan: group.slogan || '',
        location: group.location || '',
        group_type: 'tournament',
        is_private: Boolean(group.is_private),
        tournament_date: group.tournament_date || null,
        tournament_end_date: group.tournament_end_date || null,
        tournament_format: group.tournament_format || 'Stroke Play',
        tournament_type: group.tournament_type || null,
        tournament_matchups: JSON.stringify({ matchups, teams, manualParticipants, closestToPin, closestToPinSetup, closestToPinWinners: nextWinners, longestDrive })
      })
      if (response.group) setGroup((current) => current ? { ...current, ...response.group } : current)
      await loadGroup()
    } catch (error) {
      setClosestToPinWinners(previousWinners)
      Alert.alert('Unable to save winner', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const handlePickTeamLogo = async (teamId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to choose a team logo.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85
    })
    if (result.canceled || !result.assets[0]) return

    try {
      const asset = result.assets[0]
      const upload = await uploadImageToStorage({
        folder: 'tournament-team-logos',
        fileName: asset.fileName || `team-${teamId}-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        uri: asset.uri
      })
      setTeams((current) => current.map((team) => team.id === teamId ? { ...team, logoUrl: upload.publicUrl } : team))
    } catch (error) {
      Alert.alert('Unable to upload logo', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const handlePickGroupImage = async (target: 'logo' | 'cover') => {
    if (!group?.id || !isOwner) return
    const uploadAsset = async (asset: ImagePicker.ImagePickerAsset) => {
      const fileName = asset.fileName || `group-${target}-${Date.now()}.jpg`
      const mimeType = asset.mimeType || 'image/jpeg'

      if (target === 'logo') {
        setUploadingLogo(true)
      } else {
        setUploadingCover(true)
      }

      try {
        const upload = await uploadImageToStorage({
          folder: target === 'logo' ? 'group-logos' : 'group-covers',
          fileName,
          mimeType,
          uri: asset.uri
        })
        const displayUrl = `${upload.publicUrl}${upload.publicUrl.includes('?') ? '&' : '?'}v=${Date.now()}`

        if (target === 'logo') {
          await apiPost<{ success: boolean; group: GroupDetail }>('/api/groups/media', {
            group_id: group.id,
            user_id: user?.id,
            target: 'logo',
            url: upload.publicUrl
          })
          setGroup((current) =>
            current
              ? {
                  ...current,
                  logo_url: displayUrl
                }
              : current
          )
        } else {
          await apiPost<{ success: boolean; group: GroupDetail }>('/api/groups/media', {
            group_id: group.id,
            user_id: user?.id,
            target: 'cover',
            url: upload.publicUrl
          })
          setGroup((current) =>
            current
              ? {
                  ...current,
                  header_image_url: displayUrl
                }
              : current
          )
        }
      } catch (error) {
        Alert.alert('Unable to update image', error instanceof Error ? error.message : 'Please try again.')
      } finally {
        if (target === 'logo') {
          setUploadingLogo(false)
        } else {
          setUploadingCover(false)
        }
      }
    }

    const launchLibrary = async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo library access to choose a group image.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: target === 'logo' ? [1, 1] : [16, 9],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      await uploadAsset(result.assets[0])
    }

    const launchCamera = async () => {
      const permission = await ImagePicker.requestCameraPermissionsAsync()

      if (!permission.granted) {
        Alert.alert('Camera access needed', 'Allow camera access to take a group image.')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: target === 'logo' ? [1, 1] : [16, 9],
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85
      })

      if (result.canceled || !result.assets[0]) {
        return
      }

      await uploadAsset(result.assets[0])
    }

    Alert.alert(
      target === 'logo' ? 'Update group logo' : 'Update group cover',
      target === 'logo'
        ? 'Choose how you want to set the group logo.'
        : 'Choose how you want to set the group cover photo.',
      [
        { text: 'Take Photo', onPress: () => void launchCamera() },
        { text: 'Choose From Library', onPress: () => void launchLibrary() },
        { style: 'cancel', text: 'Cancel' }
      ]
    )
  }

  const handleJoin = async () => {
    if (!user?.id || !group?.id) return

    setJoining(true)
    try {
      await apiPost(`/api/groups/${encodeURIComponent(group.id)}`, {
        action: 'join',
        user_id: user.id
      })
      await loadGroup()
    } catch (error) {
      Alert.alert('Unable to join group', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setJoining(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!user?.id || !group?.id) return

    const trimmedName = editForm.name.trim()

    if (!trimmedName) {
      Alert.alert('Group name required', 'Give the group a name before saving.')
      return
    }

    setSavingEdit(true)
    try {
      const response = await apiPost<{ success: boolean; group: GroupDetail }>('/api/groups', {
        action: 'update',
        group_id: group.id,
        user_id: user.id,
        name: trimmedName,
        description: editForm.description.trim(),
        slogan: editForm.slogan.trim(),
        location: editForm.location.trim(),
        group_type: editForm.group_type.toLowerCase(),
        is_private: editForm.is_private,
        tournament_date: editForm.tournament_date.trim() || null,
        tournament_end_date: editForm.tournament_end_date.trim() || null,
        tournament_format: editForm.tournament_format.trim() || null,
        tournament_type: editForm.tournament_type.trim() || null,
        tournament_matchups: matchups.length || manualParticipants.length || teams.some((team) => team.memberIds.length || team.logoUrl || team.name.trim()) || closestToPin || longestDrive
          ? JSON.stringify({ matchups, teams, manualParticipants, closestToPin, closestToPinSetup, closestToPinWinners, longestDrive })
          : null
      })

      let savedGroup = response.group
      const expectedStartDate = editForm.tournament_date.trim() || null
      const expectedEndDate = editForm.tournament_end_date.trim() || null

      // Some legacy API fallbacks successfully save the group shell but omit
      // optional tournament fields. As the owner, make one direct, scoped
      // retry so the submitted date range cannot be silently discarded.
      if (editForm.group_type.toLowerCase() === 'tournament' && (!savedGroup || savedGroup.tournament_date !== expectedStartDate || savedGroup.tournament_end_date !== expectedEndDate)) {
        const { data, error } = await mobileSupabase
          .from('golf_groups')
          .update({
            tournament_date: expectedStartDate,
            tournament_end_date: expectedEndDate,
            tournament_format: editForm.tournament_format.trim() || 'Stroke Play',
            tournament_type: editForm.tournament_type.trim() || null
          })
          .eq('id', group.id)
          .select()
          .single()
        if (error) throw new Error(error.message)
        savedGroup = data as GroupDetail
      }

      if (savedGroup) {
        if ((savedGroup.group_type || 'community').toLowerCase() !== editForm.group_type.toLowerCase()) {
          throw new Error('The group type was not saved. Please update the tournament database setup and try again.')
        }
        setGroup((current) =>
          current
            ? {
                ...current,
                ...savedGroup,
                logo_url: savedGroup.logo_url || current.logo_url,
                header_image_url: savedGroup.header_image_url || current.header_image_url,
                image_url: savedGroup.image_url || current.image_url
              }
            : savedGroup
        )
      }

      // Reload the source of truth so date, format, and pairings immediately
      // reflect what Supabase actually stored.
      await loadGroup()
      setIsEditing(false)
      setIsEditingMatchups(false)
    } catch (error) {
      Alert.alert('Unable to update group', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSaveTournamentScore = async () => {
    if (!user?.id || !group?.id || !scoreDraft.trim()) return
    const totalScore = Number(scoreDraft)
    if (!Number.isFinite(totalScore)) {
      Alert.alert('Enter a score', 'Use a whole number for your tournament score.')
      return
    }
    setScoreSaving(true)
    try {
      await apiPost('/api/groups/scores', { group_id: group.id, user_id: user.id, total_score: totalScore })
      setScoreDraft('')
      await loadGroup()
    } catch (error) {
      Alert.alert('Unable to save score', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setScoreSaving(false)
    }
  }

  const handleSetMemberRole = async (member: Member, nextRole: 'admin' | 'member') => {
    if (!user?.id || !group?.id || !member.user_id) return

    try {
      await apiPost('/api/groups', {
        action: 'set_member_role',
        group_id: group.id,
        user_id: user.id,
        member_user_id: member.user_id,
        role: nextRole
      })
      await loadGroup()
    } catch (error) {
      Alert.alert('Unable to update member', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const handlePickPostPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to add a golf photo to your post.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 5],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.88
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setPostPhoto({ uri: asset.uri, fileName: asset.fileName, mimeType: asset.mimeType })
    }
  }

  const handlePostMessage = async () => {
    if (!user?.id || !group?.id) return

    if (!isMember) {
      Alert.alert('Join required', 'Join this group before posting on the board.')
      return
    }

    if (!draft.trim() && !postPhoto) {
      Alert.alert('Add a post', 'Write an update or add a golf photo before posting.')
      return
    }

    setPosting(true)
    try {
      let message = draft.trim()
      if (postPhoto) {
        const upload = await uploadImageToStorage({
          folder: 'group-posts',
          fileName: postPhoto.fileName || `group-post-${Date.now()}.jpg`,
          mimeType: postPhoto.mimeType || 'image/jpeg',
          uri: postPhoto.uri
        })
        message = `${GROUP_POST_PHOTO_PREFIX}${upload.publicUrl}]]${message ? `\n${message}` : ''}`
      }
      const response = await apiPost<{ success: boolean; messages: GroupMessage[] }>('/api/groups/message', {
        group_id: group.id,
        user_id: user.id,
        message,
        parent_message_id: replyingTo
      })
      setMessages(response.messages || [])
      setDraft('')
      setPostPhoto(null)
      setReplyingTo(null)
      setComposerOpen(false)
      Keyboard.dismiss()
    } catch (error) {
      Alert.alert('Unable to post', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setPosting(false)
    }
  }

  const handleCancelComposer = () => {
    Keyboard.dismiss()
    setDraft('')
    setPostPhoto(null)
    setReplyingTo(null)
    setComposerOpen(false)
  }

  const handleReviewRequest = async (member: Member, decision: 'approve' | 'decline') => {
    if (!user?.id || !group?.id || !member.user_id) return
    try {
      await apiPost('/api/groups', {
        action: 'review_join_request', group_id: group.id, user_id: user.id, member_user_id: member.user_id, role: decision
      })
      await loadGroup()
    } catch (error) {
      Alert.alert('Unable to review request', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const handleToggleLike = async (messageId: string, liked: boolean) => {
    if (!user?.id || !group?.id) return

    try {
      const response = await apiPost<{ success: boolean; messages: GroupMessage[] }>('/api/groups/message', {
        action: liked ? 'unlike' : 'like',
        group_id: group.id,
        user_id: user.id,
        message_id: messageId
      })
      setMessages(response.messages || [])
    } catch (error) {
      Alert.alert('Unable to update like', error instanceof Error ? error.message : 'Please try again.')
    }
  }

  const handleInviteConnection = async (invitedUserId: string) => {
    if (!user?.id || !group?.id) return

    setInvitingId(invitedUserId)
    try {
      const response = await apiPost<{ success?: boolean; error?: string }>('/api/groups/invitations', {
        action: 'create',
        group_id: group.id,
        invited_user_id: invitedUserId,
        user_id: user.id
      })

      if (response?.error) {
        throw new Error(response.error)
      }

      setPendingInviteUserIds((current) => new Set([...current, invitedUserId]))
      Alert.alert('Invite sent', 'That golfer can now join this group from their invitations.')
    } catch (error) {
      Alert.alert('Unable to add member', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setInvitingId(null)
    }
  }

  const formatAuthor = (message: GroupMessage) =>
    message.user_profiles?.first_name ||
    message.user_profiles?.username ||
    'UGC Member'

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadGroup()
            }}
            tintColor={palette.aqua}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.coverShell}>
            {group?.header_image_url || group?.image_url ? (
              <Image source={{ uri: group?.header_image_url || group?.image_url || undefined }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverFallback}>
                <Text style={styles.coverFallbackText}>Add cover photo</Text>
              </View>
            )}
            <View style={styles.coverScrim} />
            <View style={styles.coverActions}>
              <Pressable accessibilityLabel="Go back" onPress={() => router.back()} style={styles.coverActionButton}>
                <Ionicons color="#ffffff" name="chevron-back" size={23} />
              </Pressable>
              {isMember ? (
                <Pressable
                  accessibilityLabel={composerOpen ? 'Cancel post' : 'Compose post'}
                  onPress={() => {
                    if (composerOpen) {
                      handleCancelComposer()
                    } else {
                      setActiveSection('board')
                      setComposerOpen(true)
                    }
                  }}
                  style={styles.coverActionButton}
                >
                  <Ionicons color="#ffffff" name={composerOpen ? 'close' : 'create-outline'} size={composerOpen ? 25 : 21} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.groupTypeCoverIcon}>
              <Ionicons
                color="#ffffff"
                name={isTournament ? 'trophy' : (group?.group_type || 'community').toLowerCase() === 'course' ? 'golf-outline' : 'people-outline'}
                size={19}
              />
            </View>
            <View style={styles.heroCenteredContent}>
              <Avatar label={group?.name || 'Group'} shape="rounded" size={88} uri={group?.logo_url || group?.image_url} />
              {busy ? <ActivityIndicator color={palette.aqua} /> : null}
              {isEditing && !isEditingMatchups ? (
                <TextInput onChangeText={(value) => setEditForm((current) => ({ ...current, name: value }))} placeholder="Group name" placeholderTextColor="rgba(255,255,255,0.65)" style={styles.inlineNameInput} value={editForm.name} />
              ) : (
                <>
                  <Text numberOfLines={1} style={styles.name}>{group?.name || id?.replace(/-/g, ' ') || 'Group'}</Text>
                  {heroStory ? <Text numberOfLines={2} style={styles.heroStory}>{heroStory}</Text> : null}
                  <View style={styles.heroMetaInlineRow}>
                    {group?.location ? <Text style={styles.heroMetaInlineText}>{group.location}</Text> : null}
                    <Pressable onPress={() => setActiveSection('members')}><Text style={styles.heroMetaInlineAccent}>{members.length} {isTournament ? 'people' : 'members'}</Text></Pressable>
                    {group?.is_private ? <Text style={styles.heroMetaInlineText}>Private</Text> : null}
                  </View>
                </>
              )}
            </View>
            {isOwner && activeSection !== 'scores' ? (
              <Pressable
                accessibilityLabel={isEditing ? 'Close editor' : 'Edit group'}
                onPress={() => {
                  if (isEditing) {
                    setIsEditing(false)
                    setIsEditingMatchups(false)
                    void loadGroup()
                  } else {
                    setIsEditingMatchups(false)
                    setActiveSection('info')
                    setIsEditing(true)
                  }
                }}
                style={styles.groupEditButton}
              >
                <Ionicons color="#ffffff" name={isEditing ? 'close' : 'settings-outline'} size={isEditing ? 24 : 19} />
              </Pressable>
            ) : null}
            {isOwner && isTournament && activeSection === 'scores' ? (
              <Pressable
                accessibilityLabel={isEditingMatchups ? 'Close matchup editor' : 'Edit tournament matchups'}
                onPress={() => {
                  if (isEditingMatchups) {
                    setIsEditing(false)
                    setIsEditingMatchups(false)
                    void loadGroup()
                  } else {
                    setIsEditingMatchups(true)
                    setIsEditing(true)
                  }
                }}
                style={styles.groupEditButton}
              >
                <Ionicons color="#ffffff" name={isEditingMatchups ? 'close' : 'settings-outline'} size={isEditingMatchups ? 24 : 19} />
              </Pressable>
            ) : null}
          </View>
          {!isMember ? <PrimaryButton label={group?.is_private ? 'Request to Join' : 'Join Group'} loading={joining} onPress={handleJoin} /> : null}
        </View>

        <View style={styles.tabRow}>
          {[
            { label: 'Posts', value: 'board' as const },
            { label: 'About', value: 'info' as const },
            ...(isTournament ? [{ label: 'Scores', value: 'scores' as const }] : []),
            { label: isTournament ? 'People' : 'Members', value: 'members' as const }
          ].map((tab) => {
            const active = activeSection === tab.value

            return (
              <Pressable
                key={tab.value}
                onPress={() => setActiveSection(tab.value)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              </Pressable>
            )
          })}
        </View>

        {activeSection === 'info' || (activeSection === 'scores' && isEditing && isEditingMatchups) ? (
          <View style={styles.aboutFeed}>
            {isEditing ? (
              <>
                {!isEditingMatchups ? <>
                <TextInput
                  multiline
                  onChangeText={(value) => setEditForm((current) => ({ ...current, description: value }))}
                  placeholder="What is this group about?"
                  placeholderTextColor={palette.textMuted}
                  style={[styles.editInput, styles.editTextarea]}
                  value={editForm.description}
                />
                <TextInput
                  onChangeText={(value) => setEditForm((current) => ({ ...current, slogan: value }))}
                  placeholder="Group slogan"
                  placeholderTextColor={palette.textMuted}
                  style={styles.editInput}
                  value={editForm.slogan}
                />
                <View style={styles.typeRow}>
                  {[
                    { label: 'Community', value: 'community' },
                    { label: 'Course', value: 'course' },
                    { label: 'Tournament', value: 'tournament' }
                  ].map((option) => {
                    const active = editForm.group_type === option.value

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setEditForm((current) => ({ ...current, group_type: option.value }))}
                        style={[styles.typeChip, option.value === 'tournament' && styles.tournamentTypeChip, active && styles.typeChipActive]}
                      >
                        <Text numberOfLines={1} style={[styles.typeLabel, option.value === 'tournament' && styles.tournamentTypeLabel, active && styles.typeLabelActive]}>{option.label}</Text>
                      </Pressable>
                    )
                  })}
                </View>
                </> : null}
                {isTournament || editForm.group_type === 'tournament' ? (
                  <View style={styles.tournamentEditFields}>
                    {!isEditingMatchups ? <>
                    <View style={styles.dateRangeRow}>
                      <Pressable onPress={() => setDatePickerTarget('start')} style={[styles.editInput, styles.dateRangeInput, styles.datePickerButton]}>
                        <Ionicons color={palette.gold} name="calendar-outline" size={18} />
                        <View style={styles.datePickerCopy}>
                          <Text style={styles.datePickerLabel}>Starts</Text>
                          <Text numberOfLines={1} style={styles.datePickerValue}>{readableDate(editForm.tournament_date)}</Text>
                        </View>
                      </Pressable>
                      <Pressable onPress={() => setDatePickerTarget('end')} style={[styles.editInput, styles.dateRangeInput, styles.datePickerButton]}>
                        <Ionicons color={palette.gold} name="calendar-outline" size={18} />
                        <View style={styles.datePickerCopy}>
                          <Text style={styles.datePickerLabel}>Ends</Text>
                          <Text numberOfLines={1} style={styles.datePickerValue}>{readableDate(editForm.tournament_end_date)}</Text>
                        </View>
                      </Pressable>
                    </View>
                    {datePickerTarget ? <DateTimePicker display="default" minimumDate={datePickerTarget === 'end' && editForm.tournament_date ? dateFromIso(editForm.tournament_date) : undefined} mode="date" onChange={handleTournamentDateChange} value={dateFromIso(datePickerTarget === 'start' ? editForm.tournament_date : editForm.tournament_end_date || editForm.tournament_date)} /> : null}
                    {tournamentDays.length ? <Text style={styles.matchupHint}>{tournamentDays.length} tournament day{tournamentDays.length === 1 ? '' : 's'}</Text> : null}
                    <View style={styles.typeRow}>
                      {['Stroke Play', 'Match Play', 'Ryder Cup'].map((format) => (
                        <Pressable key={format} onPress={() => setEditForm((current) => ({ ...current, tournament_format: format }))} style={[styles.typeChip, editForm.tournament_format === format && styles.typeChipActive]}>
                          <Text style={[styles.typeLabel, editForm.tournament_format === format && styles.typeLabelActive]}>{format}</Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput onChangeText={(value) => setEditForm((current) => ({ ...current, tournament_type: value }))} placeholder="Tournament type or division" placeholderTextColor={palette.textMuted} style={styles.editInput} value={editForm.tournament_type} />
                    {editForm.tournament_format === 'Ryder Cup' ? (
                      <View style={styles.teamSetup}>
                        <Text style={styles.infoLabel}>Teams</Text>
                        {teams.slice(0, 2).map((team, teamIndex) => (
                          <View key={team.id} style={styles.teamEditor}>
                            <View style={styles.teamEditorHeader}>
                              <Pressable onPress={() => void handlePickTeamLogo(team.id)} style={styles.teamLogoPicker}>
                                {team.logoUrl ? <Image source={{ uri: team.logoUrl }} style={styles.teamLogoImage} /> : <Ionicons color={palette.aqua} name="image-outline" size={22} />}
                              </Pressable>
                              <View style={styles.teamEditorCopy}>
                                <Text style={styles.teamNameLabel}>Team {teamIndex + 1} name</Text>
                                <TextInput onChangeText={(value) => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, name: value } : item))} placeholder={`Team ${teamIndex + 1}`} placeholderTextColor={palette.textMuted} style={styles.teamNameInput} value={team.name} />
                              </View>
                            </View>
                            <Text style={styles.matchupSideLabel}>Roster · tap to remove</Text>
                            <View style={styles.teamGolferGrid}>
                              {participantOptions.filter((participant) => team.memberIds.includes(participant.id)).map((participant) => <Pressable key={participant.id} onPress={() => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, memberIds: item.memberIds.filter((memberId) => memberId !== participant.id) } : item))} style={styles.teamGolfer}><Avatar label={participant.name} size={44} uri={participant.avatarUrl} /><Text numberOfLines={1} style={styles.teamGolferName}>{participant.name.split(' ')[0]}</Text></Pressable>)}
                              {!team.memberIds.length ? <Text style={styles.matchupHint}>No golfers added yet.</Text> : null}
                            </View>
                            <Text style={styles.matchupSideLabel}>Available golfers</Text>
                            <View style={styles.teamGolferGrid}>
                              {participantOptions.filter((participant) => !teams.some((otherTeam) => otherTeam.memberIds.includes(participant.id))).map((participant) => <Pressable key={participant.id} onPress={() => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, memberIds: [...item.memberIds, participant.id] } : item))} style={styles.teamGolfer}><Avatar label={participant.name} size={44} uri={participant.avatarUrl} /><Text numberOfLines={1} style={styles.teamGolferName}>{participant.name.split(' ')[0]}</Text></Pressable>)}
                              {!participantOptions.some((participant) => !teams.some((otherTeam) => otherTeam.memberIds.includes(participant.id))) ? <Text style={styles.matchupHint}>All golfers are assigned.</Text> : null}
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    <View style={styles.tournamentContestsEditor}>
                      <Text style={styles.infoLabel}>Tournament contests</Text>
                      <Text style={styles.matchupHint}>Choose the side contests available to players.</Text>
                      <View style={styles.contestChoices}>
                        <Pressable onPress={() => setClosestToPin((current) => !current)} style={[styles.contestChoice, closestToPin && styles.contestChoiceActive]}>
                          <Ionicons color={closestToPin ? '#d7b768' : palette.textMuted} name="flag-outline" size={18} />
                          <Text style={[styles.contestChoiceText, closestToPin && styles.contestChoiceTextActive]}>Closest to pin</Text>
                        </Pressable>
                        <Pressable onPress={() => setLongestDrive((current) => !current)} style={[styles.contestChoice, longestDrive && styles.contestChoiceActive]}>
                          <Ionicons color={longestDrive ? '#d7b768' : palette.textMuted} name="golf-outline" size={18} />
                          <Text style={[styles.contestChoiceText, longestDrive && styles.contestChoiceTextActive]}>Longest drive</Text>
                        </Pressable>
                      </View>
                      {closestToPin ? <View style={styles.ctpSetupCard}>
                        <Text style={styles.matchupSideLabel}>Closest to the Pin setup</Text>
                        <Text style={styles.matchupHint}>{closestToPinSetup.multipleDays ? 'Set the par 3s and yardages separately for each day.' : 'Set each par-3 distance for the tournament.'}</Text>
                        {tournamentDays.length > 1 ? <Pressable onPress={() => setClosestToPinSetup((current) => ({ ...current, multipleDays: !current.multipleDays, days: !current.multipleDays ? tournamentDays.map((day) => ({ day, distances: current.days?.find((item) => item.day === day)?.distances || current.distances, holeNumbers: current.days?.find((item) => item.day === day)?.holeNumbers || current.holeNumbers || [], courseName: current.days?.find((item) => item.day === day)?.courseName || current.courseName || '' })) : current.days }))} style={[styles.contestChoice, closestToPinSetup.multipleDays && styles.contestChoiceActive]}><Ionicons color={closestToPinSetup.multipleDays ? '#d7b768' : palette.textMuted} name="calendar-outline" size={18} /><Text style={[styles.contestChoiceText, closestToPinSetup.multipleDays && styles.contestChoiceTextActive]}>Configure par 3s by day</Text></Pressable> : null}
                        {(closestToPinSetup.multipleDays && tournamentDays.length ? tournamentDays : ['']).map((day, dayIndex) => {
                          const distances = day ? getClosestToPinDayDistances(day) : closestToPinSetup.distances
                          const holeNumbers = day ? closestToPinSetup.days?.find((item) => item.day === day)?.holeNumbers || closestToPinSetup.holeNumbers || [] : closestToPinSetup.holeNumbers || []
                          const courseName = day ? closestToPinSetup.days?.find((item) => item.day === day)?.courseName || closestToPinSetup.courseName || '' : closestToPinSetup.courseName || ''
                          const updateDistances = (update: (items: string[]) => string[]) => day ? updateClosestToPinDayDistances(day, update) : setClosestToPinSetup((current) => { const nextDistances = update(current.distances); return { ...current, distances: nextDistances, par3Count: nextDistances.length } })
                          return <View key={day || 'tournament'} style={styles.ctpDaySetup}>
                            {closestToPinSetup.multipleDays ? <Text style={styles.ctpDayTitle}>Day {dayIndex + 1} · {readableDate(day)}</Text> : null}
                            <TextInput onChangeText={(value) => updateClosestToPinCourse(day, value)} placeholder="Course for this day" placeholderTextColor={palette.textMuted} style={styles.ctpCourseInput} value={courseName} />
                            <View style={styles.ctpCountRow}><Text style={styles.ctpCountLabel}>Par 3s</Text><View style={styles.ctpCountControls}><Pressable onPress={() => updateDistances((items) => items.length > 1 ? items.slice(0, -1) : items)} style={styles.ctpCountButton}><Ionicons color={palette.text} name="remove" size={16} /></Pressable><Text style={styles.ctpCountValue}>{distances.length}</Text><Pressable onPress={() => updateDistances((items) => [...items, ''])} style={styles.ctpCountButton}><Ionicons color={palette.text} name="add" size={16} /></Pressable></View></View>
                            {distances.map((distance, index) => <View key={index} style={styles.ctpDistanceRow}><Text style={styles.ctpHoleLabel}>Hole</Text><TextInput keyboardType="number-pad" maxLength={2} onChangeText={(value) => updateClosestToPinHoleNumber(day, index, value)} placeholder={String(index + 1)} placeholderTextColor={palette.textMuted} style={styles.ctpHoleNumberInput} value={holeNumbers[index] || ''} /><Text style={styles.ctpHoleLabel}>Yards</Text><TextInput keyboardType="number-pad" onChangeText={(value) => updateDistances((items) => items.map((item, itemIndex) => itemIndex === index ? value : item))} placeholder="—" placeholderTextColor={palette.textMuted} style={styles.ctpDistanceInput} value={distance || ''} /><Text style={styles.ctpYards}>yds</Text></View>)}
                          </View>
                        })}
                      </View> : null}
                    </View>
                    </> : null}
                    {isEditingMatchups && editForm.tournament_format === 'Stroke Play' ? (
                      <View style={styles.matchupBuilder}>
                        <Text style={styles.infoLabel}>Add a golfer manually</Text>
                        <Text style={styles.matchupHint}>Add golfers who are playing but have not joined the tournament in the app.</Text>
                        <View style={styles.manualParticipantRow}>
                          <Pressable onPress={() => void handlePickManualParticipantPhoto()} style={styles.manualParticipantPhoto}>
                            {manualParticipantPhotoUrl ? <Image source={{ uri: manualParticipantPhotoUrl }} style={styles.teamLogoImage} /> : <Ionicons color={palette.aqua} name="camera-outline" size={21} />}
                          </Pressable>
                          <View style={styles.manualParticipantFields}>
                            <TextInput onChangeText={setManualParticipantName} placeholder="Golfer name" placeholderTextColor={palette.textMuted} style={styles.teamNameInput} value={manualParticipantName} />
                            <TextInput keyboardType="decimal-pad" onChangeText={setManualParticipantHandicap} placeholder="Handicap (optional)" placeholderTextColor={palette.textMuted} style={styles.manualHandicapInput} value={manualParticipantHandicap} />
                          </View>
                        </View>
                        <Pressable onPress={addManualParticipant} style={styles.addMatchupButton}><Text style={styles.addMatchupButtonText}>Add golfer to roster</Text></Pressable>
                        {manualParticipants.length ? <ScrollView horizontal contentContainerStyle={styles.manualRosterStrip} showsHorizontalScrollIndicator={false}>{manualParticipants.map((participant) => <Pressable key={participant.id} onPress={() => setManualParticipants((current) => current.filter((item) => item.id !== participant.id))} style={styles.manualRosterGolfer}><Avatar label={participant.name} size={42} uri={participant.avatarUrl} /><Text numberOfLines={1} style={styles.manualRosterName}>{participant.name.split(' ')[0]}</Text><Ionicons color={palette.textMuted} name="close-circle" size={14} style={styles.manualRosterRemove} /></Pressable>)}</ScrollView> : null}
                      </View>
                    ) : null}
                    {isEditingMatchups && editForm.tournament_format !== 'Stroke Play' ? (
                      <>
                      <View style={styles.matchupBuilder}>
                        <Text style={styles.infoLabel}>Add a golfer manually</Text>
                        <Text style={styles.matchupHint}>Use this for a golfer who is not yet in the tournament roster.</Text>
                        <View style={styles.manualParticipantRow}>
                          <Pressable onPress={() => void handlePickManualParticipantPhoto()} style={styles.manualParticipantPhoto}>
                            {manualParticipantPhotoUrl ? <Image source={{ uri: manualParticipantPhotoUrl }} style={styles.teamLogoImage} /> : <Ionicons color={palette.aqua} name="camera-outline" size={21} />}
                          </Pressable>
                          <View style={styles.manualParticipantFields}>
                            <TextInput onChangeText={setManualParticipantName} placeholder="Golfer name" placeholderTextColor={palette.textMuted} style={styles.teamNameInput} value={manualParticipantName} />
                            <TextInput keyboardType="decimal-pad" onChangeText={setManualParticipantHandicap} placeholder="Handicap (optional)" placeholderTextColor={palette.textMuted} style={styles.manualHandicapInput} value={manualParticipantHandicap} />
                          </View>
                        </View>
                        <Pressable onPress={addManualParticipant} style={styles.addMatchupButton}><Text style={styles.addMatchupButtonText}>Add golfer to matchup list</Text></Pressable>
                        {manualParticipants.length ? <ScrollView horizontal contentContainerStyle={styles.manualRosterStrip} showsHorizontalScrollIndicator={false}>{manualParticipants.map((participant) => <Pressable key={participant.id} onPress={() => setManualParticipants((current) => current.filter((item) => item.id !== participant.id))} style={styles.manualRosterGolfer}><Avatar label={participant.name} size={42} uri={participant.avatarUrl} /><Text numberOfLines={1} style={styles.manualRosterName}>{participant.name.split(' ')[0]}</Text><Ionicons color={palette.textMuted} name="close-circle" size={14} style={styles.manualRosterRemove} /></Pressable>)}</ScrollView> : null}
                      </View>
                      <View style={styles.matchupSetupCard}>
                        <View style={styles.matchupSetupHeader}><Ionicons color={palette.gold} name="git-compare-outline" size={18} /><Text style={styles.infoLabel}>Matchup builder</Text></View>
                        <Text style={styles.matchupHint}>Set the format, day, and pairing for each match.</Text>
                        <Text style={styles.infoLabel}>Match type</Text>
                        <View style={styles.matchTypeChoices}>
                          {['Stroke Play', 'Match Play', 'Scramble', 'Best Ball', 'Alternate Shot', 'Other'].map((format) => <Pressable key={format} onPress={() => setMatchupFormat(format)} style={[styles.matchTypeChoice, matchupFormat === format && styles.matchTypeChoiceActive]}><Text style={[styles.matchTypeChoiceText, matchupFormat === format && styles.matchTypeChoiceTextActive]}>{format}</Text></Pressable>)}
                        </View>
                        {tournamentDays.length ? <><Text style={styles.infoLabel}>Tournament day</Text><View style={styles.matchTypeChoices}>{tournamentDays.map((day, index) => <Pressable key={day} onPress={() => setMatchupDay(day)} style={[styles.matchTypeChoice, (matchupDay || tournamentDays[0]) === day && styles.matchTypeChoiceActive]}><Text style={[styles.matchTypeChoiceText, (matchupDay || tournamentDays[0]) === day && styles.matchTypeChoiceTextActive]}>Day {index + 1}</Text></Pressable>)}</View></> : null}
                        <View style={styles.matchupScheduleFields}>
                          <TextInput onChangeText={setMatchupCourseName} placeholder="Course name" placeholderTextColor={palette.textMuted} style={styles.matchupScheduleInput} value={matchupCourseName} />
                          <TextInput onChangeText={setMatchupTeeTime} placeholder="Tee time" placeholderTextColor={palette.textMuted} style={styles.matchupScheduleInput} value={matchupTeeTime} />
                        </View>
                        <Text style={styles.infoLabel}>Build matchups</Text>
                        <Text style={styles.matchupHint}>Choose—or drag—a golfer into each side, then add the pairing.</Text>
                        <View style={styles.matchupSelectedRow}>
                          <Pressable onPress={() => setLeftMatchupUserId('')} style={[styles.matchupSelectedSlot, !leftMatchupUserId && styles.matchupSelectedSlotEmpty]}>
                            {leftMatchupUserId && participantById.get(leftMatchupUserId) ? <><Avatar label={participantById.get(leftMatchupUserId)?.name || 'Golfer'} size={40} uri={participantById.get(leftMatchupUserId)?.avatarUrl} /><Text numberOfLines={1} style={styles.matchupSelectedName}>{participantById.get(leftMatchupUserId)?.name.split(' ')[0]}</Text><Ionicons color={palette.textMuted} name="close-circle" size={15} style={styles.matchupSelectedRemove} /></> : <Text style={styles.matchupSlotHint}>{editForm.tournament_format === 'Ryder Cup' ? teams[0]?.name || 'Team one' : 'Player one'}</Text>}
                          </Pressable>
                          <Text style={styles.matchupVs}>VS.</Text>
                          <Pressable onPress={() => setRightMatchupUserId('')} style={[styles.matchupSelectedSlot, !rightMatchupUserId && styles.matchupSelectedSlotEmpty]}>
                            {rightMatchupUserId && participantById.get(rightMatchupUserId) ? <><Avatar label={participantById.get(rightMatchupUserId)?.name || 'Golfer'} size={40} uri={participantById.get(rightMatchupUserId)?.avatarUrl} /><Text numberOfLines={1} style={styles.matchupSelectedName}>{participantById.get(rightMatchupUserId)?.name.split(' ')[0]}</Text><Ionicons color={palette.textMuted} name="close-circle" size={15} style={styles.matchupSelectedRemove} /></> : <Text style={styles.matchupSlotHint}>{editForm.tournament_format === 'Ryder Cup' ? teams[1]?.name || 'Team two' : 'Player two'}</Text>}
                          </Pressable>
                        </View>
                        <View style={styles.matchupChooserRow}>
                          <View style={styles.matchupChoiceColumn}>
                            <Text style={styles.matchupSideLabel}>{editForm.tournament_format === 'Ryder Cup' ? teams[0]?.name || 'Team one' : 'Player one'}</Text>
                            {matchupLeftOptions.map((participant) => {
                              const active = leftMatchupUserId === participant.id
                              return (
                                <Pressable key={participant.id} onPress={() => setLeftMatchupUserId(participant.id)} style={[styles.matchupPersonChoice, active && styles.matchupPersonChoiceActive]}>
                                  <Avatar label={participant.name} size={30} uri={participant.avatarUrl} />
                                  <Text numberOfLines={1} style={styles.matchupPersonChoiceText}>{participant.name}</Text>
                                </Pressable>
                              )
                            })}
                          </View>
                          <Text style={styles.matchupVs}>VS.</Text>
                          <View style={styles.matchupChoiceColumn}>
                            <Text style={styles.matchupSideLabel}>{editForm.tournament_format === 'Ryder Cup' ? teams[1]?.name || 'Team two' : 'Player two'}</Text>
                            {matchupRightOptions.map((participant) => {
                              const active = rightMatchupUserId === participant.id
                              return (
                                <Pressable key={participant.id} onPress={() => setRightMatchupUserId(participant.id)} style={[styles.matchupPersonChoice, active && styles.matchupPersonChoiceActive]}>
                                  <Avatar label={participant.name} size={30} uri={participant.avatarUrl} />
                                  <Text numberOfLines={1} style={styles.matchupPersonChoiceText}>{participant.name}</Text>
                                </Pressable>
                              )
                            })}
                          </View>
                        </View>
                        {['scramble', 'best ball'].includes(matchupFormat.toLowerCase()) ? <View style={styles.teamPartnerChooser}>
                          <Text style={styles.matchupHint}>Choose a teammate for each side.</Text>
                          <View style={styles.matchupChooserRow}>
                            <View style={styles.matchupChoiceColumn}>
                              <Text style={styles.matchupSideLabel}>Side one teammate</Text>
                              {participantOptions.filter((participant) => participant.id !== leftMatchupUserId).map((participant) => <Pressable key={participant.id} onPress={() => setLeftPartnerUserId(participant.id)} style={[styles.matchupPersonChoice, leftPartnerUserId === participant.id && styles.matchupPersonChoiceActive]}><Avatar label={participant.name} size={30} uri={participant.avatarUrl} /><Text numberOfLines={1} style={styles.matchupPersonChoiceText}>{participant.name}</Text></Pressable>)}
                            </View>
                            <Text style={styles.matchupVs}>VS.</Text>
                            <View style={styles.matchupChoiceColumn}>
                              <Text style={styles.matchupSideLabel}>Side two teammate</Text>
                              {participantOptions.filter((participant) => participant.id !== rightMatchupUserId).map((participant) => <Pressable key={participant.id} onPress={() => setRightPartnerUserId(participant.id)} style={[styles.matchupPersonChoice, rightPartnerUserId === participant.id && styles.matchupPersonChoiceActive]}><Avatar label={participant.name} size={30} uri={participant.avatarUrl} /><Text numberOfLines={1} style={styles.matchupPersonChoiceText}>{participant.name}</Text></Pressable>)}
                            </View>
                          </View>
                        </View> : null}
                        {editForm.tournament_format === 'Ryder Cup' && (!matchupLeftOptions.length || !matchupRightOptions.length) ? <Text style={styles.matchupHint}>Add golfers to both team rosters before building matchups.</Text> : null}
                        {editForm.tournament_format !== 'Ryder Cup' && participantOptions.length < 2 ? <Text style={styles.matchupHint}>Add at least two people to create matchups.</Text> : null}
                        <Pressable onPress={addMatchup} style={styles.addMatchupButton}><Text style={styles.addMatchupButtonText}>Add matchup</Text></Pressable>
                        {matchupsByDay.map(([day, dayMatchups], dayIndex) => <View key={day} style={styles.savedMatchupDay}>
                          <View style={styles.savedMatchupDayHeader}><Text style={styles.savedMatchupDayTitle}>Day {dayIndex + 1}</Text><Text style={styles.savedMatchupDayDate}>{day === 'Unscheduled' ? 'Unscheduled' : readableDate(day)}</Text></View>
                          {dayMatchups.map((matchup) => {
                            const left = participantById.get(matchup.leftUserId)
                            const right = participantById.get(matchup.rightUserId)
                            if (!left || !right) return null
                            const leftSide = [left, matchup.leftPartnerUserId ? participantById.get(matchup.leftPartnerUserId) : null].filter(Boolean) as typeof left[]
                            const rightSide = [right, matchup.rightPartnerUserId ? participantById.get(matchup.rightPartnerUserId) : null].filter(Boolean) as typeof right[]
                            return <View key={matchup.id} style={styles.savedMatchupCard}>
                              <View style={styles.savedMatchupSide}>{leftSide.map((player) => <View key={player.id} style={styles.savedMatchupGolfer}><Avatar label={player.name} size={34} uri={player.avatarUrl} /><Text numberOfLines={1} style={styles.savedMatchupName}>{player.name.split(' ')[0]}</Text></View>)}</View>
                              <View style={styles.savedMatchupMiddle}><Text style={styles.savedMatchupVs}>VS.</Text><Text numberOfLines={1} style={styles.savedMatchupFormat}>{matchup.format || 'Match Play'}</Text></View>
                              <View style={styles.savedMatchupSide}>{rightSide.map((player) => <View key={player.id} style={styles.savedMatchupGolfer}><Avatar label={player.name} size={34} uri={player.avatarUrl} /><Text numberOfLines={1} style={styles.savedMatchupName}>{player.name.split(' ')[0]}</Text></View>)}</View>
                              <Pressable accessibilityLabel="Delete matchup" onPress={() => setMatchups((current) => current.filter((item) => item.id !== matchup.id))} style={styles.savedMatchupDelete}><Ionicons color={palette.textMuted} name="close" size={16} /></Pressable>
                            </View>
                          })}
                        </View>)}
                      </View>
                      </>
                    ) : null}
                  </View>
                ) : null}
                {!isEditingMatchups && (isTournament || editForm.group_type === 'tournament') ? <View style={styles.accessHeading}><Text style={styles.infoLabel}>Tournament access</Text><Text style={styles.matchupHint}>Public lets people join immediately. Private requires your approval.</Text></View> : null}
                {!isEditingMatchups ? <View style={styles.typeRow}>
                  {[
                    { label: 'Public', value: false, icon: 'globe-outline' as const },
                    { label: 'Private', value: true, icon: 'lock-closed-outline' as const }
                  ].map((option) => (
                    <Pressable key={option.label} onPress={() => setEditForm((current) => ({ ...current, is_private: option.value }))} style={[styles.typeChip, editForm.is_private === option.value && styles.typeChipActive]}>
                      <Ionicons color={editForm.is_private === option.value ? palette.aqua : palette.textMuted} name={option.icon} size={17} />
                      <Text style={[styles.typeLabel, editForm.is_private === option.value && styles.typeLabelActive]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View> : null}
                <View style={styles.editActions}>
                  <PrimaryButton label="Cancel" variant="ghost" onPress={() => { setIsEditing(false); setIsEditingMatchups(false) }} />
                  <PrimaryButton
                    label={savingEdit ? 'Saving...' : isEditingMatchups ? 'Save Matchups' : 'Save Group'}
                    loading={savingEdit}
                    onPress={handleSaveEdit}
                  />
                </View>
              </>
            ) : (
              group?.description?.trim() && group.description.trim().toLowerCase() !== group.name.trim().toLowerCase()
                ? <Text style={styles.body}>{group.description}</Text>
                : null
            )}
            {isTournament && !isEditing ? (
              <>
              <View style={styles.tournamentInfoCard}>
                <View style={styles.tournamentInfoLead}><View style={styles.tournamentInfoIcon}><Ionicons color="#d7b768" name="trophy-outline" size={21} /></View><Text style={styles.infoLabel}>Tournament details</Text></View>
                <View style={styles.tournamentInfoGrid}>
                  <View style={[styles.tournamentInfoTile, styles.tournamentInfoDateTile]}><Ionicons color="#d7b768" name="calendar-outline" size={17} /><View style={styles.tournamentInfoTileCopy}><Text style={styles.tournamentInfoTileLabel}>Dates</Text><Text style={styles.tournamentInfoTileValue}>{group?.tournament_date ? `${new Date(`${group.tournament_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}${group?.tournament_end_date && group.tournament_end_date !== group.tournament_date ? ` – ${new Date(`${group.tournament_end_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}` : `, ${new Date(`${group.tournament_date}T12:00:00`).getFullYear()}`}` : 'To be announced'}</Text></View></View>
                  <View style={styles.tournamentInfoTile}><Ionicons color="#8be9f7" name="golf-outline" size={17} /><View style={styles.tournamentInfoTileCopy}><Text style={styles.tournamentInfoTileLabel}>Format</Text><Text style={styles.tournamentInfoTileValue}>{group?.tournament_format || 'Stroke Play'}</Text></View></View>
                  {group?.tournament_type && group.tournament_type.trim().toLowerCase() !== (group.tournament_format || '').trim().toLowerCase() ? <View style={styles.tournamentInfoTile}><Ionicons color="#8be9f7" name="flag-outline" size={17} /><View style={styles.tournamentInfoTileCopy}><Text style={styles.tournamentInfoTileLabel}>Division</Text><Text style={styles.tournamentInfoTileValue}>{group.tournament_type}</Text></View></View> : null}
                </View>
              </View>
                {closestToPin ? <View style={styles.tournamentContestCard}>
                  {closestToPin ? <View style={styles.ctpResultsBlock}>
                    <View style={styles.tournamentContestRow}><Ionicons color="#d7b768" name="flag-outline" size={18} /><Text style={styles.tournamentContestText}>Closest to the Pin</Text></View>
                    {closestToPinEntriesByDay.map((dayEntries) => <View key={dayEntries[0]?.day || 'tournament'} style={styles.ctpDisplayDay}>
                      {closestToPinSetup.multipleDays ? <Text style={styles.ctpDisplayDayTitle}>Day {dayEntries[0]?.dayIndex + 1}{dayEntries[0]?.courseName ? ` · ${dayEntries[0].courseName}` : ''}</Text> : dayEntries[0]?.courseName ? <Text style={styles.ctpDisplayDayTitle}>{dayEntries[0].courseName}</Text> : null}
                      {dayEntries.map((entry) => {
                        const winner = closestToPinWinners[entry.key] ? participantById.get(closestToPinWinners[entry.key]) : null
                        return <Pressable disabled={!isOwner} key={entry.key} onPress={() => setClosestToPinPickerKey(entry.key)} style={styles.ctpResultRow}>
                          <View style={styles.ctpResultDetails}><View style={styles.ctpResultFlag}><Ionicons color="#d7b768" name="flag" size={14} /></View><View><Text style={styles.ctpResultTitle}>Hole {entry.holeNumber}</Text><Text style={styles.ctpResultMeta}>{entry.distance ? `${entry.distance} yds` : 'Distance TBD'}</Text></View></View>
                          {winner ? <View style={styles.ctpWinner}><Avatar label={winner.name} size={28} uri={winner.avatarUrl} /><Text numberOfLines={1} style={styles.ctpWinnerName}>{winner.name}</Text>{isOwner ? <Ionicons color={palette.aqua} name="pencil" size={13} /> : null}</View> : <Text style={styles.ctpSelectWinner}>{isOwner ? 'Select winner' : 'Winner TBD'}</Text>}
                        </Pressable>
                      })}
                    </View>)}
                  </View> : null}
                </View> : null}
                {longestDrive ? <View style={styles.tournamentContestCard}><View style={styles.tournamentContestRow}><Ionicons color="#d7b768" name="golf-outline" size={18} /><Text style={styles.tournamentContestText}>Longest Drive</Text></View></View> : null}
              </>
            ) : null}
          </View>
        ) : activeSection === 'scores' && isTournament ? (
          <View style={styles.scoresFeed}>
            {(group?.tournament_format || 'Stroke Play') === 'Stroke Play' ? <>
              {isMember ? <View style={styles.scoreEntry}><TextInput keyboardType="number-pad" onChangeText={setScoreDraft} placeholder="Your total score" placeholderTextColor={palette.textMuted} style={styles.scoreInput} value={scoreDraft} /><PrimaryButton label={scoreSaving ? 'Saving...' : 'Post Score'} loading={scoreSaving} onPress={handleSaveTournamentScore} /></View> : <Text style={styles.body}>Join this tournament to post your score.</Text>}
              <View style={styles.leaderboardCard}>
              <View style={styles.leaderboardHeader}>
                <View style={styles.leaderboardTitleRow}>
                  <Ionicons color="#d7b768" name="trophy" size={19} />
                  <Text style={styles.leaderboardTitle}>Leaderboard</Text>
                </View>
                <Text style={styles.leaderboardMeta}>{`${tournamentLeaderboard.length} people`}</Text>
              </View>
              {tournamentLeaderboard.map((entry, index) => (
                <View key={entry.member.id} style={styles.leaderboardRow}>
                  <Text style={styles.scorePlace}>{entry.score ? index + 1 : '—'}</Text>
                  <Avatar
                    label={entry.name}
                    size={42}
                    uri={entry.member.user_profiles?.avatar_url}
                  />
                  <Text numberOfLines={1} style={styles.scoreName}>{entry.name}</Text>
                  <View style={styles.leaderboardScore}>
                    <Text style={entry.score ? styles.scoreTotal : styles.leaderboardPending}>
                      {entry.score ? entry.score.total_score : '—'}
                    </Text>
                    <Text style={styles.leaderboardScoreLabel}>{entry.score ? 'TOTAL' : 'PENDING'}</Text>
                  </View>
                </View>
              ))}
              {tournamentLeaderboard.length === 0 ? <Text style={styles.body}>Participants will appear here as they join.</Text> : null}
              </View>
            </> : <View style={styles.matchupScoresList}>
              {teamScoreboard.length === 2 ? <View style={styles.teamScoreboard}>
                <Text style={styles.teamScoreboardTitle}>Team scoreboard</Text>
                <View style={styles.teamScoreboardRow}>
                  {teamScoreboard.map((team) => <View key={team.id} style={styles.teamScoreboardTeam}>
                    {team.logoUrl ? <Image source={{ uri: team.logoUrl }} style={styles.teamScoreboardLogo} /> : <Ionicons color="#d7b768" name="shield-outline" size={25} />}
                    <Text numberOfLines={1} style={styles.teamScoreboardName}>{team.name || 'Team'}</Text>
                    <Text style={styles.teamScoreboardPoints}>{team.points}</Text>
                    <Text style={styles.teamScoreboardLabel}>POINTS</Text>
                  </View>)}
                </View>
              </View> : null}
              {matchupsByDay.map(([day, dayMatchups], dayIndex) => <View key={day} style={styles.matchupDaySection}>
                <View style={styles.matchupDayHeader}>
                  <Text style={styles.matchupDayTitle}>Day {dayIndex + 1}</Text>
                  <Text style={styles.matchupDayDate}>{day === 'Unscheduled' ? 'Schedule pending' : new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                </View>
              {dayMatchups.map((matchup) => {
                const left = participantById.get(matchup.leftUserId)
                const right = participantById.get(matchup.rightUserId)
                const winner = getMatchupWinner(matchup)
                if (!left || !right) return null
                const leftPartner = matchup.leftPartnerUserId ? participantById.get(matchup.leftPartnerUserId) : null
                const rightPartner = matchup.rightPartnerUserId ? participantById.get(matchup.rightPartnerUserId) : null
                const leftLabel = leftPartner ? `${left.name} & ${leftPartner.name}` : left.name
                const rightLabel = rightPartner ? `${right.name} & ${rightPartner.name}` : right.name
                const isMatchPlay = (matchup.format || group?.tournament_format || '').toLowerCase().includes('match play')
                const isTeamFormat = ['scramble', 'best ball', 'alternate shot'].includes((matchup.format || '').toLowerCase())
                const leftTeam = isTeamFormat ? teams.find((team) => team.memberIds.includes(matchup.leftUserId)) : null
                const rightTeam = isTeamFormat ? teams.find((team) => team.memberIds.includes(matchup.rightUserId)) : null
                const leftDisplayLabel = leftLabel
                const rightDisplayLabel = rightLabel
                const leftWinnerName = leftTeam?.name ? (leftTeam.name.toLowerCase().startsWith('team ') ? leftTeam.name : `Team ${leftTeam.name}`) : leftLabel
                const rightWinnerName = rightTeam?.name ? (rightTeam.name.toLowerCase().startsWith('team ') ? rightTeam.name : `Team ${rightTeam.name}`) : rightLabel
                const leftAdjustedScore = isTeamFormat ? null : getAdjustedTournamentScore(matchup.leftScore, left.handicap)
                const rightAdjustedScore = isTeamFormat ? null : getAdjustedTournamentScore(matchup.rightScore, right.handicap)
                const matchPlayStatus = isMatchPlay ? getMatchPlayStatus(matchup) : null
                const strokeMargin = !isMatchPlay && matchup.leftScore !== null && matchup.leftScore !== undefined && matchup.rightScore !== null && matchup.rightScore !== undefined && matchup.leftScore !== matchup.rightScore ? Math.abs(matchup.leftScore - matchup.rightScore) : null
                const winnerName = winner === 'left' ? leftWinnerName : winner === 'right' ? rightWinnerName : null
                return <View key={matchup.id} style={styles.matchupScoreCard}>
                  {matchup.courseName ? <Text numberOfLines={1} style={styles.matchupCourseBadge}>{matchup.courseName}</Text> : null}
                  <View style={styles.matchupScoreRow}>
                    <View style={styles.matchupScoreGolfer}><View style={styles.matchupTeamAvatars}><Avatar label={left.name} size={42} uri={left.avatarUrl} />{leftPartner ? <Avatar label={leftPartner.name} size={42} uri={leftPartner.avatarUrl} /> : null}</View><View style={styles.matchupNameLine}><Text numberOfLines={2} style={styles.matchupGolferName}>{leftDisplayLabel}</Text>{winner === 'left' ? <Ionicons color={palette.gold} name="trophy" size={16} /> : null}</View>{isEditingMatchupScores && !isMatchPlay ? <TextInput keyboardType="number-pad" onChangeText={(value) => setMatchups((current) => current.map((item) => item.id === matchup.id ? { ...item, leftScore: value.trim() ? Number(value) : null } : item))} placeholder="—" placeholderTextColor={palette.textMuted} style={styles.matchupScoreInput} value={matchup.leftScore?.toString() || ''} /> : !isMatchPlay ? <View style={styles.matchupScoreReadout}><Text style={styles.matchupScoreValue}>{matchup.leftScore ?? '—'}</Text>{leftAdjustedScore !== null ? <Text style={styles.matchupAdjustedScore}>({leftAdjustedScore})</Text> : null}</View> : null}</View>
                    <View style={styles.matchupScheduleCenter}><Text style={styles.matchupVs}>VS.</Text><Text numberOfLines={1} style={styles.matchupFormatUnderVs}>{matchup.format || group?.tournament_format || 'Match Play'}</Text></View>
                    <View style={styles.matchupScoreGolfer}><View style={styles.matchupTeamAvatars}><Avatar label={right.name} size={42} uri={right.avatarUrl} />{rightPartner ? <Avatar label={rightPartner.name} size={42} uri={rightPartner.avatarUrl} /> : null}</View><View style={styles.matchupNameLine}><Text numberOfLines={2} style={styles.matchupGolferName}>{rightDisplayLabel}</Text>{winner === 'right' ? <Ionicons color={palette.gold} name="trophy" size={16} /> : null}</View>{isEditingMatchupScores && !isMatchPlay ? <TextInput keyboardType="number-pad" onChangeText={(value) => setMatchups((current) => current.map((item) => item.id === matchup.id ? { ...item, rightScore: value.trim() ? Number(value) : null } : item))} placeholder="—" placeholderTextColor={palette.textMuted} style={styles.matchupScoreInput} value={matchup.rightScore?.toString() || ''} /> : !isMatchPlay ? <View style={styles.matchupScoreReadout}><Text style={styles.matchupScoreValue}>{matchup.rightScore ?? '—'}</Text>{rightAdjustedScore !== null ? <Text style={styles.matchupAdjustedScore}>({rightAdjustedScore})</Text> : null}</View> : null}</View>
                  </View>
                  {isEditingMatchupScores && isMatchPlay ? <View style={styles.holeWinnerEditor}>
                    <Text style={styles.holeWinnerTitle}>Hole-by-hole result</Text>
                    {Array.from({ length: 18 }, (_, index) => index + 1).map((hole) => {
                      const selected = matchup.holeWinners?.[String(hole)]
                      return <View key={hole} style={styles.holeWinnerRow}><Text style={styles.holeNumber}>#{hole}</Text><Pressable onPress={() => setMatchups((current) => current.map((item) => item.id === matchup.id ? { ...item, holeWinners: { ...item.holeWinners, [hole]: 'left' } } : item))} style={[styles.holeWinnerChoice, selected === 'left' && styles.holeWinnerChoiceActive]}><Text numberOfLines={1} style={styles.holeWinnerText}>{left.name}</Text></Pressable><Pressable onPress={() => setMatchups((current) => current.map((item) => item.id === matchup.id ? { ...item, holeWinners: { ...item.holeWinners, [hole]: 'halve' } } : item))} style={[styles.holeWinnerChoice, selected === 'halve' && styles.holeWinnerChoiceActive]}><Text style={styles.holeWinnerText}>Half</Text></Pressable><Pressable onPress={() => setMatchups((current) => current.map((item) => item.id === matchup.id ? { ...item, holeWinners: { ...item.holeWinners, [hole]: 'right' } } : item))} style={[styles.holeWinnerChoice, selected === 'right' && styles.holeWinnerChoiceActive]}><Text numberOfLines={1} style={styles.holeWinnerText}>{right.name}</Text></Pressable></View>
                    })}
                  </View> : null}
                  {isOwner ? <Pressable accessibilityLabel="Edit matchup details" onPress={() => setMatchupSettingsId(matchup.id)} style={styles.matchupDetailsButton}><Ionicons color="rgba(255,255,255,0.64)" name="settings-outline" size={19} /></Pressable> : null}
                  {isOwner ? <Pressable accessibilityLabel="Open matchup scorecard" onPress={() => setScorecardMatchupId(matchup.id)} style={styles.matchupScorecardButton}><Ionicons color="rgba(255,255,255,0.64)" name="reader-outline" size={20} /></Pressable> : null}
                  {isEditingMatchupScores ? <PrimaryButton label={savingMatchupId === matchup.id ? 'Saving...' : 'Save Result'} loading={savingMatchupId === matchup.id} onPress={() => void handleSaveMatchupScore(matchup.id)} /> : matchPlayStatus ? <Text style={styles.matchupWinnerText}>{matchPlayStatus.leader ? `${matchPlayStatus.label} • ${matchPlayStatus.leader === 'left' ? leftWinnerName : rightWinnerName}` : matchPlayStatus.label}</Text> : winner ? <Text style={styles.matchupWinnerText}>{`${winnerName} wins`}</Text> : <Text style={styles.matchupTypeFooter}>{matchup.format || group?.tournament_format || 'Match format TBD'}</Text>}
                  {matchup.teeTime ? <View style={styles.matchupTeeTimeFooter}><Ionicons color={palette.textMuted} name="time-outline" size={13} /><Text style={styles.matchupTeeTimeFooterText}>{matchup.teeTime}</Text></View> : null}
                </View>
              })}
              </View>)}
              {!matchups.length ? <Text style={styles.body}>The tournament admin has not added matchups yet.</Text> : null}
            </View>}
          </View>
        ) : activeSection === 'members' ? (
          <View style={styles.membersFeed}>
            {isOwner && pendingMembers.length ? (
              <View style={styles.inviteSection}>
                <Text style={styles.inviteTitle}>Join requests</Text>
                {pendingMembers.map((member) => (
                  <View key={member.id} style={styles.memberRow}>
                    <View style={styles.memberIdentity}>
                      <Avatar label={member.user_profiles?.first_name || member.user_profiles?.username || 'G'} size={42} uri={member.user_profiles?.avatar_url} />
                      <Text style={styles.memberName}>{member.user_profiles?.first_name || member.user_profiles?.username || 'Golfer'}</Text>
                    </View>
                    <View style={styles.requestActions}>
                      <Pressable onPress={() => void handleReviewRequest(member, 'decline')} style={styles.roleButton}><Text style={styles.roleButtonText}>Decline</Text></Pressable>
                      <Pressable onPress={() => void handleReviewRequest(member, 'approve')} style={styles.roleButton}><Text style={styles.roleButtonText}>Approve</Text></Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
            {members.length === 0 ? (
              <Text style={styles.body}>
                No members are visible yet. Once people join, this group roster will start filling in.
              </Text>
            ) : null}
            {isTournament && (group?.tournament_format || 'Stroke Play') !== 'Stroke Play' ? (
              <View style={styles.tournamentPeopleSection}>
                {(group?.tournament_format || '') === 'Ryder Cup' ? teams.slice(0, 2).map((team) => (
                  <View key={team.id} style={styles.teamRosterCard}>
                    <View style={styles.teamRosterHeader}>
                      {team.logoUrl ? <Image source={{ uri: team.logoUrl }} style={styles.teamRosterLogo} /> : <Ionicons color="#d7b768" name="shield-outline" size={24} />}
                      <Text style={styles.teamRosterTitle}>{team.name || 'Team'}</Text>
                    </View>
                    {team.memberIds.map((memberId) => {
                      const participant = participantById.get(memberId)
                      return participant ? <View key={memberId} style={styles.teamRosterPerson}><Avatar label={participant.name} size={34} uri={participant.avatarUrl} /><Text style={styles.memberName}>{participant.name}</Text><Text style={styles.matchupHandicap}>HCP {participant.handicap ?? '—'}</Text></View> : null
                    })}
                    {!team.memberIds.length ? <Text style={styles.body}>No people assigned yet.</Text> : null}
                  </View>
                )) : null}
              </View>
            ) : null}
            {(!isTournament || (group?.tournament_format || 'Stroke Play') !== 'Ryder Cup') && members.slice(0, 10).map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberIdentity}>
                  <Avatar
                    label={member.user_profiles?.first_name || member.user_profiles?.username || 'UGC'}
                    size={46}
                    uri={member.user_profiles?.avatar_url}
                  />
                  <View style={styles.memberCopy}>
                    <Text style={styles.memberName}>
                      {member.user_profiles?.first_name || member.user_profiles?.username || 'UGC Member'}
                    </Text>
                    <Text style={styles.memberMeta}>
                      {(member.role || 'member').replace(/^./, (char) => char.toUpperCase())}
                      {member.user_profiles?.location ? ` • ${member.user_profiles.location}` : ''}
                    </Text>
                  </View>
                </View>
                {isOwner && group?.creator_id === user?.id && member.user_id !== user?.id ? (
                  <Pressable
                    onPress={() =>
                      void handleSetMemberRole(
                        member,
                        (member.role || '').toLowerCase() === 'admin' ? 'member' : 'admin'
                      )
                    }
                    style={styles.roleButton}
                  >
                    <Text style={styles.roleButtonText}>
                      {(member.role || '').toLowerCase() === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
            {isOwner ? (
              <View style={styles.inviteSection}>
                <Text style={styles.inviteTitle}>{isTournament ? 'Add people' : 'Add members'}</Text>
                <Text style={styles.body}>Invite golfers from your connections directly into this {isTournament ? 'tournament' : 'group'}.</Text>
                {inviteableConnections.length === 0 ? <Text style={styles.body}>Everyone in your network is already here, or you have no connections yet.</Text> : inviteableConnections.slice(0, 6).map((connection) => (
                  <View key={connection.id} style={styles.inviteRow}>
                    <View style={styles.invitePerson}>
                      <Avatar label={[connection.first_name, connection.last_name].filter(Boolean).join(' ') || connection.username || 'UGC'} size={48} uri={connection.avatar_url} />
                      <View style={styles.inviteCopy}>
                        <Text style={styles.memberName}>{[connection.first_name, connection.last_name].filter(Boolean).join(' ') || connection.username || 'UGC Golfer'}</Text>
                        <Text style={styles.memberMeta}>{connection.location || 'Local golfer'}</Text>
                      </View>
                    </View>
                    <PrimaryButton label={pendingInviteUserIds.has(connection.id) ? 'Pending' : 'Add'} disabled={pendingInviteUserIds.has(connection.id)} loading={invitingId === connection.id} onPress={() => void handleInviteConnection(connection.id)} />
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.postsFeed}>
            {composerOpen && isMember ? (
              <View style={styles.composerPanel}>
                {replyingTo ? (
              <View style={styles.replyBanner}>
                <Text style={styles.replyBannerText}>Replying to a member post</Text>
                <Pressable onPress={() => setReplyingTo(null)}>
                  <Text style={styles.replyCancel}>Cancel</Text>
                </Pressable>
              </View>
                ) : null}
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder={isTournament ? 'Share a tournament update…' : 'Share an update with the group…'}
              placeholderTextColor={palette.textMuted}
              style={styles.composeInput}
              value={draft}
            />
            {postPhoto ? <View style={styles.postPhotoPreview}><Image source={{ uri: postPhoto.uri }} style={styles.postPhotoPreviewImage} /><Pressable accessibilityLabel="Remove post photo" onPress={() => setPostPhoto(null)} style={styles.postPhotoRemove}><Ionicons color="#ffffff" name="close" size={17} /></Pressable></View> : null}
            <View style={styles.composerActions}><Pressable accessibilityLabel="Add a photo" disabled={posting} onPress={() => void handlePickPostPhoto()} style={styles.composerPhotoButton}><Ionicons color={palette.aqua} name="image-outline" size={20} /><Text style={styles.composerPhotoButtonText}>Photo</Text></Pressable><Pressable disabled={posting} onPress={() => void handlePostMessage()} style={[styles.tournamentPostButton, posting && styles.tournamentPostButtonDisabled]}><Ionicons color={palette.ink} name="send" size={17} /><Text style={styles.tournamentPostButtonText}>{posting ? 'Posting…' : isTournament ? 'Post update' : 'Post'}</Text></Pressable></View>
              </View>
            ) : null}

            {messages.length === 0 ? (
              <Text style={styles.body}>No posts yet. Start the conversation for this group.</Text>
            ) : null}

            {messages.map((message) => {
              const post = unpackGroupPost(message.message_content)
              const isTournamentUpdate = Boolean(post.tournamentUpdate)
              return (
              <View key={message.id} style={[styles.messageCard, isTournament && styles.compactMessageCard, isTournamentUpdate && styles.tournamentUpdatePost]}>
                <View style={styles.messageTop}>
                  <View style={styles.memberIdentity}>
                    {isTournamentUpdate ? <View style={styles.tournamentUpdateIcon}><Ionicons color="#d7b768" name={post.tournamentUpdate === 'ctp' ? 'flag-outline' : 'trophy-outline'} size={16} /></View> : <Avatar label={formatAuthor(message)} size={isTournament ? 32 : 38} uri={message.user_profiles?.avatar_url} />}
                    <Text style={styles.memberName}>{isTournamentUpdate ? 'Tournament update' : formatAuthor(message)}</Text>
                  </View>
                  <Text style={styles.messageMeta}>
                    {message.created_at ? new Date(message.created_at).toLocaleDateString() : 'Now'}
                  </Text>
                </View>
                {post.imageUrl ? <Image source={{ uri: post.imageUrl || '' }} style={styles.groupPostImage} /> : null}
                {post.text ? <Text numberOfLines={isTournament ? 3 : undefined} style={[styles.body, isTournament && styles.compactMessageBody]}>{post.text}</Text> : null}
                {!isTournamentUpdate ? <View style={styles.messageActions}>
                  <Pressable onPress={() => void handleToggleLike(message.id, !!message.liked_by_user)}>
                    {isTournament ? <View style={styles.compactMessageAction}><Ionicons color={palette.aqua} name={message.liked_by_user ? 'heart' : 'heart-outline'} size={16} />{message.like_count ? <Text style={styles.messageAction}>{message.like_count}</Text> : null}</View> : <Text style={styles.messageAction}>{message.liked_by_user ? 'Unlike' : 'Like'}{message.like_count ? ` (${message.like_count})` : ''}</Text>}
                  </Pressable>
                  <Pressable onPress={() => { setReplyingTo(message.id); setComposerOpen(true) }}>
                    {isTournament ? <Ionicons color={palette.aqua} name="chatbubble-outline" size={16} /> : <Text style={styles.messageAction}>Reply</Text>}
                  </Pressable>
                </View> : null}
                {message.replies?.length ? (
                  <View style={styles.replies}>
                    {message.replies.map((reply) => (
                      <View key={reply.id} style={styles.replyCard}>
                        <Text style={styles.replyAuthor}>{formatAuthor(reply)}</Text>
                        <Text style={styles.replyText}>{reply.message_content || ''}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            )})}
          </View>
        )}
      </ScrollView>
      <Pressable accessibilityLabel="Share group QR code" onPress={() => setShowShareModal(true)} style={[styles.floatingQrButton, isTournament && styles.floatingQrButtonTournament]}>
        <Ionicons color={palette.text} name="qr-code-outline" size={25} />
      </Pressable>
      <Modal animationType="slide" transparent visible={!!matchupSettings} onRequestClose={() => setMatchupSettingsId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.matchupDetailsModal]}>
            <View style={styles.matchupDetailsHeader}><Text style={styles.matchupDetailsTitle}>Match settings</Text><Pressable accessibilityLabel="Close match settings" hitSlop={12} onPress={() => setMatchupSettingsId(null)} style={styles.scorecardClose}><Ionicons color={palette.ink} name="close" size={21} /></Pressable></View>
            {matchupSettings ? <ScrollView contentContainerStyle={styles.matchupDetailsContent} showsVerticalScrollIndicator={false}>
              <TextInput onChangeText={(value) => setMatchups((current) => current.map((item) => item.id === matchupSettings.id ? { ...item, courseName: value } : item))} placeholder="Course name" placeholderTextColor="#80958c" style={styles.matchupDetailsInput} value={matchupSettings.courseName || ''} />
              <TextInput onChangeText={(value) => setMatchups((current) => current.map((item) => item.id === matchupSettings.id ? { ...item, teeTime: value } : item))} placeholder="Tee time" placeholderTextColor="#80958c" style={styles.matchupDetailsInput} value={matchupSettings.teeTime || ''} />
              <Text style={styles.scorecardSectionTitle}>{editForm.tournament_format === 'Ryder Cup' ? teams[0]?.name || 'Team one' : 'Left side'}</Text><ScrollView horizontal contentContainerStyle={styles.matchupDetailsPeople} showsHorizontalScrollIndicator={false}>{matchupLeftOptions.map((participant) => <Pressable key={participant.id} onPress={() => setMatchups((current) => current.map((item) => item.id === matchupSettings.id ? { ...item, leftUserId: participant.id } : item))} style={[styles.matchupDetailsPerson, matchupSettings.leftUserId === participant.id && styles.matchupDetailsPersonActive]}><Avatar label={participant.name} size={42} uri={participant.avatarUrl} /><Text numberOfLines={1} style={styles.matchupDetailsPersonName}>{participant.name.split(' ')[0]}</Text></Pressable>)}</ScrollView>
              <Text style={styles.scorecardSectionTitle}>{editForm.tournament_format === 'Ryder Cup' ? teams[1]?.name || 'Team two' : 'Right side'}</Text><ScrollView horizontal contentContainerStyle={styles.matchupDetailsPeople} showsHorizontalScrollIndicator={false}>{matchupRightOptions.map((participant) => <Pressable key={participant.id} onPress={() => setMatchups((current) => current.map((item) => item.id === matchupSettings.id ? { ...item, rightUserId: participant.id } : item))} style={[styles.matchupDetailsPerson, matchupSettings.rightUserId === participant.id && styles.matchupDetailsPersonActive]}><Avatar label={participant.name} size={42} uri={participant.avatarUrl} /><Text numberOfLines={1} style={styles.matchupDetailsPersonName}>{participant.name.split(' ')[0]}</Text></Pressable>)}</ScrollView>
              <PrimaryButton label={savingMatchupId === matchupSettings.id ? 'Saving...' : 'Save matchup'} loading={savingMatchupId === matchupSettings.id} onPress={() => void handleSaveMatchupScore(matchupSettings.id)} />
            </ScrollView> : null}
          </View>
        </View>
      </Modal>
      <Modal animationType="slide" transparent visible={!!scorecardMatchup} onRequestClose={() => setScorecardMatchupId(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.scorecardModalCard]}>
            <View style={styles.scorecardModalHeader}><View /><Pressable accessibilityLabel="Close scorecard" hitSlop={12} onPress={() => setScorecardMatchupId(null)} style={styles.scorecardClose}><Ionicons color="#fffaf0" name="close" size={21} /></Pressable></View>
            {scorecardMatchup && scorecardLeft && scorecardRight ? <ScrollView contentContainerStyle={styles.scorecardModalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.scorecardPlayers}><View style={styles.scorecardPlayer}><Avatar label={scorecardLeft.name} size={68} uri={scorecardLeft.avatarUrl} /><Text numberOfLines={2} style={styles.scorecardPlayerName}>{scorecardLeftLabel}</Text></View><View style={styles.scorecardVsMark}><Text style={styles.scorecardVsText}>VS</Text></View><View style={styles.scorecardPlayer}><Avatar label={scorecardRight.name} size={68} uri={scorecardRight.avatarUrl} /><Text numberOfLines={2} style={styles.scorecardPlayerName}>{scorecardRightLabel}</Text></View></View>
              {scorecardIsMatchPlay ? <><Text style={styles.scorecardSectionTitle}>Hole results</Text>{Array.from({ length: 18 }, (_, index) => index + 1).map((hole) => { const selected = scorecardMatchup.holeWinners?.[String(hole)]; return <View key={hole} style={styles.scorecardHoleRow}><Text style={styles.scorecardHoleNumber}>{hole}</Text><Pressable onPress={() => setScorecardHoleWinner(scorecardMatchup.id, hole, 'left')} style={[styles.scorecardHoleChoice, selected === 'left' && styles.scorecardHoleChoiceActive]}><Text numberOfLines={1} style={styles.scorecardHoleChoiceText}>{scorecardLeft.name.split(' ')[0]}</Text></Pressable><Pressable onPress={() => setScorecardHoleWinner(scorecardMatchup.id, hole, 'halve')} style={[styles.scorecardHoleChoice, selected === 'halve' && styles.scorecardHoleChoiceActive]}><Text style={styles.scorecardHoleChoiceText}>Half</Text></Pressable><Pressable onPress={() => setScorecardHoleWinner(scorecardMatchup.id, hole, 'right')} style={[styles.scorecardHoleChoice, selected === 'right' && styles.scorecardHoleChoiceActive]}><Text numberOfLines={1} style={styles.scorecardHoleChoiceText}>{scorecardRight.name.split(' ')[0]}</Text></Pressable></View>})}</> : scorecardIsTeamFormat ? <><Text style={styles.scorecardSectionTitle}>Team score by hole</Text>{Array.from({ length: 18 }, (_, index) => index + 1).map((hole) => <View key={hole} style={styles.scorecardTeamHoleRow}><Text style={styles.scorecardHoleNumber}>{hole}</Text><TextInput keyboardType="number-pad" onChangeText={(value) => setScorecardHoleScore(scorecardMatchup.id, hole, 'left', value)} placeholder="—" placeholderTextColor={palette.textMuted} style={styles.scorecardTeamHoleInput} value={scorecardMatchup.leftHoleScores?.[String(hole)]?.toString() || ''} /><TextInput keyboardType="number-pad" onChangeText={(value) => setScorecardHoleScore(scorecardMatchup.id, hole, 'right', value)} placeholder="—" placeholderTextColor={palette.textMuted} style={styles.scorecardTeamHoleInput} value={scorecardMatchup.rightHoleScores?.[String(hole)]?.toString() || ''} /></View>)}</> : <View style={styles.scorecardTotalRow}><View style={styles.scorecardTotalField}><Text style={styles.scorecardSectionTitle}>{scorecardLeft.name.split(' ')[0]} total</Text><TextInput keyboardType="number-pad" onChangeText={(value) => setMatchups((current) => current.map((item) => item.id === scorecardMatchup.id ? { ...item, leftScore: value.trim() ? Number(value) : null } : item))} placeholder="—" placeholderTextColor={palette.textMuted} style={styles.scorecardTotalInput} value={scorecardMatchup.leftScore?.toString() || ''} /></View><View style={styles.scorecardTotalField}><Text style={styles.scorecardSectionTitle}>{scorecardRight.name.split(' ')[0]} total</Text><TextInput keyboardType="number-pad" onChangeText={(value) => setMatchups((current) => current.map((item) => item.id === scorecardMatchup.id ? { ...item, rightScore: value.trim() ? Number(value) : null } : item))} placeholder="—" placeholderTextColor={palette.textMuted} style={styles.scorecardTotalInput} value={scorecardMatchup.rightScore?.toString() || ''} /></View></View>}
              <PrimaryButton label={savingMatchupId === scorecardMatchup.id ? 'Saving...' : 'Save scorecard'} loading={savingMatchupId === scorecardMatchup.id} onPress={() => void handleSaveMatchupScore(scorecardMatchup.id)} />
            </ScrollView> : null}
          </View>
        </View>
      </Modal>
      <Modal animationType="slide" transparent visible={!!closestToPinPickerEntry} onRequestClose={() => setClosestToPinPickerKey(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.ctpWinnerModal]}>
            <View style={styles.ctpWinnerModalHeader}><View><Text style={styles.ctpWinnerModalTitle}>Closest to the Pin</Text><Text style={styles.ctpWinnerModalSubtitle}>{closestToPinPickerEntry ? `${closestToPinSetup.multipleDays ? `Day ${closestToPinPickerEntry.dayIndex + 1} · ` : ''}Hole ${closestToPinPickerEntry.holeNumber}${closestToPinPickerEntry.distance ? ` · ${closestToPinPickerEntry.distance} yds` : ''}` : ''}</Text></View><Pressable accessibilityLabel="Close winner selection" hitSlop={12} onPress={() => setClosestToPinPickerKey(null)} style={styles.scorecardClose}><Ionicons color={palette.ink} name="close" size={21} /></Pressable></View>
            <ScrollView contentContainerStyle={styles.ctpWinnerChoices} showsVerticalScrollIndicator={false}>{participantOptions.map((participant) => {
              const selected = closestToPinPickerEntry ? closestToPinWinners[closestToPinPickerEntry.key] === participant.id : false
              return <Pressable key={participant.id} onPress={() => closestToPinPickerEntry && void handleSelectClosestToPinWinner(closestToPinPickerEntry.key, participant.id)} style={[styles.ctpWinnerChoice, selected && styles.ctpWinnerChoiceSelected]}><Avatar label={participant.name} size={40} uri={participant.avatarUrl} /><View style={styles.ctpWinnerChoiceDetails}><Text style={styles.ctpWinnerChoiceName}>{participant.name}</Text>{participant.handicap != null ? <Text style={styles.ctpWinnerChoiceMeta}>Handicap {participant.handicap}</Text> : null}</View>{selected ? <Ionicons color={palette.aqua} name="checkmark-circle" size={22} /> : null}</Pressable>
            })}{participantOptions.length === 0 ? <Text style={styles.body}>Add tournament people before selecting a winner.</Text> : null}</ScrollView>
            {closestToPinPickerEntry && closestToPinWinners[closestToPinPickerEntry.key] ? <Pressable onPress={() => void handleSelectClosestToPinWinner(closestToPinPickerEntry.key)} style={styles.ctpClearWinner}><Text style={styles.ctpClearWinnerText}>Clear winner</Text></Pressable> : null}
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent
        visible={showShareModal}
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowShareModal(false)}>
          <Pressable style={[styles.modalCard, styles.groupShareModalCard]} onPress={() => {}}>
            <ViewShot ref={qrCardRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
            <View style={styles.groupQrBusinessCard}>
              {group?.header_image_url || group?.image_url ? (
                <Image
                  resizeMode="contain"
                  source={{ uri: group?.header_image_url || group?.image_url || '' }}
                  style={styles.groupQrBusinessCardImage}
                />
              ) : <View style={styles.groupQrBusinessCardFallback} />}
              <View style={styles.groupQrBusinessCardShade} />
              <View style={styles.groupQrBrandRow}>
                <View>
                  <Text style={styles.groupQrBrand}>Ultimate Golf Community</Text>
                  <Text style={styles.groupQrCardType}>Group Pass</Text>
                </View>
                <Ionicons color="#f6e7ba" name="people-outline" size={19} />
              </View>
              <View style={styles.groupQrIdentity}>
                <Avatar label={group?.name || 'Group'} size={70} uri={group?.logo_url || group?.image_url} />
                <Text numberOfLines={1} style={styles.groupQrName}>{group?.name || 'Golf Group'}</Text>
                <Text numberOfLines={2} style={styles.groupQrDescription}>{group?.slogan || group?.description || 'A golf community on Ultimate Golf Community'}</Text>
              </View>
              <View style={styles.groupQrStats}>
                <View style={styles.groupQrStat}>
                  <Text style={styles.groupQrStatLabel}>Members</Text>
                  <Text style={styles.groupQrStatValue}>{members.length}</Text>
                </View>
                <View style={styles.groupQrStat}>
                  <Text style={styles.groupQrStatLabel}>Type</Text>
                  <Text style={styles.groupQrStatValue}>{groupTypeLabel}</Text>
                </View>
                <View style={styles.groupQrStat}>
                  <Text style={styles.groupQrStatLabel}>Access</Text>
                  <Text style={styles.groupQrStatValue}>{group?.is_private ? 'Private' : 'Public'}</Text>
                </View>
              </View>
              <View style={styles.groupQrBottom}>
                {groupQrUrl ? <Image source={{ uri: groupQrUrl }} style={styles.qrImage} /> : null}
                <Text style={styles.qrScanLabel}>Scan to join this group</Text>
              </View>
            </View>
            </ViewShot>
            <Pressable onPress={() => void handleShareQrCard()} style={styles.groupShareButton}>
              <Ionicons color={palette.bg} name="share-social-outline" size={18} />
              <Text style={styles.groupShareButtonText}>Share Group</Text>
            </Pressable>
            <PrimaryButton label="Close" variant="ghost" onPress={() => setShowShareModal(false)} />
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.bg,
    flex: 1
  },
  scorecardModalCard: {
    backgroundColor: '#123d2d',
    borderColor: 'rgba(246,231,186,0.34)',
    gap: 8,
    maxHeight: '84%',
    padding: 18
  },
  matchupDetailsModal: {
    backgroundColor: '#f7f3e9',
    gap: 14,
    maxHeight: '76%',
    padding: 18
  },
  matchupDetailsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  matchupDetailsTitle: {
    color: palette.ink,
    fontFamily: 'Georgia',
    fontSize: 23,
    fontWeight: '700'
  },
  matchupDetailsContent: {
    gap: 12,
    paddingBottom: 4
  },
  matchupDetailsInput: {
    backgroundColor: '#eef3ed',
    borderColor: '#d1dfd2',
    borderRadius: 13,
    borderWidth: 1,
    color: palette.ink,
    minHeight: 48,
    paddingHorizontal: 13
  },
  matchupDetailsPeople: {
    gap: 10,
    paddingVertical: 3
  },
  matchupDetailsPerson: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    gap: 4,
    padding: 4,
    width: 56
  },
  matchupDetailsPersonActive: {
    backgroundColor: '#d9eee0',
    borderColor: '#4a9368'
  },
  matchupDetailsPersonName: {
    color: palette.ink,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%'
  },
  scorecardModalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 2
  },
  scorecardClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  scorecardModalContent: {
    gap: 14,
    paddingBottom: 4,
    paddingTop: 0
  },
  scorecardPlayers: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingTop: 2
  },
  scorecardPlayer: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    maxWidth: 130
  },
  scorecardPlayerName: {
    color: '#fffaf0',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center'
  },
  scorecardVsMark: {
    alignItems: 'center',
    backgroundColor: 'rgba(215,183,104,0.18)',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34
  },
  scorecardVsText: {
    color: '#f6e7ba',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7
  },
  scorecardSectionTitle: {
    color: '#dce8df',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase'
  },
  scorecardHoleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6
  },
  scorecardHoleNumber: {
    color: '#f6e7ba',
    fontSize: 12,
    fontWeight: '800',
    width: 20
  },
  scorecardHoleChoice: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 5
  },
  scorecardHoleChoiceActive: {
    backgroundColor: '#2d6a4f',
    borderColor: '#f6e7ba',
    borderWidth: 1.5
  },
  scorecardHoleChoiceText: {
    color: '#fffaf0',
    fontSize: 10,
    fontWeight: '700'
  },
  scorecardTeamHoleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  scorecardTeamHoleInput: {
    backgroundColor: '#f7f3e9',
    borderColor: '#d7b768',
    borderRadius: 12,
    borderWidth: 1,
    color: palette.ink,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    minHeight: 40,
    textAlign: 'center'
  },
  scorecardTotalRow: {
    flexDirection: 'row',
    gap: 10
  },
  scorecardTotalField: {
    flex: 1,
    gap: 6
  },
  scorecardTotalInput: {
    backgroundColor: '#f7f3e9',
    borderColor: '#d7b768',
    borderRadius: 12,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 26,
    fontWeight: '800',
    minHeight: 58,
    textAlign: 'center'
  },
  scorecardProgressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  scorecardThroughInput: {
    backgroundColor: '#eef3ed',
    borderColor: '#d1dfd2',
    borderRadius: 10,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
    minHeight: 36,
    textAlign: 'center',
    width: 58
  },
  content: {
    gap: 20,
    paddingBottom: 150,
    paddingHorizontal: 20,
    paddingTop: 4
  },
  editInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 52,
    paddingHorizontal: 16
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 8
  },
  dateRangeInput: {
    flex: 1,
    paddingHorizontal: 10
  },
  datePickerButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8
  },
  datePickerCopy: {
    flex: 1
  },
  datePickerLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  datePickerValue: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  },
  editTextarea: {
    minHeight: 110,
    paddingBottom: 16,
    paddingTop: 16,
    textAlignVertical: 'top'
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10
  },
  typeChip: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16
  },
  typeChipActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  tournamentTypeChip: {
    flex: 1.35,
    paddingHorizontal: 8
  },
  mediaActions: {
    gap: 10,
    marginTop: 4
  },
  typeLabel: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '700'
  },
  tournamentTypeLabel: {
    fontSize: 13
  },
  typeLabelActive: {
    color: palette.aqua
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end'
  },
  hero: {
    gap: 12,
  },
  coverShell: {
    borderRadius: 24,
    height: 286,
    overflow: 'hidden',
    position: 'relative'
  },
  coverImage: {
    height: '100%',
    width: '100%'
  },
  coverScrim: {
    backgroundColor: 'rgba(3,16,10,0.38)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  coverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 14,
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 2
  },
  floatingQrButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    bottom: 132,
    height: 52,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    width: 52,
    zIndex: 10
  },
  floatingQrButtonTournament: {
    left: 20,
    right: undefined
  },
  coverActionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,22,14,0.72)',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 18,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38
  },
  heroCenteredContent: {
    alignItems: 'center',
    bottom: 48,
    gap: 7,
    left: 22,
    position: 'absolute',
    right: 22,
    zIndex: 1
  },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderWidth: 1,
    height: '100%',
    justifyContent: 'center',
    width: '100%'
  },
  coverFallbackText: {
    color: palette.textMuted,
    fontSize: 15,
    fontWeight: '600'
  },
  inlineMediaButton: {
    backgroundColor: 'rgba(7, 20, 15, 0.82)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'absolute',
    right: 12
  },
  groupEditButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,22,14,0.76)',
    borderColor: 'rgba(255,255,255,0.26)',
    borderRadius: 18,
    borderWidth: 1,
    bottom: 14,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 14,
    width: 40,
    zIndex: 3
  },
  groupTypeCoverIcon: {
    alignItems: 'center',
    bottom: 14,
    justifyContent: 'center',
    left: 14,
    position: 'absolute',
    zIndex: 2
  },
  inlineLogoButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  inlineMediaButtonText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700'
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16
  },
  logoColumn: {
    alignItems: 'center'
  },
  heroCopy: {
    flex: 1,
    gap: 6
  },
  heroMetaInlineRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  heroMetaInlineText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '600'
  },
  heroMetaInlineAccent: {
    color: '#a5f3fc',
    fontSize: 13,
    fontWeight: '700'
  },
  name: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'capitalize'
  },
  inlineNameInput: {
    backgroundColor: 'rgba(4,18,12,0.48)',
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 16,
    borderWidth: 1,
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    minHeight: 52,
    paddingHorizontal: 14
  },
  heroSubtitle: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600'
  },
  heroStory: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 290,
    textAlign: 'center'
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2
  },
  metaPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    color: palette.textMuted,
    fontSize: 13,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2
  },
  quickAction: {
    alignItems: 'center',
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  quickActionText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800'
  },
  inlineMetaInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    color: palette.text,
    flexGrow: 1,
    fontSize: 13,
    minHeight: 38,
    minWidth: 180,
    paddingHorizontal: 12
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 12,
    padding: 20
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6
  },
  tabChip: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 0,
    paddingHorizontal: 4
  },
  tabChipActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  tabLabel: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '700'
  },
  tabLabelActive: {
    color: palette.aqua
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '700'
  },
  sectionEyebrow: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase'
  },
  body: {
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22
  },
  ownerPanel: {
    backgroundColor: 'rgba(103,232,249,0.08)',
    borderColor: 'rgba(103,232,249,0.18)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 14,
    padding: 16
  },
  ownerPanelCopy: {
    gap: 4
  },
  ownerPanelEyebrow: {
    color: palette.aqua,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  ownerPanelTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  ownerPanelBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  ownerPanelActions: {
    gap: 10
  },
  infoGrid: {
    gap: 10
  },
  infoPill: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 14
  },
  infoLabel: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  infoValue: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600'
  },
  tournamentEditFields: {
    gap: 10
  },
  tournamentInfoCard: {
    backgroundColor: 'rgba(11,53,40,0.48)',
    borderColor: 'rgba(232,204,135,0.26)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 13,
    padding: 16
  },
  tournamentInfoLead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  tournamentInfoIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(215,183,104,0.14)',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34
  },
  tournamentInfoLeadValue: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2
  },
  tournamentInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tournamentInfoTile: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(232,216,178,0.15)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    minWidth: '47%',
    padding: 10
  },
  tournamentInfoDateTile: {
    flexBasis: '100%'
  },
  tournamentInfoTileCopy: {
    flex: 1
  },
  tournamentInfoTileLabel: {
    color: '#bfd2c5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase'
  },
  tournamentInfoTileValue: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2
  },
  tournamentInfoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tournamentInfoValue: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 20,
    textAlign: 'right'
  },
  tournamentContestsEditor: {
    backgroundColor: 'rgba(215,183,104,0.06)',
    borderColor: 'rgba(215,183,104,0.18)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 12
  },
  contestChoices: {
    flexDirection: 'row',
    gap: 8
  },
  contestChoice: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 10
  },
  contestChoiceActive: {
    backgroundColor: 'rgba(215,183,104,0.13)',
    borderColor: 'rgba(215,183,104,0.38)'
  },
  contestChoiceText: {
    color: palette.textMuted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700'
  },
  contestChoiceTextActive: {
    color: '#f2d991'
  },
  ctpSetupCard: {
    backgroundColor: 'rgba(8,45,34,0.44)',
    borderColor: 'rgba(215,183,104,0.24)',
    borderRadius: 13,
    borderWidth: 1,
    gap: 9,
    padding: 10
  },
  ctpDaySetup: {
    borderTopColor: 'rgba(215,183,104,0.18)',
    borderTopWidth: 1,
    gap: 7,
    paddingTop: 10
  },
  ctpDayTitle: {
    color: '#f2d991',
    fontSize: 12,
    fontWeight: '800'
  },
  ctpCourseInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    color: palette.text,
    fontSize: 13,
    minHeight: 38,
    paddingHorizontal: 10
  },
  ctpCountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  ctpCountLabel: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700'
  },
  ctpCountControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9
  },
  ctpCountButton: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  ctpCountValue: {
    color: palette.gold,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 14,
    textAlign: 'center'
  },
  ctpDistanceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  ctpHoleLabel: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    width: 70
  },
  ctpDistanceInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    color: palette.text,
    flex: 1,
    fontSize: 13,
    minHeight: 36,
    paddingHorizontal: 10
  },
  ctpHoleNumberInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    color: palette.text,
    fontSize: 13,
    minHeight: 36,
    paddingHorizontal: 8,
    textAlign: 'center',
    width: 46
  },
  ctpYards: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    width: 24
  },
  tournamentContestsDisplay: {
    borderTopColor: 'rgba(215,183,104,0.18)',
    borderTopWidth: 1,
    gap: 8,
    marginTop: 2,
    paddingTop: 12
  },
  tournamentContestCard: {
    backgroundColor: 'rgba(215,183,104,0.055)',
    borderColor: 'rgba(215,183,104,0.2)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 10,
    padding: 13
  },
  tournamentContestRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  tournamentContestText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '700'
  },
  tournamentContestDetail: {
    color: palette.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2
  },
  ctpResultsBlock: {
    gap: 8
  },
  ctpDisplayDay: {
    borderTopColor: 'rgba(215,183,104,0.18)',
    borderTopWidth: 1,
    gap: 7,
    paddingTop: 10
  },
  ctpDisplayDayTitle: {
    color: '#f2d991',
    fontSize: 12,
    fontWeight: '800'
  },
  ctpDisplayCourse: {
    color: palette.text,
    fontSize: 14,
    fontWeight: '800'
  },
  ctpResultRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(215,183,104,0.16)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  ctpResultDetails: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  ctpResultFlag: {
    alignItems: 'center',
    backgroundColor: 'rgba(215,183,104,0.12)',
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    width: 26
  },
  ctpResultTitle: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '800'
  },
  ctpResultMeta: {
    color: palette.textMuted,
    fontSize: 11,
    marginTop: 2
  },
  ctpWinner: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
    marginLeft: 8
  },
  ctpWinnerName: {
    color: palette.text,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 100
  },
  ctpSelectWinner: {
    color: palette.aqua,
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8
  },
  ctpWinnerModal: {
    backgroundColor: '#f6f2e8',
    borderColor: 'rgba(232,204,135,0.7)',
    maxHeight: '78%'
  },
  ctpWinnerModalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  ctpWinnerModalTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '800'
  },
  ctpWinnerModalSubtitle: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3
  },
  ctpWinnerChoices: {
    gap: 8
  },
  ctpWinnerChoice: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: 'rgba(21,59,45,0.12)',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 58,
    padding: 9
  },
  ctpWinnerChoiceSelected: {
    backgroundColor: '#e1f5f3',
    borderColor: 'rgba(36,150,166,0.65)'
  },
  ctpWinnerChoiceDetails: {
    flex: 1
  },
  ctpWinnerChoiceName: {
    color: palette.ink,
    fontSize: 14,
    fontWeight: '800'
  },
  ctpWinnerChoiceMeta: {
    color: '#597064',
    fontSize: 11,
    marginTop: 2
  },
  ctpClearWinner: {
    alignItems: 'center',
    borderColor: 'rgba(196,72,63,0.25)',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12
  },
  ctpClearWinnerText: {
    color: '#b7443b',
    fontSize: 13,
    fontWeight: '800'
  },
  matchupsBlock: {
    gap: 6
  },
  matchupBuilder: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  matchupSetupCard: {
    backgroundColor: 'rgba(12,49,38,0.46)',
    borderColor: 'rgba(232,204,135,0.35)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginTop: 12,
    padding: 13
  },
  matchupSetupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7
  },
  matchupScheduleFields: {
    flexDirection: 'row',
    gap: 8
  },
  matchupScheduleInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 11,
    borderWidth: 1,
    color: palette.text,
    flex: 1,
    fontSize: 12,
    minHeight: 42,
    paddingHorizontal: 11
  },
  savedMatchupDay: {
    borderTopColor: 'rgba(232,204,135,0.17)',
    borderTopWidth: 1,
    gap: 8,
    marginTop: 4,
    paddingTop: 11
  },
  savedMatchupDayHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  savedMatchupDayTitle: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: '800'
  },
  savedMatchupDayDate: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700'
  },
  savedMatchupCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderColor: 'rgba(232,204,135,0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 74,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'relative'
  },
  savedMatchupSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  savedMatchupGolfer: {
    alignItems: 'center',
    maxWidth: 48,
    width: 48
  },
  savedMatchupName: {
    color: palette.text,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 3,
    textAlign: 'center',
    width: '100%'
  },
  savedMatchupMiddle: {
    alignItems: 'center',
    minWidth: 48
  },
  savedMatchupVs: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: '900'
  },
  savedMatchupFormat: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: '700',
    marginTop: 3,
    maxWidth: 55,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  savedMatchupDelete: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.16)',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    top: 5,
    width: 24
  },
  matchupSelectedRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  matchupSelectedSlot: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(232,204,135,0.32)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 70,
    paddingHorizontal: 8,
    paddingVertical: 7,
    position: 'relative'
  },
  matchupSelectedSlotEmpty: {
    borderStyle: 'dashed'
  },
  matchupSelectedName: {
    color: palette.text,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
    maxWidth: 90,
    textAlign: 'center'
  },
  matchupSelectedRemove: {
    position: 'absolute',
    right: 5,
    top: 5
  },
  matchupSlotHint: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center'
  },
  manualParticipantRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  manualParticipantPhoto: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 52
  },
  manualParticipantFields: {
    flex: 1,
    gap: 5
  },
  manualHandicapInput: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    color: palette.text,
    fontSize: 12,
    paddingVertical: 4
  },
  manualParticipantAdded: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8
  },
  manualRosterStrip: {
    gap: 12,
    paddingVertical: 3
  },
  manualRosterGolfer: {
    alignItems: 'center',
    gap: 4,
    position: 'relative',
    width: 52
  },
  manualRosterName: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%'
  },
  manualRosterRemove: {
    position: 'absolute',
    right: 1,
    top: -2
  },
  matchTypeChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  matchTypeChoice: {
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6
  },
  matchTypeChoiceActive: {
    backgroundColor: 'rgba(215,183,104,0.16)',
    borderColor: 'rgba(215,183,104,0.45)'
  },
  matchTypeChoiceText: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700'
  },
  matchTypeChoiceTextActive: {
    color: '#f2d991'
  },
  teamSetup: {
    backgroundColor: 'rgba(215,183,104,0.06)',
    borderColor: 'rgba(215,183,104,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12
  },
  teamEditor: {
    borderTopColor: 'rgba(215,183,104,0.14)',
    borderTopWidth: 1,
    gap: 9,
    paddingTop: 10
  },
  teamEditorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10
  },
  teamLogoPicker: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 54
  },
  teamLogoImage: {
    height: '100%',
    width: '100%'
  },
  teamEditorCopy: {
    flex: 1,
    gap: 7
  },
  teamNameInput: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    color: palette.text,
    fontSize: 15,
    fontWeight: '800',
    paddingVertical: 5
  },
  teamNameLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  teamMemberChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  teamMemberChoice: {
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  teamMemberChoiceActive: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: palette.aqua
  },
  teamMemberChoiceText: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '700'
  },
  teamMemberChoiceTextActive: {
    color: palette.aqua
  },
  teamGolferGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  teamGolfer: {
    alignItems: 'center',
    gap: 4,
    maxWidth: 52,
    width: 52
  },
  teamGolferName: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%'
  },
  matchupHint: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 17
  },
  accessHeading: {
    gap: 4,
    marginTop: 2
  },
  matchupChooserRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 7
  },
  matchupChoiceColumn: {
    flex: 1,
    gap: 6
  },
  matchupSideLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase'
  },
  matchupPersonChoice: {
    alignItems: 'center',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    padding: 6
  },
  matchupPersonChoiceActive: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.45)'
  },
  matchupPersonChoiceText: {
    color: palette.text,
    flex: 1,
    fontSize: 11,
    fontWeight: '700'
  },
  matchupVs: {
    alignSelf: 'center',
    color: '#d7b768',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  addMatchupButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(215,183,104,0.16)',
    borderColor: 'rgba(215,183,104,0.38)',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center'
  },
  addMatchupButtonText: {
    color: '#f2d991',
    fontSize: 13,
    fontWeight: '800'
  },
  teamPartnerChooser: {
    gap: 8
  },
  holeWinnerEditor: {
    borderTopColor: 'rgba(215,183,104,0.18)',
    borderTopWidth: 1,
    gap: 7,
    marginTop: 10,
    paddingTop: 12
  },
  holeWinnerTitle: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  holeWinnerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5
  },
  holeNumber: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800',
    width: 27
  },
  holeWinnerChoice: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: palette.border,
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: 5
  },
  holeWinnerChoiceActive: {
    backgroundColor: 'rgba(123,224,161,0.2)',
    borderColor: palette.emerald
  },
  holeWinnerText: {
    color: palette.text,
    fontSize: 10,
    fontWeight: '700'
  },
  editMatchupRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  editMatchupName: {
    color: palette.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '700'
  },
  matchupDisplayRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: 'rgba(215,183,104,0.16)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
    position: 'relative'
  },
  matchupFormatBadge: {
    backgroundColor: 'rgba(215,183,104,0.18)',
    borderRadius: 999,
    bottom: 7,
    color: '#f2d991',
    fontSize: 9,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 3,
    position: 'absolute',
    right: 7,
    textTransform: 'uppercase'
  },
  matchupCourseBadge: {
    alignSelf: 'center',
    color: '#f2d991',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.15
  },
  matchupCourseHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(215,183,104,0.08)',
    borderColor: 'rgba(215,183,104,0.16)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 9,
    minHeight: 37,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  matchupCourseIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    minWidth: 0
  },
  matchupTeeTimeChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5
  },
  matchupTeeTimeText: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  matchupTeeTimeFooter: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
    marginHorizontal: 48,
    marginTop: -3
  },
  matchupTeeTimeFooterText: {
    color: palette.textMuted,
    fontSize: 11,
    fontWeight: '800'
  },
  matchupDayBadge: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    left: 9,
    position: 'absolute',
    top: 8,
    textTransform: 'uppercase'
  },
  matchupGolfer: {
    alignItems: 'center',
    flex: 1,
    gap: 3
  },
  matchupGolferName: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '800',
    maxWidth: 92,
    textAlign: 'center'
  },
  matchupHandicap: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '700'
  },
  tournamentPeopleSection: {
    gap: 12
  },
  teamRosterCard: {
    backgroundColor: 'rgba(215,183,104,0.08)',
    borderColor: 'rgba(215,183,104,0.2)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 9,
    padding: 12
  },
  teamRosterHeader: {
    alignItems: 'center',
    flexDirection: 'column',
    gap: 6,
    justifyContent: 'center'
  },
  teamRosterLogo: {
    borderRadius: 16,
    height: 32,
    width: 32
  },
  teamRosterTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%'
  },
  teamRosterPerson: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9
  },
  inviteSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  inviteTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700'
  },
  groupFeedPanel: {
    backgroundColor: 'rgba(103,232,249,0.06)',
    borderColor: 'rgba(103,232,249,0.16)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  groupFeedItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 10,
    padding: 10
  },
  inviteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between'
  },
  invitePerson: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12
  },
  inviteCopy: {
    flex: 1,
    gap: 2
  },
  memberRow: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 14
  },
  memberIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12
  },
  memberCopy: {
    flex: 1,
    gap: 3
  },
  memberName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600'
  },
  memberMeta: {
    color: palette.textMuted,
    fontSize: 13
  },
  roleButton: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  roleButtonText: {
    color: palette.aqua,
    fontSize: 12,
    fontWeight: '800'
  },
  requestActions: {
    flexDirection: 'row',
    gap: 6
  },
  composeInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    minHeight: 96,
    paddingHorizontal: 16,
    paddingTop: 16,
    textAlignVertical: 'top'
  },
  composerPanel: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    padding: 14
  },
  composerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between'
  },
  composerPhotoButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(139,233,247,0.09)',
    borderColor: 'rgba(139,233,247,0.22)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 13
  },
  composerPhotoButtonText: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '800'
  },
  tournamentPostButton: {
    alignItems: 'center',
    backgroundColor: '#d8bd76',
    borderRadius: 18,
    flex: 1,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 14
  },
  tournamentPostButtonDisabled: {
    opacity: 0.65
  },
  tournamentPostButtonText: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '900'
  },
  postPhotoPreview: {
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    borderWidth: 1,
    height: 180,
    overflow: 'hidden',
    position: 'relative'
  },
  postPhotoPreviewImage: {
    height: '100%',
    width: '100%'
  },
  postPhotoRemove: {
    alignItems: 'center',
    backgroundColor: 'rgba(4,22,16,0.75)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32
  },
  groupPostImage: {
    borderRadius: 15,
    height: 240,
    marginTop: 2,
    width: '100%'
  },
  postsFeed: {
    gap: 12
  },
  membersFeed: {
    gap: 12
  },
  scoresFeed: {
    gap: 12
  },
  liveMatchProgress: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 6, marginBottom: 10 },
  liveMatchProgressText: { color: '#ffd5cf', fontSize: 12, fontWeight: '800' },
  liveHoleEditor: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  liveHoleLabel: { color: '#ffd5cf', fontSize: 12, fontWeight: '800' },
  liveHoleInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(240, 107, 93, 0.42)', borderRadius: 8, borderWidth: 1, color: palette.text, fontSize: 13, fontWeight: '800', minWidth: 38, paddingHorizontal: 8, paddingVertical: 5, textAlign: 'center' },
  scoreEntry: {
    flexDirection: 'row',
    gap: 10
  },
  scoreInput: {
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    color: palette.text,
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 14
  },
  scoreRow: {
    alignItems: 'center',
    backgroundColor: palette.cardSoft,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 11,
    padding: 12
  },
  leaderboardCard: {
    backgroundColor: 'rgba(215,183,104,0.08)',
    borderColor: 'rgba(215,183,104,0.22)',
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 14
  },
  matchupScoresList: {
    gap: 12,
    position: 'relative'
  },
  teamScoreboard: {
    backgroundColor: 'rgba(215,183,104,0.09)',
    borderColor: 'rgba(215,183,104,0.28)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  teamScoreboardTitle: {
    color: '#f2d991',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  teamScoreboardRow: {
    flexDirection: 'row',
    gap: 12
  },
  teamScoreboardTeam: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  teamScoreboardLogo: {
    borderRadius: 14,
    height: 36,
    width: 36
  },
  teamScoreboardName: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  teamScoreboardPoints: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34
  },
  teamScoreboardLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  matchupDaySection: {
    gap: 8
  },
  matchupDayHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2
  },
  matchupDayTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '800'
  },
  matchupDayDate: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right'
  },
  matchupScoreCard: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
    position: 'relative'
  },
  matchupScorecardButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,38,27,0.16)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 23,
    borderWidth: 1,
    bottom: 8,
    height: 46,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    width: 46
  },
  matchupDetailsButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,38,27,0.16)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    borderWidth: 1,
    bottom: 8,
    height: 36,
    justifyContent: 'center',
    left: 8,
    position: 'absolute',
    width: 36
  },
  coverLiveScoringButton: {
    backgroundColor: 'rgba(7,38,27,0.82)'
  },
  coverLiveScoringButtonActive: {
    backgroundColor: 'rgba(192,56,50,0.88)',
    borderColor: 'rgba(255,255,255,0.5)'
  },
  matchupScoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 7
  },
  matchupScheduleCenter: {
    alignItems: 'center',
    flexShrink: 1,
    minWidth: 52
  },
  matchupFormatUnderVs: {
    color: palette.textMuted,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
    maxWidth: 76,
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  matchupCourseLabel: {
    color: palette.gold,
    fontSize: 9,
    fontWeight: '800',
    maxWidth: 72,
    textAlign: 'center'
  },
  matchupTeeTimeLabel: {
    color: palette.textMuted,
    fontSize: 9,
    fontWeight: '700',
    maxWidth: 72,
    textAlign: 'center'
  },
  matchupScoreGolfer: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 4
  },
  matchupTeamAvatars: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  matchupNameLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    maxWidth: '100%'
  },
  matchupWinner: {
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.35)',
    borderWidth: 1
  },
  matchupScoreInput: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    color: palette.text,
    fontSize: 22,
    fontWeight: '900',
    minWidth: 44,
    paddingVertical: 2,
    textAlign: 'center'
  },
  matchupScoreValue: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '900'
  },
  matchupScoreReadout: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center'
  },
  matchupAdjustedScore: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '800'
  },
  matchupWinnerText: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  },
  matchupTypeFooter: {
    color: '#f2d991',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'uppercase'
  },
  matchupSettingsButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(7,38,27,0.88)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 8,
    height: 46,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    width: 46,
    zIndex: 3
  },
  leaderboardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  leaderboardTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  leaderboardTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '800'
  },
  leaderboardMeta: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700'
  },
  leaderboardRow: {
    alignItems: 'center',
    borderTopColor: 'rgba(215,183,104,0.14)',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 11,
    paddingVertical: 9
  },
  leaderboardScore: {
    alignItems: 'flex-end',
    minWidth: 48
  },
  leaderboardPending: {
    color: palette.textMuted,
    fontSize: 20,
    fontWeight: '800'
  },
  leaderboardScoreLabel: {
    color: 'rgba(215,183,104,0.7)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6
  },
  scorePlace: {
    color: '#d7b768',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    width: 20
  },
  scoreName: {
    color: palette.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '700'
  },
  scoreTotal: {
    color: '#d7b768',
    fontSize: 23,
    fontWeight: '800'
  },
  aboutFeed: {
    gap: 12
  },
  messageCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12
  },
  compactMessageCard: {
    borderRadius: 16,
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
    shadowOpacity: 0,
    shadowRadius: 0
  },
  tournamentUpdatePost: {
    backgroundColor: 'rgba(215,183,104,0.12)',
    borderColor: 'rgba(215,183,104,0.36)'
  },
  tournamentUpdateIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(215,183,104,0.13)',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32
  },
  messageTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  messageMeta: {
    color: palette.textMuted,
    fontSize: 12
  },
  messageActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16
  },
  compactMessageAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  },
  messageAction: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
  },
  compactMessageBody: {
    fontSize: 14,
    lineHeight: 19
  },
  replies: {
    gap: 8
  },
  replyCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    padding: 12
  },
  replyAuthor: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '700'
  },
  replyText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  replyBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  replyBannerText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  replyCancel: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
  },
  modalBackdrop: {
    backgroundColor: 'rgba(3,10,8,0.72)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18
  },
  modalCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: 28,
    borderWidth: 1,
    gap: 14,
    padding: 20
  },
  groupShareModalCard: {
    gap: 12,
    padding: 14
  },
  groupQrBusinessCard: {
    backgroundColor: '#123d2d',
    borderColor: 'rgba(246,231,186,0.3)',
    borderRadius: 24,
    borderWidth: 1,
    height: 490,
    overflow: 'hidden',
    padding: 18,
    position: 'relative'
  },
  groupQrBusinessCardImage: {
    backgroundColor: '#123d2d',
    bottom: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%'
  },
  groupQrBusinessCardFallback: {
    backgroundColor: '#1e5c45',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  groupQrBusinessCardShade: {
    backgroundColor: 'rgba(4,18,12,0.72)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  groupQrBrandRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1
  },
  groupQrBrand: {
    color: '#f6e7ba',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase'
  },
  groupQrCardType: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase'
  },
  groupQrIdentity: {
    alignItems: 'center',
    gap: 5,
    marginTop: 20,
    zIndex: 1
  },
  groupQrName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 5,
    textAlign: 'center'
  },
  groupQrDescription: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 270,
    textAlign: 'center'
  },
  groupQrStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
    zIndex: 1
  },
  groupQrStat: {
    alignItems: 'center',
    backgroundColor: 'rgba(3,18,11,0.55)',
    borderColor: 'rgba(246,231,186,0.18)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    paddingVertical: 9
  },
  groupQrStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase'
  },
  groupQrStatValue: {
    color: '#f6e7ba',
    fontSize: 13,
    fontWeight: '800'
  },
  groupQrBottom: {
    alignItems: 'center',
    bottom: 16,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 1
  },
  groupShareButton: {
    alignItems: 'center',
    backgroundColor: palette.aqua,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46
  },
  groupShareButtonText: {
    color: palette.bg,
    fontSize: 14,
    fontWeight: '800'
  },
  qrScanLabel: {
    color: '#f6e7ba',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
    marginTop: 7,
    textTransform: 'uppercase'
  },
  qrImage: {
    alignSelf: 'center',
    backgroundColor: palette.white,
    borderRadius: 20,
    height: 240,
    width: 240
  },
  shareLink: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center'
  }
})
