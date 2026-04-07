import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

const connectionProfileFields = 'id, first_name, last_name, username, avatar_url, location, handicap, bio'

const connectionSelect = `
  *,
  requester:user_profiles!user_connections_requester_id_fkey(${connectionProfileFields}),
  recipient:user_profiles!user_connections_recipient_id_fkey(${connectionProfileFields})
`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const searchQuery = searchParams.get('q')
  const userId = searchParams.get('id')
  const action = searchParams.get('action')

  console.log('🔍 Users API called with:', { search, searchQuery, userId, action })

  try {
    const supabase = createAdminClient()
    
    // Handle connections fetch
    if (action === 'connections' && userId) {
      console.log('🔗 Fetching connections for user:', userId)
      
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select(connectionSelect)
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (error) {
        console.error('❌ Connections fetch error:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch connections', 
          details: error.message 
        }, { status: 500 })
      }

      console.log('✅ Found connections:', connections?.length || 0)
      return NextResponse.json({
        success: true,
        connections: connections || []
      })
    }

    if (action === 'requests' && userId) {
      console.log('🔗 Fetching pending requests for user:', userId)

      const { data: requests, error } = await supabase
        .from('user_connections')
        .select(connectionSelect)
        .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Requests fetch error:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch connection requests',
          details: error.message
        }, { status: 500 })
      }

      const incoming = (requests || []).filter((connection: any) => connection.recipient_id === userId)
      const outgoing = (requests || []).filter((connection: any) => connection.requester_id === userId)

      return NextResponse.json({
        success: true,
        incoming,
        outgoing
      })
    }

    if (action === 'status' && userId) {
      const viewerId = searchParams.get('viewer_id')

      if (!viewerId) {
        return NextResponse.json({ success: true, status: 'none' })
      }

      const { data: connection, error } = await supabase
        .from('user_connections')
        .select('*')
        .or(`and(requester_id.eq.${viewerId},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${viewerId})`)
        .maybeSingle()

      if (error) {
        console.error('❌ Status fetch error:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch connection status',
          details: error.message
        }, { status: 500 })
      }

      let status = 'none'

      if (connection?.status === 'accepted') {
        status = 'connected'
      } else if (connection?.status === 'pending') {
        status = connection.recipient_id === viewerId ? 'incoming_pending' : 'pending'
      }

      return NextResponse.json({
        success: true,
        status,
        connection: connection || null
      })
    }
    
    // Handle user search (both 'search' and 'q' parameters)
    if (search || searchQuery) {
      const query = search || searchQuery
      console.log('🔍 Searching for users with query:', query)
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, username, avatar_url, location, handicap, bio, total_points, connections_count, tee_times_count')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%,location.ilike.%${query}%`)
        .limit(20)

      if (error) {
        console.error('❌ Search error:', error)
        return NextResponse.json({ 
          success: false, 
          error: 'Search failed', 
          details: error.message 
        }, { status: 500 })
      }

      console.log('👥 Found users:', data?.length || 0)
      return NextResponse.json({
        success: true,
        users: data || []
      })
    }

    // Handle profile fetch
    if (userId) {
      console.log('🔍 Fetching profile for user:', userId)
      
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
    }

    // Default: return all users (for testing)
    console.log('🔍 Returning all users from database')
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, username, avatar_url, location, handicap, bio, total_points, connections_count, tee_times_count')
      .limit(50)

    if (error) {
      console.error('❌ Error fetching users:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch users', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      users: data || []
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
            success: false,
            error: 'Search failed',
            details: error.message
          }, { status: 500 })
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
          .maybeSingle()

        if (checkError) {
          console.error('❌ Error checking existing connection:', checkError)
          return NextResponse.json({ 
            error: 'Failed to check existing connection', 
            details: checkError.message 
          }, { status: 400 })
        }

        if (existingConnection) {
          console.log('⚠️ Connection already exists:', existingConnection)

          if (
            existingConnection.status === 'pending' &&
            existingConnection.requester_id === data.connected_user_id &&
            existingConnection.recipient_id === data.user_id
          ) {
            const { data: acceptedConnection, error: acceptError } = await supabase
              .from('user_connections')
              .update({ status: 'accepted' })
              .eq('id', existingConnection.id)
              .select()
              .single()

            if (acceptError) {
              return NextResponse.json({
                error: 'Failed to accept existing connection request',
                details: acceptError.message
              }, { status: 400 })
            }

            return NextResponse.json({
              success: true,
              autoAccepted: true,
              message: 'Connection accepted successfully',
              connection: acceptedConnection
            })
          }

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

      if (action === 'respond_connection') {
        const { connection_id, user_id, response } = data

        if (!connection_id || !user_id || !response) {
          return NextResponse.json({
            error: 'connection_id, user_id, and response are required'
          }, { status: 400 })
        }

        const nextStatus = response === 'accept' ? 'accepted' : 'declined'

        const { data: connection, error: fetchError } = await supabase
          .from('user_connections')
          .select('*')
          .eq('id', connection_id)
          .eq('recipient_id', user_id)
          .maybeSingle()

        if (fetchError || !connection) {
          return NextResponse.json({
            error: 'Connection request not found'
          }, { status: 404 })
        }

        const { data: updatedConnection, error: updateError } = await supabase
          .from('user_connections')
          .update({ status: nextStatus })
          .eq('id', connection_id)
          .select()
          .single()

        if (updateError) {
          return NextResponse.json({
            error: 'Failed to update connection request',
            details: updateError.message
          }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: response === 'accept' ? 'Connection accepted successfully' : 'Connection declined',
          connection: updatedConnection
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
