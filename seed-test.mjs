// Creates a complete 7-team test tournament in the live database.
// node seed-test.mjs

import { createClient } from '@supabase/supabase-js'

const URL  = 'https://bvxfadleksghrqzwgiod.supabase.co'
const KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2eGZhZGxla3NnaHJxendnaW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzU4MzUsImV4cCI6MjA5MDYxMTgzNX0.ouOUi6-YoZWj2ouaB9hUqyb60juHJuVD2SpWwRkAqS8'
const EMAIL = 'mail@endelis.co'
const PASS  = 'kakalizma'

const sb = createClient(URL, KEY)

// ── inline generators (no .js extension issues) ───────────────────────────────
const BYE = { id: null, name: 'BYE' }
function rr(teams) {
  if (!teams || teams.length < 2) return []
  let slots = [...teams]; if (slots.length % 2) slots.push(BYE)
  const n = slots.length, rounds = []
  const pinned = slots[0]; let rotating = slots.slice(1)
  for (let r = 0; r < n - 1; r++) {
    const ring = [pinned, ...rotating], fx = []
    for (let i = 0; i < n / 2; i++) {
      const h = ring[i], a = ring[n - 1 - i]
      if (h.id !== null || a.id !== null) fx.push({ home: h, away: a, round: r + 1 })
    }
    rounds.push(fx)
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)]
  }
  return rounds
}
function pow2(n) { let p = 1; while (p < n) p *= 2; return p }
function roundName(slots, r) {
  const m = slots / Math.pow(2, r)
  return m === 1 ? 'F' : m === 2 ? 'SF' : m === 4 ? 'QF' : `R${m * 2}`
}
function generateGroupStage(teams, groupsCount = 2, adv = 2) {
  const n = Math.min(groupsCount, Math.floor(teams.length / 2))
  const groups = Array.from({ length: n }, (_, g) => ({ name: String.fromCharCode(65 + g), teams: [], fixtures: [] }))
  teams.forEach((t, i) => {
    const pass = Math.floor(i / n), off = i % n
    groups[pass % 2 === 0 ? off : n - 1 - off].teams.push(t)
  })
  for (const g of groups) g.fixtures = rr(g.teams).flat().map(f => ({ ...f, group: g.name }))
  const allFx = groups.flatMap(g => g.fixtures)
  const maxRound = allFx.reduce((m, f) => Math.max(m, f.round ?? 0), 0)
  const groupFx = allFx.filter(f => f.home?.id && f.away?.id).sort((a, b) => a.round - b.round)
    .map(f => ({ homeTeamId: f.home.id, awayTeamId: f.away.id, round: f.round, group: f.group }))
  const total = n * adv, slots = pow2(total)
  const phs = []
  for (let pos = 1; pos <= adv; pos++) for (let g = 0; g < n; g++) phs.push(`Group ${String.fromCharCode(65 + g)}-${pos}`)
  while (phs.length < slots) phs.push(null)
  const nr = Math.log2(slots), koFx = []
  for (let i = 0; i < slots / 2; i++)
    koFx.push({ round: 1 + maxRound, home_placeholder: phs[i], away_placeholder: phs[slots - 1 - i], round_name: null })
  for (let r = 2; r <= nr; r++) {
    const prev = roundName(slots, r - 1), mc = slots / Math.pow(2, r)
    if (r === nr && nr >= 2)
      koFx.push({ round: r + maxRound, home_placeholder: 'SF1 zaudētājs', away_placeholder: 'SF2 zaudētājs', round_name: '3rd_place' })
    for (let i = 0; i < mc; i++)
      koFx.push({ round: r + maxRound, home_placeholder: `${prev}${2*i+1} uzvarētājs`, away_placeholder: `${prev}${2*i+2} uzvarētājs`, round_name: null })
  }
  return { groups, groupFx, koFx }
}

// ── main ──────────────────────────────────────────────────────────────────────
const { data: { user }, error: authErr } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASS })
if (authErr) { console.error('Auth failed:', authErr.message); process.exit(1) }
console.log(`✓ Signed in as ${user.email}`)

const slug = `test-7-teams-${Date.now()}`

// 1. Tournament
const { data: tourney, error: tErr } = await sb.from('tournaments').insert({
  name: 'Test — 7 Teams',
  slug,
  sport: 'football',
  is_active: true,
  owner_id: user.id,
  first_game_time: '09:00',
  last_game_time: '18:00',
}).select().single()
if (tErr) { console.error('Tournament:', tErr.message); process.exit(1) }
console.log(`✓ Tournament created: /t/${slug}   id=${tourney.id}`)

// 2. Venue + 2 pitches
const { data: venue, error: vErr } = await sb.from('venues').insert({
  tournament_id: tourney.id, name: 'Test Venue',
}).select().single()
if (vErr) { console.error('Venue:', vErr.message); process.exit(1) }

const { data: pitches, error: pErr } = await sb.from('pitches').insert([
  { venue_id: venue.id, name: 'Field 1' },
  { venue_id: venue.id, name: 'Field 2' },
]).select()
if (pErr) { console.error('Pitches:', pErr.message); process.exit(1) }
console.log(`✓ Venue + 2 pitches created`)

// 3. Age group (group_knockout, 4 per group, 2 advancing)
const { data: ag, error: agErr } = await sb.from('age_groups').insert({
  tournament_id: tourney.id,
  name: 'Open',
  format: 'group_knockout',
  teams_per_group: 4,
  teams_advancing: 2,
  game_duration_minutes: 20,
  pitch_gap_minutes: 5,
  registration_open: false,
}).select().single()
if (agErr) { console.error('Age group:', agErr.message); process.exit(1) }
console.log(`✓ Age group created: ${ag.name}`)

// 4. 7 teams
const teamNames = ['Alpha FC', 'Beta FC', 'Gamma FC', 'Delta FC', 'Epsilon FC', 'Zeta FC', 'Eta FC']
const { data: teams, error: tmErr } = await sb.from('teams').insert(
  teamNames.map(name => ({ age_group_id: ag.id, name, status: 'confirmed' }))
).select()
if (tmErr) { console.error('Teams:', tmErr.message); process.exit(1) }
console.log(`✓ ${teams.length} teams created`)

// 5. Generate fixtures
const { groups, groupFx, koFx } = generateGroupStage(teams, 2, 2)
groups.forEach(g => console.log(`  Group ${g.name}: ${g.teams.map(t=>t.name).join(', ')}`))
console.log(`  Group fixtures: ${groupFx.length}   Knockout: ${koFx.length}   Total: ${groupFx.length + koFx.length}`)

// 6. Create stages and insert fixtures
const { data: groupStage, error: gsErr } = await sb.from('stages').insert({
  age_group_id: ag.id, name: 'Group Stage', type: 'group_stage', sequence: 1,
}).select().single()
if (gsErr) { console.error('Group stage:', gsErr.message); process.exit(1) }

const { data: koStage, error: ksErr } = await sb.from('stages').insert({
  age_group_id: ag.id, name: 'Knockout', type: 'knockout', sequence: 2,
}).select().single()
if (ksErr) { console.error('Knockout stage:', ksErr.message); process.exit(1) }

const { error: gfErr } = await sb.from('fixtures').insert(
  groupFx.map(f => ({
    stage_id: groupStage.id,
    home_team_id: f.homeTeamId,
    away_team_id: f.awayTeamId,
    round: f.round,
    group_label: f.group,
    status: 'scheduled',
  }))
)
if (gfErr) { console.error('Group fixtures:', gfErr.message); process.exit(1) }

const { error: kfErr } = await sb.from('fixtures').insert(
  koFx.map(f => ({
    stage_id: koStage.id,
    home_team_id: null,
    away_team_id: null,
    round: f.round,
    round_name: f.round_name ?? null,
    home_placeholder: f.home_placeholder,
    away_placeholder: f.away_placeholder,
    status: 'scheduled',
  }))
)
if (kfErr) { console.error('Knockout fixtures:', kfErr.message); process.exit(1) }

console.log(`✓ All fixtures inserted`)
console.log(`\n🎉 Done!`)
console.log(`   Admin: /admin/tournaments/${tourney.id}/age-groups`)
console.log(`   Public: /t/${slug}\n`)
