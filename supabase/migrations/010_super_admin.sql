-- ── 010_super_admin.sql ──────────────────────────────────────────
-- Profiles table + is_super_admin flag + super admin RLS bypass

-- ── profiles table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_super_admin boolean NOT NULL DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Own profile - select"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Only super admins can update profiles (prevents self-promotion)
CREATE POLICY "Super admin - profiles all"
  ON profiles FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Helper function ───────────────────────────────────────────────
-- SECURITY DEFINER so it can bypass RLS on profiles table
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_super_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── tournaments ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner full access - tournaments" ON tournaments;
CREATE POLICY "Owner or super admin - tournaments"
  ON tournaments FOR ALL
  TO authenticated
  USING  (owner_id = auth.uid() OR is_super_admin())
  WITH CHECK (owner_id = auth.uid() OR is_super_admin());

-- ── age_groups ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner access via tournament - age_groups" ON age_groups;
CREATE POLICY "Owner or super admin - age_groups"
  ON age_groups FOR ALL
  TO authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE owner_id = auth.uid()
    )
    OR is_super_admin()
  );

-- ── venues ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner access via tournament - venues" ON venues;
CREATE POLICY "Owner or super admin - venues"
  ON venues FOR ALL
  TO authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE owner_id = auth.uid()
    )
    OR is_super_admin()
  );

-- ── pitches ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner access via tournament - pitches" ON pitches;
CREATE POLICY "Owner or super admin - pitches"
  ON pitches FOR ALL
  TO authenticated
  USING (
    venue_id IN (
      SELECT v.id FROM venues v
      JOIN tournaments t ON t.id = v.tournament_id
      WHERE t.owner_id = auth.uid()
    )
    OR is_super_admin()
  );

-- ── stages ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner access via tournament - stages" ON stages;
CREATE POLICY "Owner or super admin - stages"
  ON stages FOR ALL
  TO authenticated
  USING (
    age_group_id IN (
      SELECT ag.id FROM age_groups ag
      JOIN tournaments t ON t.id = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    )
    OR is_super_admin()
  );

-- ── fixtures ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner access via tournament - fixtures" ON fixtures;
CREATE POLICY "Owner or super admin - fixtures"
  ON fixtures FOR ALL
  TO authenticated
  USING (
    stage_id IN (
      SELECT s.id FROM stages s
      JOIN age_groups ag ON ag.id = s.age_group_id
      JOIN tournaments t  ON t.id  = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    )
    OR is_super_admin()
  );

-- ── fixture_results ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner access via tournament - fixture_results" ON fixture_results;
CREATE POLICY "Owner or super admin - fixture_results"
  ON fixture_results FOR ALL
  TO authenticated
  USING (
    fixture_id IN (
      SELECT f.id FROM fixtures f
      JOIN stages s     ON s.id  = f.stage_id
      JOIN age_groups ag ON ag.id = s.age_group_id
      JOIN tournaments t  ON t.id  = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    )
    OR is_super_admin()
  );

-- ── teams ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Owner access via tournament - teams" ON teams;
CREATE POLICY "Owner or super admin - teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    age_group_id IN (
      SELECT ag.id FROM age_groups ag
      JOIN tournaments t ON t.id = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    )
    OR is_super_admin()
  );

-- ── team_players ─────────────────────────────────────────────────
-- Drop any existing authenticated write policy then recreate with super admin bypass
DROP POLICY IF EXISTS "team_players_admin_all" ON team_players;
DROP POLICY IF EXISTS "Owner or super admin - team_players" ON team_players;
CREATE POLICY "Owner or super admin - team_players"
  ON team_players FOR ALL
  TO authenticated
  USING (
    team_id IN (
      SELECT tm.id FROM teams tm
      JOIN age_groups ag ON ag.id = tm.age_group_id
      JOIN tournaments t  ON t.id  = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    )
    OR is_super_admin()
  );
