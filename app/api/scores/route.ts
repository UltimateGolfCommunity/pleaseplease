import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

const mockRounds = [
  {
    id: 'mock-round-1',
    user_id: 'mock-user',
    course_name: 'Pebble Beach Golf Links',
    holes_played: 18,
    hole_scores: [5, 4, 4, 6, 5, 4, 5, 4, 5, 4, 5, 4, 4, 5, 5, 4, 4, 5],
    total_score: 82,
    average_score_per_hole: 4.56,
    played_at: new Date().toISOString()
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ success: true, rounds: [] })
    }

    const supabase = createAdminClient()

    const { error: tableCheckError } = await supabase
      .from('user_rounds')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      return NextResponse.json({ success: true, rounds: [] })
    }

    const { data, error } = await supabase
      .from('user_rounds')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Error fetching rounds:', error)
      return NextResponse.json({ success: true, rounds: [] })
    }

    return NextResponse.json({ success: true, rounds: data || [] })
  } catch (error) {
    console.error('Error in scores GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, course_name, holes_played, hole_scores, played_at } = body

    if (!user_id || !course_name || !holes_played || !Array.isArray(hole_scores)) {
      return NextResponse.json({ error: 'Missing required scorecard fields' }, { status: 400 })
    }

    if (![9, 18].includes(Number(holes_played))) {
      return NextResponse.json({ error: 'Rounds must be 9 or 18 holes' }, { status: 400 })
    }

    if (hole_scores.length !== Number(holes_played)) {
      return NextResponse.json({ error: 'Please provide a score for each hole' }, { status: 400 })
    }

    const parsedScores = hole_scores.map((score: unknown) => Number(score))

    if (parsedScores.some((score: number) => !Number.isFinite(score) || score <= 0)) {
      return NextResponse.json({ error: 'Hole scores must all be valid numbers greater than 0' }, { status: 400 })
    }

    const totalScore = parsedScores.reduce((sum: number, score: number) => sum + score, 0)
    const averageScorePerHole = totalScore / Number(holes_played)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        success: true,
        round: {
          ...mockRounds[0],
          id: `mock-round-${Date.now()}`,
          user_id,
          course_name,
          holes_played: Number(holes_played),
          hole_scores: parsedScores,
          total_score: totalScore,
          average_score_per_hole: averageScorePerHole,
          played_at: played_at || new Date().toISOString()
        }
      })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('user_rounds')
      .insert({
        user_id,
        course_name,
        holes_played: Number(holes_played),
        hole_scores: parsedScores,
        total_score: totalScore,
        average_score_per_hole: averageScorePerHole,
        played_at: played_at || new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving round:', error)
      return NextResponse.json({ error: 'Failed to save round' }, { status: 500 })
    }

    return NextResponse.json({ success: true, round: data })
  } catch (error) {
    console.error('Error in scores POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
