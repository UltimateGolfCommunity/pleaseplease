import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking database schema...')
    
    const supabase = createAdminClient()
    
    // Get the current columns in tee_times table
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'tee_times')
      .order('ordinal_position')
    
    if (error) {
      console.error('❌ Error checking schema:', error)
      return NextResponse.json({ 
        error: 'Failed to check schema',
        details: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ Schema check successful')
    return NextResponse.json({
      success: true,
      table: 'tee_times',
      columns: data || [],
      count: data?.length || 0
    })
    
  } catch (error) {
    console.error('❌ Schema check error:', error)
    return NextResponse.json({ 
      error: 'Schema check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
