import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Validating Supabase configuration...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment variables:')
    console.log('  URL:', supabaseUrl)
    console.log('  Service key length:', serviceRoleKey?.length || 0)
    console.log('  Service key prefix:', serviceRoleKey?.substring(0, 50) + '...')
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey
        }
      }, { status: 400 })
    }
    
    // Decode the JWT to check the project reference
    try {
      const base64Url = serviceRoleKey.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      
      const payload = JSON.parse(jsonPayload)
      console.log('JWT payload:', payload)
      
      // Expected URL format: https://{ref}.supabase.co
      const expectedUrl = `https://${payload.ref}.supabase.co`
      const urlMatches = supabaseUrl === expectedUrl
      
      console.log('URL validation:')
      console.log('  Expected URL:', expectedUrl)
      console.log('  Actual URL:', supabaseUrl)
      console.log('  URLs match:', urlMatches)
      
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      const isExpired = payload.exp < now
      
      console.log('Token validation:')
      console.log('  Current timestamp:', now)
      console.log('  Token expires:', payload.exp)
      console.log('  Is expired:', isExpired)
      
      return NextResponse.json({ 
        success: true,
        validation: {
          urlMatches,
          isExpired,
          projectRef: payload.ref,
          role: payload.role,
          issuer: payload.iss,
          expectedUrl,
          actualUrl: supabaseUrl,
          expiresAt: new Date(payload.exp * 1000).toISOString()
        }
      })
      
    } catch (decodeError) {
      console.log('❌ Failed to decode JWT:', decodeError)
      return NextResponse.json({ 
        error: 'Failed to decode service role key',
        details: decodeError instanceof Error ? decodeError.message : 'Unknown error'
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('❌ Validation error:', error)
    return NextResponse.json({ 
      error: 'Validation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
