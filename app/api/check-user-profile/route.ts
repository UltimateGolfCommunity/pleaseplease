import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    console.log('🔍 Checking user profile for:', userId)
    
    const supabase = createAdminClient()

    // Check if user profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking profile:', checkError)
      throw checkError
    }

    if (existingProfile) {
      console.log('✅ Profile exists for user:', userId)
      return NextResponse.json({ 
        exists: true, 
        profile: existingProfile 
      })
    }

    console.log('⚠️ Profile not found, checking auth.users...')

    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
    
    if (authError || !authUser.user) {
      console.error('❌ User not found in auth.users:', authError)
      return NextResponse.json({ 
        error: 'User not found in auth.users',
        details: authError?.message 
      }, { status: 404 })
    }

    console.log('✅ User found in auth.users, creating profile...')

    // Create user profile
    const { data: newProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email: authUser.user.email,
        username: authUser.user.user_metadata?.username || authUser.user.email?.split('@')[0] || 'user',
        first_name: authUser.user.user_metadata?.first_name || '',
        last_name: authUser.user.user_metadata?.last_name || '',
        full_name: authUser.user.user_metadata?.full_name || 
          `${authUser.user.user_metadata?.first_name || ''} ${authUser.user.user_metadata?.last_name || ''}`.trim() || 'Golfer'
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating profile:', createError)
      throw createError
    }

    console.log('✅ Profile created successfully for user:', userId)
    return NextResponse.json({ 
      exists: false, 
      created: true, 
      profile: newProfile 
    })

  } catch (error) {
    console.error('❌ Error checking/creating user profile:', error)
    
    // Return a more graceful error response
    return NextResponse.json({ 
      error: 'Profile check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    }, { status: 500 })
  }
}
