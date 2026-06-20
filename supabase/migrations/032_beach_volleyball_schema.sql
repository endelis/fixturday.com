-- 032_beach_volleyball_schema.sql
-- Adds columns and constraint updates needed for beach volleyball support.
--
-- Changes:
--   fixture_results  : sport_data JSONB for set-based scores
--   stages           : bracket column for double elimination sides
--   age_groups       : format CHECK extended with double_elimination, round_robin_playoff
--   stages           : type CHECK extended with double_elimination

BEGIN;

-- ── fixture_results: flexible per-sport score storage ───────────────────────
-- Beach volleyball example:
-- { "sets": [{"h":21,"a":19},{"h":21,"a":15}], "sets_home":2, "sets_away":0 }
ALTER TABLE fixture_results
  ADD COLUMN IF NOT EXISTS sport_data jsonb;

-- ── stages: which side of a double elimination bracket ──────────────────────
ALTER TABLE stages
  ADD COLUMN IF NOT EXISTS bracket text
  CHECK (bracket IN ('winners', 'losers', 'grand_final'));

-- ── age_groups.format: extend with new beach volleyball formats ──────────────
ALTER TABLE age_groups
  DROP CONSTRAINT IF EXISTS age_groups_format_check;

ALTER TABLE age_groups
  ADD CONSTRAINT age_groups_format_check
  CHECK (format IN (
    'round_robin',
    'knockout',
    'group_knockout',
    'double_elimination',
    'round_robin_playoff'
  )) NOT VALID;

-- ── stages.type: extend with double_elimination ──────────────────────────────
ALTER TABLE stages
  DROP CONSTRAINT IF EXISTS stages_type_check;

ALTER TABLE stages
  ADD CONSTRAINT stages_type_check
  CHECK (type IN (
    'round_robin',
    'knockout',
    'group_stage',
    'double_elimination'
  )) NOT VALID;

COMMIT;
