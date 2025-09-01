import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const supabase = createServerClient()
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Profile PUT request received')
    const body = await request.json()
    console.log('🔍 Request body:', body)
    
    const { id, first_name, last_name, username, bio, avatar_url, handicap, location } = body
    
    if (!id) {
      console.log('❌ No user ID provided')
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    console.log('🔍 User ID:', id)

    const supabase = createServerClient()
    console.log('🔍 Supabase client created')
    
    // First check if profile exists
    console.log('🔍 Checking if profile exists for user:', id)
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', id)
      .single()
    
    if (checkError) {
      console.error('❌ Error checking profile existence:', checkError)
      
      // Try to create profile if it doesn't exist
      console.log('🔍 Profile not found, attempting to create new profile')
      const { data: createdProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: id,
          email: body.email || 'user@example.com', // Fallback email
          first_name: first_name || '',
          last_name: last_name || '',
          username: username || '',
          full_name: first_name && last_name ? `${first_name} ${last_name}`.trim() : '',
          bio: bio || '',
          avatar_url: avatar_url || '',
          handicap: handicap || 0,
          location: location || ''
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating profile:', createError)
        return NextResponse.json({ 
          error: 'Failed to create profile', 
          details: createError.message 
        }, { status: 500 })
      }
      
      console.log('✅ Profile created successfully:', createdProfile)
      return NextResponse.json(createdProfile)
    }
    
    console.log('✅ Profile exists, proceeding with update')
    
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (username !== undefined) updateData.username = username
    if (bio !== undefined) updateData.bio = bio
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (handicap !== undefined) updateData.handicap = handicap
    if (location !== undefined) updateData.location = location
    
    // Only set full_name if both first_name and last_name are provided
    if (first_name && last_name) {
      updateData.full_name = `${first_name} ${last_name}`.trim()
    }
    
    console.log('🔍 Update data:', updateData)
    
    // Update profile
    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating profile:', error)
      return NextResponse.json({ 
        error: 'Failed to update profile', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Profile updated successfully:', updatedProfile)
    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('❌ Profile PUT error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
