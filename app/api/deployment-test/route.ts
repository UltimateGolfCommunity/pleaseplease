import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  
  return NextResponse.json({
    message: 'Deployment test successful',
    timestamp,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'unknown',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'configured' : 'missing',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
  })
}
