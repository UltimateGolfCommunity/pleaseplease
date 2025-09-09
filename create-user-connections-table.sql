-- Create user_connections table for golf community
-- Run this in your Supabase SQL Editor

-- First, create the connection_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the user_connections table
CREATE TABLE IF NOT EXISTS user_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status connection_status DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, recipient_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_recipient ON user_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);

-- Enable Row Level Security
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own connections" ON user_connections
    FOR SELECT USING (
        requester_id = auth.uid() OR 
        recipient_id = auth.uid()
    );

CREATE POLICY "Users can create connection requests" ON user_connections
    FOR INSERT WITH CHECK (
        requester_id = auth.uid() AND 
        requester_id != recipient_id
    );

CREATE POLICY "Users can update their own connection requests" ON user_connections
    FOR UPDATE USING (
        requester_id = auth.uid() OR 
        recipient_id = auth.uid()
    );

-- Create notification_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('connection_request', 'connection_accepted', 'message', 'tee_time_invite', 'group_invite', 'achievement', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_id UUID,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Create policy for inserting notifications (system can create them)
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Add some helpful comments
COMMENT ON TABLE user_connections IS 'Stores connection requests between users';
COMMENT ON COLUMN user_connections.requester_id IS 'User who initiated the connection request';
COMMENT ON COLUMN user_connections.recipient_id IS 'User who received the connection request';
COMMENT ON COLUMN user_connections.status IS 'Current status of the connection request';

COMMENT ON TABLE notifications IS 'Stores notifications for users';
COMMENT ON COLUMN notifications.type IS 'Type of notification';
COMMENT ON COLUMN notifications.related_id IS 'ID of related object (connection, message, etc.)';
COMMENT ON COLUMN notifications.data IS 'Additional data as JSON';