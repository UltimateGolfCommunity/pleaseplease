import { useCallback, useEffect, useMemo, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import Ionicons from '@expo/vector-icons/Ionicons'
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

type TournamentMatchup = {
  id: string
  leftUserId: string
  rightUserId: string
  format?: string
  day?: string | null
  leftScore?: number | null
  rightScore?: number | null
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

type TournamentSetup = {
  matchups: TournamentMatchup[]
  teams: TournamentTeam[]
  manualParticipants: ManualTournamentParticipant[]
}

function parseTournamentMatchups(value?: string | null): TournamentMatchup[] {
  return parseTournamentSetup(value).matchups
}

function parseTournamentSetup(value?: string | null): TournamentSetup {
  const empty = { matchups: [], teams: [], manualParticipants: [] } as TournamentSetup
  if (!value) return empty
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return { ...empty, matchups: parsed.filter((matchup) => matchup?.leftUserId && matchup?.rightUserId) }
    return {
      matchups: Array.isArray(parsed?.matchups) ? parsed.matchups.filter((matchup: TournamentMatchup) => matchup?.leftUserId && matchup?.rightUserId) : [],
      teams: Array.isArray(parsed?.teams) ? parsed.teams.filter((team: TournamentTeam) => team?.id) : [],
      manualParticipants: Array.isArray(parsed?.manualParticipants) ? parsed.manualParticipants.filter((participant: ManualTournamentParticipant) => participant?.id && participant?.name) : []
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
  const [showShareModal, setShowShareModal] = useState(false)
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
  const [matchups, setMatchups] = useState<TournamentMatchup[]>([])
  const [leftMatchupUserId, setLeftMatchupUserId] = useState('')
  const [rightMatchupUserId, setRightMatchupUserId] = useState('')
  const [matchupFormat, setMatchupFormat] = useState('Match Play')
  const [matchupDay, setMatchupDay] = useState('')
  const [teams, setTeams] = useState<TournamentTeam[]>([
    { id: 'team-a', name: 'Team One', logoUrl: null, memberIds: [] },
    { id: 'team-b', name: 'Team Two', logoUrl: null, memberIds: [] }
  ])
  const [manualParticipants, setManualParticipants] = useState<ManualTournamentParticipant[]>([])
  const [manualParticipantName, setManualParticipantName] = useState('')
  const [manualParticipantHandicap, setManualParticipantHandicap] = useState('')
  const [manualParticipantPhotoUrl, setManualParticipantPhotoUrl] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
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

  const loadGroup = useCallback(async () => {
    if (!id) return

    try {
      const [response, connectionsResponse, directConnections] = await Promise.all([
        apiGet<{ success: boolean; group: GroupDetail; members: Member[]; pending_members?: Member[] }>(
          `/api/groups/${encodeURIComponent(id)}${user?.id ? `?user_id=${encodeURIComponent(user.id)}` : ''}`
        ),
        user?.id
          ? apiGet<{ success: boolean; connections: ConnectionRecord[] }>(
              `/api/users?action=connections&id=${encodeURIComponent(user.id)}`
            ).catch(() => ({ success: true, connections: [] }))
          : Promise.resolve({ success: true, connections: [] as ConnectionRecord[] })
        ,
        user?.id
          ? (async () => {
              const { data: edges } = await mobileSupabase
                .from('user_connections')
                .select('id, requester_id, recipient_id, status')
                .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
                .in('status', ['accepted', 'active'])
              const counterpartIds = Array.from(new Set((edges || []).map((edge: any) => edge.requester_id === user.id ? edge.recipient_id : edge.requester_id).filter(Boolean)))
              const { data: profiles } = counterpartIds.length
                ? await mobileSupabase.from('user_profiles').select('id, first_name, last_name, username, avatar_url, location, handicap').in('id', counterpartIds)
                : { data: [] as UserCard[] }
              const profileById = new Map((profiles || []).map((profile: UserCard) => [profile.id, profile]))
              return (edges || []).map((edge: any) => ({
                ...edge,
                requester: edge.requester_id === user.id ? null : profileById.get(edge.requester_id) || null,
                recipient: edge.recipient_id === user.id ? null : profileById.get(edge.recipient_id) || null
              })) as ConnectionRecord[]
            })().catch(() => [] as ConnectionRecord[])
          : Promise.resolve([] as ConnectionRecord[])
      ])
      setGroup(response.group)
      setMembers(response.members || [])
      setPendingMembers(response.pending_members || [])
      const mergedConnections = [...(connectionsResponse.connections || []), ...directConnections]
      setConnections(Array.from(new Map(mergedConnections.map((connection) => [connection.id, connection])).values()))

      if ((response.group.group_type || '').toLowerCase() === 'tournament') {
        const scores = await apiGet<{ success: boolean; scores: TournamentScore[] }>(
          `/api/groups/scores?group_id=${encodeURIComponent(id)}`
        ).catch(() => ({ success: true, scores: [] as TournamentScore[] }))
        setTournamentScores(scores.scores || [])
      } else {
        setTournamentScores([])
      }

      if (user?.id) {
        try {
          const board = await apiGet<{ success: boolean; messages: GroupMessage[] }>(
            `/api/groups/message?group_id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}`
          )
          setMessages(board.messages || [])
          const feed = await apiGet<{ success: boolean; activities: GroupActivity[] }>(
            `/api/activities?action=group_detail&group_id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}&limit=8`
          ).catch(() => ({ success: true, activities: [] }))
          setGroupFeed(feed.activities || [])
        } catch {
          setMessages([])
          setGroupFeed([])
        }
      }
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
    setTeams(setup.teams.length ? setup.teams : [
      { id: 'team-a', name: 'Team One', logoUrl: null, memberIds: [] },
      { id: 'team-b', name: 'Team Two', logoUrl: null, memberIds: [] }
    ])
    setLeftMatchupUserId('')
    setRightMatchupUserId('')
    setMatchupFormat('Match Play')
    setMatchupDay(group.tournament_date || '')
  }, [group])

  if (!loading && !user) {
    return <Redirect href="/welcome" />
  }

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

  const addMatchup = () => {
    if (!leftMatchupUserId || !rightMatchupUserId) {
      Alert.alert('Choose two golfers', 'Select one golfer for each side of the matchup.')
      return
    }
    if (leftMatchupUserId === rightMatchupUserId) {
      Alert.alert('Choose two different golfers', 'A golfer cannot play against themselves.')
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
        { id: `matchup-${Date.now()}`, leftUserId: leftMatchupUserId, rightUserId: rightMatchupUserId, format: matchupFormat, day: matchupDay || editForm.tournament_date || null }
      ])
    }
    setLeftMatchupUserId('')
    setRightMatchupUserId('')
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
    if (matchup.leftScore === null || matchup.leftScore === undefined || matchup.rightScore === null || matchup.rightScore === undefined || matchup.leftScore === matchup.rightScore) return null
    // Stroke-play match cards use the lower total; all head-to-head formats
    // use the higher entered result (for example, holes won).
    const lowerWins = matchup.format === 'Stroke Play'
    return lowerWins
      ? matchup.leftScore < matchup.rightScore ? 'left' : 'right'
      : matchup.leftScore > matchup.rightScore ? 'left' : 'right'
  }

  const handleSaveMatchupScore = async (matchupId: string) => {
    if (!user?.id || !group?.id || !isOwner) return
    const nextMatchups = matchups.map((matchup) => ({ ...matchup }))
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
        tournament_matchups: JSON.stringify({ matchups: nextMatchups, teams, manualParticipants })
      })
      if (response.group) setGroup((current) => current ? { ...current, ...response.group } : current)
      await loadGroup()
    } catch (error) {
      Alert.alert('Unable to save matchup score', error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setSavingMatchupId(null)
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
        group_type: editForm.group_type,
        is_private: editForm.is_private,
        tournament_date: editForm.tournament_date.trim() || null,
        tournament_end_date: editForm.tournament_end_date.trim() || null,
        tournament_format: editForm.tournament_format.trim() || null,
        tournament_type: editForm.tournament_type.trim() || null,
        tournament_matchups: matchups.length || manualParticipants.length || teams.some((team) => team.memberIds.length || team.logoUrl || team.name.trim())
          ? JSON.stringify({ matchups, teams, manualParticipants })
          : null
      })

      if (response.group) {
        if ((response.group.group_type || 'community') !== editForm.group_type) {
          throw new Error('The group type was not saved. Please update the tournament database setup and try again.')
        }
        setGroup((current) =>
          current
            ? {
                ...current,
                ...response.group,
                logo_url: response.group.logo_url || current.logo_url,
                header_image_url: response.group.header_image_url || current.header_image_url,
                image_url: response.group.image_url || current.image_url
              }
            : response.group
        )
      }

      // Reload the source of truth so date, format, and pairings immediately
      // reflect what Supabase actually stored.
      await loadGroup()
      setIsEditing(false)
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

  const handlePostMessage = async () => {
    if (!user?.id || !group?.id) return

    if (!isMember) {
      Alert.alert('Join required', 'Join this group before posting on the board.')
      return
    }

    if (!draft.trim()) {
      Alert.alert('Write something first', 'Add a post, score note, photo caption, or update before posting.')
      return
    }

    setPosting(true)
    try {
      const response = await apiPost<{ success: boolean; messages: GroupMessage[] }>('/api/groups/message', {
        group_id: group.id,
        user_id: user.id,
        message: draft.trim(),
        parent_message_id: replyingTo
      })
      setMessages(response.messages || [])
      setDraft('')
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
              {isEditing ? (
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
            {isOwner ? (
              <Pressable
                accessibilityLabel={isEditing ? 'Change group cover photo' : 'Edit group'}
                onPress={() => {
                  if (isEditing) {
                    void handlePickGroupImage('cover')
                  } else {
                    setActiveSection('info')
                    setIsEditing(true)
                  }
                }}
                style={styles.groupEditButton}
              >
                <Ionicons color="#ffffff" name={isEditing ? 'camera-outline' : 'settings-outline'} size={19} />
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

        {activeSection === 'info' ? (
          <View style={styles.aboutFeed}>
            {isEditing ? (
              <>
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
                {isTournament || editForm.group_type === 'tournament' ? (
                  <View style={styles.tournamentEditFields}>
                    <View style={styles.dateRangeRow}>
                      <TextInput onChangeText={(value) => setEditForm((current) => ({ ...current, tournament_date: value }))} placeholder="Start date (YYYY-MM-DD)" placeholderTextColor={palette.textMuted} style={[styles.editInput, styles.dateRangeInput]} value={editForm.tournament_date} />
                      <TextInput onChangeText={(value) => setEditForm((current) => ({ ...current, tournament_end_date: value }))} placeholder="End date (YYYY-MM-DD)" placeholderTextColor={palette.textMuted} style={[styles.editInput, styles.dateRangeInput]} value={editForm.tournament_end_date} />
                    </View>
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
                            <Pressable onPress={() => void handlePickTeamLogo(team.id)} style={styles.teamLogoPicker}>
                              {team.logoUrl ? <Image source={{ uri: team.logoUrl }} style={styles.teamLogoImage} /> : <Ionicons color={palette.aqua} name="image-outline" size={22} />}
                            </Pressable>
                            <View style={styles.teamEditorCopy}>
                              <Text style={styles.teamNameLabel}>Team {teamIndex + 1} name</Text>
                              <TextInput onChangeText={(value) => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, name: value } : item))} placeholder={`Team ${teamIndex + 1}`} placeholderTextColor={palette.textMuted} style={styles.teamNameInput} value={team.name} />
                              <Text style={styles.matchupSideLabel}>Tap golfers to add or remove</Text>
                              <View style={styles.teamMemberChoices}>
                                {participantOptions.map((participant) => {
                                  const selected = team.memberIds.includes(participant.id)
                                  return <Pressable key={participant.id} onPress={() => setTeams((current) => current.map((item) => item.id === team.id ? { ...item, memberIds: selected ? item.memberIds.filter((id) => id !== participant.id) : [...item.memberIds, participant.id] } : item))} style={[styles.teamMemberChoice, selected && styles.teamMemberChoiceActive]}><Text style={[styles.teamMemberChoiceText, selected && styles.teamMemberChoiceTextActive]}>{participant.name}</Text></Pressable>
                                })}
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
                    {editForm.tournament_format === 'Stroke Play' ? (
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
                        {manualParticipants.map((participant) => <View key={participant.id} style={styles.editMatchupRow}><View style={styles.manualParticipantAdded}><Avatar label={participant.name} size={28} uri={participant.avatarUrl} /><Text style={styles.editMatchupName}>{participant.name}{participant.handicap !== null && participant.handicap !== undefined ? ` · HCP ${participant.handicap}` : ''}</Text></View><Pressable onPress={() => setManualParticipants((current) => current.filter((item) => item.id !== participant.id))}><Ionicons color={palette.textMuted} name="close-circle-outline" size={21} /></Pressable></View>)}
                      </View>
                    ) : null}
                    {editForm.tournament_format !== 'Stroke Play' ? (
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
                        {manualParticipants.map((participant) => <View key={participant.id} style={styles.editMatchupRow}><View style={styles.manualParticipantAdded}><Avatar label={participant.name} size={28} uri={participant.avatarUrl} /><Text style={styles.editMatchupName}>{participant.name}{participant.handicap !== null && participant.handicap !== undefined ? ` · HCP ${participant.handicap}` : ''}</Text></View><Pressable onPress={() => setManualParticipants((current) => current.filter((item) => item.id !== participant.id))}><Ionicons color={palette.textMuted} name="close-circle-outline" size={21} /></Pressable></View>)}
                        <Text style={styles.infoLabel}>Match type</Text>
                        <View style={styles.matchTypeChoices}>
                          {['Stroke Play', 'Match Play', 'Scramble', 'Alternate Shot', 'Other'].map((format) => <Pressable key={format} onPress={() => setMatchupFormat(format)} style={[styles.matchTypeChoice, matchupFormat === format && styles.matchTypeChoiceActive]}><Text style={[styles.matchTypeChoiceText, matchupFormat === format && styles.matchTypeChoiceTextActive]}>{format}</Text></Pressable>)}
                        </View>
                        {tournamentDays.length ? <><Text style={styles.infoLabel}>Tournament day</Text><View style={styles.matchTypeChoices}>{tournamentDays.map((day, index) => <Pressable key={day} onPress={() => setMatchupDay(day)} style={[styles.matchTypeChoice, (matchupDay || tournamentDays[0]) === day && styles.matchTypeChoiceActive]}><Text style={[styles.matchTypeChoiceText, (matchupDay || tournamentDays[0]) === day && styles.matchTypeChoiceTextActive]}>Day {index + 1}</Text></Pressable>)}</View></> : null}
                        <Text style={styles.infoLabel}>Build matchups</Text>
                        <Text style={styles.matchupHint}>Choose two people, then add their pairing.</Text>
                        <View style={styles.matchupChooserRow}>
                          <View style={styles.matchupChoiceColumn}>
                            <Text style={styles.matchupSideLabel}>Player one</Text>
                            {participantOptions.map((participant) => {
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
                            <Text style={styles.matchupSideLabel}>Player two</Text>
                            {participantOptions.map((participant) => {
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
                        {participantOptions.length < 2 ? <Text style={styles.matchupHint}>Add at least two people to create matchups.</Text> : null}
                        <Pressable onPress={addMatchup} style={styles.addMatchupButton}><Text style={styles.addMatchupButtonText}>Add matchup</Text></Pressable>
                        {matchups.map((matchup) => {
                          const left = participantById.get(matchup.leftUserId)
                          const right = participantById.get(matchup.rightUserId)
                          if (!left || !right) return null
                          return (
                            <View key={matchup.id} style={styles.editMatchupRow}>
                              <Text numberOfLines={1} style={styles.editMatchupName}>{left.name} vs. {right.name}{matchup.format ? ` · ${matchup.format}` : ''}</Text>
                              <Pressable onPress={() => setMatchups((current) => current.filter((item) => item.id !== matchup.id))}><Ionicons color={palette.textMuted} name="close-circle-outline" size={21} /></Pressable>
                            </View>
                          )
                        })}
                      </View>
                    ) : null}
                  </View>
                ) : null}
                {(isTournament || editForm.group_type === 'tournament') ? <View style={styles.accessHeading}><Text style={styles.infoLabel}>Tournament access</Text><Text style={styles.matchupHint}>Public lets people join immediately. Private requires your approval.</Text></View> : null}
                <View style={styles.typeRow}>
                  {[
                    { label: 'Public', value: false, icon: 'globe-outline' as const },
                    { label: 'Private', value: true, icon: 'lock-closed-outline' as const }
                  ].map((option) => (
                    <Pressable key={option.label} onPress={() => setEditForm((current) => ({ ...current, is_private: option.value }))} style={[styles.typeChip, editForm.is_private === option.value && styles.typeChipActive]}>
                      <Ionicons color={editForm.is_private === option.value ? palette.aqua : palette.textMuted} name={option.icon} size={17} />
                      <Text style={[styles.typeLabel, editForm.is_private === option.value && styles.typeLabelActive]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.editActions}>
                  <PrimaryButton label="Cancel" variant="ghost" onPress={() => setIsEditing(false)} />
                  <PrimaryButton
                    label={savingEdit ? 'Saving...' : 'Save Group'}
                    loading={savingEdit}
                    onPress={handleSaveEdit}
                  />
                </View>
              </>
            ) : (
              <Text style={styles.body}>
                {group?.description ||
                  'Add what this group is for, who it serves, and why golfers should join.'}
              </Text>
            )}
            {isTournament && !isEditing ? (
              <View style={styles.tournamentInfoCard}>
                <View style={styles.tournamentInfoRow}><Text style={styles.infoLabel}>Dates</Text><Text style={styles.tournamentInfoValue}>{group?.tournament_date ? `${new Date(`${group.tournament_date}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}${group?.tournament_end_date && group.tournament_end_date !== group.tournament_date ? ` – ${new Date(`${group.tournament_end_date}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}` : `, ${new Date(`${group.tournament_date}T12:00:00`).getFullYear()}`}` : 'To be announced'}</Text></View>
                <View style={styles.tournamentInfoRow}><Text style={styles.infoLabel}>Format</Text><Text style={styles.tournamentInfoValue}>{group?.tournament_format || 'Stroke Play'}</Text></View>
                {group?.tournament_type ? <View style={styles.tournamentInfoRow}><Text style={styles.infoLabel}>Type</Text><Text style={styles.tournamentInfoValue}>{group.tournament_type}</Text></View> : null}
              </View>
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
                <Text style={styles.leaderboardMeta}>{tournamentLeaderboard.length} people</Text>
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
              {matchups.map((matchup) => {
                const left = participantById.get(matchup.leftUserId)
                const right = participantById.get(matchup.rightUserId)
                const winner = getMatchupWinner(matchup)
                if (!left || !right) return null
                return <View key={matchup.id} style={styles.matchupScoreCard}>
                  <Text style={styles.matchupFormatBadge}>{matchup.format || group?.tournament_format || 'Match Play'}</Text>
                  {matchup.day ? <Text style={styles.matchupDayBadge}>{new Date(`${matchup.day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text> : null}
                  <View style={styles.matchupScoreRow}>
                    <View style={[styles.matchupScoreGolfer, winner === 'left' && styles.matchupWinner]}><Avatar label={left.name} size={42} uri={left.avatarUrl} /><Text numberOfLines={1} style={styles.matchupGolferName}>{left.name}</Text>{isEditingMatchupScores ? <TextInput keyboardType="number-pad" onChangeText={(value) => setMatchups((current) => current.map((item) => item.id === matchup.id ? { ...item, leftScore: value.trim() ? Number(value) : null } : item))} placeholder="—" placeholderTextColor={palette.textMuted} style={styles.matchupScoreInput} value={matchup.leftScore?.toString() || ''} /> : <Text style={styles.matchupScoreValue}>{matchup.leftScore ?? '—'}</Text>}</View>
                    <Text style={styles.matchupVs}>VS.</Text>
                    <View style={[styles.matchupScoreGolfer, winner === 'right' && styles.matchupWinner]}><Avatar label={right.name} size={42} uri={right.avatarUrl} /><Text numberOfLines={1} style={styles.matchupGolferName}>{right.name}</Text>{isEditingMatchupScores ? <TextInput keyboardType="number-pad" onChangeText={(value) => setMatchups((current) => current.map((item) => item.id === matchup.id ? { ...item, rightScore: value.trim() ? Number(value) : null } : item))} placeholder="—" placeholderTextColor={palette.textMuted} style={styles.matchupScoreInput} value={matchup.rightScore?.toString() || ''} /> : <Text style={styles.matchupScoreValue}>{matchup.rightScore ?? '—'}</Text>}</View>
                  </View>
                  {isEditingMatchupScores ? <PrimaryButton label={savingMatchupId === matchup.id ? 'Saving...' : 'Save Result'} loading={savingMatchupId === matchup.id} onPress={() => void handleSaveMatchupScore(matchup.id)} /> : winner ? <Text style={styles.matchupWinnerText}>{winner === 'left' ? left.name : right.name} wins</Text> : <Text style={styles.matchupTypeFooter}>{matchup.format || group?.tournament_format || 'Match Play'}</Text>}
                </View>
              })}
              {!matchups.length ? <Text style={styles.body}>The tournament admin has not added matchups yet.</Text> : null}
              {isOwner ? <Pressable accessibilityLabel={isEditingMatchupScores ? 'Finish editing matchup scores' : 'Edit matchup scores'} onPress={() => setIsEditingMatchupScores((current) => !current)} style={styles.matchupSettingsButton}><Ionicons color="#ffffff" name={isEditingMatchupScores ? 'close' : 'settings-outline'} size={21} /></Pressable> : null}
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
              placeholder="Post to the board: score, photo caption, tee time, or group update"
              placeholderTextColor={palette.textMuted}
              style={styles.composeInput}
              value={draft}
            />
            <PrimaryButton label={posting ? 'Posting...' : 'Post to Group'} loading={posting} onPress={handlePostMessage} />
              </View>
            ) : null}

            {messages.length === 0 ? (
              <Text style={styles.body}>No posts yet. Start the conversation for this group.</Text>
            ) : null}

            {messages.map((message) => (
              <View key={message.id} style={styles.messageCard}>
                <View style={styles.messageTop}>
                  <View style={styles.memberIdentity}>
                    <Avatar
                      label={formatAuthor(message)}
                      size={38}
                      uri={message.user_profiles?.avatar_url}
                    />
                    <Text style={styles.memberName}>{formatAuthor(message)}</Text>
                  </View>
                  <Text style={styles.messageMeta}>
                    {message.created_at ? new Date(message.created_at).toLocaleDateString() : 'Now'}
                  </Text>
                </View>
                <Text style={styles.body}>{message.message_content || ''}</Text>
                <View style={styles.messageActions}>
                  <Pressable onPress={() => void handleToggleLike(message.id, !!message.liked_by_user)}>
                    <Text style={styles.messageAction}>
                      {message.liked_by_user ? 'Unlike' : 'Like'}{message.like_count ? ` (${message.like_count})` : ''}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => { setReplyingTo(message.id); setComposerOpen(true) }}>
                    <Text style={styles.messageAction}>Reply</Text>
                  </Pressable>
                </View>
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
            ))}
          </View>
        )}
      </ScrollView>
      <Pressable accessibilityLabel="Share group QR code" onPress={() => setShowShareModal(true)} style={styles.floatingQrButton}>
        <Ionicons color={palette.text} name="qr-code-outline" size={25} />
      </Pressable>
      <Modal
        animationType="slide"
        transparent
        visible={showShareModal}
        onRequestClose={() => setShowShareModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowShareModal(false)}>
          <Pressable style={[styles.modalCard, styles.groupShareModalCard]} onPress={() => {}}>
            <View style={styles.groupQrBusinessCard}>
              {group?.header_image_url || group?.image_url ? (
                <Image source={{ uri: group?.header_image_url || group?.image_url || '' }} style={styles.groupQrBusinessCardImage} />
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
            <Pressable onPress={() => void Share.share({ message: groupLink, url: groupLink })} style={styles.groupShareButton}>
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
    fontSize: 12,
    paddingHorizontal: 10
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
    gap: 10
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
    paddingHorizontal: 16
  },
  tabChipActive: {
    backgroundColor: 'rgba(103,232,249,0.14)',
    borderColor: 'rgba(103,232,249,0.26)'
  },
  tabLabel: {
    color: palette.textMuted,
    fontSize: 14,
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
    backgroundColor: 'rgba(215,183,104,0.08)',
    borderColor: 'rgba(215,183,104,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 15
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
    alignItems: 'flex-start',
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
    flexDirection: 'row',
    gap: 9
  },
  teamRosterLogo: {
    borderRadius: 16,
    height: 32,
    width: 32
  },
  teamRosterTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: '800'
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
  postsFeed: {
    gap: 12
  },
  membersFeed: {
    gap: 12
  },
  scoresFeed: {
    gap: 12
  },
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
  matchupScoreCard: {
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12,
    position: 'relative'
  },
  matchupScoreRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between'
  },
  matchupScoreGolfer: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    gap: 4,
    padding: 6
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
    flexDirection: 'row',
    gap: 16
  },
  messageAction: {
    color: palette.aqua,
    fontSize: 13,
    fontWeight: '700'
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
