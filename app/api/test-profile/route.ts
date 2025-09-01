import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test profile API endpoint called')
    
    const supabase = createServerClient()
    console.log('🔍 Supabase client created successfully')
    
    // Test a simple query
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase test query failed:', error)
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ Supabase connection successful')
    return NextResponse.json({ 
      status: 'ok', 
      message: 'Profile API is working',
      database: 'connected'
    })
  } catch (error) {
    console.error('❌ Test profile API error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
