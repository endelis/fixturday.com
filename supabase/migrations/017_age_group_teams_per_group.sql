-- ── 017_age_group_teams_per_group.sql ────────────────────────────
-- Replace groups_count with teams_per_group as the primary config.
-- Organizer sets "how many teams per group" (default 4); the system
-- derives group count at fixture-generation time from teams.length / teams_per_group.

ALTER TABLE age_groups
  ADD COLUMN IF NOT EXISTS teams_per_group integer DEFAULT 4;
