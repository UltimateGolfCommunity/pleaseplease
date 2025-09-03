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
      
      if (action === 'get-applications' && userId) {
        // Mock applications data
        const mockApplications = [
          {
            id: 'app-1',
            applicant_id: userId,
            tee_time_id: 'tee-1',
            status: 'pending',
            applied_at: new Date().toISOString(),
            tee_times: {
              id: 'tee-1',
              course_name: 'Pebble Beach Golf Links',
              tee_time_date: '2024-04-15',
              tee_time_time: '9:00 AM',
              creator_id: 'user-1'
            }
          },
          {
            id: 'app-2',
            applicant_id: userId,
            tee_time_id: 'tee-2',
            status: 'accepted',
            applied_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            tee_times: {
              id: 'tee-2',
              course_name: 'Augusta National',
              tee_time_date: '2024-04-20',
              tee_time_time: '2:00 PM',
              creator_id: 'user-2'
            }
          }
        ]
        return NextResponse.json({ applications: mockApplications })
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
          creator:user_profiles(id, first_name, last_name, avatar_url)
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
          creator:user_profiles(id, first_name, last_name, avatar_url)
        `)
        .eq('status', 'active')

      if (error) throw error
      return NextResponse.json(data || [])
    }
    
    if (action === 'get-applications' && userId) {
      // Fetch applications for a specific user
      try {
        const { data: applications, error } = await supabase
          .from('tee_time_applications')
          .select(`
            *,
            tee_times (
              id,
              course_name,
              tee_time_date,
              tee_time_time,
              creator_id
            )
          `)
          .eq('applicant_id', userId)
          .order('applied_at', { ascending: false })

        if (error) {
          console.error('Error fetching applications:', error)
          // Return empty applications instead of throwing
          return NextResponse.json({ applications: [] })
        }
        
        return NextResponse.json({ applications: applications || [] })
      } catch (dbError) {
        console.error('Database error fetching applications:', dbError)
        // Return empty applications instead of throwing
        return NextResponse.json({ applications: [] })
      }
    }

    // Default: return all tee times
    const { data, error } = await supabase
      .from('tee_times')
      .select(`
        *,
        creator:user_profiles(id, first_name, last_name, avatar_url)
      `)

    if (error) throw error
    return NextResponse.json(data || [])

  } catch (error) {
    console.error('Error in tee-times API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, tee_time_id, user_id } = body

    if (!tee_time_id || !user_id) {
      return NextResponse.json({ error: 'Tee time ID and user ID are required' }, { status: 400 })
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock data for tee-times API DELETE')
      
      if (action === 'delete') {
        // Mock tee time deletion
        return NextResponse.json({ 
          success: true, 
          message: 'Tee time deleted successfully'
        })
      }
      
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Use real Supabase if configured
    const supabase = createAdminClient()

    if (action === 'delete') {
      // First verify the user owns this tee time
      const { data: teeTime, error: checkError } = await supabase
        .from('tee_times')
        .select('creator_id')
        .eq('id', tee_time_id)
        .single()

      if (checkError || !teeTime) {
        return NextResponse.json({ 
          error: 'Tee time not found',
          details: 'The tee time you are trying to delete does not exist'
        }, { status: 404 })
      }

      if (teeTime.creator_id !== user_id) {
        return NextResponse.json({ 
          error: 'Unauthorized',
          details: 'You can only delete your own tee times'
        }, { status: 403 })
      }

      // Delete the tee time
      const { error: deleteError } = await supabase
        .from('tee_times')
        .delete()
        .eq('id', tee_time_id)

      if (deleteError) {
        console.error('Error deleting tee time:', deleteError)
        return NextResponse.json({ 
          error: 'Failed to delete tee time',
          details: deleteError.message
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Tee time deleted successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in tee-times DELETE API:', error)
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
      console.log('🔍 Received tee time creation request with data:', data)
      
      // Get the authenticated user from the request
      const authHeader = request.headers.get('authorization')
      let authenticatedUserId = null
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser(token)
          if (!authError && user) {
            authenticatedUserId = user.id
            console.log('✅ Authenticated user ID:', authenticatedUserId)
          }
        } catch (error) {
          console.log('⚠️ Could not verify auth token:', error)
        }
      }
      
      // Use authenticated user ID if available, otherwise fall back to creator_id
      const creatorId = authenticatedUserId || data.creator_id
      
      if (!creatorId) {
        return NextResponse.json({ 
          error: 'Authentication required',
          details: 'You must be logged in to create a tee time'
        }, { status: 401 })
      }
      
      if (!data.tee_time_date) {
        return NextResponse.json({ 
          error: 'Missing required field: tee_time_date',
          details: 'Tee time date is required'
        }, { status: 400 })
      }
      
      if (!data.tee_time_time) {
        return NextResponse.json({ 
          error: 'Missing required field: tee_time_time',
          details: 'Tee time is required'
        }, { status: 400 })
      }
      
      // First check if user profile exists
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', creatorId)
        .single()

      if (profileError || !userProfile) {
        console.log('⚠️ User profile not found for:', creatorId)
        
        // Check if user exists in auth.users first
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(creatorId)
        
        if (authError || !authUser) {
          console.error('❌ User does not exist in auth.users:', authError)
          return NextResponse.json({ 
            error: 'User not found. Please sign in again.',
            details: 'User does not exist in the authentication system'
          }, { status: 400 })
        }
        
        // Try to create a user profile with proper data
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: creatorId,
            email: authUser.user.email || 'user@example.com',
            username: authUser.user.email?.split('@')[0] || 'user',
            first_name: 'User',
            last_name: 'Profile',
            full_name: 'User Profile'
          })
          .select('id')
          .single()

        if (createError) {
          console.error('❌ Failed to create user profile:', createError)
          return NextResponse.json({ 
            error: 'User profile not found. Please complete your profile first.',
            details: 'User profile does not exist and could not be created: ' + createError.message
          }, { status: 400 })
        }
        
        console.log('✅ Created basic user profile for:', creatorId)
      }

      // First, try to find or create a course for this tee time
      let courseId = null
      if (data.course) {
        // Try to find existing course
        const { data: existingCourse } = await supabase
          .from('golf_courses')
          .select('id')
          .eq('name', data.course)
          .single()
        
        if (existingCourse) {
          courseId = existingCourse.id
        } else {
          // Create a new course
          const { data: newCourse, error: courseError } = await supabase
            .from('golf_courses')
            .insert({
              name: data.course,
              location: 'TBD',
              description: 'Course created automatically'
            })
            .select('id')
            .single()
          
          if (!courseError && newCourse) {
            courseId = newCourse.id
          }
        }
      }

      // Format the time properly for PostgreSQL TIME type
      let formattedTime = data.tee_time_time
      if (typeof data.tee_time_time === 'string') {
        // Handle various time formats
        if (data.tee_time_time.includes('AM') || data.tee_time_time.includes('PM')) {
          // Convert "9:00 AM" to "09:00:00"
          const timeMatch = data.tee_time_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
          if (timeMatch) {
            let hours = parseInt(timeMatch[1])
            const minutes = timeMatch[2]
            const period = timeMatch[3].toUpperCase()
            
            if (period === 'PM' && hours !== 12) hours += 12
            if (period === 'AM' && hours === 12) hours = 0
            
            formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}:00`
          }
        } else if (data.tee_time_time.includes(':')) {
          // Already in HH:MM format, add seconds
          if (!data.tee_time_time.includes(':')) {
            formattedTime = `${data.tee_time_time}:00`
          }
        }
      }
      
      // Use only the fields that exist in the database schema
      const insertData = {
        course_id: courseId,
        creator_id: creatorId,
        tee_time_date: data.tee_time_date,
        tee_time_time: formattedTime,
        max_players: data.max_players || 4,
        current_players: 1,
        handicap_requirement: data.handicap_requirement || 'any',
        description: data.description || '',
        status: 'open'
      }
      
      console.log('🔍 Creating tee time with data:', insertData)
      
      const { data: newTeeTime, error } = await supabase
        .from('tee_times')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating tee time:', error)
        console.error('❌ Error details:', error)
        console.error('❌ Attempted data:', insertData)
        
        // Provide more specific error messages
        let errorMessage = 'Failed to create tee time'
        let errorDetails = error.message
        
        if (error.message.includes('foreign key')) {
          errorMessage = 'Invalid course or user reference'
          errorDetails = 'The course or user does not exist in the database'
        } else if (error.message.includes('invalid input syntax')) {
          errorMessage = 'Invalid date or time format'
          errorDetails = 'Please check the date and time format'
        } else if (error.message.includes('not null')) {
          errorMessage = 'Missing required field'
          errorDetails = 'A required field is missing or empty'
        }
        
        return NextResponse.json({ 
          error: errorMessage, 
          details: errorDetails,
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
          applicant_id: data.applicant_id,
          status: 'pending'
        })

      if (error) {
        console.error('❌ Error applying to tee time:', error)
        return NextResponse.json({ 
          error: 'Failed to submit application', 
          details: (error as any).message
        }, { status: 400 })
      }
      
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


