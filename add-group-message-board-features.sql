-- Add threaded replies and likes for group message boards
-- Run this in the Supabase SQL editor for production

ALTER TABLE group_messages
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_group_messages_parent_message_id
ON group_messages(parent_message_id);

CREATE TABLE IF NOT EXISTS group_message_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_message_id UUID NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_message_likes_message_id
ON group_message_likes(group_message_id);

CREATE INDEX IF NOT EXISTS idx_group_message_likes_user_id
ON group_message_likes(user_id);
