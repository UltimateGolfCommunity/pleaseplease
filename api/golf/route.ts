import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Consolidated golf API route
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const user_id = searchParams.get('user_id')
    
    switch (action) {
      case 'rounds':
        // Get golf rounds
        if (!user_id) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }
        
        const { data: rounds, error: roundsError } = await supabase
          .from('golf_rounds')
          .select('*, details:golf_round_details(*)')
          .eq('user_id', user_id)
          .order('date_played', { ascending: false })

        if (roundsError) {
          return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, rounds: rounds || [] })
        
      case 'courses':
        // Search golf courses
        const query = searchParams.get('q')
        if (!query) {
          return NextResponse.json({ error: 'Search query required' }, { status: 400 })
        }
        
        const { data: courses, error: coursesError } = await supabase
          .from('golf_courses')
          .select('*')
          .ilike('name', `%${query}%`)
          .limit(10)

        if (coursesError) {
          return NextResponse.json({ error: 'Failed to search courses' }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, courses: courses || [] })
        
      case 'tee-times':
        // Get tee times
        if (!user_id) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 })
        }
        
        const { data: teeTimes, error: teeTimesError } = await supabase
          .from('tee_times')
          .select('*')
          .eq('user_id', user_id)
          .order('date', { ascending: false })

        if (teeTimesError) {
          return NextResponse.json({ error: 'Failed to fetch tee times' }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, tee_times: teeTimes || [] })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Golf API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { action, ...data } = await request.json()
    
    switch (action) {
      case 'round':
        // Create golf round
        const { data: round, error: roundError } = await supabase
          .from('golf_rounds')
          .insert(data)
          .select()
          .single()

        if (roundError) {
          return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, round })
        
      case 'tee-time':
        // Create tee time
        const { data: teeTime, error: teeTimeError } = await supabase
          .from('tee_times')
          .insert(data)
          .select()
          .single()

        if (teeTimeError) {
          return NextResponse.json({ error: 'Failed to create tee time' }, { status: 500 })
        }
        
        return NextResponse.json({ success: true, tee_time: teeTime })
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Golf API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
