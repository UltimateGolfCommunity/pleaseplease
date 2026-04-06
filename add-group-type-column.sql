-- Add group_type support to golf_groups
-- Run this in the Supabase SQL editor for production

ALTER TABLE golf_groups
ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'community';

UPDATE golf_groups
SET group_type = 'community'
WHERE group_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_golf_groups_group_type
ON golf_groups(group_type);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'golf_groups_group_type_check'
  ) THEN
    ALTER TABLE golf_groups
    ADD CONSTRAINT golf_groups_group_type_check
    CHECK (group_type IN ('community', 'course'));
  END IF;
END $$;
