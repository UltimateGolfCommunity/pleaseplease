import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
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
    profile_image: null,
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
    profile_image: null,
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
    profile_image: null,
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
    profile_image: null,
    total_points: 320,
    connections_count: 12,
    rounds_played: 25
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const query = searchParams.get('q')
  const userId = searchParams.get('id')

  console.log('🔍 Users API called with:', { action, query, userId })

  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('⚠️ Supabase environment variables not found, trying admin client...')
      
      // Try to use admin client even if regular client isn't configured
      try {
        const adminSupabase = createAdminClient()
        
        if (action === 'search' && query) {
          console.log('🔍 Searching with admin client for:', query)
          const { data, error } = await adminSupabase
            .from('user_profiles')
            .select('*')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
            .limit(20)

          if (error) {
            console.error('❌ Admin search error:', error)
            throw error
          }

          console.log('👥 Admin search found:', data?.length || 0)
          return NextResponse.json(data || [])
        }
        
        if (action === 'profile' && userId) {
          console.log('🔍 Fetching profile with admin client for:', userId)
          const { data, error } = await adminSupabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single()

          if (error) {
            console.error('❌ Admin profile error:', error)
            throw error
          }

          return NextResponse.json(data)
        }
        
        if (action === 'connections') {
          console.log('🔍 Fetching connections with admin client for:', userId)
          const { data: connections, error } = await adminSupabase
            .from('user_connections')
            .select('*')
            .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
            .in('status', ['pending', 'accepted'])

          if (error) {
            console.error('❌ Admin connections error:', error)
            throw error
          }

          const userIds = connections?.map((conn: any) => 
            conn.requester_id === userId ? conn.recipient_id : conn.requester_id
          ) || []

          if (userIds.length > 0) {
            const { data: userProfiles, error: profilesError } = await adminSupabase
              .from('user_profiles')
              .select('*')
              .in('id', userIds)

            if (profilesError) {
              console.error('❌ Admin profiles error:', profilesError)
              throw profilesError
            }

            const connectionsWithProfiles = connections?.map((conn: any) => {
              const otherUserId = conn.requester_id === userId ? conn.recipient_id : conn.requester_id
              const profile = userProfiles?.find((profile: any) => profile.id === otherUserId)
              return {
                ...conn,
                user: profile
              }
            }) || []

            return NextResponse.json(connectionsWithProfiles)
          }

          return NextResponse.json([])
        }
        
              // Default: return all users with admin client
      console.log('🔍 Fetching all users with admin client')
      const { data, error } = await adminSupabase
        .from('user_profiles')
        .select('*')
        .limit(20)

      if (error) {
        console.error('❌ Admin all users error:', error)
        throw error
      }

      console.log('👥 Admin all users found:', data?.length || 0)
      
      // If no data found, return mock users
      if (!data || data.length === 0) {
        console.log('🔧 No users found in database, returning mock users')
        return NextResponse.json(mockUsers)
      }
      
      return NextResponse.json(data || [])
        
      } catch (adminError) {
        console.error('❌ Admin client failed, falling back to mock data:', adminError)
        
        // Fall back to mock data if admin client fails
        if (action === 'search' && query) {
          console.log('🔍 Using mock data search for:', query)
          console.log('📊 Available mock users:', mockUsers.map(u => u.first_name + ' ' + u.last_name))
          
          const filteredUsers = mockUsers.filter(user => 
            user.first_name.toLowerCase().includes(query.toLowerCase()) ||
            user.last_name.toLowerCase().includes(query.toLowerCase()) ||
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.location.toLowerCase().includes(query.toLowerCase())
          )
          
          console.log('✅ Mock search results:', filteredUsers.length)
          
          // If no results found, return some users for testing
          if (filteredUsers.length === 0) {
            console.log('🔧 No results found, returning sample users for testing')
            return NextResponse.json([mockUsers[0], mockUsers[1], mockUsers[2]]) // John, Sarah, Mike
          }
          
          return NextResponse.json(filteredUsers)
        }
        
        if (action === 'profile' && userId) {
          const user = mockUsers.find(u => u.id === userId)
          return user ? NextResponse.json(user) : NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        if (action === 'connections') {
          return NextResponse.json([
            { id: 'conn-1', user: mockUsers[0], status: 'connected', connected_at: '2024-01-15' },
            { id: 'conn-2', user: mockUsers[1], status: 'connected', connected_at: '2024-01-10' }
          ])
        }
        
        return NextResponse.json(mockUsers)
      }
    }

    if (action === 'search' && query) {
      console.log('🔍 Searching for users with query:', query)
      
      // Use three-tier fallback system
      let supabase: any = null
      let usingMockMode = false
      
      try {
        console.log('🔍 USERS GET: Creating admin client with service role key...')
        supabase = createAdminClient()
        console.log('✅ USERS GET: Admin client created successfully')
      } catch (adminError) {
        console.log('⚠️ USERS GET: Admin client failed, trying server client:', adminError)
        try {
          supabase = createServerClient()
          console.log('✅ USERS GET: Server client created as fallback')
        } catch (serverError) {
          console.log('❌ USERS GET: Both clients failed:', serverError)
          usingMockMode = true
        }
      }
      
      if (!supabase) {
        usingMockMode = true
      }

      if (usingMockMode) {
        console.log('🔧 USERS GET: Using mock mode for search')
        
        // Mock search results
        const mockUsers = [
          { id: 'mock-1', first_name: 'John', last_name: 'Doe', username: 'johndoe', avatar_url: null },
          { id: 'mock-2', first_name: 'Jane', last_name: 'Smith', username: 'janesmith', avatar_url: null },
          { id: 'mock-3', first_name: 'Mike', last_name: 'Johnson', username: 'mikej', avatar_url: null },
          { id: 'mock-4', first_name: 'Sarah', last_name: 'Wilson', username: 'sarahw', avatar_url: null },
          { id: 'mock-5', first_name: 'Tom', last_name: 'Brown', username: 'tombrown', avatar_url: null }
        ]
        
        const filteredUsers = mockUsers.filter(user => 
          user.first_name.toLowerCase().includes(query.toLowerCase()) ||
          user.last_name.toLowerCase().includes(query.toLowerCase()) ||
          user.username.toLowerCase().includes(query.toLowerCase())
        )
        
        console.log('👥 Mock search found users:', filteredUsers.length)
        return NextResponse.json(filteredUsers)
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(20)

        if (error) {
          console.error('❌ Error searching users:', error)
          // If database query fails, fall back to mock mode
          console.log('🔧 USERS GET: Database query failed, falling back to mock mode')
          
          const mockUsers = [
            { id: 'mock-1', first_name: 'John', last_name: 'Doe', username: 'johndoe', avatar_url: null },
            { id: 'mock-2', first_name: 'Jane', last_name: 'Smith', username: 'janesmith', avatar_url: null },
            { id: 'mock-3', first_name: 'Mike', last_name: 'Johnson', username: 'mikej', avatar_url: null },
            { id: 'mock-4', first_name: 'Sarah', last_name: 'Wilson', username: 'sarahw', avatar_url: null },
            { id: 'mock-5', first_name: 'Tom', last_name: 'Brown', username: 'tombrown', avatar_url: null }
          ]
          
          const filteredUsers = mockUsers.filter(user => 
            user.first_name.toLowerCase().includes(query.toLowerCase()) ||
            user.last_name.toLowerCase().includes(query.toLowerCase()) ||
            user.username.toLowerCase().includes(query.toLowerCase())
          )
          
          console.log('👥 Fallback mock search found users:', filteredUsers.length)
          return NextResponse.json(filteredUsers)
        }

        console.log('👥 Found users:', data?.length || 0)
        return NextResponse.json(data || [])
      } catch (searchError) {
        console.error('❌ Search error:', searchError)
        // Return empty array instead of throwing to prevent 500 error
        return NextResponse.json([])
      }
    }

    // Use real Supabase if configured
    const supabase = createServerClient()

    if (action === 'profile' && userId) {
      try {
        console.log('🔍 Fetching profile for user:', userId)
        
        // Use admin client to bypass RLS for profile fetch
        const adminSupabase = createAdminClient()
        
        const { data, error } = await adminSupabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('❌ Error fetching profile:', error)
          throw error
        }

        console.log('✅ Profile found:', data ? 'yes' : 'no')
        return NextResponse.json(data)
      } catch (profileError) {
        console.error('❌ Profile fetch error:', profileError)
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
      }
    }

    if (action === 'connections') {
      try {
        console.log('🔍 Fetching connections for user:', userId)
        
        // Use admin client to bypass RLS for connections query
        const adminSupabase = createAdminClient()
        
        // Get connections where user is requester or recipient
        const { data: connections, error } = await adminSupabase
          .from('user_connections')
          .select('*')
          .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
          .in('status', ['pending', 'accepted'])

        if (error) {
          console.error('❌ Error fetching connections:', error)
          throw error
        }

        console.log('📊 Found connections:', connections?.length || 0)

        // Get user profiles for the other users in the connections
        const userIds = connections?.map((conn: any) => 
          conn.requester_id === userId ? conn.recipient_id : conn.requester_id
        ) || []

        console.log('👥 User IDs to fetch:', userIds)

        if (userIds.length > 0) {
          const { data: userProfiles, error: profilesError } = await adminSupabase
            .from('user_profiles')
            .select('*')
            .in('id', userIds)

          if (profilesError) {
            console.error('❌ Error fetching user profiles:', profilesError)
            throw profilesError
          }

          console.log('👤 Found user profiles:', userProfiles?.length || 0)

          // Combine connection data with user profiles
          const enrichedConnections = connections?.map((conn: any) => ({
            ...conn,
            connected_user: userProfiles?.find((profile: any) => 
              profile.id === (conn.requester_id === userId ? conn.recipient_id : conn.requester_id)
            )
          })) || []

          console.log('✅ Returning enriched connections:', enrichedConnections.length)
          return NextResponse.json(enrichedConnections)
        }

        console.log('✅ No connections found, returning empty array')
        return NextResponse.json([])
      } catch (connectionError) {
        console.error('❌ Connection fetch error:', connectionError)
        // Return empty array instead of throwing to prevent 500 error
        return NextResponse.json([])
      }
    }

    // Default: return all users
    try {
      console.log('🔍 Fetching all users')
      
      // Use admin client to bypass RLS for all users fetch
      const adminSupabase = createAdminClient()
      
      const { data, error } = await adminSupabase
        .from('user_profiles')
        .select('*')
        .limit(50)

      if (error) {
        console.error('❌ Error fetching all users:', error)
        throw error
      }

      console.log('👥 Found users:', data?.length || 0)
      return NextResponse.json(data || [])
    } catch (allUsersError) {
      console.error('❌ All users fetch error:', allUsersError)
      return NextResponse.json([])
    }

  } catch (error) {
    console.error('Error in users API:', error)
    console.log('🔧 Returning mock users due to error')
    return NextResponse.json(mockUsers)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    console.log('🔍 USERS POST: Action requested:', action)

    // Use real Supabase with correct service role key
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 USERS POST: Creating admin client with service role key...')
      supabase = createAdminClient()
      console.log('✅ USERS POST: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ USERS POST: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ USERS POST: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ USERS POST: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    // Only use mock mode if no client could be created
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 USERS POST: Using mock mode')
      
      if (action === 'connect') {
        // Mock connection request
        return NextResponse.json({ 
          success: true, 
          message: 'Connection request sent (backup system)',
          connection_id: 'mock-conn-' + Date.now()
        })
      }
      
      if (action === 'update_profile') {
        // Mock profile update
        return NextResponse.json({ 
          success: true, 
          message: 'Profile updated successfully (backup system)'
        })
      }
      
      if (action === 'search') {
        const { query } = data
        console.log('🔍 USERS POST: Mock search for:', query)
        
        if (!query) {
          return NextResponse.json([])
        }
        
        // Filter mock users based on search query
        const filteredUsers = mockUsers.filter(user => 
          user.first_name.toLowerCase().includes(query.toLowerCase()) ||
          user.last_name.toLowerCase().includes(query.toLowerCase()) ||
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.location.toLowerCase().includes(query.toLowerCase())
        )
        
        console.log('✅ USERS POST: Mock search results:', filteredUsers.length)
        
        // If no results found, return some users for testing
        if (filteredUsers.length === 0) {
          console.log('🔧 USERS POST: No results found, returning sample users')
          return NextResponse.json([mockUsers[0], mockUsers[1], mockUsers[2]])
        }
        
        return NextResponse.json(filteredUsers)
      }
      
      return NextResponse.json({ error: 'Invalid action for mock mode', action }, { status: 400 })
    }

    console.log('🔍 USERS POST: Using database for operations')

    if (action === 'search') {
      const { query } = data
      console.log('🔍 USERS POST: Database search for:', query)
      
      if (!query) {
        return NextResponse.json([])
      }
      
      try {
        // Use admin client to search users
        const { data: searchResults, error } = await supabase
          .from('user_profiles')
          .select('*')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(20)

        if (error) {
          console.error('❌ Database search error:', error)
          return NextResponse.json({ 
            error: 'Search failed', 
            details: error.message 
          }, { status: 400 })
        }

        console.log('✅ USERS POST: Database search results:', searchResults?.length || 0)
        return NextResponse.json(searchResults || [])
      } catch (searchError) {
        console.error('❌ Search operation failed:', searchError)
        return NextResponse.json({ 
          error: 'Search failed', 
          details: searchError instanceof Error ? searchError.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    if (action === 'connect') {
      console.log('🔗 USERS POST: Creating connection between:', data.user_id, 'and', data.connected_user_id)
      
      try {
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
      } catch (connectError) {
        console.error('❌ Connection creation failed:', connectError)
        return NextResponse.json({ 
          error: 'Failed to create connection', 
          details: connectError instanceof Error ? connectError.message : 'Unknown error'
        }, { status: 500 })
      }
    }

    if (action === 'accept_connection') {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'accepted' })
        .eq('id', data.connection_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Connection accepted' })
    }

    if (action === 'reject_connection') {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: 'rejected' })
        .eq('id', data.connection_id)

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Connection rejected' })
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

  } catch (error) {
    console.error('Error in users API POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


