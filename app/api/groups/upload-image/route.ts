import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

async function updateGroupImageWithFallback(supabase: any, groupId: string, imageType: string, publicUrl: string) {
  const attempts = imageType === 'header'
    ? [{ header_image_url: publicUrl }, { image_url: publicUrl }]
    : [{ image_url: publicUrl }, { logo_url: publicUrl }]

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
    console.warn('⚠️ GROUP IMAGE: Update attempt failed, trying fallback payload:', {
      payloadKeys: Object.keys(payload),
      code: error.code,
      message: error.message
    })
  }

  return lastError
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const groupId = formData.get('groupId') as string
    const imageType = formData.get('imageType') as string // 'profile' or 'header'

    if (!file || !groupId || !imageType) {
      return NextResponse.json(
        { error: 'File, groupId, and imageType are required' },
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

    // Validate file size (max 10MB for header images, 5MB for profile)
    const maxSize = imageType === 'header' ? 10 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size must be less than ${imageType === 'header' ? '10MB' : '5MB'}` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const fileExtension = file.name.split('.').pop() || 'png'
    const filePath = `group-images/group-${groupId}-${imageType}-${Date.now()}.${fileExtension}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Error uploading group image to storage:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload group image' },
        { status: 500 }
      )
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    const updateError = await updateGroupImageWithFallback(supabase, groupId, imageType, publicUrl)

    if (updateError) {
      console.error('Error updating group image:', updateError)
      return NextResponse.json(
        { error: 'Failed to update group image' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      message: `Group ${imageType} image uploaded successfully`
    })

  } catch (error) {
    console.error('Error uploading group image:', error)
    return NextResponse.json(
      { error: 'Failed to upload group image' },
      { status: 500 }
    )
  }
}
