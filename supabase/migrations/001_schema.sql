-- =============================================================================
-- Migration: 001_schema.sql
-- Project:   Fixturday
-- Created:   2026-04-01
-- Description: Initial schema — tournaments, venues, pitches, age groups,
--              teams, players, stages, fixtures, and results.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function
-- Applied to any table that tracks its own update timestamp.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ===========================================================================
-- TABLE: tournaments
-- Top-level container for every competition.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS tournaments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  sport       text        NOT NULL DEFAULT 'football',
  slug        text        UNIQUE NOT NULL,   -- url-friendly, e.g. "summer-cup-2025"
  description text,
  logo_url    text,
  start_date  date,
  end_date    date,
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tournaments_public_select"
  ON tournaments FOR SELECT
  USING (true);

CREATE POLICY "tournaments_admin_all"
  ON tournaments FOR ALL
  USING (auth.role() = 'service_role');

-- Explicit index on slug for fast slug-based lookups (UNIQUE already creates
-- one, but this makes the intent clear and avoids planner ambiguity).
CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments (slug);


-- ===========================================================================
-- TABLE: venues
-- Physical locations that host matches within a tournament.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS venues (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid        NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
  name          text        NOT NULL,
  address       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "venues_public_select"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "venues_admin_all"
  ON venues FOR ALL
  USING (auth.role() = 'service_role');


-- ===========================================================================
-- TABLE: pitches
-- Individual playing surfaces within a venue.
-- e.g. "Laukums A", "Pitch 1"
-- ===========================================================================
CREATE TABLE IF NOT EXISTS pitches (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id   uuid        NOT NULL REFERENCES venues (id) ON DELETE CASCADE,
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pitches_public_select"
  ON pitches FOR SELECT
  USING (true);

CREATE POLICY "pitches_admin_all"
  ON pitches FOR ALL
  USING (auth.role() = 'service_role');


-- ===========================================================================
-- TABLE: age_groups
-- Divisions within a tournament (e.g. "U10", "U12", "Seniori").
-- Each age group defines its own competition format.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS age_groups (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id     uuid        NOT NULL REFERENCES tournaments (id) ON DELETE CASCADE,
  name              text        NOT NULL,
  format            text        NOT NULL
                      CHECK (format IN ('round_robin', 'knockout', 'group_knockout')),
  max_teams         integer,
  registration_open boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "age_groups_public_select"
  ON age_groups FOR SELECT
  USING (true);

CREATE POLICY "age_groups_admin_all"
  ON age_groups FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_age_groups_tournament_id ON age_groups (tournament_id);


-- ===========================================================================
-- TABLE: teams
-- Participating teams, each belonging to a single age group.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS teams (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_id  uuid        NOT NULL REFERENCES age_groups (id) ON DELETE CASCADE,
  name          text        NOT NULL,
  club          text,
  contact_name  text,
  contact_email text,
  contact_phone text,
  status        text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_public_select"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "teams_admin_all"
  ON teams FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_teams_age_group_id ON teams (age_group_id);


-- ===========================================================================
-- TABLE: team_players
-- Individual players registered to a team.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS team_players (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid        NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
  name          text        NOT NULL,
  number        integer,
  date_of_birth date,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_players_public_select"
  ON team_players FOR SELECT
  USING (true);

CREATE POLICY "team_players_admin_all"
  ON team_players FOR ALL
  USING (auth.role() = 'service_role');


-- ===========================================================================
-- TABLE: stages
-- Phases within an age group (e.g. "Grupu posms", "Izslēgšanas kārta").
-- sequence controls ordering within the age group.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS stages (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_id uuid        NOT NULL REFERENCES age_groups (id) ON DELETE CASCADE,
  name         text        NOT NULL,
  type         text        NOT NULL
                 CHECK (type IN ('round_robin', 'knockout', 'group_stage')),
  sequence     integer     NOT NULL DEFAULT 1,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stages_public_select"
  ON stages FOR SELECT
  USING (true);

CREATE POLICY "stages_admin_all"
  ON stages FOR ALL
  USING (auth.role() = 'service_role');


-- ===========================================================================
-- TABLE: fixtures
-- Individual matches scheduled within a stage.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS fixtures (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id     uuid        NOT NULL REFERENCES stages (id) ON DELETE CASCADE,
  home_team_id uuid        REFERENCES teams (id),
  away_team_id uuid        REFERENCES teams (id),
  round        integer,                             -- round number within stage
  kickoff_time timestamptz,
  pitch_id     uuid        REFERENCES pitches (id),
  status       text        NOT NULL DEFAULT 'scheduled'
                 CHECK (status IN ('scheduled', 'live', 'completed', 'postponed')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fixtures_public_select"
  ON fixtures FOR SELECT
  USING (true);

CREATE POLICY "fixtures_admin_all"
  ON fixtures FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_fixtures_stage_id ON fixtures (stage_id);
CREATE INDEX IF NOT EXISTS idx_fixtures_status   ON fixtures (status);


-- ===========================================================================
-- TABLE: fixture_results
-- Stores the final (or live) score for a fixture — one row per fixture.
-- updated_at is maintained automatically via trigger.
-- ===========================================================================
CREATE TABLE IF NOT EXISTS fixture_results (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id uuid        UNIQUE NOT NULL REFERENCES fixtures (id) ON DELETE CASCADE,
  home_goals integer     NOT NULL DEFAULT 0,
  away_goals integer     NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fixture_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fixture_results_public_select"
  ON fixture_results FOR SELECT
  USING (true);

CREATE POLICY "fixture_results_admin_all"
  ON fixture_results FOR ALL
  USING (auth.role() = 'service_role');

-- Automatically refresh updated_at whenever a result row is modified.
CREATE TRIGGER trg_fixture_results_updated_at
  BEFORE UPDATE ON fixture_results
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();


COMMIT;
