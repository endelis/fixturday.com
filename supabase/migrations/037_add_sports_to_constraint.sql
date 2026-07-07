-- 037_add_sports_to_constraint.sql
-- Extend tournaments.sport CHECK to include catch_serve and rugby.

BEGIN;

ALTER TABLE tournaments
  DROP CONSTRAINT IF EXISTS tournaments_sport_check;

ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_sport_check
  CHECK (sport IN ('football', 'beach_volleyball', 'catch_serve', 'rugby'));

COMMIT;
