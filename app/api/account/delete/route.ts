import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const userId = body?.user_id

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    await Promise.allSettled([
      supabase.from('group_members').delete().eq('user_id', userId),
      supabase.from('user_connections').delete().eq('requester_id', userId),
      supabase.from('user_connections').delete().eq('recipient_id', userId),
      supabase.from('group_invitations').delete().eq('invited_user_id', userId),
      supabase.from('group_invitations').delete().eq('invited_by', userId),
      supabase.from('notifications').delete().eq('user_id', userId),
      supabase.from('user_activities').delete().eq('user_id', userId),
      supabase.from('user_rounds').delete().eq('user_id', userId),
      supabase.from('user_profiles').delete().eq('id', userId)
    ])

    await supabase.auth.admin.deleteUser(userId, true)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      {
        error: 'Unable to delete account right now',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
