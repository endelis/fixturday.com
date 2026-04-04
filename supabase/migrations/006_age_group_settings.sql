-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New query

ALTER TABLE age_groups
  ADD COLUMN IF NOT EXISTS pitch_gap_minutes integer DEFAULT 5,
  ADD COLUMN IF NOT EXISTS team_rest_minutes integer DEFAULT 20,
  ADD COLUMN IF NOT EXISTS groups_count integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS teams_advancing integer DEFAULT 2;

ALTER TABLE fixtures
  ADD COLUMN IF NOT EXISTS home_placeholder text,
  ADD COLUMN IF NOT EXISTS away_placeholder text;
