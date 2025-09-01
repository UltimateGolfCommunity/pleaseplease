import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Tee times test endpoint called')
    
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
    
    console.log('🔍 Environment check:', envCheck)
    
    // Try to create admin client
    let adminClient = null
    try {
      adminClient = createAdminClient()
      console.log('✅ Admin client created successfully')
    } catch (error) {
      console.log('❌ Failed to create admin client:', error)
    }
    
    // Try a simple database query
    let dbTest = null
    if (adminClient) {
      try {
        const { data, error } = await adminClient
          .from('tee_times')
          .select('count')
          .limit(1)
        
        if (error) {
          dbTest = { error: error.message }
        } else {
          dbTest = { success: true, count: data?.length || 0 }
        }
      } catch (error) {
        dbTest = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envCheck,
      adminClient: !!adminClient,
      databaseTest: dbTest
    })
    
  } catch (error) {
    console.error('❌ Error in tee-times test:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
