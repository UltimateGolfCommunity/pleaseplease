import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up direct_messages table...')
    
    const supabase = createAdminClient()
    
    // Create the direct_messages table
    const createTableSQL = `
      -- Create direct_messages table for messaging system
      CREATE TABLE IF NOT EXISTS direct_messages (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
          recipient_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
          message_content TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })
    
    if (createError) {
      console.error('❌ Error creating table:', createError)
      // Try alternative approach - direct query
      const { error: directCreateError } = await supabase
        .from('direct_messages')
        .select('id')
        .limit(1)
      
      if (directCreateError && directCreateError.message.includes('relation "direct_messages" does not exist')) {
        // Table doesn't exist, we need to create it through SQL execution
        return NextResponse.json({
          error: 'Table creation failed',
          details: 'Need to create table through SQL execution',
          sql: createTableSQL
        }, { status: 400 })
      }
    }
    
    // Create indexes
    const indexesSQL = [
      'CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);',
      'CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);',
      'CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at);',
      'CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(sender_id, recipient_id);'
    ]
    
    for (const indexSQL of indexesSQL) {
      const { error: indexError } = await supabase.rpc('exec_sql', { 
        sql: indexSQL 
      })
      if (indexError) {
        console.log('⚠️ Index creation warning:', indexError.message)
      }
    }
    
    // Enable RLS and create policies
    const rlsSQL = `
      ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can read their own messages" ON direct_messages
          FOR SELECT USING (
              auth.uid() = sender_id OR 
              auth.uid() = recipient_id
          );
      
      CREATE POLICY IF NOT EXISTS "Users can send messages" ON direct_messages
          FOR INSERT WITH CHECK (
              auth.uid() = sender_id
          );
      
      CREATE POLICY IF NOT EXISTS "Users can mark received messages as read" ON direct_messages
          FOR UPDATE USING (
              auth.uid() = recipient_id
          ) WITH CHECK (
              auth.uid() = recipient_id
          );
    `
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: rlsSQL 
    })
    
    if (rlsError) {
      console.log('⚠️ RLS setup warning:', rlsError.message)
    }
    
    // Test the table by trying to select from it
    const { data: testData, error: testError } = await supabase
      .from('direct_messages')
      .select('id')
      .limit(1)
    
    if (testError) {
      console.error('❌ Table test failed:', testError)
      return NextResponse.json({
        error: 'Table creation verification failed',
        details: testError.message
      }, { status: 400 })
    }
    
    console.log('✅ direct_messages table setup completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'direct_messages table created successfully',
      tableExists: true,
      testResult: 'Table accessible'
    })
    
  } catch (error) {
    console.error('❌ Error setting up messages table:', error)
    return NextResponse.json({ 
      error: 'Failed to setup messages table', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking direct_messages table status...')
    
    const supabase = createAdminClient()
    
    // Check if table exists by trying to query it
    const { data, error } = await supabase
      .from('direct_messages')
      .select('id')
      .limit(1)
    
    if (error) {
      return NextResponse.json({
        tableExists: false,
        error: error.message,
        needsCreation: true
      })
    }
    
    return NextResponse.json({
      tableExists: true,
      message: 'direct_messages table is available',
      recordCount: data?.length || 0
    })
    
  } catch (error) {
    console.error('❌ Error checking messages table:', error)
    return NextResponse.json({ 
      error: 'Failed to check messages table', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
