-- ── 015_is_super_admin_volatile.sql ──────────────────────────────
-- Change is_super_admin() to VOLATILE to prevent query planner from caching
-- its result when evaluated inside RLS policies.

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql VOLATILE
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
