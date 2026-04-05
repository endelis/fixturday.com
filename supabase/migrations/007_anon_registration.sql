-- Allow anonymous users to self-register teams and players.
-- Without these policies, the anon key gets RLS violations on INSERT.
-- Status is constrained to 'pending' to prevent abuse.

CREATE POLICY "anon_register_team"
  ON teams FOR INSERT
  TO anon
  WITH CHECK (status = 'pending');

CREATE POLICY "anon_register_players"
  ON team_players FOR INSERT
  TO anon
  WITH CHECK (true);
