-- Run this once in the Supabase SQL editor before deploying tournament support.
ALTER TABLE golf_groups
  ADD COLUMN IF NOT EXISTS tournament_date date,
  ADD COLUMN IF NOT EXISTS tournament_format text,
  ADD COLUMN IF NOT EXISTS tournament_type text,
  ADD COLUMN IF NOT EXISTS tournament_matchups text;

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
