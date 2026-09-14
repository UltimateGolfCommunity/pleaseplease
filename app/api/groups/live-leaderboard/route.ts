import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

async function canManageTournament(supabase: any, groupId: string, userId: string) {
  const { data: group } = await supabase
    .from('golf_groups')
    .select('id, name, creator_id, group_type, tournament_matchups')
    .eq('id', groupId)
    .maybeSingle()
  if (!group || (group.group_type || '').toLowerCase() !== 'tournament') return { allowed: false, group: null }
  if (group.creator_id === userId) return { allowed: true, group }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle()
  return { allowed: ['admin', 'owner', 'creator'].includes((membership?.role || '').toLowerCase()) && membership?.status === 'active', group }
}

async function isTournamentMember(supabase: any, groupId: string, userId: string) {
  const { data } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  return Boolean(data)
}

export async function POST(request: NextRequest) {
  try {
    const { group_id, user_id, live_scoring } = await request.json()
    if (!group_id || !user_id) return NextResponse.json({ error: 'Tournament and user are required' }, { status: 400 })

    const supabase = createAdminClient()
    const permission = await canManageTournament(supabase, group_id, user_id)
    if (!permission.group) return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    // Admins control the switch in the app. Any active participant may refresh
    // the already-enabled public board after posting their own score.
    if (!permission.allowed && !(await isTournamentMember(supabase, group_id, user_id))) {
      return NextResponse.json({ error: 'Only tournament participants can update the live leaderboard' }, { status: 403 })
    }
    if (!live_scoring && !permission.allowed) {
      return NextResponse.json({ error: 'Only tournament admins can turn off live scoring' }, { status: 403 })
    }

    if (!live_scoring) {
      await supabase
        .from('user_activities')
        .delete()
        .eq('related_id', group_id)
        .eq('activity_type', 'tournament_live_leaderboard')
      return NextResponse.json({ success: true, removed: true })
    }

    const [{ data: members }, { data: scores }] = await Promise.all([
      supabase
        .from('group_members')
        .select('user_id, user_profiles (first_name, last_name, username)')
        .eq('group_id', group_id)
        .eq('status', 'active'),
      supabase.from('tournament_scores').select('user_id, total_score').eq('group_id', group_id).order('total_score', { ascending: true })
    ])
    const scoreByUser = new Map((scores || []).map((score: any) => [score.user_id, score.total_score]))
    const leaders = (members || [])
      .map((member: any) => {
        const profile = member.user_profiles || {}
        const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'Participant'
        return { name, score: scoreByUser.get(member.user_id) ?? null }
      })
      .filter((entry: any) => entry.score !== null)
      .sort((a: any, b: any) => a.score - b.score)
      .slice(0, 3)

    let liveMatchups: { left: string; right: string; leftScore: number | null; rightScore: number | null; throughHole: number | null }[] = []
    try {
      const setup = JSON.parse(permission.group.tournament_matchups || '{}')
      const nameByUserId = new Map(
        (members || []).map((member: any) => {
          const profile = member.user_profiles || {}
          return [
            member.user_id,
            [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'Participant'
          ]
        })
      )
      liveMatchups = (Array.isArray(setup?.matchups) ? setup.matchups : [])
        .filter((matchup: any) => matchup?.leftUserId && matchup?.rightUserId)
        .map((matchup: any) => ({
          left: nameByUserId.get(matchup.leftUserId) || 'Golfer one',
          right: nameByUserId.get(matchup.rightUserId) || 'Golfer two',
          leftScore: typeof matchup.leftScore === 'number' ? matchup.leftScore : null,
          rightScore: typeof matchup.rightScore === 'number' ? matchup.rightScore : null,
          throughHole: typeof matchup.throughHole === 'number' ? matchup.throughHole : null
        }))
        .filter((matchup: any) => matchup.leftScore !== null || matchup.rightScore !== null || matchup.throughHole !== null)
        .slice(0, 3)
    } catch {
      liveMatchups = []
    }

    const description = leaders.length
      ? leaders.map((entry: any, index: number) => `${index + 1}. ${entry.name} — ${entry.score}`).join('  •  ')
      : liveMatchups.length
        ? liveMatchups.map((matchup) => `${matchup.left} ${matchup.leftScore ?? '—'}–${matchup.rightScore ?? '—'} ${matchup.right}${matchup.throughHole ? ` (through ${matchup.throughHole})` : ''}`).join('  •  ')
        : 'Scores will appear here as tournament participants post them.'
    const payload = {
      title: `${permission.group.name} live leaderboard`,
      description,
      metadata: { group_id, group_name: permission.group.name, live_scoring: true, leaders, live_matchups: liveMatchups }
    }
    const { data: existing } = await supabase
      .from('user_activities')
      .select('id')
      .eq('related_id', group_id)
      .eq('activity_type', 'tournament_live_leaderboard')
      .maybeSingle()

    const result = existing
      ? await supabase.from('user_activities').update(payload).eq('id', existing.id).select().single()
      : await supabase.from('user_activities').insert({
          user_id: permission.group.creator_id || user_id,
          activity_type: 'tournament_live_leaderboard',
          related_id: group_id,
          related_type: 'group',
          ...payload
        }).select().single()
    if (result.error) throw result.error
    return NextResponse.json({ success: true, activity: result.data })
  } catch (error) {
    console.error('Unable to update live tournament leaderboard:', error)
    return NextResponse.json({ error: 'Unable to update live leaderboard' }, { status: 500 })
  }
}
