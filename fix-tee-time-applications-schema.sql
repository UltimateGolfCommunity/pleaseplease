-- Fix tee_time_applications table schema
-- Add missing updated_at column that's causing 400 errors

-- Add updated_at column to tee_time_applications table
ALTER TABLE tee_time_applications 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have updated_at timestamp
UPDATE tee_time_applications 
SET updated_at = COALESCE(updated_at, applied_at)
WHERE updated_at IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tee_time_applications_updated_at ON tee_time_applications(updated_at);
CREATE INDEX IF NOT EXISTS idx_tee_time_applications_status ON tee_time_applications(status);
CREATE INDEX IF NOT EXISTS idx_tee_time_applications_tee_time_id ON tee_time_applications(tee_time_id);
CREATE INDEX IF NOT EXISTS idx_tee_time_applications_applicant_id ON tee_time_applications(applicant_id);

-- Verify the schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tee_time_applications' 
ORDER BY ordinal_position;
