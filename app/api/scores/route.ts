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
    const roundId = searchParams.get('round_id')

    if (!userId && !roundId) {
      return NextResponse.json({ error: 'User ID or round ID is required' }, { status: 400 })
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

    if (roundId) {
      const { data: round, error: roundError } = await supabase
        .from('user_rounds')
        .select('*')
        .eq('id', roundId)
        .maybeSingle()

      if (roundError) {
        console.error('Error fetching round detail:', roundError)
        return NextResponse.json({ error: 'Failed to fetch round detail' }, { status: 500 })
      }

      if (!round) {
        return NextResponse.json({ error: 'Round not found' }, { status: 404 })
      }

      const { data: courseRounds, error: courseRoundsError } = await supabase
        .from('user_rounds')
        .select('*')
        .eq('user_id', round.user_id)
        .eq('course_name', round.course_name)
        .order('played_at', { ascending: false })

      if (courseRoundsError) {
        console.error('Error fetching course rounds:', courseRoundsError)
      }

      const sameCourseRounds = courseRounds || []
      const courseAverage = sameCourseRounds.length
        ? sameCourseRounds.reduce((sum: number, item: any) => sum + Number(item.total_score || 0), 0) / sameCourseRounds.length
        : Number(round.total_score || 0)
      const bestAtCourse = sameCourseRounds.length
        ? Math.min(...sameCourseRounds.map((item: any) => Number(item.total_score || 0)))
        : Number(round.total_score || 0)

      return NextResponse.json({
        success: true,
        round,
        course_average: Number(courseAverage.toFixed(1)),
        rounds_at_course: sameCourseRounds.length,
        best_at_course: bestAtCourse,
        same_course_rounds: sameCourseRounds.slice(0, 6)
      })
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
    const { user_id, course_name, holes_played, hole_scores, total_score, played_at } = body

    if (!user_id || !course_name || !holes_played) {
      return NextResponse.json({ error: 'Missing required scorecard fields' }, { status: 400 })
    }

    if (![9, 18].includes(Number(holes_played))) {
      return NextResponse.json({ error: 'Rounds must be 9 or 18 holes' }, { status: 400 })
    }

    const providedScores = Array.isArray(hole_scores) ? hole_scores : []
    const totalOnlyScore = Number(total_score)

    if (!providedScores.length && (!Number.isFinite(totalOnlyScore) || totalOnlyScore <= 0)) {
      return NextResponse.json({ error: 'Add hole scores or a valid total score' }, { status: 400 })
    }

    if (providedScores.length && providedScores.length !== Number(holes_played)) {
      return NextResponse.json({ error: 'Please provide a score for each hole' }, { status: 400 })
    }

    const parsedScores = providedScores.length
      ? providedScores.map((score: unknown) => Number(score))
      : []

    if (parsedScores.some((score: number) => !Number.isFinite(score) || score <= 0)) {
      return NextResponse.json({ error: 'Hole scores must all be valid numbers greater than 0' }, { status: 400 })
    }

    const totalScore = parsedScores.length
      ? parsedScores.reduce((sum: number, score: number) => sum + score, 0)
      : totalOnlyScore
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

    const activityPayload = {
      user_id,
      activity_type: 'round_logged',
      title: 'Logged a score',
      description: `Logged ${totalScore} at ${course_name}`,
      related_id: data.id,
      related_type: 'round',
      metadata: {
        round_id: data.id,
        course_name,
        score: totalScore,
        holes_played: Number(holes_played),
        average_score_per_hole: averageScorePerHole,
        played_at: data.played_at
      }
    }

    const { error: activityError } = await supabase
      .from('user_activities')
      .insert(activityPayload)

    if (activityError) {
      console.warn('Score saved, but activity log failed:', activityError)
    }

    return NextResponse.json({ success: true, round: data })
  } catch (error) {
    console.error('Error in scores POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
