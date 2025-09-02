-- Add group_invitations table
-- Run this in your Supabase SQL Editor

-- Create group_invitations table
CREATE TABLE IF NOT EXISTS group_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES golf_groups(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invited_user_id ON group_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON group_invitations(status);

-- Add RLS policies
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations sent to them
CREATE POLICY "Users can view own invitations" ON group_invitations 
FOR SELECT USING (auth.uid() = invited_user_id);

-- Group owners can view invitations for their groups
CREATE POLICY "Group owners can view group invitations" ON group_invitations 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM golf_groups 
        WHERE id = group_id AND creator_id = auth.uid()
    )
);

-- Users can create invitations (if they're group owners)
CREATE POLICY "Group owners can create invitations" ON group_invitations 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM golf_groups 
        WHERE id = group_id AND creator_id = auth.uid()
    )
);

-- Users can update their own invitations
CREATE POLICY "Users can update own invitations" ON group_invitations 
FOR UPDATE USING (auth.uid() = invited_user_id);

-- Add comment
COMMENT ON TABLE group_invitations IS 'Table for managing group invitations';
