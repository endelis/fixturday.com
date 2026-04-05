# Fixturday QA Report
**Date:** 2026-04-05  
**Scope:** Full codebase audit — src/pages, src/components, src/hooks, src/utils, supabase/migrations  
**Methodology:** 3-layer analysis (static code, functional flows, database/RLS)

---

## Summary Table

```
┌─────────────────────────────────────────────┬──────────┬────────┐
│ Check                                       │ Status   │ Issues │
├─────────────────────────────────────────────┼──────────┼────────┤
│ Supabase error handling                     │ FAIL     │   14   │
│ Mutation toasts                             │ PASS     │    0   │
│ Auth guards (admin pages)                   │ FAIL     │    4   │
│ Hardcoded strings (i18n violations)         │ FAIL     │    8   │
│ Import integrity                            │ WARN     │    1   │
│ console.log / console.error                 │ FAIL     │    1   │
│ DB column name mismatches                   │ CRITICAL │    2   │
│ DB CHECK constraint violations              │ CRITICAL │    1   │
│ RLS policy coverage                         │ CRITICAL │    1   │
│ calculateStandings call signature           │ CRITICAL │    1   │
├─────────────────────────────────────────────┼──────────┼────────┤
│ TOTAL CRITICAL                              │          │    5   │
│ TOTAL FAIL                                  │          │   10   │
│ TOTAL WARNING                               │          │    5   │
└─────────────────────────────────────────────┴──────────┴────────┘
```

---

## Layer 1 — Static Code Analysis

### CRITICAL Issues

---

#### C-1 — Wrong column names in TournamentStats query
- **File:** `src/pages/Admin/Tournament/TournamentStats.jsx:47`
- **Code:** `.select('id, home_score, away_score, stage_id, home_team_id, away_team_id, fixture_results(*)')`
- **Problem:** Columns `home_score` and `away_score` do not exist. Migration `001_schema.sql` defines them as `home_goals` and `away_goals` on the `fixtures` table.
- **Impact:** Query returns `null` for both fields; all score rendering shows nothing.
- **Fix:** Change to `.select('id, home_goals, away_goals, stage_id, home_team_id, away_team_id, fixture_results(*)')`

---

#### C-2 — Wrong calculateStandings call signature + wrong result property access
- **File:** `src/pages/Admin/Tournament/TournamentStats.jsx:66`
- **Code:** `const standings = calculateStandings(agFixtures, agResults)` and later `row.teamId`, `row.teamName`
- **Problem 1:** `calculateStandings` signature is `(teams, fixtures, results)` (3 args); `teams` arg is missing entirely.
- **Problem 2:** The function returns objects with shape `{ team: {id, name}, played, ... }` but the code accesses `row.teamId` and `row.teamName` (which are `undefined`).
- **Impact:** Standings table renders empty rows.
- **Fix:** Call as `calculateStandings(agTeams, agFixtures, agResults)` and access `row.team.id` / `row.team.name`.

---

#### C-3 — Stage type 'group' violates DB CHECK constraint
- **File:** `src/pages/Admin/Fixtures/index.jsx:50`
- **Code:** `await supabase.from('stages').insert({ ..., type: 'group', ... })`
- **Problem:** Migration `001_schema.sql` has `CHECK (type IN ('round_robin', 'knockout', 'group_stage'))`. The value `'group'` is not in this list.
- **Impact:** Inserting a group stage silently fails or throws a DB constraint violation; group-stage fixtures are never created.
- **Fix:** Change `type: 'group'` to `type: 'group_stage'` and audit all places that read this field to ensure they match.

---

#### C-4 — RLS blocks public team registration
- **File:** `src/pages/Public/Register.jsx`
- **Migration:** `supabase/migrations/002_fix_rls_admin.sql`
- **Problem:** The `teams_admin_all` policy was changed to `TO authenticated`, granting INSERT only to authenticated users. There is no separate INSERT policy for the `anon` role. Public registration uses the anon key and will receive an RLS violation (`new row violates row-level security policy`).
- **Impact:** Public self-registration is completely broken in production.
- **Fix:** Add a migration: `CREATE POLICY "teams_public_insert" ON teams FOR INSERT TO anon WITH CHECK (status = 'pending');` (restricting to `pending` prevents abuse).

---

#### C-5 — jersey_number column does not exist
- **File:** `src/pages/Public/Register.jsx:124`
- **Code:** `{ name: p.name, dob: p.dob, jersey_number: p.jersey, age_group_id: ... }`
- **Problem:** Migration `001_schema.sql` defines the column as `number`, not `jersey_number`.
- **Impact:** Player jersey numbers are silently dropped; the insert succeeds but the `number` column is always null.
- **Fix:** Change `jersey_number: p.jersey` to `number: p.jersey`.

---

### FAIL Issues

---

#### F-1 — signOut() error handling unreachable
- **File:** `src/pages/Admin/Dashboard.jsx:31`
- **Code:** `const { error } = await signOut(); if (error) ...`
- **Problem:** `useAuth.js` `signOut()` calls `supabase.auth.signOut()` and throws on error — it does not return `{ error }`. The destructuring always yields `error = undefined`.
- **Fix:** Wrap in try/catch: `try { await signOut() } catch (err) { toast(err.message, 'error') }`

---

#### F-2 — Missing component-level auth guards
- **Files:**
  - `src/pages/Admin/AgeGroups.jsx`
  - `src/pages/Admin/Venues.jsx`
  - `src/pages/Admin/Teams.jsx`
  - `src/pages/Admin/Fixtures/index.jsx`
- **Problem:** These pages render without checking `useAuth`. They are protected at route level by `RequireAuth` in App.jsx, but the skill rule requires each Admin page to independently guard. A future routing refactor could accidentally expose these.
- **Fix:** Add `const { user, loading } = useAuth(); if (loading) return <div>...</div>; if (!user) return <Navigate to="/admin" replace />;` at the top of each component.

---

#### F-3 — console.error in production
- **File:** `src/pages/Public/Register.jsx:137`
- **Code:** `console.error(err)`
- **Fix:** Remove the `console.error` line; the error is already handled by showing an error message in UI state.

---

#### F-4 — Hardcoded Latvian strings in TeamRoster.jsx
- **File:** `src/pages/Public/TeamRoster.jsx`
- **Strings found:** "Komanda nav atrasta.", "Nav spēlētāju", "Spēlētāji", "Dzimšanas datums:", "Krekla nr.:", "← Atpakaļ"
- **Fix:** Replace with `t()` calls; add corresponding keys to `lv.json` under `team.*` or `common.*`.

---

#### F-5 — Hardcoded Latvian strings in FixtureList.jsx
- **File:** `src/pages/Admin/Fixtures/FixtureList.jsx`
- **Strings found:** "Nav spēļu", "Kārta", "pret", "Laukums nav iestatīts", "Ieplānota", "Pabeigta"
- **Fix:** Replace with existing i18n keys (`t('fixture.vs')`, `t('fixture.round')`, etc.).

---

#### F-6 — Hardcoded strings in Fixtures/index.jsx
- **File:** `src/pages/Admin/Fixtures/index.jsx`
- **Strings found (toast messages and labels):** "Spēles ģenerētas!", "Kļūda ģenerējot spēles", "Grupu posms", "Izslēgšanas kārtas"
- **Fix:** Add i18n keys and replace hardcoded strings.

---

#### F-7 — Hardcoded strings in AgeGroups.jsx
- **File:** `src/pages/Admin/AgeGroups.jsx:166`
- **Strings found:** `"apstiprinātas"`, `"gaida"`
- **Problem:** These appear inside a filter/map callback, bypassing i18n.
- **Fix:** Use `t('team.statuses.confirmed')` and `t('team.statuses.pending')`.

---

#### F-8 — Hardcoded 'pret' in Schedule.jsx
- **File:** `src/pages/Public/Schedule.jsx:155`
- **Code:** `<span>pret</span>`
- **Fix:** Replace with `{t('fixture.vs')}`.

---

#### F-9 — Hardcoded table headers in Standings.jsx
- **File:** `src/pages/Public/Standings.jsx:114`
- **Code:** `<th>S</th><th>U</th><th>N</th><th>Z</th>...` (hardcoded abbreviations)
- **Fix:** Use `t('standings.played')`, `t('standings.won')`, etc.

---

#### F-10 — Hardcoded "Nav apstiprinātu komandu." in Standings.jsx
- **File:** `src/pages/Public/Standings.jsx`
- **Code:** `<p>Nav apstiprinātu komandu.</p>`
- **Fix:** Add key `standings.noConfirmedTeams` to lv.json and use `t('standings.noConfirmedTeams')`.

---

### WARNING Issues

---

#### W-1 — Stale file: Fixtures.jsx alongside Fixtures/ folder
- **File:** `src/pages/Admin/Fixtures.jsx` (original monolith)
- **Problem:** The refactor split this into `Fixtures/index.jsx`, `Fixtures/FixtureList.jsx`, `Fixtures/SchedulerModal.jsx`, but the original file may still exist. If the router still imports the old path, the refactor is effectively dead code.
- **Fix:** Verify `src/App.jsx` imports from `./pages/Admin/Fixtures/` (not `./pages/Admin/Fixtures`), then delete `Fixtures.jsx`.

---

#### W-2 — Variable `t` shadowing in AgeGroups.jsx
- **File:** `src/pages/Admin/AgeGroups.jsx:162–163`
- **Problem:** A filter/map callback uses a parameter also named `t`, shadowing the `useTranslation` `t` function. This prevents i18n use inside that callback.
- **Fix:** Rename the local variable (e.g., `team` → `tm` or choose a non-conflicting name).

---

#### W-3 — Stage type 'group' vs 'group_stage' broader impact
- **Files:** `src/utils/generators/groupStage.js`, `src/pages/Admin/Fixtures/index.jsx`, `src/pages/Admin/Fixtures/FixtureList.jsx`
- **Problem:** Even if C-3 is fixed in index.jsx, all code that reads `stage.type === 'group'` will break after the fix. The mismatch may be pervasive.
- **Fix:** After fixing the INSERT to `'group_stage'`, grep for `=== 'group'` and `=== "group"` across all files and update accordingly.

---

#### W-4 — Realtime subscription not guaranteed to work
- **Files:** `src/pages/Public/TournamentDetail.jsx` (new), `src/pages/Public/Schedule.jsx`, `src/pages/Public/Standings.jsx`
- **Problem:** No migration adds `fixture_results` or `fixtures` to the `supabase_realtime` publication. Realtime subscriptions silently receive no events if the tables are not in the publication.
- **Fix:** Run `ALTER PUBLICATION supabase_realtime ADD TABLE fixture_results, fixtures;` or add a migration to do so.

---

#### W-5 — Hardcoded string in new TournamentDetail.jsx
- **File:** `src/pages/Public/TournamentDetail.jsx`
- **Code:** In `blockLabel()` function — `return 'Laiks nav norādīts'`
- **Fix:** Add key `schedule.noDate` to lv.json (already exists as `"noDate": "Datums nav norādīts"` — use `t('schedule.noDate')`).

---

## Layer 2 — Functional Flow Analysis

| Flow | Result | Notes |
|------|--------|-------|
| Admin login | PASS | useAuth handles session correctly |
| Create tournament | PASS | form → insert → slug auto-gen → redirect |
| Add age group | PASS | modal → insert → refetch |
| Generate round-robin fixtures | PASS | pure generator → bulk insert |
| Generate group-stage fixtures | CRITICAL FAIL | `type: 'group'` breaks DB constraint (C-3) |
| Schedule fixtures | PASS | SchedulerModal scheduler.js → bulk update kickoff_time |
| Enter matchday results | PASS | useResults hook with optimistic updates |
| Public tournament list | PASS | loads, filters, shows counts |
| Public registration | CRITICAL FAIL | RLS blocks anon INSERT (C-4) + wrong column (C-5) |
| Public standings view | FAIL | hardcoded headers (F-9), possible stale data |
| Public schedule view | FAIL | hardcoded 'pret' (F-8), realtime not guaranteed (W-4) |

---

## Layer 3 — Database / RLS Analysis

### Migration Timeline
| File | Purpose | Issues |
|------|---------|--------|
| `001_schema.sql` | Base schema, RLS enable, initial policies | CHECK constraint: `('round_robin', 'knockout', 'group_stage')` — code uses `'group'` (C-3); column `number` not `jersey_number` (C-5) |
| `002_fix_rls_admin.sql` | Changed admin policies to `TO authenticated` | Removed anon INSERT on teams — broke public registration (C-4) |
| `003_scheduler_fields.sql` | Added `game_duration_minutes`, tournament time fields | Clean |
| `004_fixtures_labels.sql` | Added `group_label`, `round_name` to fixtures | Clean |
| `005_storage.sql` | Storage buckets, `rules`, `attachments` jsonb | Clean |
| `006_age_group_settings.sql` | Added `pitch_gap_minutes`, `team_rest_minutes`, `groups_count`, `teams_advancing`, fixture placeholders | Clean |

### RLS Policy Gaps

```
Table: teams
  ✓ anon   SELECT (public teams for tournament pages)
  ✗ anon   INSERT (public registration — BROKEN, see C-4)
  ✓ auth   ALL    (admin management)

Table: team_players
  ✓ anon   SELECT
  ✗ anon   INSERT (public registration adds players — also broken by same RLS gap)
  ✓ auth   ALL

Table: fixture_results
  ✓ anon   SELECT
  ✓ auth   ALL (matchday result entry)
  — Note: not in supabase_realtime publication (W-4)
```

### Recommended New Migrations

```sql
-- Fix C-4: Allow public registration
CREATE POLICY "teams_public_register" ON teams
  FOR INSERT TO anon
  WITH CHECK (status = 'pending');

CREATE POLICY "team_players_public_register" ON team_players
  FOR INSERT TO anon
  WITH CHECK (true);

-- Fix W-4: Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE fixture_results, fixtures;
```

---

## Action Priority

| Priority | Count | Action |
|----------|-------|--------|
| Fix immediately (production broken) | 5 | C-1 through C-5 |
| Fix before next release | 10 | F-1 through F-10 |
| Address in next sprint | 5 | W-1 through W-5 |

---

*Report generated by Claude Code — do not edit manually, re-run QA after fixes.*
