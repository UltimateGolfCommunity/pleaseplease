import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

async function canManageGroup(supabase: any, groupId: string, userId: string) {
  const { data: group } = await supabase
    .from('golf_groups')
    .select('creator_id')
    .eq('id', groupId)
    .maybeSingle()

  if (!group) {
    return false
  }

  if (group.creator_id === userId) {
    return true
  }

  const { data: membership } = await supabase
    .from('group_members')
    .select('role, status')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return ['admin', 'owner', 'creator'].includes((membership?.role || '').toLowerCase())
}

async function updateGroupMedia(
  supabase: any,
  groupId: string,
  target: 'logo' | 'cover',
  url: string
) {
  const attempts =
    target === 'logo'
      ? [{ logo_url: url }, { image_url: url }]
      : [{ header_image_url: url }, { image_url: url }]

  let lastError: any = null

  for (const payload of attempts) {
    const { data, error } = await supabase
      .from('golf_groups')
      .update(payload)
      .eq('id', groupId)
      .select()
      .single()

    if (!error) {
      return { group: data, error: null }
    }

    lastError = error
  }

  return { group: null, error: lastError }
}

async function logGroupMediaActivity(
  supabase: any,
  {
    userId,
    groupId,
    groupName,
    target
  }: {
    userId: string
    groupId: string
    groupName?: string | null
    target: 'logo' | 'cover'
  }
) {
  try {
    await supabase.from('user_activities').insert({
      user_id: userId,
      activity_type: target === 'logo' ? 'group_logo_updated' : 'group_cover_updated',
      title: target === 'logo' ? 'Updated group logo' : 'Updated group cover',
      description:
        target === 'logo'
          ? `Updated the logo for ${groupName || 'a golf group'}`
          : `Updated the cover photo for ${groupName || 'a golf group'}`,
      related_id: groupId,
      related_type: 'group',
      metadata: {
        group_id: groupId,
        group_name: groupName || null,
        target
      }
    })
  } catch (error) {
    console.warn('⚠️ Unable to log group media activity:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { group_id, user_id, target, url } = await request.json()

    if (!group_id || !user_id || !target || !url) {
      return NextResponse.json({ error: 'Group ID, user ID, target, and url are required' }, { status: 400 })
    }

    if (target !== 'logo' && target !== 'cover') {
      return NextResponse.json({ error: 'Target must be logo or cover' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const allowed = await canManageGroup(supabase, group_id, user_id)

    if (!allowed) {
      return NextResponse.json({ error: 'Only the group owner or admin can update group media' }, { status: 403 })
    }

    const { group, error } = await updateGroupMedia(supabase, group_id, target, url)

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to update group media',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    await logGroupMediaActivity(supabase, {
      userId: user_id,
      groupId: group_id,
      groupName: group?.name || null,
      target
    })

    return NextResponse.json({
      success: true,
      group
    })
  } catch (error) {
    console.error('Error updating group media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
