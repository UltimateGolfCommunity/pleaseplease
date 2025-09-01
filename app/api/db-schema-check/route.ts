import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database schema...')
    
    const supabase = createAdminClient()
    
    // Try a simple query to see what columns are available
    const { data: sampleData, error: queryError } = await supabase
      .from('tee_times')
      .select('*')
      .limit(1)
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      sampleData,
      error: queryError?.message
    })
    
  } catch (error) {
    console.error('❌ Error checking database schema:', error)
    return NextResponse.json({ 
      error: 'Failed to check schema', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
