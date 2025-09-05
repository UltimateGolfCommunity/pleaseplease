-- Fix golf_groups table by adding missing status column
-- This resolves the error: "Could not find the 'status' column of 'golf_groups' in the schema cache"

-- Add status column to golf_groups table
ALTER TABLE golf_groups 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Update existing records to have active status
UPDATE golf_groups 
SET status = 'active' 
WHERE status IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_golf_groups_status ON golf_groups(status);

-- Add RLS policy for status column
CREATE POLICY IF NOT EXISTS "Users can view active groups" ON golf_groups
FOR SELECT USING (status = 'active');

-- Update existing RLS policies to include status check
DROP POLICY IF EXISTS "Anyone can view golf groups" ON golf_groups;
CREATE POLICY "Anyone can view active golf groups" ON golf_groups
FOR SELECT USING (status = 'active');

-- Ensure group_members table has status column too
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Update existing group_members records
UPDATE group_members 
SET status = 'active' 
WHERE status IS NULL;

-- Add index for group_members status
CREATE INDEX IF NOT EXISTS idx_group_members_status ON group_members(status);

-- Ensure group_invitations table has status column
ALTER TABLE group_invitations 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';

-- Update existing group_invitations records
UPDATE group_invitations 
SET status = 'pending' 
WHERE status IS NULL;

-- Add index for group_invitations status
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON group_invitations(status);

-- Add RLS policies for group_invitations
CREATE POLICY IF NOT EXISTS "Users can view their own invitations" ON group_invitations
FOR SELECT USING (invited_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Group admins can create invitations" ON group_invitations
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_invitations.group_id 
    AND user_id = auth.uid() 
    AND role = 'admin' 
    AND status = 'active'
  )
);

CREATE POLICY IF NOT EXISTS "Users can update their own invitations" ON group_invitations
FOR UPDATE USING (invited_user_id = auth.uid());

-- Verify the changes
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name IN ('golf_groups', 'group_members', 'group_invitations')
  AND column_name = 'status'
ORDER BY table_name;
