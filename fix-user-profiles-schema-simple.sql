-- Simple fix for user_profiles table schema
-- Add missing columns that are causing 400 errors

-- Add missing columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS header_image_url TEXT,
ADD COLUMN IF NOT EXISTS home_club TEXT,
ADD COLUMN IF NOT EXISTS years_playing INTEGER,
ADD COLUMN IF NOT EXISTS favorite_course TEXT,
ADD COLUMN IF NOT EXISTS playing_style TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS preferred_playing_days TEXT[],
ADD COLUMN IF NOT EXISTS preferred_playing_times TEXT[],
ADD COLUMN IF NOT EXISTS golf_goals TEXT[],
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS member_since TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have default values
UPDATE user_profiles 
SET 
  total_points = COALESCE(total_points, 0),
  member_since = COALESCE(member_since, created_at)
WHERE total_points IS NULL OR member_since IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_experience_level ON user_profiles(experience_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_playing_style ON user_profiles(playing_style);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON user_profiles(location);

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;
