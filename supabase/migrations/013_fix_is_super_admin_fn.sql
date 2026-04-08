-- ── 013_fix_is_super_admin_fn.sql ────────────────────────────────
-- Remove SECURITY DEFINER from is_super_admin().
-- It was needed when the function queried the profiles table (which has RLS).
-- Now that it only reads auth.jwt(), SECURITY DEFINER is unnecessary and
-- causes auth.jwt() to run in the wrong context, silently breaking RLS checks.

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean,
    false
  );
$$;
