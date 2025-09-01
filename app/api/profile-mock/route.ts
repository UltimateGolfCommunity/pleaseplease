import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  try {
    console.log('🔍 Mock Profile PUT request received')
    const body = await request.json()
    console.log('🔍 Request body:', body)
    
    const { id, first_name, last_name, username, bio, avatar_url, handicap, location } = body
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Return a mock successful response
    const mockProfile = {
      id: id,
      email: 'user@example.com',
      first_name: first_name || '',
      last_name: last_name || '',
      username: username || '',
      full_name: first_name && last_name ? `${first_name} ${last_name}`.trim() : '',
      bio: bio || '',
      avatar_url: avatar_url || '',
      handicap: handicap || 0,
      location: location || '',
      rank: 15,
      connections_count: 0,
      tee_times_count: 0,
      groups_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('✅ Mock profile updated successfully:', mockProfile)
    return NextResponse.json(mockProfile)
  } catch (error) {
    console.error('❌ Mock Profile PUT error:', error)
    return NextResponse.json({ 
      error: 'Mock profile update failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
