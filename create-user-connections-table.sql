-- Create user_connections table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(requester_id, recipient_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS user_connections_requester_id_idx ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS user_connections_recipient_id_idx ON user_connections(recipient_id);
CREATE INDEX IF NOT EXISTS user_connections_status_idx ON user_connections(status);

-- Enable RLS
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for user_connections
-- Users can view connections they are involved in
CREATE POLICY IF NOT EXISTS "Users can view their own connections" ON user_connections
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id
  );

-- Users can create connection requests (as requester)
CREATE POLICY IF NOT EXISTS "Users can create connection requests" ON user_connections
  FOR INSERT WITH CHECK (
    auth.uid() = requester_id
  );

-- Users can update connections they are involved in (to accept/reject)
CREATE POLICY IF NOT EXISTS "Users can update their connections" ON user_connections
  FOR UPDATE USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id
  );

-- Users can delete their own connection requests
CREATE POLICY IF NOT EXISTS "Users can delete their connection requests" ON user_connections
  FOR DELETE USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id
  );

-- Update the updated_at timestamp on updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_connections_updated_at') THEN
        CREATE TRIGGER update_user_connections_updated_at
            BEFORE UPDATE ON user_connections
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;
