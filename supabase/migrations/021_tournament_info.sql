-- ── 021_tournament_info.sql ──────────────────────────────────────────────────
-- Adds a per-tournament info page: organizer-written markdown, contact fields.
-- Idempotent: DROP POLICY IF EXISTS before every CREATE POLICY.
-- RLS: public SELECT; authenticated write scoped to owner or super-admin.
-- ---------------------------------------------------------------------------

BEGIN;

CREATE TABLE IF NOT EXISTS tournament_info (
  tournament_id uuid PRIMARY KEY
    REFERENCES tournaments(id) ON DELETE CASCADE,
  content_md    text NOT NULL DEFAULT '',
  contact_email text,
  contact_phone text,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tournament_info ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read info pages.
DROP POLICY IF EXISTS "tournament_info_public_select" ON tournament_info;
CREATE POLICY "tournament_info_public_select"
  ON tournament_info FOR SELECT
  USING (true);

-- Authenticated users can write their own tournament's info; super-admins can write any.
DROP POLICY IF EXISTS "tournament_info_admin_all" ON tournament_info;
CREATE POLICY "tournament_info_admin_all"
  ON tournament_info FOR ALL
  TO authenticated
  USING (
    tournament_id IN (SELECT id FROM tournaments WHERE owner_id = auth.uid())
    OR is_super_admin()
  )
  WITH CHECK (
    tournament_id IN (SELECT id FROM tournaments WHERE owner_id = auth.uid())
    OR is_super_admin()
  );

COMMIT;
