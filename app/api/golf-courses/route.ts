import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const supabase = createServerClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '20')

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
      console.error('Database error fetching courses:', error)
      return NextResponse.json(
        { error: 'Failed to fetch courses' },
        { status: 500 }
      )
    }

    // Calculate average ratings and review counts
    const coursesWithStats = courses?.map((course: any) => {
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
    
    if (!name || !location) {
      return NextResponse.json(
        { error: 'Name and location are required' },
        { status: 400 }
      )
    }

    // Check if course already exists
    const { data: existingCourse, error: checkError } = await supabase
      .from('golf_courses')
      .select('id')
      .eq('name', name)
      .eq('location', location)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing course:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing course' },
        { status: 500 }
      )
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
      console.error('Database error creating course:', error)
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      course 
    })

  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
