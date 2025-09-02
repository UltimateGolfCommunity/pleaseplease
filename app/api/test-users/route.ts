import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Get all users
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, email, username')
      .limit(10)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      users: users || [],
      count: users?.length || 0,
      message: 'Users fetched successfully'
    })

  } catch (error) {
    console.error('Error in test-users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
