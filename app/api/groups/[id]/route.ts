import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const viewerId = new URL(request.url).searchParams.get('user_id')

    const { data: group, error: groupError } = await supabase
      .from('golf_groups')
      .select('*')
      .eq('id', id)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const { data: members, error: membersError } = await supabase
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
          handicap
        )
      `)
      .eq('group_id', id)
      .eq('status', 'active')

    if (membersError) {
      console.error('Error fetching group members:', membersError)
    }

    let pendingMembers: any[] = []
    const viewerIsCreator = viewerId && group.creator_id === viewerId
    let viewerIsAdmin = false

    if (viewerId && !viewerIsCreator) {
      const { data: viewerMembership } = await supabase
        .from('group_members')
        .select('role, status')
        .eq('group_id', id)
        .eq('user_id', viewerId)
        .eq('status', 'active')
        .maybeSingle()
      viewerIsAdmin = ['admin', 'owner', 'creator'].includes((viewerMembership?.role || '').toLowerCase())
    }

    if (viewerIsCreator || viewerIsAdmin) {
      const { data } = await supabase
        .from('group_members')
        .select(`*, user_profiles (id, first_name, last_name, username, avatar_url, location, handicap)`)
        .eq('group_id', id)
        .eq('status', 'pending')
      pendingMembers = data || []
    }

    return NextResponse.json(
      {
        success: true,
        group,
        members: members || [],
        pending_members: pendingMembers
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    )
  } catch (error) {
    console.error('Error fetching group detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
