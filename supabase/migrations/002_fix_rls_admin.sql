-- Fix admin RLS policies: allow authenticated users (the single admin) to do all operations.
-- The original policies only allowed service_role, which never matches a logged-in Supabase Auth user.

BEGIN;

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'tournaments','venues','pitches','age_groups',
    'teams','team_players','stages','fixtures','fixture_results'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_admin_all" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_admin_all" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END;
$$;

COMMIT;
