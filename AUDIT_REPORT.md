# Fixturday Audit Report

**Date:** 2026-07-05  
**Auditor:** Claude Code (claude-sonnet-4-6)  
**Scope:** Full technical audit — build, rules, features, E2E tests, competitor research

---

## Phase 1 — Build & Test Status

### Build

```
npm run build
```

**Result: PASS — zero errors**

- Vite compiled 2,810 modules in 3.9 s
- `[blog-prerender-meta]` generated 26 static blog HTML files for Googlebot
- `[sitemap]` found 26 blog posts, wrote updated sitemap.xml
- All output chunks within normal size range; no circular dependency warnings

### Tests

`npm run test` — no test script defined in package.json.

`npx playwright test tests/e2e/audit.spec.cjs` — **13/13 PASSED** (requires dev server at :5173)

> Note: `tests/e2e/audit.spec.js` fails at import time because it uses CommonJS `require()` in an ES module project. The `.cjs` sibling file is the working copy.

---

## Phase 2 — Rule Violations

### Rule 1 — No hardcoded strings (2 violations)

| File | Line | Violation |
|------|------|-----------|
| `src/pages/Admin/Tournaments/New.jsx` | 130 | `← Fixturday Admin` rendered as raw JSX text, not via `t()` |
| `src/pages/Admin/AgeGroups.jsx` | 374 | `→ Fixtures` hardcoded as Link inner text in the fixtures-exist warning banner |

### Rule 2 — Supabase error handling (11 violations)

| File | Line | Violation |
|------|------|-----------|
| `src/pages/Admin/AgeGroups.jsx` | 127 | `stages.delete()` — no `{ error }` captured; silent failure before success toast |
| `src/pages/Admin/Fixtures/index.jsx` | 27 | `Promise.all` of 4 queries — none capture `error`; failed query silently sets state to `undefined` |
| `src/pages/Admin/Fixtures/FixtureList.jsx` | 40 | Conflict-check query — `{ data: conflicts }` only, no error |
| `src/pages/Admin/Tournament/TournamentStandings.jsx` | 205 | Per-age-group `Promise.all` — `{ data: teams }` and `{ data: stages }` only, no error |
| `src/pages/Admin/Tournament/TournamentStandings.jsx` | 219 | `allFixtures` query — no error captured |
| `src/pages/Admin/Tournament/TournamentStandings.jsx` | 225 | `fixtureResults` query — no error captured |
| `src/pages/Admin/Matchday.jsx` | 205 | `resultData` query — no error captured |
| `src/pages/Admin/Matchday.jsx` | 396 | `advanceKnockoutTeams`: `fixtures.update()` — no destructuring at all |
| `src/pages/Admin/Matchday.jsx` | 429 | Beach-volleyball `saveScore`: `fixtures.update({ status: 'completed' })` — no error (football branch at line 449 does capture it) |
| `src/pages/Admin/Tournaments/New.jsx` | 118 | Attachment update after creation — no destructuring, no error toast |
| `src/pages/Admin/Fixtures/SchedulerModal.jsx` | 64 | `.then(({ data }) => {...})` — Promise `.then()` form with no rejection handler |

### Rule 3 — Admin auth guard

**0 violations.** All routes under `/admin/` are protected:
- `/admin/dashboard`, `/admin/tournaments/new`, `/admin/matchday`, `/admin/tournaments/:id/print` — wrapped in `<RequireAuth>`
- `/admin/tournaments/:id/*` — nested inside `TournamentLayout` which has its own `if (!user) return <Navigate to="/admin">` guard

> The Playwright test navigated to `/admin/tournaments` (no `:id`), which correctly renders the 404 page — not an unprotected admin page. Auth guards are intact.

### Rule 4 — Mobile-first CSS (2 violations)

| File | Lines | Violation |
|------|-------|-----------|
| `src/pages/Admin/Tournament/TournamentStandings.jsx` | 65–80 | `STANDINGS_MOBILE_STYLE` uses `@media (max-width: 767px)` to hide columns — desktop-first |
| `src/pages/Admin/Tournament/TournamentPlayoff.jsx` | 11–23 | `BRACKET_STYLE` uses `@media (max-width: 640px)` to switch layout — desktop-first |

Note: these are admin-only pages; the public-facing pages pass the 390 px overflow test.

### Rule 5 — Toast on success and error (3 violations)

| File | Line | Violation |
|------|------|-----------|
| `src/pages/Admin/Dashboard.jsx` | 48 | `handleDelete`: filters tournament from state on success but calls no `toast()` |
| `src/pages/Admin/Tournaments/Edit.jsx` | 83 | `handleDelete`: calls `navigate()` on success with no success toast |
| `src/pages/Admin/Matchday.jsx` | 510 | `postpone`: calls `load()` on success with no toast |

### Rule 6 — date-fns with `{ locale: lv }` (1 violation)

| File | Line | Violation |
|------|------|-----------|
| `src/hooks/useDateLocale.js` | 4 | Returns `enGB` locale instead of `lv`. Consumers (`Print.jsx:110`) will render English month/weekday names |

### Rule 7 — No service role key in browser

**0 violations.** `src/lib/supabase.js` uses only `VITE_SUPABASE_ANON_KEY`. No service role key found in any `src/` file.

---

## Phase 3 — Feature Completeness

| Feature | Status | Notes |
|---------|--------|-------|
| Tournament creation + slug generation | ✅ | `New.jsx`, auto-slug from name; sitemap picks up all slugs |
| Age group and team management | ✅ | `AgeGroups.jsx`, `Teams.jsx` with full CRUD |
| Fixture generation — round-robin | ✅ | `src/utils/generators/roundRobin.js` |
| Fixture generation — knockout | ✅ | `knockout.js`, `multiTierKnockout.js`, `doubleElimination.js` |
| Fixture generation — group stage | ✅ | `groupStage.js` |
| Score entry | ✅ | `Matchday.jsx` — football, beach volleyball, catch serve, rugby |
| Standings calculation | ✅ | `standings.js` — football, BV, CS (set-based), rugby (4/2/1 + 3/1) |
| Public schedule with realtime | ✅ | `Public/Schedule.jsx` with Supabase Realtime subscription |
| Public standings | ✅ | `Public/Standings.jsx` — multi-sport, group stage, knockout |
| Admin auth guard on all pages | ✅ | `RequireAuth` component + `TournamentLayout` guard |
| Mobile layout — public pages | ✅ | Playwright: no horizontal overflow at 390 px on home and guide |
| i18n coverage | ⚠️ | 2 hardcoded strings found (see Rule 1) |
| Blog SEO prerendering | ✅ | 26 static HTML files built per deploy; Googlebot gets real content |

---

## Phase 4 — E2E Test Results

**Spec:** `tests/e2e/audit.spec.cjs` — 13 tests, 1 worker  
**Result: 13/13 PASSED (32.7 s)**

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | Homepage loads | ✅ | H1: "Run tournaments. Effortlessly." |
| 2 | Guide — no Latvian strings | ✅ | "Laukums", "Komanda", "Jānis" not found |
| 3 | Tournaments list | ✅ | Page renders (0 public cards — expected, no active tournaments) |
| 4 | Blog index | ✅ | 16 blog post links present |
| 5 | Blog FAQ LD+JSON schema | ✅ | 3 LD+JSON scripts on blog post; FAQ schema injected |
| 6 | Admin login accessible | ✅ | Email input rendered |
| 7 | Auth guard redirect | ✅ | `/admin/tournaments` (non-route) → 404; does not expose admin content |
| 8 | Mobile 390 px — home no overflow | ✅ | |
| 9 | Mobile 390 px — guide no overflow | ✅ | |
| 10 | 404 page | ✅ | Renders SEO content correctly |
| 11 | Console errors — home | ✅ | Zero JS errors |
| 12 | Console errors — guide | ✅ | Zero JS errors |
| 13 | Console errors — tournaments | ✅ | Zero JS errors |

> **Known issue:** `audit.spec.js` (CommonJS `require`) cannot run in this ES module project. Rename to `.cjs` or convert to `import` syntax to resolve.

---

## Phase 5 — Competitor Insights

### Analysed

- **turniir.ee** — tournament discovery portal
- **sportlyzer.com** — club/coach management platform
- **tournamentsoftware.com** — blocked by cookie consent wall; no UX data extracted

### 5 improvements for Fixturday

**1. Tournament discovery index with inline filter chips**  
turniir.ee shows all tournaments as scannable cards (logo, sport, dates, team count, status badge) with Sport / Active / Upcoming / Past chips above the list — no sidebar, works on mobile. Currently `/tournaments` on Fixturday renders zero cards for unauthenticated users. Opening this to show public active tournaments would be a meaningful acquisition surface.

**2. "LIVE" status badge on tournament cards and schedule headers**  
turniir.ee renders a pulsing "LIVE" chip when a tournament is in progress (`start_date <= today <= end_date`). Single boolean derived from existing date columns — high visibility, low build cost. Add to `TournamentDetail`, `Schedule`, and the (future) public index.

**3. Stakeholder-split onboarding copy**  
sportlyzer.com organises its hero and feature sections by role: organiser, team manager, spectator. Fixturday's landing currently leads with organiser tasks only. Adding a second message track (e.g., "Are you a coach? Here's your schedule.") makes the value prop land faster for visiting parents and opponents.

**4. "Try for free — no credit card" micro-copy next to every primary CTA**  
sportlyzer.com places this one-liner next to every sign-up button. Cold visitors to Fixturday don't know the friction level. One sentence next to the hero CTA removes the hesitation — consistent with the approved pricing direction ("try for free / free to start").

**5. Embeddable public schedule widget**  
sportlyzer.com lets clubs paste an `<iframe>` on their own club website. A Fixturday embed (public schedule by tournament slug) would expose the brand to visiting parents and opponents, driving organic registrations. The public `/t/:slug/:ageGroup/fixtures` page already exists and is mobile-optimised — wrapping it in an embeddable snippet is straightforward.

---

## Prioritised Recommendations

### Critical (fix before next deploy)

| # | Issue | File(s) | Rule |
|---|-------|---------|------|
| C1 | `useDateLocale.js` returns `enGB` — printed schedules show English month names | `src/hooks/useDateLocale.js:4` | 6 |
| C2 | `advanceKnockoutTeams` update has no error handling — knockout advancement can fail silently | `Matchday.jsx:396` | 2 |

### High (fix this sprint)

| # | Issue | File(s) | Rule |
|---|-------|---------|------|
| H1 | 9 remaining Supabase queries with no error capture (see Rule 2 table) | Multiple | 2 |
| H2 | 3 delete/postpone mutations with no success toast | Dashboard, Edit, Matchday | 5 |
| H3 | `audit.spec.js` cannot run — rename to `.cjs` or convert to ESM | `tests/e2e/audit.spec.js` | — |

### Medium (next sprint)

| # | Issue | Effort |
|---|-------|--------|
| M1 | 2 hardcoded strings (`← Fixturday Admin`, `→ Fixtures`) | 30 min |
| M2 | TournamentStandings and TournamentPlayoff use desktop-first CSS | 1 h |
| M3 | Add "LIVE" badge to public tournament pages | 2 h |
| M4 | "Try for free — no credit card" micro-copy on all primary CTAs | 30 min |

### Low / Backlog

| # | Issue | Effort |
|---|-------|--------|
| L1 | Public tournament discovery index (`/tournaments`) with filter chips | 1 day |
| L2 | Embeddable schedule widget (`<iframe>`) | 2 days |
| L3 | Stakeholder-split landing page copy | 0.5 day |
| L4 | Playwright `webServer` config to auto-start dev server before tests | 1 h |

---

*Generated by Claude Code — Fixturday QA audit 2026-07-05*
