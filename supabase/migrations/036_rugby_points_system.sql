-- Adds rugby_points_system column to age_groups.
-- Stores the standing-points system used for rugby divisions.
--   '4_2_1' = international (Win=4, Draw=2, Loss=1, Technical=0)
--   '3_1'   = simplified Latvian (Win=3, Loss=1, no draws tracked)
-- Defaults to international standard.

ALTER TABLE age_groups
  ADD COLUMN IF NOT EXISTS rugby_points_system TEXT NOT NULL DEFAULT '4_2_1';
