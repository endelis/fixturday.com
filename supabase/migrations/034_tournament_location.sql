-- 034_tournament_location.sql
-- Add event location field to tournaments table

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS location text;
