-- ── 016_fix_cascade_fixtures_teams.sql ───────────────────────────
-- fixtures.home_team_id and away_team_id reference teams, but without
-- CASCADE, deleting a tournament's teams fails with FK violation.
-- Set to SET NULL so fixtures remain (as placeholders) when teams are deleted.
-- Also ensure full cascade chain from tournaments down to fixture_results.

-- fixtures → teams (SET NULL so fixture survives without a team)
ALTER TABLE fixtures
  DROP CONSTRAINT IF EXISTS fixtures_home_team_id_fkey;
ALTER TABLE fixtures
  ADD CONSTRAINT fixtures_home_team_id_fkey
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE fixtures
  DROP CONSTRAINT IF EXISTS fixtures_away_team_id_fkey;
ALTER TABLE fixtures
  ADD CONSTRAINT fixtures_away_team_id_fkey
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- stages → age_groups CASCADE
ALTER TABLE stages
  DROP CONSTRAINT IF EXISTS stages_age_group_id_fkey;
ALTER TABLE stages
  ADD CONSTRAINT stages_age_group_id_fkey
    FOREIGN KEY (age_group_id) REFERENCES age_groups(id) ON DELETE CASCADE;

-- fixtures → stages CASCADE
ALTER TABLE fixtures
  DROP CONSTRAINT IF EXISTS fixtures_stage_id_fkey;
ALTER TABLE fixtures
  ADD CONSTRAINT fixtures_stage_id_fkey
    FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE;

-- fixture_results → fixtures CASCADE
ALTER TABLE fixture_results
  DROP CONSTRAINT IF EXISTS fixture_results_fixture_id_fkey;
ALTER TABLE fixture_results
  ADD CONSTRAINT fixture_results_fixture_id_fkey
    FOREIGN KEY (fixture_id) REFERENCES fixtures(id) ON DELETE CASCADE;

-- pitches → venues CASCADE
ALTER TABLE pitches
  DROP CONSTRAINT IF EXISTS pitches_venue_id_fkey;
ALTER TABLE pitches
  ADD CONSTRAINT pitches_venue_id_fkey
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE;

-- fixtures → pitches SET NULL (pitch can be removed without losing fixture)
ALTER TABLE fixtures
  DROP CONSTRAINT IF EXISTS fixtures_pitch_id_fkey;
ALTER TABLE fixtures
  ADD CONSTRAINT fixtures_pitch_id_fkey
    FOREIGN KEY (pitch_id) REFERENCES pitches(id) ON DELETE SET NULL;
