-- Add logo_url column to golf_groups table
-- This allows groups to have custom logos

ALTER TABLE golf_groups 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_golf_groups_logo_url ON golf_groups(logo_url);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'golf_groups' 
AND column_name = 'logo_url';
