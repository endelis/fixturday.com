-- ── 012_super_admin_jwt.sql ──────────────────────────────────────
-- Replace profiles-table-based is_super_admin() with a JWT app_metadata read.
-- This eliminates the DB query on every auth event and removes the fragile
-- profiles upsert dependency.
--
-- Pre-req: set app_metadata = {"is_super_admin": true} for super admin users
-- in Supabase Dashboard → Authentication → Users → Edit.
--
-- All RLS policies from 010 continue to work unchanged — they call
-- is_super_admin() which now reads from the JWT instead of the profiles table.

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean,
    false
  );
$$;
