-- ── 041_tournament_members.sql ───────────────────────────────────
-- Tournament collaborators: invite other registered users to co-edit.
-- Invited users get full access identical to the owner.
-- Pending invites (user_id IS NULL) are auto-claimed by a trigger when the
-- invitee registers, so the tournament appears in their dashboard immediately.

-- ── Table ────────────────────────────────────────────────────────
create table tournament_members (
  id            uuid        primary key default gen_random_uuid(),
  tournament_id uuid        not null references tournaments(id) on delete cascade,
  invited_email text        not null,
  user_id       uuid        references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  unique(tournament_id, invited_email)
);

alter table tournament_members enable row level security;

-- Owner can manage members of their own tournaments
create policy "Owner manages members"
  on tournament_members for all to authenticated
  using  (tournament_id in (select id from tournaments where owner_id = auth.uid()))
  with check (tournament_id in (select id from tournaments where owner_id = auth.uid()));

-- Members can see their own membership rows (needed for dashboard query)
create policy "Member views own membership"
  on tournament_members for select to authenticated
  using (user_id = auth.uid());

-- ── Helper function ───────────────────────────────────────────────
create or replace function is_tournament_member(tid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from tournament_members
    where tournament_id = tid and user_id = auth.uid()
  )
$$;

-- ── Update all 7 table policies to include members ───────────────

-- tournaments
drop policy if exists "Owner full access - tournaments" on tournaments;
create policy "Owner or member - tournaments"
  on tournaments for all to authenticated
  using  (owner_id = auth.uid() or is_tournament_member(id))
  with check (owner_id = auth.uid() or is_tournament_member(id));

-- age_groups
drop policy if exists "Owner access via tournament - age_groups" on age_groups;
create policy "Owner or member - age_groups"
  on age_groups for all to authenticated
  using (
    tournament_id in (select id from tournaments where owner_id = auth.uid())
    or is_tournament_member(tournament_id)
  );

-- venues
drop policy if exists "Owner access via tournament - venues" on venues;
create policy "Owner or member - venues"
  on venues for all to authenticated
  using (
    tournament_id in (select id from tournaments where owner_id = auth.uid())
    or is_tournament_member(tournament_id)
  );

-- stages
drop policy if exists "Owner access via tournament - stages" on stages;
create policy "Owner or member - stages"
  on stages for all to authenticated
  using (
    exists (
      select 1 from age_groups ag
      join tournaments t on t.id = ag.tournament_id
      where ag.id = stages.age_group_id
      and (t.owner_id = auth.uid() or is_tournament_member(t.id))
    )
  );

-- fixtures
drop policy if exists "Owner access via tournament - fixtures" on fixtures;
create policy "Owner or member - fixtures"
  on fixtures for all to authenticated
  using (
    exists (
      select 1 from stages s
      join age_groups ag on ag.id = s.age_group_id
      join tournaments t  on t.id  = ag.tournament_id
      where s.id = fixtures.stage_id
      and (t.owner_id = auth.uid() or is_tournament_member(t.id))
    )
  );

-- fixture_results
drop policy if exists "Owner access via tournament - fixture_results" on fixture_results;
create policy "Owner or member - fixture_results"
  on fixture_results for all to authenticated
  using (
    exists (
      select 1 from fixtures f
      join stages s     on s.id  = f.stage_id
      join age_groups ag on ag.id = s.age_group_id
      join tournaments t  on t.id  = ag.tournament_id
      where f.id = fixture_results.fixture_id
      and (t.owner_id = auth.uid() or is_tournament_member(t.id))
    )
  );

-- teams
drop policy if exists "Owner access via tournament - teams" on teams;
create policy "Owner or member - teams"
  on teams for all to authenticated
  using (
    exists (
      select 1 from age_groups ag
      join tournaments t on t.id = ag.tournament_id
      where ag.id = teams.age_group_id
      and (t.owner_id = auth.uid() or is_tournament_member(t.id))
    )
  );

-- pitches
drop policy if exists "Owner access via tournament - pitches" on pitches;
create policy "Owner or member - pitches"
  on pitches for all to authenticated
  using (
    exists (
      select 1 from venues v
      join tournaments t on t.id = v.tournament_id
      where v.id = pitches.venue_id
      and (t.owner_id = auth.uid() or is_tournament_member(t.id))
    )
  );

-- ── Auto-claim trigger ────────────────────────────────────────────
-- When a new user registers, claim any pending invites that match their email.
create or replace function public.claim_pending_invites()
returns trigger language plpgsql security definer as $$
begin
  update public.tournament_members
  set user_id = new.id
  where lower(invited_email) = lower(new.email) and user_id is null;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.claim_pending_invites();
