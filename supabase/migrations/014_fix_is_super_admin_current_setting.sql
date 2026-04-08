-- ── 014_fix_is_super_admin_current_setting.sql ───────────────────
-- auth.jwt() is unreliable inside SQL functions called from RLS policies.
-- Use current_setting('request.jwt.claims') instead — PostgREST sets this
-- GUC on every request before executing any query, so it's always correct.

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  claims jsonb;
BEGIN
  claims := current_setting('request.jwt.claims', true)::jsonb;
  RETURN coalesce((claims -> 'app_metadata' ->> 'is_super_admin')::boolean, false);
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;
