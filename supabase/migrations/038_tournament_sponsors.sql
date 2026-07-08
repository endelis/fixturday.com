-- =============================================================================
-- Migration: 038_tournament_sponsors.sql
-- Description: Add sponsors JSONB array and sponsors_label text to tournaments.
--              Reuses the existing 'tournament-logos' storage bucket.
--              sponsors: [{logo_path: string, name: string}]
-- =============================================================================

BEGIN;

ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS sponsors_label text,
  ADD COLUMN IF NOT EXISTS sponsors       jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
