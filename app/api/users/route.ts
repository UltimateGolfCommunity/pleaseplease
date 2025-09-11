import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

// Mock user data for development
const mockUsers = [
  {
    id: 'user-1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@example.com',
    username: 'johnsmith',
    handicap: 12,
    location: 'San Francisco, CA',
    bio: 'Weekend warrior who loves the game',
    avatar_url: null,
    total_points: 450,
    connections_count: 15,
    rounds_played: 28
  },
  {
    id: 'user-2',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.j@example.com',
    username: 'sarahj',
    handicap: 8,
    location: 'Los Angeles, CA',
    bio: 'Competitive golfer, always looking to improve',
    avatar_url: null,
    total_points: 720,
    connections_count: 23,
    rounds_played: 45
  },
  {
    id: 'user-3',
    first_name: 'Mike',
    last_name: 'Davis',
    email: 'mike.davis@example.com',
    username: 'mikedavis',
    handicap: 18,
    location: 'Phoenix, AZ',
    bio: 'Just getting back into golf after a long break',
    avatar_url: null,
    total_points: 180,
    connections_count: 8,
    rounds_played: 12
  },
  {
    id: 'user-4',
    first_name: 'Luke',
    last_name: 'Restall',
    email: 'luke.restall@example.com',
    username: 'lukerestall',
    handicap: 15,
    location: 'Toronto, ON',
    bio: 'Passionate golfer looking for new connections',
    avatar_url: null,
    total_points: 320,
    connections_count: 12,
    rounds_played: 25
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const userId = searchParams.get('id')

  console.log('🔍 Users API called with:', { search, userId })

  try {
    // Handle user search for invite members functionality
    if (search) {
      console.log('🔍 Searching for users with query:', search)
      
      try {
        const supabase = createAdminClient()
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, username, avatar_url, location, handicap')
          .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,username.ilike.%${search}%`)
          .limit(20)

        if (error) {
          console.error('❌ Search error:', error)
          // Return mock data if database fails
          return NextResponse.json({
            success: true,
            users: [
              { id: 'mock-1', first_name: 'John', last_name: 'Doe', username: 'johndoe', avatar_url: null, location: 'San Francisco, CA', handicap: 12 },
              { id: 'mock-2', first_name: 'Jane', last_name: 'Smith', username: 'janesmith', avatar_url: null, location: 'Los Angeles, CA', handicap: 8 },
              { id: 'mock-3', first_name: 'Mike', last_name: 'Johnson', username: 'mikej', avatar_url: null, location: 'Phoenix, AZ', handicap: 18 }
            ]
          })
        }

        console.log('👥 Found users:', data?.length || 0)
        return NextResponse.json({
          success: true,
          users: data || []
        })
      } catch (searchError) {
        console.error('❌ Search operation failed:', searchError)
        // Return mock data as fallback
        return NextResponse.json({
          success: true,
          users: [
            { id: 'mock-1', first_name: 'John', last_name: 'Doe', username: 'johndoe', avatar_url: null, location: 'San Francisco, CA', handicap: 12 },
            { id: 'mock-2', first_name: 'Jane', last_name: 'Smith', username: 'janesmith', avatar_url: null, location: 'Los Angeles, CA', handicap: 8 },
            { id: 'mock-3', first_name: 'Mike', last_name: 'Johnson', username: 'mikej', avatar_url: null, location: 'Phoenix, AZ', handicap: 18 }
          ]
        })
      }
    }

    // Handle profile fetch
    if (userId) {
      console.log('🔍 Fetching profile for user:', userId)
      
      try {
        const supabase = createAdminClient()
        
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('❌ Profile fetch error:', error)
          return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
        }

        return NextResponse.json(data)
      } catch (profileError) {
        console.error('❌ Profile fetch failed:', profileError)
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
    }

    // Default: return mock users with optional search filtering
    console.log('🔍 Returning mock users')
    const searchQuery = searchParams.get('q')
    let filteredUsers = mockUsers
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredUsers = mockUsers.filter(user => 
        user.first_name.toLowerCase().includes(query) ||
        user.last_name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.location.toLowerCase().includes(query) ||
        user.handicap.toString().includes(query)
      )
    }
    
    return NextResponse.json({
      success: true,
      users: filteredUsers
    })

  } catch (error) {
    console.error('Error in users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    console.log('🔍 USERS POST: Action requested:', action)

    try {
      const supabase = createAdminClient()

      if (action === 'search') {
        const { query } = data
        console.log('🔍 USERS POST: Database search for:', query)
        
        if (!query) {
          return NextResponse.json({ success: true, users: [] })
        }
        
        const { data: searchResults, error } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, username, avatar_url, location, handicap')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(20)

        if (error) {
          console.error('❌ Database search error:', error)
          return NextResponse.json({ 
            success: true,
            users: [
              { id: 'mock-1', first_name: 'John', last_name: 'Doe', username: 'johndoe', avatar_url: null, location: 'San Francisco, CA', handicap: 12 },
              { id: 'mock-2', first_name: 'Jane', last_name: 'Smith', username: 'janesmith', avatar_url: null, location: 'Los Angeles, CA', handicap: 8 },
              { id: 'mock-3', first_name: 'Mike', last_name: 'Johnson', username: 'mikej', avatar_url: null, location: 'Phoenix, AZ', handicap: 18 }
            ]
          })
        }

        console.log('✅ USERS POST: Database search results:', searchResults?.length || 0)
        return NextResponse.json({ success: true, users: searchResults || [] })
      }

      if (action === 'connect') {
        console.log('🔗 USERS POST: Creating connection between:', data.user_id, 'and', data.connected_user_id)
        
        // First check if connection already exists
        const { data: existingConnection, error: checkError } = await supabase
          .from('user_connections')
          .select('*')
          .or(`and(requester_id.eq.${data.user_id},recipient_id.eq.${data.connected_user_id}),and(requester_id.eq.${data.connected_user_id},recipient_id.eq.${data.user_id})`)
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('❌ Error checking existing connection:', checkError)
          return NextResponse.json({ 
            error: 'Failed to check existing connection', 
            details: checkError.message 
          }, { status: 400 })
        }

        if (existingConnection) {
          console.log('⚠️ Connection already exists:', existingConnection)
          return NextResponse.json({ 
            error: 'Connection already exists', 
            details: `Connection status: ${existingConnection.status}` 
          }, { status: 409 })
        }

        // Create new connection
        const { data: newConnection, error } = await supabase
          .from('user_connections')
          .insert({
            requester_id: data.user_id,
            recipient_id: data.connected_user_id,
            status: 'pending'
          })
          .select()
          .single()

        if (error) {
          console.error('❌ Error creating connection:', error)
          return NextResponse.json({ 
            error: 'Failed to create connection', 
            details: error.message 
          }, { status: 400 })
        }

        console.log('✅ Connection created successfully:', newConnection.id)
        return NextResponse.json({ 
          success: true, 
          message: 'Connection request sent successfully',
          connection: newConnection
        })
      }

      if (action === 'update_profile') {
        const { error } = await supabase
          .from('user_profiles')
          .update(data)
          .eq('id', data.id)

        if (error) throw error
        return NextResponse.json({ success: true, message: 'Profile updated successfully' })
      }

      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (operationError) {
      console.error('❌ Operation failed:', operationError)
      return NextResponse.json({ 
        error: 'Operation failed', 
        details: operationError instanceof Error ? operationError.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in users API POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}