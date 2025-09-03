import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnostic endpoint called')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 Environment check:')
    console.log('  Supabase URL exists:', !!supabaseUrl)
    console.log('  Supabase Key exists:', !!supabaseKey)
    console.log('  Service Role Key exists:', !!serviceRoleKey)
    console.log('  URL starts with:', supabaseUrl?.substring(0, 20))
    console.log('  Key starts with:', supabaseKey?.substring(0, 20))
    console.log('  Service key starts with:', serviceRoleKey?.substring(0, 20))
    console.log('  Service key length:', serviceRoleKey?.length || 0)
    
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production'
    console.log('  Environment:', process.env.NODE_ENV)
    console.log('  Is production:', isProduction)
    
    // Test admin client creation
    let adminClientTest = 'not-tested'
    try {
      const { createAdminClient } = await import('@/lib/supabase-admin')
      const adminClient = createAdminClient()
      adminClientTest = 'success'
      console.log('✅ Admin client created successfully')
    } catch (adminError) {
      adminClientTest = `failed: ${adminError instanceof Error ? adminError.message : String(adminError)}`
      console.log('❌ Admin client failed:', adminClientTest)
    }
    
    return NextResponse.json({ 
      status: 'ok',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction,
        supabaseUrlExists: !!supabaseUrl,
        supabaseKeyExists: !!supabaseKey,
        serviceRoleKeyExists: !!serviceRoleKey,
        supabaseUrlPrefix: supabaseUrl?.substring(0, 20) + '...',
        supabaseKeyPrefix: supabaseKey?.substring(0, 20) + '...',
        serviceRoleKeyPrefix: serviceRoleKey?.substring(0, 20) + '...',
        serviceRoleKeyLength: serviceRoleKey?.length || 0,
        adminClientTest
      }
    })
  } catch (error) {
    console.error('❌ Diagnostic error:', error)
    return NextResponse.json({ 
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
