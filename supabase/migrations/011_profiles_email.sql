-- ── 011_profiles_email.sql ───────────────────────────────────────
-- Add email to profiles + confirm cascade deletes on tournaments

-- ── profiles: add email column ───────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text;

-- ── tournaments → age_groups: ensure ON DELETE CASCADE ──────────
ALTER TABLE age_groups
  DROP CONSTRAINT IF EXISTS age_groups_tournament_id_fkey;
ALTER TABLE age_groups
  ADD CONSTRAINT age_groups_tournament_id_fkey
    FOREIGN KEY (tournament_id)
    REFERENCES tournaments(id) ON DELETE CASCADE;

-- ── tournaments → venues: ensure ON DELETE CASCADE ───────────────
ALTER TABLE venues
  DROP CONSTRAINT IF EXISTS venues_tournament_id_fkey;
ALTER TABLE venues
  ADD CONSTRAINT venues_tournament_id_fkey
    FOREIGN KEY (tournament_id)
    REFERENCES tournaments(id) ON DELETE CASCADE;
