-- 033_tournaments_sport_constraint.sql
-- Extends the tournaments.sport CHECK to allow beach_volleyball.
-- The old constraint "tournaments_sport_football_only" only permitted 'football'.

BEGIN;

ALTER TABLE tournaments
  DROP CONSTRAINT IF EXISTS tournaments_sport_football_only;

ALTER TABLE tournaments
  DROP CONSTRAINT IF EXISTS tournaments_sport_check;

ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_sport_check
  CHECK (sport IN ('football', 'beach_volleyball'));

COMMIT;
