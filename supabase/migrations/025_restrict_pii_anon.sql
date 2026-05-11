-- ── 025_restrict_pii_anon.sql ────────────────────────────────────────────────
-- Restrict what the anon role can read on teams and team_players.
--
-- Problem: the broad table-level SELECT grant (applied by Supabase for all
-- tables in the public schema) gives anon access to every column, including
-- PII fields added after the initial schema: contact_name, contact_email,
-- contact_phone on teams; date_of_birth on team_players.
--
-- Fix: revoke the table-level SELECT from anon on both tables, then re-grant
-- only the columns safe for public consumption. The existing RLS policies
-- (USING (true)) continue to control row-level access; column privileges
-- operate as an independent layer on top of that.
--
-- Public pages that use select('*') or select specific safe columns are
-- unaffected — they will simply not receive the revoked columns.
-- Admin (authenticated) access is unaffected; only the anon role is changed.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── teams ─────────────────────────────────────────────────────────────────────
-- PII columns excluded: contact_name, contact_email, contact_phone
-- (added in migration 001 / 020).  club is retained as it is non-PII public
-- information (club affiliation displayed on public pages).

REVOKE SELECT ON public.teams FROM anon;

GRANT SELECT (
  id,
  name,
  club,
  age_group_id,
  logo_path,
  country_code,
  status,
  created_at
) ON public.teams TO anon;

-- ── team_players ──────────────────────────────────────────────────────────────
-- PII column excluded: date_of_birth (GDPR-relevant for minors).
-- Anon receives only identity/display fields.

REVOKE SELECT ON public.team_players FROM anon;

GRANT SELECT (
  id,
  team_id,
  name,
  number
) ON public.team_players TO anon;

COMMIT;
