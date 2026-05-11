-- ── 026_contact_messages_rls.sql ─────────────────────────────────
-- Tighten SELECT on contact_messages.
-- The table has no tournament_id FK so there is no per-organizer
-- ownership to check. Only super-admins should read submissions.

DROP POLICY IF EXISTS "Owner read contact messages" ON contact_messages;

CREATE POLICY "Super admin read contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (is_super_admin());
