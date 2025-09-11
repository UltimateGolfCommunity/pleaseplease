-- Add user_activities table for tracking user actions
-- This allows the profile page to show real recent activity

-- Create activity types enum
CREATE TYPE activity_type AS ENUM (
  'profile_updated',
  'tee_time_created',
  'tee_time_applied',
  'tee_time_accepted',
  'tee_time_declined',
  'group_joined',
  'group_created',
  'group_invited',
  'group_invitation_accepted',
  'group_invitation_declined',
  'connection_requested',
  'connection_accepted',
  'connection_declined',
  'round_logged',
  'course_reviewed',
  'badge_earned',
  'message_sent'
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    related_id UUID, -- ID of related entity (tee_time_id, group_id, etc.)
    related_type TEXT, -- Type of related entity ('tee_time', 'group', 'user', etc.)
    metadata JSONB, -- Additional data like course name, group name, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_related_id ON user_activities(related_id);

-- Enable RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Users can view their own activities
CREATE POLICY "Users can view own activities" ON user_activities 
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own activities
CREATE POLICY "Users can insert own activities" ON user_activities 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System can insert activities for any user (for automated tracking)
CREATE POLICY "System can insert activities" ON user_activities 
FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT ALL ON user_activities TO anon, authenticated;

-- Add comment
COMMENT ON TABLE user_activities IS 'Table for tracking user activities and actions';
COMMENT ON COLUMN user_activities.metadata IS 'JSON data containing additional context like course names, group names, etc.';
