-- ── 008_multiuser.sql ───────────────────────────────────────────
-- Multi-user ownership model + contact_messages table

-- ── tournaments: add owner_id ────────────────────────────────────
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);

UPDATE tournaments
  SET owner_id = (SELECT id FROM auth.users LIMIT 1)
  WHERE owner_id IS NULL;

ALTER TABLE tournaments
  ALTER COLUMN owner_id SET NOT NULL;

-- ── Drop old broad admin policies ────────────────────────────────
DROP POLICY IF EXISTS "Admin full access - tournaments"    ON tournaments;
DROP POLICY IF EXISTS "tournaments_admin_all"              ON tournaments;
DROP POLICY IF EXISTS "Admin full access - age_groups"    ON age_groups;
DROP POLICY IF EXISTS "age_groups_admin_all"               ON age_groups;
DROP POLICY IF EXISTS "Admin full access - venues"        ON venues;
DROP POLICY IF EXISTS "venues_admin_all"                   ON venues;
DROP POLICY IF EXISTS "Admin full access - stages"        ON stages;
DROP POLICY IF EXISTS "stages_admin_all"                   ON stages;
DROP POLICY IF EXISTS "Admin full access - fixtures"      ON fixtures;
DROP POLICY IF EXISTS "fixtures_admin_all"                 ON fixtures;
DROP POLICY IF EXISTS "Admin full access - fixture_results" ON fixture_results;
DROP POLICY IF EXISTS "fixture_results_admin_all"          ON fixture_results;
DROP POLICY IF EXISTS "Admin full access - teams"         ON teams;
DROP POLICY IF EXISTS "teams_admin_all"                    ON teams;
DROP POLICY IF EXISTS "Admin full access - pitches"       ON pitches;
DROP POLICY IF EXISTS "pitches_admin_all"                  ON pitches;

-- ── tournaments: owner + public read ─────────────────────────────
CREATE POLICY "Owner full access - tournaments"
  ON tournaments FOR ALL
  TO authenticated
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Public read active tournaments" ON tournaments;
CREATE POLICY "Public read active tournaments"
  ON tournaments FOR SELECT
  TO anon
  USING (is_active = true);

-- ── age_groups ───────────────────────────────────────────────────
CREATE POLICY "Owner access via tournament - age_groups"
  ON age_groups FOR ALL
  TO authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE owner_id = auth.uid()
    )
  );

-- ── venues ───────────────────────────────────────────────────────
CREATE POLICY "Owner access via tournament - venues"
  ON venues FOR ALL
  TO authenticated
  USING (
    tournament_id IN (
      SELECT id FROM tournaments WHERE owner_id = auth.uid()
    )
  );

-- ── stages ───────────────────────────────────────────────────────
CREATE POLICY "Owner access via tournament - stages"
  ON stages FOR ALL
  TO authenticated
  USING (
    age_group_id IN (
      SELECT ag.id FROM age_groups ag
      JOIN tournaments t ON t.id = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    )
  );

-- ── fixtures ─────────────────────────────────────────────────────
CREATE POLICY "Owner access via tournament - fixtures"
  ON fixtures FOR ALL
  TO authenticated
  USING (
    stage_id IN (
      SELECT s.id FROM stages s
      JOIN age_groups ag ON ag.id = s.age_group_id
      JOIN tournaments t  ON t.id  = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    )
  );

-- ── fixture_results ──────────────────────────────────────────────
CREATE POLICY "Owner access via tournament - fixture_results"
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
  );

-- ── teams ────────────────────────────────────────────────────────
CREATE POLICY "Owner access via tournament - teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    age_group_id IN (
      SELECT ag.id FROM age_groups ag
      JOIN tournaments t ON t.id = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    )
  );

-- ── pitches ──────────────────────────────────────────────────────
CREATE POLICY "Owner access via tournament - pitches"
  ON pitches FOR ALL
  TO authenticated
  USING (
    venue_id IN (
      SELECT v.id FROM venues v
      JOIN tournaments t ON t.id = v.tournament_id
      WHERE t.owner_id = auth.uid()
    )
  );

-- ── contact_messages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  message    text        NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can submit contact"
  ON contact_messages FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Owner read contact messages"
  ON contact_messages FOR SELECT
  TO authenticated
  USING (true);
