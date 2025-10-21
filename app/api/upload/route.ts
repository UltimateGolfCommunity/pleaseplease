import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Try to get Supabase client
    let supabase: any = null
    try {
      supabase = createAdminClient()
    } catch (adminError) {
      try {
        supabase = createServerClient()
      } catch (serverError) {
        console.error('❌ Failed to create Supabase client:', serverError)
        // Return a mock URL for development
        return NextResponse.json({ 
          success: true, 
          url: `/logos/DefaultPicPNG.png`,
          message: 'Using default image (Supabase not configured)'
        })
      }
    }

    if (!supabase) {
      // Return a mock URL for development
      return NextResponse.json({ 
        success: true, 
        url: `/logos/DefaultPicPNG.png`,
        message: 'Using default image (Supabase not configured)'
      })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    console.log('📤 Uploading file:', filePath)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('❌ Upload error:', error)
      
      // If bucket doesn't exist, return default image
      if (error.message.includes('bucket') || error.message.includes('not found')) {
        console.log('⚠️ Storage bucket not configured, using default image')
        return NextResponse.json({ 
          success: true, 
          url: `/logos/DefaultPicPNG.png`,
          message: 'Using default image (storage bucket not configured)'
        })
      }
      
      return NextResponse.json({ 
        error: 'Failed to upload file', 
        details: error.message 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    console.log('✅ File uploaded successfully:', publicUrl)

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      path: filePath
    })

  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}

