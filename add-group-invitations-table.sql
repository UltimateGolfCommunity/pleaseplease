-- Add group_invitations table to the database
-- Run this in your Supabase SQL Editor

-- Create group_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES golf_groups(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_invitations_group_id') THEN
        CREATE INDEX idx_group_invitations_group_id ON group_invitations(group_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_invitations_invited_user_id') THEN
        CREATE INDEX idx_group_invitations_invited_user_id ON group_invitations(invited_user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_group_invitations_status') THEN
        CREATE INDEX idx_group_invitations_status ON group_invitations(status);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own invitations' AND tablename = 'group_invitations') THEN
        CREATE POLICY "Users can view own invitations" ON group_invitations 
        FOR SELECT USING (auth.uid() = invited_user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group owners can view group invitations' AND tablename = 'group_invitations') THEN
        CREATE POLICY "Group owners can view group invitations" ON group_invitations 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM golf_groups 
                WHERE id = group_id AND creator_id = auth.uid()
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Group owners can create invitations' AND tablename = 'group_invitations') THEN
        CREATE POLICY "Group owners can create invitations" ON group_invitations 
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM golf_groups 
                WHERE id = group_id AND creator_id = auth.uid()
            )
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own invitations' AND tablename = 'group_invitations') THEN
        CREATE POLICY "Users can update own invitations" ON group_invitations 
        FOR UPDATE USING (auth.uid() = invited_user_id);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON group_invitations TO anon, authenticated;

-- Add comment
COMMENT ON TABLE group_invitations IS 'Table for managing group invitations';
