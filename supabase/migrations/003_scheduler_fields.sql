-- =============================================================================
-- Migration: 002_scheduler_fields.sql
-- Project:   Fixturday
-- Created:   2026-04-01
-- Description: Add scheduling-related columns to tournaments and age_groups.
--              Idempotent — uses ADD COLUMN IF NOT EXISTS throughout.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- TABLE: tournaments
-- Day-level scheduling boundaries and optional lunch break window.
-- ---------------------------------------------------------------------------
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS first_game_time TIME DEFAULT '09:00:00',
  ADD COLUMN IF NOT EXISTS last_game_time  TIME DEFAULT '18:00:00',
  ADD COLUMN IF NOT EXISTS lunch_start     TIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lunch_end       TIME DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- TABLE: age_groups
-- Per-age-group match duration used by the fixture scheduler.
-- ---------------------------------------------------------------------------
ALTER TABLE age_groups
  ADD COLUMN IF NOT EXISTS game_duration_minutes INTEGER NOT NULL DEFAULT 20;

-- Add the CHECK constraint only if it does not already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   pg_constraint
    WHERE  conrelid = 'age_groups'::regclass
    AND    conname  = 'age_groups_game_duration_minutes_check'
  ) THEN
    ALTER TABLE age_groups
      ADD CONSTRAINT age_groups_game_duration_minutes_check
      CHECK (game_duration_minutes >= 5 AND game_duration_minutes <= 90);
  END IF;
END;
$$;

COMMIT;
