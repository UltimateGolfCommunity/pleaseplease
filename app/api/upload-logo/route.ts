import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { generateLogoFileName, getFileExtension } from '@/lib/logo-upload'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('logo') as File
    const courseName = formData.get('courseName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Generate filename
    const fileExtension = getFileExtension(file.name)
    const filename = courseName 
      ? generateLogoFileName(courseName, fileExtension)
      : `logo-${Date.now()}.${fileExtension}`

    // Ensure logos directory exists
    const logosDir = join(process.cwd(), 'public', 'logos')
    try {
      await mkdir(logosDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save file
    const filePath = join(logosDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)

    // Return the public URL
    const logoUrl = `/logos/${filename}`

    return NextResponse.json({ 
      success: true, 
      logoUrl,
      filename 
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload logo' }, 
      { status: 500 }
    )
  }
}
