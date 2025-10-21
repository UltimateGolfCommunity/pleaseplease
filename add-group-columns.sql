-- Add location and logo_url columns to golf_groups table

-- Add location column if it doesn't exist
ALTER TABLE golf_groups 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add logo_url column if it doesn't exist
ALTER TABLE golf_groups 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add index for location searches
CREATE INDEX IF NOT EXISTS idx_golf_groups_location ON golf_groups(location);

-- Add index for logo_url to speed up queries
CREATE INDEX IF NOT EXISTS idx_golf_groups_logo_url ON golf_groups(logo_url);

-- Show the updated table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'golf_groups'
ORDER BY ordinal_position;

