import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 TEST-COURSES: Starting test...')
    
    // Try to create admin client
    let supabase: any = null
    try {
      supabase = createAdminClient()
      console.log('✅ TEST-COURSES: Admin client created successfully')
    } catch (error) {
      console.error('❌ TEST-COURSES: Failed to create admin client:', error)
      return NextResponse.json({ 
        error: 'Failed to create admin client',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

    // Test basic connection
    console.log('🔍 TEST-COURSES: Testing basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('golf_courses')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ TEST-COURSES: Database connection failed:', testError)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: testError.message
      }, { status: 500 })
    }

    console.log('✅ TEST-COURSES: Database connection successful')

    // Get all courses
    console.log('🔍 TEST-COURSES: Fetching all courses...')
    const { data: courses, error: coursesError } = await supabase
      .from('golf_courses')
      .select('*')
      .order('created_at', { ascending: false })

    if (coursesError) {
      console.error('❌ TEST-COURSES: Failed to fetch courses:', coursesError)
      return NextResponse.json({ 
        error: 'Failed to fetch courses',
        details: coursesError.message
      }, { status: 500 })
    }

    console.log('✅ TEST-COURSES: Successfully fetched courses:', courses?.length || 0)

    return NextResponse.json({
      success: true,
      totalCourses: courses?.length || 0,
      courses: courses?.slice(0, 5) || [], // Return first 5 courses
      message: 'Courses fetched successfully'
    })

  } catch (error) {
    console.error('❌ TEST-COURSES: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
