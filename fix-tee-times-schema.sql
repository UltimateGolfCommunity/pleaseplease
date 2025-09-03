-- Fix tee_times table schema
-- Run this in your Supabase SQL Editor

-- Make course_id nullable (in case it's not already)
ALTER TABLE tee_times 
ALTER COLUMN course_id DROP NOT NULL;

-- Add any missing columns that might be needed
ALTER TABLE tee_times 
ADD COLUMN IF NOT EXISTS course_name TEXT;

-- Update existing tee times to have course_name if they don't have it
UPDATE tee_times 
SET course_name = golf_courses.name 
FROM golf_courses 
WHERE tee_times.course_id = golf_courses.id 
AND tee_times.course_name IS NULL;

-- Create a default course if none exists
INSERT INTO golf_courses (id, name, location, description)
SELECT 
    gen_random_uuid(),
    'Default Golf Course',
    'TBD',
    'Default course for tee times without a specific course'
WHERE NOT EXISTS (SELECT 1 FROM golf_courses LIMIT 1);

-- Grant permissions
GRANT ALL ON tee_times TO anon, authenticated;
GRANT ALL ON golf_courses TO anon, authenticated;
