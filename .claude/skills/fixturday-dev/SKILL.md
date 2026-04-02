---
name: fixturday-dev
description: Use this skill for ALL development tasks on the Fixturday project — building React components, writing Supabase queries, creating admin pages, public pages, fixture generators, standings logic, i18n strings, and any other code that belongs to the fixturday.com tournament management platform. Trigger whenever the user mentions Fixturday, tournaments, fixtures, standings, age groups, teams, pitches, venues, registration, or matchday in the context of coding. Also trigger for any React + Vite + Supabase task that involves the fixturday stack.
---

# Fixturday Dev Skill

Tournament management platform for Latvian regional football.
Stack: React + Vite · Supabase · Vercel · react-i18next · react-hook-form · date-fns

---

## Project structure

```
src/
  components/       # Shared UI components
  pages/
    Admin/          # Auth-protected admin pages
    Public/         # Public-facing pages (no auth)
  hooks/            # Custom React hooks (useAuth, useResults, useStandings...)
  utils/
    generators/     # Fixture generation logic (roundRobin, knockout, groupStage)
    standings.js    # Standings calculation
  locales/
    lv.json         # ALL UI strings in Latvian
  lib/
    supabase.js     # Supabase client singleton
  styles/
    theme.css       # Design tokens (CSS variables)
supabase/
  migrations/       # SQL migration files
```

---

## Core rules — apply to every file

### 1. No hardcoded strings
Every user-visible string goes through i18n. Never write:
```jsx
// WRONG
<h1>Turnīri</h1>
<button>Saglabāt</button>

// CORRECT
const { t } = useTranslation();
<h1>{t('tournaments.title')}</h1>
<button>{t('common.save')}</button>
```
Add the key to `src/locales/lv.json` in the same session.

### 2. Every Supabase query has error handling
```js
// WRONG
const { data } = await supabase.from('tournaments').select('*');

// CORRECT
const { data, error } = await supabase.from('tournaments').select('*');
if (error) throw error; // or handle in UI
```

### 3. Admin pages check auth before rendering
Every page under `src/pages/Admin/` must wrap content in the auth guard:
```jsx
import { useAuth } from '../../hooks/useAuth';

export default function AdminPage() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/admin" replace />;
  // ... rest of page
}
```

### 4. Mobile-first CSS
All layout CSS starts with mobile styles, then adds `@media (min-width: 768px)` for desktop. The public schedule and standings pages must be fully usable on a phone — this is a gameday tool.

### 5. Mutations use toast feedback
Every INSERT / UPDATE / DELETE operation shows a toast on success and error. Use the shared `useToast` hook.
```js
const { toast } = useToast();
try {
  const { error } = await supabase.from('fixtures').update(data).eq('id', id);
  if (error) throw error;
  toast({ type: 'success', message: t('fixtures.saved') });
} catch (err) {
  toast({ type: 'error', message: t('errors.saveFailed') });
}
```

### 6. Dates always use date-fns with Latvian locale
```js
import { format } from 'date-fns';
import { lv } from 'date-fns/locale';

format(date, 'dd. MMMM yyyy', { locale: lv });  // "01. aprīlis 2026"
```

### 7. RLS — never expose service role key on client
The `src/lib/supabase.js` client uses `VITE_SUPABASE_ANON_KEY` only. Service role key is only used in Edge Functions or server-side scripts, never in the browser.

### 8. Max 3 files changed per Claude Code session
Keep scope tight. If a task requires more than 3 files, split into multiple sessions.

---

## Database schema (quick reference)

```
tournaments → age_groups → teams → team_players
tournaments → venues → pitches
age_groups → stages → fixtures → fixture_results
pitches → fixtures (pitch_id FK)
```

Key column patterns:
- All PKs: `uuid` with `gen_random_uuid()` default
- All timestamps: `timestamptz` (not `timestamp`)
- Soft status fields use `text` with CHECK constraint, not enums
- `slug` column on tournaments for public URLs (auto-generated from name)

---

## Fixture generator rules

All generators live in `src/utils/generators/` and return pure data — no Supabase calls inside generators.

Every generator function must include a JSDoc comment documenting its parameters and return type:
```js
/**
 * generateRoundRobin
 *
 * @param {Array<{id: *, name: string}>} teams
 * @returns {Array<Array<{home: object, away: object, round: number}>>}
 */
export function generateRoundRobin(teams) { ... }
```

**Round-robin** (`roundRobin.js`):
- Uses circle method (rotate all but first team)
- Returns `[{ homeTeamId, awayTeamId, round, groupLabel }]`
- Handles odd teams with `null` as bye

**Knockout** (`knockout.js`):
- Seeds by registration order
- Pads to next power of 2 with byes
- Returns rounds labeled: 'R16', 'QF', 'SF', 'F'

**Group stage** (`groupStage.js`):
- Splits teams into groups using snake seeding
- Round-robin within each group
- Generates a second knockout stage automatically

---

## Standings calculation rules (`src/utils/standings.js`)

Input: array of completed `fixture_results` joined with fixtures.
Output: sorted standings array per group.

Sorting order:
1. Points (W=3, D=1, L=0)
2. Goal difference (GF - GA)
3. Goals for (GF)
4. Head-to-head points
5. Alphabetical (last resort)

Function signature:
```js
export function calculateStandings(fixtures, results) {
  // returns: [{ teamId, teamName, played, won, drawn, lost, gf, ga, gd, points }]
}
```

---

## Design tokens (from theme.css)

```css
--color-primary: #1a1a2e;      /* dark navy */
--color-accent: #f0a500;       /* amber/gold */
--color-surface: #16213e;      /* card background */
--color-text: #e0e0e0;         /* primary text */
--color-muted: #8892a4;        /* secondary text */
--color-success: #2ecc71;
--color-danger: #e74c3c;
--font-display: 'Barlow Condensed', sans-serif;  /* headings */
--font-body: 'Inter', sans-serif;
```

---

## Supabase Realtime (public pages only)

Subscribe to live result changes on public standings/schedule pages:
```js
useEffect(() => {
  const channel = supabase
    .channel('fixture_results')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'fixture_results' },
      () => refetchStandings()
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}, []);
```

---

## Public registration form pattern

Public team registration forms (e.g. `src/pages/Public/Register.jsx`) must follow this exact pattern:

**1. Always use react-hook-form:**
```jsx
import { useForm } from 'react-hook-form';
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
```

**2. Check `registration_open` before rendering the form:**
```jsx
// age_groups table has a boolean column: registration_open
if (!ageGroup.registration_open) {
  return <p>{t('register.closed')}</p>;
}
```

**3. Insert team with `status: 'pending'` — never 'confirmed' or omitted:**
```js
await supabase.from('teams').insert({
  age_group_id: values.age_group_id,
  name: values.name,
  club: values.club,
  contact_name: values.contact_name,
  contact_email: values.contact_email,
  contact_phone: values.contact_phone,
  status: 'pending',   // ← always 'pending' on self-registration
})
```

**4. Submit button is full-width on mobile:**
```jsx
<button type="submit" className="btn-primary" style={{ width: '100%' }}>
  {isSubmitting ? t('register.submitting') : t('register.submit')}
</button>
```

---

## i18n key naming convention

```
common.*          → shared labels (save, cancel, loading, error...)
tournaments.*     → tournament list and detail
ageGroups.*       → age group management
teams.*           → team and player management
fixtures.*        → fixture list, schedule, results
standings.*       → standings table
venues.*          → venue and pitch management
admin.*           → admin dashboard and nav
errors.*          → error messages
```
