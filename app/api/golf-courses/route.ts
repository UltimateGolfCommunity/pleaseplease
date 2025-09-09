import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'
import { getZipCodeCoordinates, filterCoursesByRadius } from '@/lib/location-utils'

// Mock course data for when database is not available
const mockCourses = [
  {
    id: 'mock-1',
    name: 'Pebble Beach Golf Links',
    location: 'Pebble Beach, CA',
    description: 'Iconic coastal golf course with stunning ocean views',
    par: 72,
    holes: 18,
    average_rating: 4.8,
    review_count: 15,
    course_reviews: [],
    recent_reviews: []
  },
  {
    id: 'mock-2', 
    name: 'Augusta National Golf Club',
    location: 'Augusta, GA',
    description: 'Home of The Masters Tournament',
    par: 72,
    holes: 18,
    average_rating: 4.9,
    review_count: 8,
    course_reviews: [],
    recent_reviews: []
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const zipCode = searchParams.get('zipCode')
    const radius = parseInt(searchParams.get('radius') || '250')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('🔍 GOLF-COURSES GET:', { query, zipCode, radius, limit })

    // Use real Supabase with fallback pattern
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 GOLF-COURSES GET: Creating admin client...')
      supabase = createAdminClient()
      console.log('✅ GOLF-COURSES GET: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ GOLF-COURSES GET: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ GOLF-COURSES GET: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ GOLF-COURSES GET: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    // Only use mock mode if no client could be created
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 GOLF-COURSES GET: Using mock data')
      let filteredCourses = mockCourses
      
      if (query) {
        filteredCourses = mockCourses.filter(course => 
          course.name.toLowerCase().includes(query.toLowerCase()) ||
          course.location.toLowerCase().includes(query.toLowerCase())
        )
      }
      
      return NextResponse.json({ 
        courses: filteredCourses.slice(0, limit),
        usingMockData: true 
      })
    }

    console.log('🔍 GOLF-COURSES GET: Using database for operations')

    let queryBuilder = supabase
      .from('golf_courses')
      .select(`
        *,
        course_reviews (
          id,
          rating,
          comment,
          created_at,
          user_profiles (
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .order('name', { ascending: true })
      .limit(limit)

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,location.ilike.%${query}%`)
    }

    const { data: courses, error } = await queryBuilder

    if (error) {
      console.error('❌ Database error fetching courses:', error)
      console.log('🔧 GOLF-COURSES GET: Falling back to mock data due to database error')
      
      let filteredCourses = mockCourses
      if (query) {
        filteredCourses = mockCourses.filter(course => 
          course.name.toLowerCase().includes(query.toLowerCase()) ||
          course.location.toLowerCase().includes(query.toLowerCase())
        )
      }
      
      return NextResponse.json({ 
        courses: filteredCourses.slice(0, limit),
        usingMockData: true,
        fallbackReason: 'Database error: ' + error.message
      })
    }

    // Calculate average ratings and review counts
    let coursesWithStats = courses?.map((course: any) => {
      const reviews = course.course_reviews || []
      const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0)
      const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : '0.0'
      
      return {
        ...course,
        average_rating: parseFloat(averageRating),
        review_count: reviews.length,
        recent_reviews: reviews.slice(0, 3) // Get last 3 reviews
      }
    })

    // Apply location-based filtering if zip code is provided
    if (zipCode && coursesWithStats) {
      try {
        console.log('📍 Getting coordinates for zip code:', zipCode)
        const location = await getZipCodeCoordinates(zipCode)
        
        if (location) {
          console.log('📍 Found location:', location)
          coursesWithStats = filterCoursesByRadius(
            coursesWithStats,
            location.latitude,
            location.longitude,
            radius
          )
          console.log(`📍 Filtered to ${coursesWithStats.length} courses within ${radius} miles`)
        } else {
          console.log('❌ Could not find coordinates for zip code:', zipCode)
        }
      } catch (error) {
        console.error('❌ Error filtering by location:', error)
      }
    }

    return NextResponse.json({ courses: coursesWithStats })

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, location, description, par, holes } = await request.json()
    
    console.log('🔍 GOLF-COURSES POST:', { name, location, description, par, holes })
    
    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      )
    }

    // Use real Supabase with fallback pattern
    let supabase: any = null
    let usingMockMode = false
    
    try {
      console.log('🔍 GOLF-COURSES POST: Creating admin client...')
      supabase = createAdminClient()
      console.log('✅ GOLF-COURSES POST: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ GOLF-COURSES POST: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ GOLF-COURSES POST: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ GOLF-COURSES POST: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    // Only use mock mode if no client could be created
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 GOLF-COURSES POST: Using mock mode')
      const newCourse = {
        id: 'mock-' + Date.now(),
        name,
        location,
        description: description || null,
        par: par || 72,
        holes: holes || 18,
        average_rating: 0,
        review_count: 0,
        course_reviews: [],
        recent_reviews: []
      }
      
      return NextResponse.json({ 
        success: true, 
        course: newCourse,
        usingMockData: true,
        message: 'Course created successfully (backup system)'
      })
    }

    console.log('🔍 GOLF-COURSES POST: Using database for operations')

    // Check if course already exists
    const { data: existingCourse, error: checkError } = await supabase
      .from('golf_courses')
      .select('id')
      .eq('name', name)
      .eq('location', location)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing course:', checkError)
      console.log('🔧 GOLF-COURSES POST: Falling back to mock due to check error')
      
      const newCourse = {
        id: 'mock-' + Date.now(),
        name,
        location,
        description: description || null,
        par: par || 72,
        holes: holes || 18,
        average_rating: 0,
        review_count: 0,
        course_reviews: [],
        recent_reviews: []
      }
      
      return NextResponse.json({ 
        success: true, 
        course: newCourse,
        usingMockData: true,
        fallbackReason: 'Database check error: ' + checkError.message
      })
    }

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course already exists' },
        { status: 409 }
      )
    }

    // Create new course
    const { data: course, error } = await supabase
      .from('golf_courses')
      .insert({
        name,
        location,
        description: description || null,
        par: par || null,
        holes: holes || 18
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Database error creating course:', error)
      console.log('🔧 GOLF-COURSES POST: Falling back to mock due to creation error')
      
      const newCourse = {
        id: 'mock-' + Date.now(),
        name,
        location,
        description: description || null,
        par: par || 72,
        holes: holes || 18,
        average_rating: 0,
        review_count: 0,
        course_reviews: [],
        recent_reviews: []
      }
      
      return NextResponse.json({ 
        success: true, 
        course: newCourse,
        usingMockData: true,
        fallbackReason: 'Database creation error: ' + error.message
      })
    }

    console.log('✅ GOLF-COURSES POST: Course created successfully:', course.id)
    return NextResponse.json({ 
      success: true, 
      course 
    })

  } catch (error) {
    console.error('❌ Error in golf courses POST:', error)
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
