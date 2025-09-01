import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'

// Mock tee time data for development
const mockTeeTimes = [
  {
    id: 'tee-1',
    creator: { id: 'user-1', first_name: 'John', last_name: 'Smith' },
    course_name: 'Pebble Beach Golf Links',
    tee_time_date: '2024-04-15',
    tee_time_time: '9:00 AM',
    max_players: 4,
    current_players: 2,
    available_spots: 2,
    handicap_requirement: 'Any',
    description: 'Weekend round at Pebble Beach',
    status: 'active'
  },
  {
    id: 'tee-2',
    creator: { id: 'user-2', first_name: 'Sarah', last_name: 'Johnson' },
    course_name: 'Augusta National',
    tee_time_date: '2024-04-20',
    tee_time_time: '2:00 PM',
    max_players: 3,
    current_players: 3,
    available_spots: 0,
    handicap_requirement: '15 or better',
    description: 'Afternoon round at Augusta',
    status: 'completed'
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const userId = searchParams.get('user_id')

  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for tee-times API')
      
      if (action === 'user' && userId) {
        // Get user's tee times
        return NextResponse.json(mockTeeTimes.filter(tt => tt.creator.id === userId))
      }
      
      if (action === 'available') {
        // Get available tee times
        return NextResponse.json(mockTeeTimes.filter(tt => tt.status === 'active'))
      }
      
      // Default: return all tee times
      return NextResponse.json(mockTeeTimes)
    }

    // Use real Supabase if configured
    const supabase = createServerClient()

    if (action === 'user' && userId) {
      const { data, error } = await supabase
        .from('tee_times')
        .select(`
          *,
          creator:user_profiles(id, first_name, last_name)
        `)
        .eq('creator_id', userId)

      if (error) throw error
      return NextResponse.json(data || [])
    }

    if (action === 'available') {
      const { data, error } = await supabase
        .from('tee_times')
        .select(`
          *,
          creator:user_profiles(id, first_name, last_name)
        `)
        .eq('status', 'active')

      if (error) throw error
      return NextResponse.json(data || [])
    }

    // Default: return all tee times
    const { data, error } = await supabase
      .from('tee_times')
      .select(`
        *,
        creator:user_profiles(id, first_name, last_name)
      `)

    if (error) throw error
    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Error in tee-times API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for tee-times API POST')
      
      if (action === 'create') {
        // Mock tee time creation
        const newTeeTime = {
          id: 'tee-' + Date.now(),
          ...data,
          creator: { id: data.creator_id, first_name: 'You', last_name: '' },
          current_players: 1,
          available_spots: data.max_players - 1,
          status: 'active'
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Tee time created successfully',
          tee_time: newTeeTime
        })
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
      
      if (action === 'apply') {
        // Mock application
        return NextResponse.json({ 
          success: true, 
          message: 'Application submitted successfully'
        })
      }
      
      if (action === 'join') {
        // Mock joining
        return NextResponse.json({ 
          success: true, 
          message: 'Successfully joined tee time'
        })
      }
      
      console.log('❌ Invalid action:', action)
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Use real Supabase if configured
    const supabase = createAdminClient()

    if (action === 'create') {
      // Simple, bulletproof approach - just use the basic fields that should work
      const insertData: any = {
        creator_id: data.creator_id,
        tee_time_date: data.tee_time_date,
        tee_time_time: data.tee_time_time,
        max_players: data.max_players || 4,
        current_players: 1,
        handicap_requirement: data.handicap_requirement || 'Any level',
        description: data.description || '',
        status: 'active'
      }
      
      // Add course field based on what's available
      if (data.course_name) {
        insertData.course_name = data.course_name
      }
      
      console.log('🔍 Creating tee time with data:', insertData)
      
      const { data: newTeeTime, error } = await supabase
        .from('tee_times')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating tee time:', error)
        return NextResponse.json({ 
          error: 'Failed to create tee time', 
          details: error.message,
          attemptedData: insertData
        }, { status: 400 })
      }
      
      console.log('✅ Tee time created successfully:', newTeeTime)
      return NextResponse.json({ 
        success: true, 
        message: 'Tee time created successfully', 
        tee_time: newTeeTime 
      })
    }

    if (action === 'apply') {
      const { error } = await supabase
        .from('tee_time_applications')
        .insert({
          tee_time_id: data.tee_time_id,
          user_id: data.user_id,
          status: 'pending'
        })

      if (error) throw error
      return NextResponse.json({ success: true, message: 'Application submitted successfully' })
    }

    if (action === 'join') {
      const { error } = await supabase
        .from('tee_time_players')
        .insert({
          tee_time_id: data.tee_time_id,
          user_id: data.user_id
        })

      if (error) throw error
      
      // Update current players count
      await supabase
        .from('tee_times')
        .update({ current_players: supabase.rpc('increment', { row_id: data.tee_time_id, x: 1 }) })
        .eq('id', data.tee_time_id)

      return NextResponse.json({ success: true, message: 'Successfully joined tee time' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in tee-times API POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


