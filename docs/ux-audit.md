# Fixturday UX Audit
**Date:** 2026-04-01  
**Scope:** Full codebase audit — `src/pages/Admin/`, `src/pages/Public/`, `src/utils/`, `src/locales/lv.json`

---

## Part 1 — Admin Flow Audit

### Step 1: Login (`Login.jsx`)
| | Status |
|---|---|
| End-to-end | ✅ Works — Supabase auth, redirect to dashboard on success |
| Strings | ⚠️ Hardcoded ("Pieslēgties", "Parole") — not using `t()` |
| Auth state | ✅ Redirects to dashboard if already logged in |

**Gaps:**
- No "forgot password" link — admin locked out has no self-service path.
- No logo or branding on login screen — doesn't feel like a finished product.

---

### Step 2: Dashboard (`Dashboard.jsx`)
| | Status |
|---|---|
| Tournament list | ✅ Shows all tournaments, active/inactive badge |
| Navigation | ✅ Links to Edit, Age Groups, Venues, Print, Matchday |
| Public link | ⚠️ "Skatīt publiski" links to `/` (home) — not to the specific tournament |

**Gaps:**
- **No link to the specific tournament public page** from each tournament card. Admin has to navigate home and find it.
- **Supabase query does not destructure `error`** — silent failure if the query fails leaves admin staring at "Ielādē..." forever.
- **No pending team count indicator** — if teams have registered and are waiting for approval, admin sees nothing on Dashboard. Easy to miss.
- All strings hardcoded — violates Rule 1.

---

### Step 3: Create tournament (`Tournaments/New.jsx`)
| | Status |
|---|---|
| Form fields | ✅ Name, slug, dates, scheduling defaults |
| Submit | ✅ Inserts, redirects to Edit page |
| Redirect after save | ⚠️ Redirects to `/admin/tournaments/${id}` (Edit) — not to Age Groups |

**Gaps:**
- **Dead handoff after creation.** Admin is dropped at the Edit page with no obvious "next step." The natural next action is to add age groups, but there is no button for that on the Edit page — admin must go back to Dashboard and click "Vecuma grupas."
- `TournamentEdit.jsx` has no links to Age Groups or Venues — it is an isolated page.

---

### Step 4: Add age groups (`AgeGroups.jsx`)
| | Status |
|---|---|
| Form | ✅ Name, format, max_teams, game_duration_minutes, registration_open |
| Navigation | ✅ Back to tournament, link to Venues |
| Team/fixture access | ✅ Buttons per age group for Teams and Fixtures |

**Gaps:**
- **Confirmed team count not shown** on each age group row. Admin cannot tell at a glance if enough teams have confirmed before clicking into Fixtures. The "Ģenerēt spēles" button in Fixtures fails silently (toast only) if <2 confirmed teams.
- No visual indicator of whether fixtures have already been generated for an age group — admin might accidentally try to generate twice.

---

### Step 5: Add venues + pitches (`Venues.jsx`)
| | Status |
|---|---|
| Venue form | ✅ Name, address |
| Pitch form | ✅ Add/delete pitches per venue |
| Navigation | ⚠️ Back link goes to Dashboard, not to Age Groups |

**Gaps:**
- **Back link is wrong.** Venues nav says `← {tournament.name}` but links to `/admin/dashboard` — not to the tournament's age groups page. Admin loses context.
- No pitch count shown in Age Groups page — admin doesn't know if pitches exist before opening the scheduler.

---

### Step 6: Add and confirm teams (`Teams.jsx`)
| | Status |
|---|---|
| Add team manually | ✅ Form with all fields |
| Approve/reject pending | ✅ Buttons per team |
| Player management | ✅ Expandable player section |

**Gaps:**
- **No link from Teams page to Fixtures.** Admin must go back to Age Groups to access Fixtures. Dead end in the flow.
- **No bulk approval button.** If 12 teams register, admin must click "Apstiprināt" 12 times individually.
- `loadPlayers()` Supabase query does not destructure `error` — silent failure.
- Player `date_of_birth` column in the table shows raw ISO string (e.g. `2015-04-01`) — not formatted.

---

### Step 7: Generate fixtures (`Fixtures.jsx`)
| | Status |
|---|---|
| Round-robin generation | ✅ Works |
| Knockout generation | ✅ Works |
| Group + knockout | ✅ Creates two stage records |

**Gaps:**
- **Knockout round labels show numbers** (Kārta 1) instead of bracket labels (QF, SF, F). The `generateKnockout()` function returns round names ('QF', 'SF', 'F') but the fixture rows store `round: 1` (number) and the UI groups by number — labels are lost.
- **No warning when fixtures already exist.** The "Ģenerēt spēles" button is hidden when `fixtures.length > 0`, but the knockout stage (empty after group_knockout generation) could confuse admin — there's no explanation that the knockout stage is intentionally empty.
- `generateFixtures()` uses hardcoded toast strings — not `t()`.

---

### Step 8: Auto-schedule (`Fixtures.jsx` — scheduler modal)
| | Status |
|---|---|
| Modal opens | ✅ |
| Preview generates | ✅ (after slots→schedule fix) |
| Confirm saves | ✅ (after try/catch fix) |
| Lunch toggle | ✅ (after toggle fix) |

**Gaps:**
- **No warning if no pitches are configured.** If admin opens the scheduler with zero pitches, the preview runs and shows "Laukums 1", "Laukums 2" etc. (index fallbacks) — but Supabase update sets `pitch_id: null` because `pitches[0]` is undefined. No error is shown.
- **Scheduler modal is not mobile-friendly.** The 2-column grid collapses poorly on small screens. On gameday, admin may need to adjust schedule on a phone.
- **No way to reset / clear the schedule** after confirming — if admin wants to re-schedule, they must manually clear kickoff times one by one.

---

### Step 9: Matchday score entry (`Matchday.jsx`)
| | Status |
|---|---|
| Today's fixtures | ✅ Filtered by today's date |
| Score entry | ✅ Input per game, save/update |
| Live status | ✅ "Live" button toggles status |

**Gaps:**
- **If kickoff_time is not set, games don't appear.** Matchday filters by `kickoff_time` between today's midnight and 23:59. A fixture with null kickoff_time is invisible. No fallback or explanation shown.
- **"Atlikt" (Postpone) has no confirmation dialog.** Admin can accidentally postpone a live game with one tap.
- **Supabase query does not destructure `error`** — if the query fails, admin sees empty matchday with no error message.
- **No way to navigate to a specific date's games.** If games span multiple days, admin has no date selector.
- Hardcoded toast strings (not `t()`).

---

### Step 10: View results
| | Status |
|---|---|
| Public standings | ✅ Realtime updates |
| Print view | ✅ Auto-triggers print |

**Gaps:**
- **Print.jsx still uses `d. MMMM yyyy`** date format (not updated in the recent date format fix — it was not in the three files changed).
- **No admin-facing results summary.** Admin has to open the public site to see final standings — there's no results view in the admin area.

---

## Part 2 — Public User Flow Audit

### Step 1: Land on site (`TournamentList.jsx`)
| | Status |
|---|---|
| Tournament list | ✅ Active tournaments, dates shown |
| Navigation | ✅ PublicNav with home link |

**Gaps:**
- **No tournament status context.** Dates are shown, but there's no indicator of whether a tournament is "Upcoming", "Ongoing today", or "Completed." A user on gameday can't tell at a glance which tournament to tap.
- **If no active tournaments:** shows "Nav aktīvu turnīru." with no CTA — dead end for a visitor who came to register.

---

### Step 2–3: Tournament detail (`TournamentDetail.jsx`)
| | Status |
|---|---|
| Age group list | ✅ Shows all age groups with registration badge |
| Navigation | ✅ PublicNav with age group tabs |

**Gaps:**
- 🔴 **CRITICAL: No link to the registration form.** The page shows "Reģistrācija atvērta" badges but there is no button or link to `/t/{slug}/register`. A parent wanting to register their child's team has absolutely no path forward from this page. This is the most critical gap in the entire public UX.
- Registration badge is read-only text, not a clickable link.

---

### Step 4: View age group / standings (`Standings.jsx`)
| | Status |
|---|---|
| Standings table | ✅ Sorted correctly |
| Realtime updates | ✅ Supabase channel subscription |
| Link to schedule | ✅ "Spēļu grafiks →" |

**Gaps:**
- 🔴 **CRITICAL: Group stage standings are broken for `group_knockout` format.** `calculateStandings()` receives all teams from the age group and all fixtures (from all stages including knockout). For a group_knockout format with Group A and Group B, the function merges all teams into a single table — completely wrong. Groups A and B must be calculated and displayed separately.
- **No group label on standings.** Even for round-robin, the table has no heading or context for what tournament/age group it represents at a glance.
- The "Spēļu grafiks →" link is in the top-right corner — easy to miss on mobile, especially when the standings table is long.

---

### Step 5: View schedule (`Schedule.jsx`)
| | Status |
|---|---|
| Fixture list | ✅ Grouped by day |
| Realtime | ✅ |
| Time display | ✅ HH:mm 24h |

**Gaps:**
- **If kickoff_time is null:** all fixtures pile under "Datums nav norādīts" — unhelpful for a user checking the schedule on gameday.
- **No "live" games highlighted at the top.** A parent watching from the sideline has to scroll through the full list to find an ongoing game.
- No CTA to register if registration is still open.

---

### Step 6: View team roster (`TeamRoster.jsx`)
| | Status |
|---|---|
| Team info | ✅ Name, club |
| Player list | ✅ Number, name, DOB |
| Navigation | ⚠️ Back link to standings ✅, but PublicNav missing age group tabs |

**Gaps:**
- **`ageGroups` not passed to `PublicNav`.** The nav only shows the FIXTURDAY logo and tournament name — no age group tabs. User who navigated into a roster has to use the back link or browser back to continue exploring.
- **DOB column shows raw ISO string** (`2015-04-01`) — should be formatted as `dd/MM/yyyy`.
- Hardcoded strings ("Spēlētāji", "Vārds", "Dzimšanas datums") — not `t()`.

---

### Step 7: Register a team (`Register.jsx`)
| | Status |
|---|---|
| Form fields | ✅ All contact fields, optional players |
| registration_open check | ✅ Shows closed message if false |
| Submit | ✅ Inserts team as 'pending' |
| Success | ✅ Confirmation with back link |

**Gaps:**
- **No link to this page from anywhere in the public UI** (see Step 3 gap above).
- **max_teams not surfaced.** If an age group has a team limit, the registrant has no idea if spots remain.
- **No email confirmation** to the registrant after submission. They get a success screen but no email — if they close the tab, they have no record of registering.
- The closed message links back to `/t/{slug}` correctly ✅, but slug is taken from `useParams()` on the register route — the register route is `/t/:slug/register`, so this works.

---

### Step 8: Confirmation state
| | Status |
|---|---|
| Success message | ✅ |
| Back link | ✅ To tournament detail |

**Gaps:**
- Registrant has no way to check their application status after closing the page.
- No reference number or team ID shown on confirmation.

---

## Part 3 — Gap Summary (Ranked by Severity)

### 🔴 Critical — blocks the flow completely

| # | Gap | File | 
|---|-----|------|
| C1 | No link to registration form from TournamentDetail — public users cannot self-register | `TournamentDetail.jsx` |
| C2 | Group stage standings show all teams in one table — incorrect for `group_knockout` format | `Standings.jsx`, `calculateStandings()` |
| C3 | Matchday shows zero fixtures if `kickoff_time` is null — admin cannot enter scores | `Matchday.jsx` |
| C4 | Supabase error not handled in Dashboard load — infinite loading on DB failure | `Dashboard.jsx` |

### 🟠 Major — confusing or broken, has workaround

| # | Gap | File |
|---|-----|------|
| M1 | TournamentEdit has no links to Age Groups or Venues — handoff broken after tournament creation | `Tournaments/Edit.jsx` |
| M2 | Venues back link goes to Dashboard, not Age Groups — admin loses flow context | `Venues.jsx` |
| M3 | Knockout round labels show numbers instead of QF/SF/F in fixture list | `Fixtures.jsx` |
| M4 | Scheduler opens with no pitch warning — saves null pitch_ids silently | `Fixtures.jsx` |
| M5 | No confirmed team count on Age Groups page — admin can't tell if ready to generate | `AgeGroups.jsx` |
| M6 | No pending registration count on Dashboard — admin misses incoming registrations | `Dashboard.jsx` |
| M7 | "Atlikt" button on Matchday has no confirmation — accidental postpone risk | `Matchday.jsx` |
| M8 | TeamRoster PublicNav missing age group tabs — navigation dead end | `TeamRoster.jsx` |
| M9 | DOB shown as raw ISO string in Teams admin and TeamRoster public | `Teams.jsx`, `TeamRoster.jsx` |
| M10 | Matchday: no date selector — can only see today's games | `Matchday.jsx` |
| M11 | No link from Teams page to Fixtures — broken flow in admin setup | `Teams.jsx` |
| M12 | Print.jsx uses old `d. MMMM yyyy` date format — inconsistent with rest of app | `Print.jsx` |

### 🟡 Minor — polish issue

| # | Gap | File |
|---|-----|------|
| P1 | Login, Dashboard, Matchday, TeamRoster use hardcoded strings — not `t()` | Multiple |
| P2 | No tournament status pill (upcoming/ongoing/finished) on public list | `TournamentList.jsx` |
| P3 | "Spēļu grafiks →" link small and top-right — hard to find on mobile | `Standings.jsx` |
| P4 | No branding/logo on admin login page | `Login.jsx` |
| P5 | Schedule shows "Datums nav norādīts" block when no kickoff times set | `Schedule.jsx` |
| P6 | No "forgot password" link on Login | `Login.jsx` |
| P7 | No confirmation email to registrant after team registration | `Register.jsx` |
| P8 | max_teams not surfaced during registration — registrant can't see remaining spots | `Register.jsx` |
| P9 | Bulk team approval not available — must confirm one at a time | `Teams.jsx` |
| P10 | No admin-facing results/standings view — must use public site | Admin area |

**Totals: 4 critical · 12 major · 10 minor**

---

## Part 4 — Admin Recommendations

### A1. Tournament setup wizard / progress checklist
**What:** After creating a tournament, show a step-by-step checklist card on the tournament page: "1. Vecuma grupas ✓ · 2. Laukumi · 3. Komandas · 4. Spēles · 5. Grafiks". Each step links directly to the relevant page and shows a green tick when complete.  
**Why:** Currently admin must guess the correct sequence and navigate manually. The checklist eliminates dead ends after creation and prevents forgotten steps (e.g. forgetting to add pitches before scheduling).  
**Complexity:** Medium — requires counting age groups, pitches, confirmed teams, and fixtures per tournament in one query.

---

### A2. Pending registration badge on Dashboard
**What:** Show a yellow badge `"N gaida"` on each tournament card in Dashboard when teams with `status='pending'` exist. Clicking it navigates directly to the pending team list.  
**Why:** Admin currently has no passive notification. Registrations pile up unseen for days, leading to frustrated coaches waiting for confirmation.  
**Complexity:** Low — add a subquery count of `status='pending'` teams per tournament in the Dashboard load.

---

### A3. Matchday date selector + "no schedule" fallback
**What:** Add a date picker to Matchday (defaulting to today). When no fixtures exist for the selected date, show: "Nav ieplānotu spēļu šodien. Vai laukumi nav konfigurēti?" with a link to set kickoff times.  
**Why:** The current page is completely empty if kickoff_time is null or the event is tomorrow, leaving admin confused. On a multi-day tournament this is unusable.  
**Complexity:** Low — replace hardcoded `new Date()` with a date state and bind it to a date input.

---

### A4. Confirmed team count on Age Groups page
**What:** Show `"X apstiprinātas"` on each age group row, alongside the existing badges. If fewer than 2 are confirmed, highlight in amber.  
**Why:** Admin needs to know if enough teams are confirmed before generating fixtures. Currently they click Fixtures → get a toast error → go back — an unnecessary loop.  
**Complexity:** Low — add a count subquery or compute from the age group's team list.

---

### A5. Bulk team approval
**What:** Add an "Apstiprināt visas" button at the top of the pending teams list that confirms all `status='pending'` teams in one operation.  
**Why:** A typical tournament registration period ends with 8–15 teams waiting. Clicking approve 15 times individually is error-prone and tedious, especially on a phone.  
**Complexity:** Low — one `UPDATE WHERE status='pending' AND age_group_id=X`.

---

### A6. Pitch warning in scheduler modal
**What:** When the scheduler modal opens, check if `pitches.length === 0`. If so, show an inline alert: "Nav konfigurētu laukumu. Ieplānošana piešķirs kickoff laikus, bet ne laukumus." or block scheduling entirely with a link to Venues.  
**Why:** Currently the scheduler runs, assigns "Laukums 1/2/3" labels in preview, then saves `pitch_id: null` on all fixtures — with no error. Misleading and silent.  
**Complexity:** Low — a single conditional check at modal open.

---

### A7. Quick score entry from Fixtures page
**What:** Add a lightweight "Ievadīt rezultātus" mode in `Fixtures.jsx` for the admin who is setting up — not just on Matchday. Show score inputs inline on the fixture cards.  
**Why:** On a small tournament, the admin doing setup and the admin entering scores may be the same person. Forcing a navigation to Matchday (which only shows today) adds friction.  
**Complexity:** Medium — duplicate the score-entry logic from Matchday into Fixtures with a toggle.

---

## Part 5 — Public User Recommendations

### P1. "Reģistrēties" CTA on tournament detail page
**What:** On `TournamentDetail.jsx`, when any age group has `registration_open = true`, show a prominent amber button: "Pieteikt komandu →" linking to `/t/{slug}/register`.  
**Why:** This is the single most important public UX gap. Without this link, self-registration is inaccessible unless the user knows the exact URL. No parent will find it.  
**Complexity:** Low — one conditional button using the already-loaded `ageGroups` array.

---

### P2. Separate group standings by group (group_knockout format)
**What:** In `Standings.jsx`, detect when the age group format is `group_knockout`. Load stages and their type, then show one standings table per group (Group A, Group B) using fixtures filtered per group. Show a separate "Izslēgšanas kārtas" section below.  
**Why:** The current single merged table is factually wrong — teams from Group A and Group B are ranked together, making standings meaningless for group stage tournaments.  
**Complexity:** Medium — requires loading stages, joining fixtures to stage type, and rendering multiple tables.

---

### P3. Live game highlighting on Schedule page
**What:** On `Schedule.jsx`, pin fixtures with `status = 'live'` to the top of the page under a "🟢 Pašlaik notiek" section, visually distinct with an amber border and pulsing dot.  
**Why:** Parents and coaches watching on their phones are looking for their team's current game. Scrolling through 30+ fixtures to find the live game is painful. This is the most-used feature on gameday.  
**Complexity:** Low — filter and separate `status='live'` fixtures before rendering. Already have realtime subscription.

---

### P4. Tournament status pills on TournamentList
**What:** Show a contextual pill on each tournament card: "Drīzumā" (upcoming, start_date > today), "Notiek" (start_date ≤ today ≤ end_date), "Pabeigts" (end_date < today). Color-coded: amber, green, muted.  
**Why:** A visitor landing on the site on a random day needs to know which tournament is happening now. The current date display doesn't convey this clearly.  
**Complexity:** Low — compute from `start_date`/`end_date` compared to `new Date()`.

---

### P5. Age group tabs on TeamRoster nav
**What:** In `TeamRoster.jsx`, load the age group and its siblings (as Schedule and Standings already do) and pass them to `PublicNav`.  
**Why:** Currently the nav on the roster page shows only the logo and tournament name — no age group switcher. If a user navigates to a roster from search or a share link, they're stranded with no navigation.  
**Complexity:** Low — copy the siblings query from `Schedule.jsx` and pass the result to PublicNav.

---

### P6. Format DOB as dd/MM/yyyy on TeamRoster
**What:** Format `player.date_of_birth` using `format(new Date(p.date_of_birth), 'dd/MM/yyyy')` in `TeamRoster.jsx` (and in `Teams.jsx` admin view).  
**Why:** The raw ISO string `2015-04-01` is programmer output, not user output. Parents and officials checking a roster expect "01/04/2015".  
**Complexity:** Low — two one-line format changes.

---

### P7. Registration spots remaining indicator
**What:** In `Register.jsx`, for each age group in the select dropdown, show remaining capacity: `"U10 — 3 vietas atlikušas"` computed from `max_teams - confirmed_teams_count`. Hide age groups that are full.  
**Why:** Registrants currently have no idea if they're too late. A parent who registers only to be told "spots full" by email days later is a poor experience.  
**Complexity:** Medium — requires a confirmed teams count query per age group at registration page load.

---

## Summary Table

| Severity | Count | Top items |
|----------|-------|-----------|
| 🔴 Critical | 4 | No register CTA, broken group standings, matchday empty without kickoff times |
| 🟠 Major | 12 | Missing nav links, knockout labels, pitch warning, pending notifications |
| 🟡 Minor | 10 | Hardcoded strings, date formatting, polish |

**Top 3 most impactful recommendations overall:**
1. **Add "Reģistrēties" button to TournamentDetail** — unblocks registration entirely for public users (Low complexity, maximum impact)
2. **Matchday date selector + null kickoff fallback** — unblocks score entry on gameday (Low complexity, critical path)
3. **Separate group standings for group_knockout** — makes standings correct and meaningful for the most common multi-team tournament format (Medium complexity, core functionality)
