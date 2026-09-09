-- Run this once in the Supabase SQL editor before deploying tournament support.
ALTER TABLE golf_groups
  ADD COLUMN IF NOT EXISTS group_type text NOT NULL DEFAULT 'community',
  ADD COLUMN IF NOT EXISTS tournament_date date,
  ADD COLUMN IF NOT EXISTS tournament_end_date date,
  ADD COLUMN IF NOT EXISTS tournament_format text,
  ADD COLUMN IF NOT EXISTS tournament_type text,
  ADD COLUMN IF NOT EXISTS tournament_matchups text;

-- Older installations only permitted community and course. Tournament is a
-- first-class group type, so replace that constraint before using it.
ALTER TABLE golf_groups
  DROP CONSTRAINT IF EXISTS golf_groups_group_type_check;

ALTER TABLE golf_groups
  ADD CONSTRAINT golf_groups_group_type_check
  CHECK (group_type IN ('community', 'course', 'tournament'));

CREATE TABLE IF NOT EXISTS tournament_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES golf_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  total_score integer NOT NULL,
  score_label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS tournament_scores_group_id_idx ON tournament_scores(group_id);
