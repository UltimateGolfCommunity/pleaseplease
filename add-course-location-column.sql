-- Add missing course_location column to tee_times table
-- This fixes the 400 error when creating tee times

-- Add the course_location column if it doesn't exist
ALTER TABLE tee_times 
ADD COLUMN IF NOT EXISTS course_location TEXT;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tee_times_course_location ON tee_times(course_location);

-- Grant permissions
GRANT ALL ON tee_times TO anon, authenticated;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tee_times' 
AND column_name = 'course_location';
