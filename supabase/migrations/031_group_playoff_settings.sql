-- 031_group_playoff_settings.sql
-- groups_count   : organiser picks 2/3/4 groups directly
-- playoff_depth  : controls knockout rounds (final/sf/qf/r16)
-- bracket_seeding: cross = A1 vs B2 (default), mirror = A1 vs A2, ranked = best N overall

ALTER TABLE age_groups
  ADD COLUMN IF NOT EXISTS groups_count integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS playoff_depth text DEFAULT 'sf'
    CHECK (playoff_depth IN ('final', 'sf', 'qf', 'r16')),
  ADD COLUMN IF NOT EXISTS bracket_seeding text DEFAULT 'cross'
    CHECK (bracket_seeding IN ('cross', 'mirror', 'ranked'));
