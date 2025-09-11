import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const groupId = formData.get('groupId') as string

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

    // Create group-logos directory if it doesn't exist
    const groupLogosDir = join(process.cwd(), 'public', 'group-logos')
    try {
      await mkdir(groupLogosDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'png'
    const fileName = `group-${groupId}-${Date.now()}.${fileExtension}`
    const filePath = join(groupLogosDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Generate public URL
    const publicUrl = `/group-logos/${fileName}`

    // Update group with logo URL
    const supabase = createAdminClient()
    const { error: updateError } = await supabase
      .from('golf_groups')
      .update({ logo_url: publicUrl })
      .eq('id', groupId)

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
