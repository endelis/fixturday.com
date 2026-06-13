# Fixturday Audit Report

Date: 2026-06-08
Scope: project audit following CLAUDE.md

---

## Phase 1 — Technical audit

### Build / test status
- `npm run build` ✅ passed
  - Evidence: Vite production build completed successfully in 5.06s.
- `npm run test` ❌ failed
  - Evidence: `npm error Missing script: "test"`.
- `npm run lint` ❌ failed
  - Evidence: ESLint 9 could not find `eslint.config.js` / `eslint.config.mjs` / `eslint.config.cjs`.
- VS Code error scan on `src/` ✅ no compile/lint errors were reported by the editor.

### Rule-violation summary
The current codebase already contains several known project-rule violations and stability risks:
1. Hardcoded UI strings remain in some admin/public pages and tests instead of using `t()` / `useTranslation()`.
2. Some admin pages are protected at route level, but the codebase still has component-level guard gaps for a few admin screens.
3. Supabase error handling is not consistent across all query paths; some paths still rely on silent failure or incomplete destructuring.
4. The existing QA audit documents several critical issues, including:
   - wrong stage type (`group` vs `group_stage`) in fixture generation logic,
   - wrong `calculateStandings()` call signature / property access in tournament stats,
   - RLS / public registration column mismatches that can block anon registration,
   - hardcoded strings in public standings / schedule / team roster views.

### Notes from the current codebase
- The app has a real router with protected admin routes in `src/App.jsx` and `src/components/RequireAuth.jsx`.
- The project uses `useTranslation()` in many places, but the i18n coverage is not yet complete across all pages.

---

## Phase 2 — Feature completeness audit

### What is present
- Tournament creation + slug generation: present in the admin flow.
- Age group and team management: present in the admin area.
- Fixture generation + standings views: present in the admin / public flows.
- Public schedule / standings pages: present and wired into the public routes.
- Admin auth guard on protected routes: present via `RequireAuth` in `src/App.jsx`.
- Mobile-first layout structure: present in the public pages and responsive CSS patterns.

### What is incomplete or risky
- The group-stage fixture path is flagged as broken in the current QA documentation because of the `group` / `group_stage` mismatch.
- The standings logic and score-rendering path has documented call-signature and property-access issues.
- Public registration remains risky because of documented RLS / column-name problems.
- Some UI text and toast strings are still hardcoded, so the i18n rule is only partially satisfied.

### Verdict
The feature set is largely present, but the project is not yet production-ready because several critical logic and policy issues remain unresolved.

---

## Phase 3 — UI / E2E test audit

### Existing Playwright suite
- `npx playwright test` ❌ failed with 5 failing tests.

### Failure evidence
1. Public homepage load failed with `ERR_CERT_COMMON_NAME_INVALID` against `https://fixturday.com/`.
2. Public tournament page load failed with the same certificate error.
3. Admin redirect test failed for the same HTTPS certificate issue.
4. Admin login test failed because `PLAYWRIGHT_ADMIN_EMAIL` and `PLAYWRIGHT_ADMIN_PASSWORD` are not set.
5. Admin logout test failed for the same missing environment-variable requirement.

### Root-cause summary
- The Playwright base URL is hardcoded to `https://fixturday.com`, which is not a reliable local test target in this environment.
- The admin tests require credentials that are not configured in the current terminal environment.

---

## Phase 4 — Competitor research

### Observations from the reviewed competitors
- Turniir.ee: strong messaging around quick tournament creation, clear public registration CTA, and visible tournament listings.
- Sportlyzer.com: strong all-in-one club-management positioning, mobile-friendly feature framing, and clear trust signals.
- Tournamentsoftware.com: clean tournament presentation, strong organizer-focused UX, and polished public trust / legal-page support.

### Five improvements Fixturday should adopt
1. Add a more prominent start-tournament / register-now CTA on public landing pages.
2. Improve public registration UX with clearer status, progress, and mobile-first steps.
3. Add stronger admin onboarding / next-step guidance after tournament creation.
4. Make standings, fixture, and team pages more visually scannable on mobile.
5. Add stronger trust / social-proof elements (testimonials, support links, clearer policy messaging).

---

## Phase 5 — Final assessment

### Overall verdict
- Technical build baseline: acceptable for compile-time validation.
- Production readiness: not yet ready because of documented logic, policy, and i18n issues.
- E2E automation: currently failing due environment and test-target configuration.

### Priority recommendations
1. Fix the documented critical logic issues (group-stage type mismatch, standings logic, public registration RLS / column mismatches).
2. Remove remaining hardcoded strings and complete the i18n audit.
3. Add a local Playwright target / dev-server setup and configure admin test credentials.
4. Add consistent error handling and toasts across all mutations.
5. Re-run build, test, and Playwright checks after the fixes.
