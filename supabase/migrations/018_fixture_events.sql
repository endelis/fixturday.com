-- ── 018_fixture_events.sql ───────────────────────────────────────
-- Adds position to team_players and creates fixture_events table
-- for tracking goals, cards and other match events.

ALTER TABLE team_players
  ADD COLUMN IF NOT EXISTS position text;

CREATE TABLE IF NOT EXISTS fixture_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id  uuid        NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  team_id     uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id   uuid        REFERENCES team_players(id) ON DELETE SET NULL,
  event_type  text        NOT NULL CHECK (event_type IN ('goal', 'own_goal', 'yellow_card', 'red_card')),
  minute      integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fixture_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fixture_events_public_select"
  ON fixture_events FOR SELECT
  USING (true);

CREATE POLICY "fixture_events_admin_all"
  ON fixture_events FOR ALL
  TO authenticated
  USING (
    fixture_id IN (
      SELECT f.id FROM fixtures f
      JOIN stages s     ON s.id  = f.stage_id
      JOIN age_groups ag ON ag.id = s.age_group_id
      JOIN tournaments t  ON t.id  = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    ) OR is_super_admin()
  )
  WITH CHECK (
    fixture_id IN (
      SELECT f.id FROM fixtures f
      JOIN stages s     ON s.id  = f.stage_id
      JOIN age_groups ag ON ag.id = s.age_group_id
      JOIN tournaments t  ON t.id  = ag.tournament_id
      WHERE t.owner_id = auth.uid()
    ) OR is_super_admin()
  );
