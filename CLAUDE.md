# Fixturday — Claude Code Brief

## Stack
React + Vite · Supabase · Vercel · react-i18next · react-hook-form · date-fns · Playwright

## Project rules (apply to all code)
1. All strings via useTranslation() + lv.json key — no hardcoded text
2. All Supabase queries destructure { data, error } and handle error
3. Admin pages use useAuth guard before any render
4. CSS mobile-first, breakpoint 768px
5. Every mutation shows useToast on success and error
6. Dates use date-fns with { locale: lv }
7. Never use service role key in browser — anon key only
8. Max 3 files changed per coding session

## Audit mode instructions
When asked to run a full audit, do this in order:

### Phase 1 — Technical audit
- Run: npm run build (capture errors)
- Run: npm run test (if tests exist)
- Scan every file in src/ against the 8 project rules above
- List every violation found

### Phase 2 — Feature completeness audit
Check whether these features exist and work end-to-end:
- Tournament creation + slug generation
- Age group and team management
- Fixture generation (round-robin, knockout, group stage)
- Score entry and standings calculation
- Public schedule page with realtime updates
- Admin auth guard on all /Admin/ pages
- Mobile layout on public pages
- i18n coverage (no untranslated strings)

### Phase 3 — UI/E2E testing
- Run existing Playwright tests: npx playwright test
- If no tests exist, create tests/e2e/smoke.spec.js covering:
  - Public homepage loads
  - Tournament public page loads by slug
  - Admin login redirects unauthenticated users
  - Standings table renders with data

### Phase 4 — Competitor research
Fetch and analyse these URLs, note their strongest UX patterns:
- https://turniir.ee
- https://sportlyzer.com
- https://tournamentsoftware.com
List 5 specific improvements Fixturday should adopt.

### Phase 5 — Output
Write a file called AUDIT_REPORT.md in the project root with:
- Build/test status
- Rule violations list
- Missing features list
- E2E test results summary
- Competitor insights
- Prioritised improvement recommendations
