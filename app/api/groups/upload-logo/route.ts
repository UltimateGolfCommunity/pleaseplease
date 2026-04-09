import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

async function updateGroupLogoWithFallback(supabase: any, groupId: string, publicUrl: string) {
  const attempts = [{ logo_url: publicUrl }, { image_url: publicUrl }]

  let lastError: any = null

  for (const payload of attempts) {
    const { error } = await supabase
      .from('golf_groups')
      .update(payload)
      .eq('id', groupId)

    if (!error) {
      return null
    }

    lastError = error
    console.warn('⚠️ GROUP LOGO: Update attempt failed, trying fallback payload:', {
      payloadKeys: Object.keys(payload),
      code: error.code,
      message: error.message
    })
  }

  return lastError
}

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const groupId = formData.get('groupId') as string
    const userId = formData.get('userId') as string

    if (!file || !groupId) {
      return NextResponse.json(
        { error: 'File and groupId are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    if (userId) {
      const allowed = await canManageGroup(supabase, groupId, userId)
      if (!allowed) {
        return NextResponse.json(
          { error: 'Only the group owner or admin can update the group logo' },
          { status: 403 }
        )
      }
    }

    const fileExtension = file.name.split('.').pop() || 'png'
    const filePath = `group-logos/group-${groupId}-${Date.now()}.${fileExtension}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading group logo to storage:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload group logo' },
        { status: 500 }
      )
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    const updateError = await updateGroupLogoWithFallback(supabase, groupId, publicUrl)

    if (updateError) {
      console.error('Error updating group logo:', updateError)
      return NextResponse.json(
        { error: 'Failed to update group logo' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      logoUrl: publicUrl,
      message: 'Group logo uploaded successfully'
    })

  } catch (error) {
    console.error('Error uploading group logo:', error)
    return NextResponse.json(
      { error: 'Failed to upload group logo' },
      { status: 500 }
    )
  }
}
