import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

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

    return NextResponse.json({
      success: true,
      group,
      members: members || []
    })
  } catch (error) {
    console.error('Error fetching group detail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
