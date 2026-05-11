-- ── 022_team_registrations.sql ───────────────────────────────────────────────
-- Public self-registration for teams. Honeypot field + trigger guard against
-- bot submissions. Organizers review via admin; status flow: pending → approved
-- or rejected (with optional rejection_reason).
-- Idempotent: DROP TRIGGER/FUNCTION IF EXISTS before creates;
--             DROP POLICY IF EXISTS before every CREATE POLICY.
-- ---------------------------------------------------------------------------

BEGIN;

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_registrations (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id    uuid        NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  age_group_id     uuid        NOT NULL REFERENCES age_groups(id)  ON DELETE CASCADE,
  team_name        text        NOT NULL,
  manager_name     text        NOT NULL,
  manager_email    text        NOT NULL,
  manager_phone    text,
  player_roster    jsonb       NOT NULL DEFAULT '[]',
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid        REFERENCES auth.users(id),
  honeypot         text
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS team_registrations_tournament_status_idx
  ON team_registrations (tournament_id, status);

CREATE INDEX IF NOT EXISTS team_registrations_created_at_idx
  ON team_registrations (created_at DESC);

-- ── Honeypot trigger ──────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS reject_spam_trigger ON team_registrations;
DROP FUNCTION IF EXISTS reject_spam();

CREATE FUNCTION reject_spam()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.honeypot IS NOT NULL AND NEW.honeypot <> '' THEN
    RAISE EXCEPTION 'spam detected';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reject_spam_trigger
  BEFORE INSERT ON team_registrations
  FOR EACH ROW EXECUTE FUNCTION reject_spam();

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE team_registrations ENABLE ROW LEVEL SECURITY;

-- Anon can submit a registration only when honeypot is null or empty.
-- The trigger is the hard enforcement; the policy is a belt-and-suspenders check.
DROP POLICY IF EXISTS "team_registrations_anon_insert" ON team_registrations;
CREATE POLICY "team_registrations_anon_insert"
  ON team_registrations FOR INSERT
  TO anon
  WITH CHECK (honeypot IS NULL OR honeypot = '');

-- Authenticated organizers (or super-admins) can read and manage registrations
-- for their own tournaments.
DROP POLICY IF EXISTS "team_registrations_admin_all" ON team_registrations;
CREATE POLICY "team_registrations_admin_all"
  ON team_registrations FOR ALL
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
