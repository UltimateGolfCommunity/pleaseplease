import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing admin client...')
    
    // Test 1: Create admin client
    let supabase
    try {
      supabase = createAdminClient()
      console.log('✅ Admin client created successfully')
    } catch (adminError) {
      const errorMsg = adminError instanceof Error ? adminError.message : String(adminError)
      console.log('❌ Admin client creation failed:', errorMsg)
      return NextResponse.json({ 
        error: 'Admin client creation failed',
        details: errorMsg,
        step: 'client-creation'
      }, { status: 500 })
    }
    
    // Test 2: Simple query to test connection
    try {
      console.log('🔍 Testing simple query...')
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1)
      
      if (error) {
        console.log('❌ Simple query failed:', error.message)
        return NextResponse.json({ 
          error: 'Database query failed',
          details: error.message,
          step: 'simple-query',
          errorCode: error.code
        }, { status: 500 })
      }
      
      console.log('✅ Simple query successful, found', data?.length || 0, 'profiles')
    } catch (queryError) {
      const errorMsg = queryError instanceof Error ? queryError.message : String(queryError)
      console.log('❌ Query exception:', errorMsg)
      return NextResponse.json({ 
        error: 'Query exception',
        details: errorMsg,
        step: 'query-exception'
      }, { status: 500 })
    }
    
    // Test 3: Try to insert a test profile
    const testUserId = 'test-' + Date.now()
    try {
      console.log('🔍 Testing profile insertion...')
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User'
        })
        .select()
        .single()
      
      if (error) {
        console.log('❌ Profile insertion failed:', error.message)
        return NextResponse.json({ 
          error: 'Profile insertion failed',
          details: error.message,
          step: 'profile-insertion',
          errorCode: error.code
        }, { status: 500 })
      }
      
      console.log('✅ Profile insertion successful:', data?.id)
      
      // Clean up test profile
      await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testUserId)
      
      console.log('✅ Test profile cleaned up')
      
    } catch (insertError) {
      const errorMsg = insertError instanceof Error ? insertError.message : String(insertError)
      console.log('❌ Insert exception:', errorMsg)
      return NextResponse.json({ 
        error: 'Insert exception',
        details: errorMsg,
        step: 'insert-exception'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'All admin client tests passed',
      steps: ['client-creation', 'simple-query', 'profile-insertion', 'cleanup']
    })
    
  } catch (error) {
    console.error('❌ Test admin client error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      step: 'general-exception'
    }, { status: 500 })
  }
}
