import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

async function getInteractionSummary(supabase: any, activityId: string, userId: string) {
  const [likesResult, commentsResult] = await Promise.all([
    supabase.from('activity_likes').select('user_id').eq('activity_id', activityId),
    supabase.from('activity_comments').select('id').eq('activity_id', activityId)
  ])

  const likes = likesResult.data || []
  const comments = commentsResult.data || []

  return {
    like_count: likes.length,
    liked_by_user: likes.some((like: any) => like.user_id === userId),
    comment_count: comments.length
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activityId = searchParams.get('activity_id')

    if (!activityId) {
      return NextResponse.json({ error: 'activity_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('activity_comments')
      .select(`
        *,
        user_profiles (
          id,
          first_name,
          last_name,
          username,
          avatar_url
        )
      `)
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ success: true, comments: [] })
    }

    return NextResponse.json({ success: true, comments: data || [] })
  } catch (error) {
    console.error('Error fetching feed interactions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, activity_id, user_id, comment } = await request.json()

    if (!activity_id || !user_id) {
      return NextResponse.json({ error: 'activity_id and user_id are required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    if (action === 'like') {
      const { error } = await supabase
        .from('activity_likes')
        .upsert({ activity_id, user_id }, { onConflict: 'activity_id,user_id', ignoreDuplicates: true })

      if (error) {
        return NextResponse.json({ error: 'Failed to like activity' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        ...(await getInteractionSummary(supabase, activity_id, user_id))
      })
    }

    if (action === 'unlike') {
      const { error } = await supabase
        .from('activity_likes')
        .delete()
        .eq('activity_id', activity_id)
        .eq('user_id', user_id)

      if (error) {
        return NextResponse.json({ error: 'Failed to unlike activity' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        ...(await getInteractionSummary(supabase, activity_id, user_id))
      })
    }

    if (action === 'comment') {
      if (!comment?.trim()) {
        return NextResponse.json({ error: 'Comment is required' }, { status: 400 })
      }

      const { data, error } = await supabase
        .from('activity_comments')
        .insert({
          activity_id,
          user_id,
          comment: comment.trim()
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: 'Failed to comment on activity' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        comment: data,
        ...(await getInteractionSummary(supabase, activity_id, user_id))
      })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating feed interaction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
