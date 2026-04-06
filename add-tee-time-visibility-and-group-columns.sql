-- Add tee time visibility and group posting support
-- Run this in the Supabase SQL editor for production

ALTER TABLE tee_times
ADD COLUMN IF NOT EXISTS visibility_scope TEXT DEFAULT 'public';

ALTER TABLE tee_times
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES golf_groups(id) ON DELETE SET NULL;

UPDATE tee_times
SET visibility_scope = 'public'
WHERE visibility_scope IS NULL;

CREATE INDEX IF NOT EXISTS idx_tee_times_visibility_scope ON tee_times(visibility_scope);
CREATE INDEX IF NOT EXISTS idx_tee_times_group_id ON tee_times(group_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tee_times_visibility_scope_check'
  ) THEN
    ALTER TABLE tee_times
    ADD CONSTRAINT tee_times_visibility_scope_check
    CHECK (visibility_scope IN ('public', 'connections', 'group'));
  END IF;
END $$;
