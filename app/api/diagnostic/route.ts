import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnostic endpoint called')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('🔍 Environment check:')
    console.log('  Supabase URL exists:', !!supabaseUrl)
    console.log('  Supabase Key exists:', !!supabaseKey)
    console.log('  URL starts with:', supabaseUrl?.substring(0, 20))
    console.log('  Key starts with:', supabaseKey?.substring(0, 20))
    
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production'
    console.log('  Environment:', process.env.NODE_ENV)
    console.log('  Is production:', isProduction)
    
    return NextResponse.json({ 
      status: 'ok',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isProduction,
        supabaseUrlExists: !!supabaseUrl,
        supabaseKeyExists: !!supabaseKey,
        supabaseUrlPrefix: supabaseUrl?.substring(0, 20) + '...',
        supabaseKeyPrefix: supabaseKey?.substring(0, 20) + '...'
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
