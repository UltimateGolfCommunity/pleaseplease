-- Ensure golf_groups supports persistent logo and cover images

ALTER TABLE golf_groups
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS header_image_url TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT;

CREATE INDEX IF NOT EXISTS idx_golf_groups_location ON golf_groups(location);
CREATE INDEX IF NOT EXISTS idx_golf_groups_image_url ON golf_groups(image_url);
CREATE INDEX IF NOT EXISTS idx_golf_groups_header_image_url ON golf_groups(header_image_url);
CREATE INDEX IF NOT EXISTS idx_golf_groups_logo_url ON golf_groups(logo_url);

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'golf_groups'
  AND column_name IN ('location', 'image_url', 'header_image_url', 'logo_url')
ORDER BY column_name;
