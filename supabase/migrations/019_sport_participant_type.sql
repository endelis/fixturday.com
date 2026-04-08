-- ── 019_sport_participant_type.sql ───────────────────────────────
-- Adds CHECK constraint on tournaments.sport (new canonical values)
-- and adds participant_type column (team | individual).
-- Existing rows are NOT validated against the new sport CHECK
-- (NOT VALID) so old free-form values survive until edited.

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS participant_type text NOT NULL DEFAULT 'team'
  CHECK (participant_type IN ('team', 'individual'));

ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_sport_check
  CHECK (sport IS NULL OR sport IN (
    'football', 'volleyball', 'beach_volleyball', 'rugby', 'table_tennis'
  )) NOT VALID;
