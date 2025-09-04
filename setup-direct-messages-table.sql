-- Setup Direct Messages Table
-- Run this in your Supabase SQL Editor to enable messaging functionality

-- Create the direct_messages table
CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    message_content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(sender_id, recipient_id);

-- Enable Row Level Security
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Verify table creation
SELECT 'direct_messages table created successfully' AS status;
