import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

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

    // Create group-images directory if it doesn't exist
    const groupImagesDir = join(process.cwd(), 'public', 'group-images')
    try {
      await mkdir(groupImagesDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'png'
    const fileName = `group-${groupId}-${imageType}-${Date.now()}.${fileExtension}`
    const filePath = join(groupImagesDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate public URL
    const publicUrl = `/group-images/${fileName}`

    // Update group with image URL
    const supabase = createAdminClient()
    const updateData = imageType === 'header' 
      ? { header_image_url: publicUrl }
      : { image_url: publicUrl }

    const { error: updateError } = await supabase
      .from('golf_groups')
      .update(updateData)
      .eq('id', groupId)

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
