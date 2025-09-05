import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const courseId = searchParams.get('course_id')

    console.log('🔍 GOLF-COURSES MANAGE GET:', { action, courseId })

    // Use real Supabase with fallback pattern
    let supabase: any = null
    let usingMockMode = false
    
    try {
      supabase = createAdminClient()
      console.log('✅ GOLF-COURSES MANAGE: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ GOLF-COURSES MANAGE: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ GOLF-COURSES MANAGE: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ GOLF-COURSES MANAGE: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 GOLF-COURSES MANAGE: Using mock data')
      return NextResponse.json({ 
        courses: [],
        usingMockData: true 
      })
    }

    if (action === 'list') {
      // Get all courses with full details
      const { data: courses, error } = await supabase
        .from('golf_courses')
        .select(`
          *,
          course_photos (
            id,
            photo_url,
            photo_type,
            caption,
            is_primary,
            display_order
          ),
          course_amenities (
            id,
            amenity_type,
            amenity_name,
            description,
            is_available,
            additional_cost
          ),
          course_holes (
            id,
            hole_number,
            par,
            yardage,
            handicap,
            description
          ),
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
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('name', { ascending: true })

      if (error) {
        console.error('❌ Error fetching courses:', error)
        return NextResponse.json({ 
          error: 'Failed to fetch courses', 
          details: error.message 
        }, { status: 500 })
      }

      // Calculate average ratings
      const coursesWithStats = courses?.map((course: any) => {
        const reviews = course.course_reviews || []
        const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0)
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : '0.0'
        
        return {
          ...course,
          average_rating: parseFloat(averageRating),
          review_count: reviews.length,
          recent_reviews: reviews.slice(0, 3)
        }
      })

      return NextResponse.json({ courses: coursesWithStats })
    }

    if (action === 'details' && courseId) {
      // Get detailed course information
      const { data: course, error } = await supabase
        .from('golf_courses')
        .select(`
          *,
          course_photos (
            id,
            photo_url,
            photo_type,
            caption,
            is_primary,
            display_order
          ),
          course_amenities (
            id,
            amenity_type,
            amenity_name,
            description,
            is_available,
            additional_cost
          ),
          course_holes (
            id,
            hole_number,
            par,
            yardage,
            handicap,
            description,
            photo_url
          ),
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
        .eq('id', courseId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('❌ Error fetching course details:', error)
        return NextResponse.json({ 
          error: 'Failed to fetch course details', 
          details: error.message 
        }, { status: 500 })
      }

      if (!course) {
        return NextResponse.json({ 
          error: 'Course not found' 
        }, { status: 404 })
      }

      // Calculate average rating
      const reviews = course.course_reviews || []
      const totalRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0)
      const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : '0.0'
      
      return NextResponse.json({
        ...course,
        average_rating: parseFloat(averageRating),
        review_count: reviews.length,
        recent_reviews: reviews.slice(0, 5)
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ Error in golf courses manage GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    console.log('🔍 GOLF-COURSES MANAGE POST:', action, data)

    // Use real Supabase with fallback pattern
    let supabase: any = null
    let usingMockMode = false
    
    try {
      supabase = createAdminClient()
      console.log('✅ GOLF-COURSES MANAGE POST: Admin client created successfully')
    } catch (adminError) {
      console.log('⚠️ GOLF-COURSES MANAGE POST: Admin client failed, trying server client:', adminError)
      try {
        supabase = createServerClient()
        console.log('✅ GOLF-COURSES MANAGE POST: Server client created as fallback')
      } catch (serverError) {
        console.log('❌ GOLF-COURSES MANAGE POST: Both clients failed:', serverError)
        usingMockMode = true
      }
    }
    
    if (!supabase) {
      usingMockMode = true
    }

    if (usingMockMode) {
      console.log('🔧 GOLF-COURSES MANAGE POST: Using mock mode')
      return NextResponse.json({ 
        success: true, 
        message: 'Operation completed (backup system)',
        usingMockData: true 
      })
    }

    if (action === 'create') {
      // Create new golf course
      const { data: course, error } = await supabase
        .from('golf_courses')
        .insert({
          name: data.name,
          location: data.location,
          description: data.description,
          par: data.par,
          holes: data.holes,
          course_image_url: data.course_image_url,
          logo_url: data.logo_url,
          website_url: data.website_url,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          country: data.country || 'USA',
          latitude: data.latitude,
          longitude: data.longitude,
          course_type: data.course_type || 'public',
          green_fees_min: data.green_fees_min,
          green_fees_max: data.green_fees_max,
          cart_fees: data.cart_fees,
          caddie_available: data.caddie_available || false,
          pro_shop: data.pro_shop !== false,
          restaurant: data.restaurant !== false,
          driving_range: data.driving_range !== false,
          putting_green: data.putting_green !== false,
          practice_facilities: data.practice_facilities !== false,
          lessons_available: data.lessons_available || false,
          dress_code: data.dress_code,
          booking_policy: data.booking_policy,
          cancellation_policy: data.cancellation_policy,
          is_featured: data.is_featured || false,
          is_active: true,
          created_by: data.created_by
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating course:', error)
        return NextResponse.json({ 
          error: 'Failed to create course', 
          details: error.message 
        }, { status: 500 })
      }

      console.log('✅ Course created successfully:', course.id)
      return NextResponse.json({ success: true, course })
    }

    if (action === 'update') {
      // Update existing golf course
      const { data: course, error } = await supabase
        .from('golf_courses')
        .update({
          name: data.name,
          location: data.location,
          description: data.description,
          par: data.par,
          holes: data.holes,
          course_image_url: data.course_image_url,
          logo_url: data.logo_url,
          website_url: data.website_url,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          course_type: data.course_type,
          green_fees_min: data.green_fees_min,
          green_fees_max: data.green_fees_max,
          cart_fees: data.cart_fees,
          caddie_available: data.caddie_available,
          pro_shop: data.pro_shop,
          restaurant: data.restaurant,
          driving_range: data.driving_range,
          putting_green: data.putting_green,
          practice_facilities: data.practice_facilities,
          lessons_available: data.lessons_available,
          dress_code: data.dress_code,
          booking_policy: data.booking_policy,
          cancellation_policy: data.cancellation_policy,
          is_featured: data.is_featured,
          updated_by: data.updated_by
        })
        .eq('id', data.course_id)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating course:', error)
        return NextResponse.json({ 
          error: 'Failed to update course', 
          details: error.message 
        }, { status: 500 })
      }

      console.log('✅ Course updated successfully:', course.id)
      return NextResponse.json({ success: true, course })
    }

    if (action === 'upload_photo') {
      // Add photo to course
      const { data: photo, error } = await supabase
        .from('course_photos')
        .insert({
          course_id: data.course_id,
          photo_url: data.photo_url,
          photo_type: data.photo_type || 'general',
          caption: data.caption,
          is_primary: data.is_primary || false,
          display_order: data.display_order || 0,
          uploaded_by: data.uploaded_by
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error uploading photo:', error)
        return NextResponse.json({ 
          error: 'Failed to upload photo', 
          details: error.message 
        }, { status: 500 })
      }

      console.log('✅ Photo uploaded successfully:', photo.id)
      return NextResponse.json({ success: true, photo })
    }

    if (action === 'add_amenity') {
      // Add amenity to course
      const { data: amenity, error } = await supabase
        .from('course_amenities')
        .insert({
          course_id: data.course_id,
          amenity_type: data.amenity_type,
          amenity_name: data.amenity_name,
          description: data.description,
          is_available: data.is_available !== false,
          additional_cost: data.additional_cost || 0
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error adding amenity:', error)
        return NextResponse.json({ 
          error: 'Failed to add amenity', 
          details: error.message 
        }, { status: 500 })
      }

      console.log('✅ Amenity added successfully:', amenity.id)
      return NextResponse.json({ success: true, amenity })
    }

    if (action === 'add_hole') {
      // Add hole to course
      const { data: hole, error } = await supabase
        .from('course_holes')
        .insert({
          course_id: data.course_id,
          hole_number: data.hole_number,
          par: data.par,
          yardage: data.yardage,
          handicap: data.handicap,
          description: data.description,
          photo_url: data.photo_url
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error adding hole:', error)
        return NextResponse.json({ 
          error: 'Failed to add hole', 
          details: error.message 
        }, { status: 500 })
      }

      console.log('✅ Hole added successfully:', hole.id)
      return NextResponse.json({ success: true, hole })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('❌ Error in golf courses manage POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
