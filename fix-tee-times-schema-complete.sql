-- Fix tee_times table schema - Add all missing columns
-- This fixes the 400 error when creating tee times

-- Add missing columns to tee_times table
ALTER TABLE tee_times 
ADD COLUMN IF NOT EXISTS course_location TEXT,
ADD COLUMN IF NOT EXISTS course_name TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS current_players INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS handicap_requirement TEXT DEFAULT 'any',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tee_times_course_location ON tee_times(course_location);
CREATE INDEX IF NOT EXISTS idx_tee_times_course_name ON tee_times(course_name);
CREATE INDEX IF NOT EXISTS idx_tee_times_coordinates ON tee_times(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tee_times_status ON tee_times(status);

-- Make course_id nullable if it's not already
ALTER TABLE tee_times 
ALTER COLUMN course_id DROP NOT NULL;

-- Grant permissions
GRANT ALL ON tee_times TO anon, authenticated;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tee_times' 
ORDER BY ordinal_position;
