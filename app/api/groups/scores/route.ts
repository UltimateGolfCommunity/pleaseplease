import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

async function isActiveMember(supabase: any, groupId: string, userId: string) {
  const { data } = await supabase
    .from('group_members')
    .select('id, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  return Boolean(data)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('group_id')

  if (!groupId) return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('tournament_scores')
      .select('*, user_profiles (id, first_name, last_name, username, avatar_url, handicap)')
      .eq('group_id', groupId)
      .order('total_score', { ascending: true })

    if (error) throw error
    return NextResponse.json({ success: true, scores: data || [] })
  } catch (error) {
    console.error('Unable to load tournament scores:', error)
    return NextResponse.json({ error: 'Unable to load tournament scores' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { group_id, user_id, total_score, score_label } = await request.json()
    if (!group_id || !user_id || !Number.isFinite(Number(total_score))) {
      return NextResponse.json({ error: 'Tournament, golfer, and score are required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!(await isActiveMember(supabase, group_id, user_id))) {
      return NextResponse.json({ error: 'Only tournament participants can post scores' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('tournament_scores')
      .upsert(
        { group_id, user_id, total_score: Number(total_score), score_label: score_label?.trim() || null },
        { onConflict: 'group_id,user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, score: data })
  } catch (error) {
    console.error('Unable to save tournament score:', error)
    return NextResponse.json({ error: 'Unable to save tournament score' }, { status: 500 })
  }
}
