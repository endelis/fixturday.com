-- Per-division set scoring target for Catch'n Serve Ball.
-- 15 = 15/15/11 scoring (LTSA default)
-- 25 = 25/25/15 scoring (extended/ICSBF international)
-- NULL on non-catch_serve divisions is fine; column is ignored.
ALTER TABLE age_groups
  ADD COLUMN IF NOT EXISTS cs_set_target smallint NOT NULL DEFAULT 15;
