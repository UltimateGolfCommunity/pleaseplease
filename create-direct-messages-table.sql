-- Create direct_messages table for messaging system
-- This table stores direct messages between users

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

-- Create RLS policies for direct messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages they sent or received
CREATE POLICY "Users can read their own messages" ON direct_messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = recipient_id
    );

-- Policy: Users can send messages to any user
CREATE POLICY "Users can send messages" ON direct_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Policy: Users can update only the read status of messages they received
CREATE POLICY "Users can mark received messages as read" ON direct_messages
    FOR UPDATE USING (
        auth.uid() = recipient_id
    ) WITH CHECK (
        auth.uid() = recipient_id
    );

-- Comment on table
COMMENT ON TABLE direct_messages IS 'Stores direct messages between users in the golf community platform';
COMMENT ON COLUMN direct_messages.sender_id IS 'User who sent the message';
COMMENT ON COLUMN direct_messages.recipient_id IS 'User who received the message';
COMMENT ON COLUMN direct_messages.message_content IS 'The text content of the message';
COMMENT ON COLUMN direct_messages.is_read IS 'Whether the recipient has read the message';
COMMENT ON COLUMN direct_messages.created_at IS 'When the message was sent';
