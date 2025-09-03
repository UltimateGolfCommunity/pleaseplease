-- Create golf_groups table if it doesn't exist
CREATE TABLE IF NOT EXISTS golf_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER DEFAULT 10 CHECK (max_members > 0),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create group_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES golf_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'moderator')) DEFAULT 'member',
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'banned')) DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS golf_groups_creator_id_idx ON golf_groups(creator_id);
CREATE INDEX IF NOT EXISTS golf_groups_status_idx ON golf_groups(status);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_user_id_idx ON group_members(user_id);
CREATE INDEX IF NOT EXISTS group_members_status_idx ON group_members(status);

-- Enable RLS
ALTER TABLE golf_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Golf Groups Policies
-- Users can view active groups
CREATE POLICY IF NOT EXISTS "Users can view active groups" ON golf_groups
  FOR SELECT USING (status = 'active');

-- Users can create groups
CREATE POLICY IF NOT EXISTS "Users can create groups" ON golf_groups
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Group creators and admins can update groups
CREATE POLICY IF NOT EXISTS "Group creators can update groups" ON golf_groups
  FOR UPDATE USING (
    auth.uid() = creator_id OR 
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = golf_groups.id 
      AND user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Group Members Policies
-- Users can view members of groups they belong to
CREATE POLICY IF NOT EXISTS "Users can view group members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm 
      WHERE gm.group_id = group_members.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.status = 'active'
    )
  );

-- Users can join groups (insert themselves)
CREATE POLICY IF NOT EXISTS "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Group admins can manage members
CREATE POLICY IF NOT EXISTS "Group admins can manage members" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_members.group_id 
      AND user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Users can remove themselves from groups
CREATE POLICY IF NOT EXISTS "Users can leave groups" ON group_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_members.group_id 
      AND user_id = auth.uid() 
      AND role = 'admin' 
      AND status = 'active'
    )
  );

-- Update the updated_at timestamp on updates for golf_groups
CREATE OR REPLACE FUNCTION update_golf_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist for golf_groups
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_golf_groups_updated_at') THEN
        CREATE TRIGGER update_golf_groups_updated_at
            BEFORE UPDATE ON golf_groups
            FOR EACH ROW
            EXECUTE FUNCTION update_golf_groups_updated_at();
    END IF;
END
$$;
