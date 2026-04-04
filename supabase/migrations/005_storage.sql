-- =============================================================================
-- Migration: 005_storage.sql
-- Project:   Fixturday
-- Created:   2026-04-04
-- Description: Add Storage buckets for tournament logos and attachments.
--              Add rules (text) and attachments (jsonb) columns to tournaments.
--
-- NOTE: Also run in Supabase Dashboard → Storage → New bucket:
--   1. tournament-logos        (public)
--   2. tournament-attachments  (public)
-- Then add storage policies via Dashboard → Storage → Policies:
--   Allow authenticated users to INSERT/UPDATE/DELETE
--   Allow anonymous users to SELECT (public read)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Storage buckets (idempotent via ON CONFLICT DO NOTHING)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
  VALUES ('tournament-logos', 'tournament-logos', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('tournament-attachments', 'tournament-attachments', true)
  ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- TABLE: tournaments
-- Rich-content fields.
-- ---------------------------------------------------------------------------
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS rules        text,
  ADD COLUMN IF NOT EXISTS attachments  jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMIT;
