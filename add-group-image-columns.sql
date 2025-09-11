-- Add image columns to golf_groups table
-- This allows groups to have profile pictures and header images

ALTER TABLE golf_groups 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS header_image_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_golf_groups_image_url ON golf_groups(image_url);
CREATE INDEX IF NOT EXISTS idx_golf_groups_header_image_url ON golf_groups(header_image_url);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'golf_groups' 
AND column_name IN ('image_url', 'header_image_url', 'logo_url')
ORDER BY ordinal_position;
