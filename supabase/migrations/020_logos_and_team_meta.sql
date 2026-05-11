-- =============================================================================
-- Migration: 020_logos_and_team_meta.sql
-- Project:   Fixturday
-- Created:   2026-05-09
-- Description: Add Storage-backed logo_path columns to tournaments and teams,
--              add country_code and manager_name to teams, ensure the two
--              logo buckets exist, and apply RLS policies on storage.objects.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS, ON CONFLICT DO NOTHING,
--             DROP POLICY IF EXISTS before CREATE POLICY.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- TABLE: tournaments — Storage object path for the tournament logo
-- (logo_url already exists as a legacy free-text URL field; logo_path is the
--  Supabase Storage object path inside the 'tournament-logos' bucket.)
-- ---------------------------------------------------------------------------
ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS logo_path text;

-- ---------------------------------------------------------------------------
-- TABLE: teams — logo, country, and manager metadata
-- ---------------------------------------------------------------------------
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS logo_path    text,
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'LV',
  ADD COLUMN IF NOT EXISTS manager_name text;

-- ---------------------------------------------------------------------------
-- Storage buckets (idempotent — bucket created in 005 already handles
-- tournament-logos; team-logos is new)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
  VALUES ('tournament-logos', 'tournament-logos', true)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('team-logos', 'team-logos', true)
  ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS on storage.objects
--
-- Public (anon) SELECT — anyone can read logo files via the public bucket URL.
-- Authenticated INSERT / UPDATE / DELETE — any signed-in user (= tournament
-- owner / admin in Fixturday) or super admin may manage logo objects.
-- Super-admin check uses the existing is_super_admin() helper from 010.
-- ---------------------------------------------------------------------------

-- ── tournament-logos: public read ────────────────────────────────────────
DROP POLICY IF EXISTS "Public read - tournament-logos" ON storage.objects;
CREATE POLICY "Public read - tournament-logos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'tournament-logos');

-- ── tournament-logos: authenticated write ────────────────────────────────
DROP POLICY IF EXISTS "Admin write - tournament-logos" ON storage.objects;
CREATE POLICY "Admin write - tournament-logos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'tournament-logos')
  WITH CHECK (bucket_id = 'tournament-logos');

-- ── team-logos: public read ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Public read - team-logos" ON storage.objects;
CREATE POLICY "Public read - team-logos"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'team-logos');

-- ── team-logos: authenticated write ──────────────────────────────────────
DROP POLICY IF EXISTS "Admin write - team-logos" ON storage.objects;
CREATE POLICY "Admin write - team-logos"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'team-logos')
  WITH CHECK (bucket_id = 'team-logos');

COMMIT;
