-- ── 030_security_hardening.sql ───────────────────────────────────────────────
-- Three independent hardening steps, all idempotent:
--   1. Rate-limit contact_messages inserts (anon)
--   2. Rate-limit team_registrations inserts (anon) — preserves honeypot check
--   3. Enforce football-only sport at DB level
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── 1. Rate-limit contact_messages ───────────────────────────────────────────
-- Anon may submit at most 5 messages from the same email within 24 hours.
-- In RLS WITH CHECK, bare column names refer to the incoming row's values.

DROP POLICY IF EXISTS "anon insert contact messages"             ON contact_messages;
DROP POLICY IF EXISTS "anon insert contact_messages"             ON contact_messages;
DROP POLICY IF EXISTS "anon insert contact_messages rate_limited" ON contact_messages;

CREATE POLICY "anon insert contact_messages rate_limited"
  ON contact_messages FOR INSERT
  TO anon
  WITH CHECK (
    (
      SELECT COUNT(*)
        FROM contact_messages existing
       WHERE existing.email        = email          -- 'email' = new row value
         AND existing.created_at  > NOW() - INTERVAL '24 hours'
    ) < 5
  );

-- ── 2. Rate-limit team_registrations ─────────────────────────────────────────
-- Rebuild the anon insert policy to add a rate-limit layer on top of the
-- existing honeypot check. Max 3 registrations per manager_email per tournament
-- per 24 hours prevents flooding a tournament with fake applications.

DROP POLICY IF EXISTS "team_registrations_anon_insert" ON team_registrations;

CREATE POLICY "team_registrations_anon_insert"
  ON team_registrations FOR INSERT
  TO anon
  WITH CHECK (
    (honeypot IS NULL OR honeypot = '')
    AND
    (
      SELECT COUNT(*)
        FROM team_registrations existing
       WHERE existing.manager_email = manager_email    -- new row value
         AND existing.tournament_id = tournament_id    -- new row value
         AND existing.created_at   > NOW() - INTERVAL '24 hours'
    ) < 3
  );

-- ── 3. Enforce football-only sport ───────────────────────────────────────────
-- DB-level constraint so no code path can persist a non-football tournament.
-- The admin form already hardcodes sport = 'football'; this is belt-and-suspenders.

ALTER TABLE tournaments
  DROP CONSTRAINT IF EXISTS tournaments_sport_football_only;

ALTER TABLE tournaments
  ADD CONSTRAINT tournaments_sport_football_only
  CHECK (sport = 'football');

COMMIT;
