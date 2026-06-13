/**
 * Full tournament lifecycle E2E test — group_knockout format with playoffs.
 *
 * Flow:
 *   1.  Create tournament
 *   2.  Add U10 age group (group_knockout, 2 groups of 3)
 *   2b. Create venue + pitch
 *   3.  Add 6 teams
 *   4.  Bulk-confirm teams
 *   5.  Generate fixtures (10 total: 6 group + 4 knockout placeholders)
 *   6.  Set kickoff + pitch for 6 group-stage fixtures
 *   7.  Enter group-stage scores via Matchday (home wins 2:0)
 *   7b. Admin standings: click "Virzīt komandas uz playoff" → SF fixtures get real teams
 *   7c. sbNode: seed 3rd-place and Final fixtures with SF winners/losers
 *   7d. Set kickoff + pitch for 4 knockout fixtures
 *   8.  Enter knockout scores via Matchday (home wins 2:0)
 *   9.  Admin standings shows 6 teams across 2 groups (3 rows each)
 *  10.  Public Grafiks tab shows team names on main tournament page
 *  11.  Public Tabula tab shows 6 standings rows
 *  12.  Public schedule route shows fixtures with pitch info
 */

import { expect, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const TODAY = new Date().toISOString().split('T')[0] // yyyy-MM-dd
const RUN_ID = Date.now().toString().slice(-5)
const TOURNAMENT_NAME = `E2E Test ${TODAY} ${RUN_ID}`

let context, page, sbNode
let tournamentId, tournamentSlug, u10Id

function slugify(text) {
  return text
    .toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[āàáâä]/g, 'a').replace(/[čç]/g, 'c').replace(/[ēèéê]/g, 'e')
    .replace(/[ģ]/g, 'g').replace(/[ī]/g, 'i').replace(/[ķ]/g, 'k')
    .replace(/[ļ]/g, 'l').replace(/[ņ]/g, 'n').replace(/[š]/g, 's')
    .replace(/[ū]/g, 'u').replace(/[ž]/g, 'z')
    .replace(/[^\w-]/g, '').replace(/--+/g, '-')
}

test.describe.serial('Full Tournament Lifecycle — group_knockout with playoffs', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    await context.addInitScript(() => {
      localStorage.setItem('fixturday_cookie_consent', 'all')
    })
    page = await context.newPage()

    const email = process.env.PLAYWRIGHT_ADMIN_EMAIL
    const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD
    if (!email || !password) throw new Error('Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

    // Node.js Supabase client for direct DB operations (seeding Final/3rd-place teams)
    sbNode = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
    )
    const { error: authErr } = await sbNode.auth.signInWithPassword({ email, password })
    if (authErr) throw authErr

    await page.goto('/admin')
    await page.getByLabel('E-pasts').fill(email)
    await page.getByLabel('Parole').fill(password)
    await page.getByRole('button', { name: 'Pieslēgties' }).click()
    await page.waitForURL('**/admin/dashboard', { timeout: 60_000 })
  })

  test.afterAll(async () => {
    await context.close()
  })

  // ── 01: Create tournament ─────────────────────────────────────────────────
  test('01 · create tournament', async () => {
    await page.goto('/admin/tournaments/new')
    await page.locator('input[name="name"]').fill(TOURNAMENT_NAME)
    await expect(page.locator('input[name="slug"]')).not.toHaveValue('', { timeout: 3000 })

    await page.getByRole('button', { name: 'Izveidot turnīru' }).click()
    await page.waitForURL(/\/admin\/tournaments\/[^/]+\/overview/, { timeout: 15000 })

    const match = page.url().match(/\/admin\/tournaments\/([^/]+)\/overview/)
    expect(match, 'should redirect to tournament overview').toBeTruthy()
    tournamentId = match[1]
    tournamentSlug = slugify(TOURNAMENT_NAME)

    await expect(page.getByText(TOURNAMENT_NAME).first()).toBeVisible()
    await page.evaluate((id) => {
      localStorage.setItem(`fixturday_wizard_dismissed_${id}`, 'true')
    }, tournamentId)
  })

  // ── 02: Add U10 age group (group_knockout) ────────────────────────────────
  test('02 · add U10 age group (group_knockout)', async () => {
    await page.goto(`/admin/tournaments/${tournamentId}/age-groups`)
    await page.getByRole('button', { name: /Jauna vecuma grupa/i }).click()

    await page.locator('input[placeholder="U10"]').fill('U10')
    await page.locator('select').selectOption('group_knockout')
    await page.getByRole('button', { name: 'Saglabāt' }).click()

    await expect(page.getByText('U10')).toBeVisible({ timeout: 8000 })

    const teamsHref = await page
      .locator('a[href*="/admin/age-groups/"][href*="/teams"]')
      .first()
      .getAttribute('href')
    const idMatch = teamsHref.match(/\/admin\/age-groups\/([^/]+)\/teams/)
    expect(idMatch, 'age-group teams link must contain UUID').toBeTruthy()
    u10Id = idMatch[1]
  })

  // ── 02b: Create venue + pitch ─────────────────────────────────────────────
  test('02b · create venue and pitch', async () => {
    await page.goto(`/admin/tournaments/${tournamentId}/venues`)
    await page.getByRole('button', { name: /Jauna vieta/i }).click()
    await page.locator('input[name="name"]').fill('E2E Test Stadion')
    await page.getByRole('button', { name: 'Pievienot vietu' }).click()
    await expect(page.getByText('E2E Test Stadion')).toBeVisible({ timeout: 8000 })

    await page.getByRole('button', { name: /Jauns laukums/i }).click()
    await page.locator('input[placeholder="Laukuma nosaukums"]').fill('Galvenais laukums')
    await page.getByRole('button', { name: 'Pievienot' }).click()
    await expect(page.getByText('Galvenais laukums')).toBeVisible({ timeout: 8000 })
  })

  // ── 03: Add 6 teams ───────────────────────────────────────────────────────
  test('03 · add 6 teams to U10', async () => {
    await page.goto(`/admin/age-groups/${u10Id}/teams`)

    for (const name of ['Alpha FC', 'Beta FC', 'Gamma FC', 'Delta FC', 'Epsilon FC', 'Zeta FC']) {
      await page.getByRole('button', { name: /\+ Jauna komanda/i }).click()
      await page.locator('input[name="name"]').fill(name)
      await page.getByRole('button', { name: 'Pievienot' }).click()
      await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 8000 })
    }
  })

  // ── 04: Bulk-confirm 6 teams ──────────────────────────────────────────────
  test('04 · bulk-confirm all 6 teams', async () => {
    await page.goto(`/admin/age-groups/${u10Id}/teams`)
    page.once('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Apstiprināt visas' }).click()
    await expect(page.locator('.badge-success')).toHaveCount(6, { timeout: 10000 })
  })

  // ── 05: Generate group_knockout fixtures ──────────────────────────────────
  test('05 · generate group_knockout fixtures (10 total)', async () => {
    await page.goto(`/admin/age-groups/${u10Id}/fixtures`)
    await page.getByRole('button', { name: /Ģenerēt spēles/i }).click()

    // 6 teams, 2 groups of 3 → 6 group fixtures + 4 knockout placeholders = 10
    await expect(page.getByText(/Kārta/i).first()).toBeVisible({ timeout: 10000 })
    const fixCards = page.locator('.card').filter({ hasText: /pret/i })
    await expect(fixCards).toHaveCount(10, { timeout: 10000 })
  })

  // ── 06: Set kickoff + pitch for 6 group-stage fixtures ────────────────────
  test('06 · set kickoff and pitch on group-stage fixtures', async () => {
    await page.goto(`/admin/age-groups/${u10Id}/fixtures`)

    const fixCards = page.locator('.card').filter({ hasText: /pret/i })
    await expect(fixCards.first()).toBeVisible({ timeout: 5000 })
    await expect(fixCards).toHaveCount(10, { timeout: 5000 })

    // Cards 0-5 are group-stage (FixtureList sorts groups before knockout rounds)
    for (let i = 0; i < 6; i++) {
      const card = fixCards.nth(i)
      await card.locator('input[type="date"]').fill(TODAY)
      await page.waitForTimeout(400)
      await card.locator('select').nth(1).selectOption({ label: 'E2E Test Stadion — Galvenais laukums' })
      await page.waitForTimeout(400)
    }
    await page.waitForTimeout(500)
  })

  // ── 07: Enter group-stage scores via Matchday ─────────────────────────────
  test('07 · enter group-stage scores (home wins 2:0)', async () => {
    await page.goto('/admin/matchday')
    await expect(page.getByRole('heading', { name: 'U10' })).toBeVisible({ timeout: 12000 })

    const fixtureCards = page.locator('.card').filter({
      has: page.locator('input[type="number"]'),
    })
    await expect(fixtureCards.first()).toBeVisible({ timeout: 8000 })
    const totalCards = await fixtureCards.count()
    // Matchday shows all today's admin fixtures — previous runs may add extras
    expect(totalCards, 'should have at least 6 group-stage fixtures').toBeGreaterThanOrEqual(6)

    for (let i = 0; i < totalCards; i++) {
      const card = fixtureCards.nth(i)
      await card.locator('input[type="number"]').first().fill('2')
      await card.locator('input[type="number"]').nth(1).fill('0')
    }

    await page.getByRole('button', { name: 'Saglabāt visas' }).click()
    await expect(page.getByText('Visi rezultāti saglabāti!')).toBeVisible({ timeout: 10000 })
  })

  // ── 07b: Advance teams to knockout stage via admin standings ───────────────
  test('07b · advance group winners to playoff via standings button', async () => {
    await page.goto(`/admin/tournaments/${tournamentId}/standings`)
    await expect(page.getByText('U10')).toBeVisible({ timeout: 10000 })

    // Wait for advance button to be enabled (all group games completed)
    const advBtn = page.getByRole('button', { name: 'Virzīt komandas uz playoff' })
    await expect(advBtn).toBeEnabled({ timeout: 12000 })
    await advBtn.click()

    // handleAdvance sets real team IDs on SF fixtures; success state appears
    await expect(page.getByText('Komandas jau virzītas uz playoff')).toBeVisible({ timeout: 15000 })
  })

  // ── 07c: sbNode — seed 3rd-place and Final with SF winners/losers ─────────
  test('07c · seed Final and 3rd-place fixtures via sbNode', async () => {
    const { data: stages, error: stErr } = await sbNode.from('stages')
      .select('id, type')
      .eq('age_group_id', u10Id)
    if (stErr) throw stErr

    const knockoutStage = stages.find(s => s.type === 'knockout')
    expect(knockoutStage, 'knockout stage must exist').toBeTruthy()

    const { data: knockFx, error: kfErr } = await sbNode.from('fixtures')
      .select('id, home_team_id, away_team_id, home_placeholder')
      .eq('stage_id', knockoutStage.id)
    if (kfErr) throw kfErr

    // handleAdvance sets real teams on round-1 SF fixtures; home wins = home is winner
    const sf1 = knockFx.find(f => f.home_placeholder === 'Group A-1')
    const sf2 = knockFx.find(f => f.home_placeholder === 'Group B-1')
    expect(sf1?.home_team_id, 'SF1 home team must be set after advance').toBeTruthy()
    expect(sf2?.home_team_id, 'SF2 home team must be set after advance').toBeTruthy()

    const thirdPlace = knockFx.find(f => f.home_placeholder === 'SF1 zaudētājs')
    const final_ = knockFx.find(f => f.home_placeholder === 'SF1 uzvarētājs')
    expect(thirdPlace, '3rd-place fixture must exist').toBeTruthy()
    expect(final_, 'Final fixture must exist').toBeTruthy()

    // SF home wins → home_team_id = winner, away_team_id = loser
    const { error: tpErr } = await sbNode.from('fixtures')
      .update({ home_team_id: sf1.away_team_id, away_team_id: sf2.away_team_id })
      .eq('id', thirdPlace.id)
    if (tpErr) throw tpErr

    const { error: fErr } = await sbNode.from('fixtures')
      .update({ home_team_id: sf1.home_team_id, away_team_id: sf2.home_team_id })
      .eq('id', final_.id)
    if (fErr) throw fErr
  })

  // ── 07d: Set kickoff + pitch for 4 knockout fixtures ─────────────────────
  test('07d · set kickoff and pitch on knockout fixtures', async () => {
    await page.goto(`/admin/age-groups/${u10Id}/fixtures`)

    const fixCards = page.locator('.card').filter({ hasText: /pret/i })
    await expect(fixCards.first()).toBeVisible({ timeout: 5000 })
    await expect(fixCards).toHaveCount(10, { timeout: 5000 })

    // Cards 6-9 are knockout fixtures (sorted after group rounds by FixtureList)
    for (let i = 6; i < 10; i++) {
      const card = fixCards.nth(i)
      await card.locator('input[type="date"]').fill(TODAY)
      await page.waitForTimeout(400)
      await card.locator('select').nth(1).selectOption({ label: 'E2E Test Stadion — Galvenais laukums' })
      await page.waitForTimeout(400)
    }
    await page.waitForTimeout(500)
  })

  // ── 08: Enter knockout scores via Matchday ────────────────────────────────
  test('08 · enter knockout scores (home wins 2:0)', async () => {
    await page.goto('/admin/matchday')
    await expect(page.getByRole('heading', { name: 'U10' })).toBeVisible({ timeout: 12000 })

    const fixtureCards = page.locator('.card').filter({
      has: page.locator('input[type="number"]'),
    })
    await expect(fixtureCards.first()).toBeVisible({ timeout: 8000 })
    const totalCards = await fixtureCards.count()
    expect(totalCards, 'should have at least 4 knockout fixtures').toBeGreaterThanOrEqual(4)

    for (let i = 0; i < totalCards; i++) {
      const card = fixtureCards.nth(i)
      await card.locator('input[type="number"]').first().fill('2')
      await card.locator('input[type="number"]').nth(1).fill('0')
    }

    await page.getByRole('button', { name: 'Saglabāt visas' }).click()
    await expect(page.getByText('Visi rezultāti saglabāti!')).toBeVisible({ timeout: 10000 })
  })

  // ── 09: Admin standings — 6 teams across 2 groups ────────────────────────
  test('09 · admin standings show 6 teams across 2 groups', async () => {
    await page.goto(`/admin/tournaments/${tournamentId}/standings`)

    // The "advancing" indicator prepends ↑ inside the cell, so avoid exact match
    await expect(page.getByText('Alpha FC').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Beta FC').first()).toBeVisible()
    await expect(page.getByText('Gamma FC').first()).toBeVisible()
    await expect(page.getByText('Delta FC').first()).toBeVisible()
    await expect(page.getByText('Epsilon FC').first()).toBeVisible()
    await expect(page.getByText('Zeta FC').first()).toBeVisible()

    // Group A (3 rows) + Group B (3 rows) = 6 total tbody rows
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(6, { timeout: 8000 })
  })

  // ── 10: Public tournament main page — Grafiks/Tabula/Komandas have content ──
  test('10 · public tournament page loads', async () => {
    await page.goto(`/t/${tournamentSlug}`)
    await expect(page.getByText(TOURNAMENT_NAME).first()).toBeVisible({ timeout: 12000 })

    // Grafiks tab: click and verify a fixture row is visible
    await page.getByRole('button', { name: 'Grafiks', exact: true }).click()
    await expect(page.getByText('Alpha FC').first()).toBeVisible({ timeout: 10000 })

    // Tabula tab: click and verify standings table has rows
    await page.getByRole('button', { name: 'Tabula', exact: true }).click()
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 })

    // Komandas tab: click and verify teams are listed
    await page.getByRole('button', { name: 'Komandas', exact: true }).click()
    await expect(page.getByText('Alpha FC').first()).toBeVisible({ timeout: 10000 })
  })

  // ── 11: Public standings page (dedicated route) shows 6 rows ─────────────
  test('11 · public U10 standings page shows 6 rows', async () => {
    await page.goto(`/t/${tournamentSlug}/${u10Id}`)
    await expect(page.getByText('Alpha FC').first()).toBeVisible({ timeout: 12000 })
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(6, { timeout: 8000 })
  })

  // ── 12: Public schedule route shows fixtures with pitch info ──────────────
  test('12 · public schedule shows fixtures', async () => {
    await page.goto(`/t/${tournamentSlug}/${u10Id}/fixtures`)
    await expect(page.getByText('Alpha FC').first()).toBeVisible({ timeout: 12000 })
    await expect(page.getByText(/E2E Test Stadion/i).first()).toBeVisible({ timeout: 8000 })
  })
})
