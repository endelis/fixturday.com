/**
 * Full tournament lifecycle E2E test.
 *
 * Covers the complete admin + public journey:
 *   1.  Create tournament
 *   2.  Add U10 age group (round_robin)
 *   3.  Add 4 teams
 *   4.  Bulk-confirm teams
 *   5.  Generate fixtures (6 round-robin matches)
 *   6.  Assign kickoff times (today) so Matchday can load them
 *   7.  Enter scores via Matchday page
 *   8.  Verify admin standings table
 *   9.  Public tournament page loads
 *  10.  Public standings show 4 teams
 *  11.  Public schedule shows fixtures
 *
 * The tournament is LEFT in the database after the run so it can be reviewed.
 */

import { expect, test } from '@playwright/test'

// ── Shared state (serial run inside one browser context) ──────────────────────
const TODAY = new Date().toISOString().split('T')[0] // yyyy-MM-dd
const RUN_ID = Date.now().toString().slice(-5)        // 5-digit suffix, unique per run
const TOURNAMENT_NAME = `E2E Test ${TODAY} ${RUN_ID}`

let context, page
let tournamentId, tournamentSlug, u10Id

// ── slugify mirrors src/pages/Admin/Tournaments/New.jsx ──────────────────────
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

test.describe.serial('Full Tournament Lifecycle', () => {
  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext()

    // Pre-set cookie consent so the fixed bottom banner never appears and
    // blocks button clicks during the test.
    await context.addInitScript(() => {
      localStorage.setItem('fixturday_cookie_consent', 'all')
    })

    page = await context.newPage()

    // Inline login — do NOT use the loginAsAdmin helper here because it calls
    // page.addInitScript to clear localStorage, which would fire on every
    // subsequent navigation in this shared context and log the user out.
    const email = process.env.PLAYWRIGHT_ADMIN_EMAIL
    const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD
    if (!email || !password) throw new Error('Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD')

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

    // Slug auto-fills via onChange — wait for it
    await expect(page.locator('input[name="slug"]')).not.toHaveValue('', { timeout: 3000 })

    await page.getByRole('button', { name: 'Izveidot turnīru' }).click()
    await page.waitForURL(/\/admin\/tournaments\/[^/]+\/overview/, { timeout: 15000 })

    const match = page.url().match(/\/admin\/tournaments\/([^/]+)\/overview/)
    expect(match, 'should redirect to tournament overview').toBeTruthy()
    tournamentId = match[1]
    tournamentSlug = slugify(TOURNAMENT_NAME)

    await expect(page.getByText(TOURNAMENT_NAME).first()).toBeVisible()

    // Pre-dismiss the setup wizard — it's keyed by tournament ID in localStorage
    // and would block all click interactions on tournament sub-pages.
    await page.evaluate((id) => {
      localStorage.setItem(`fixturday_wizard_dismissed_${id}`, 'true')
    }, tournamentId)
  })

  // ── 02: Add U10 age group ─────────────────────────────────────────────────
  test('02 · add U10 age group (round_robin)', async () => {
    await page.goto(`/admin/tournaments/${tournamentId}/age-groups`)
    await page.getByRole('button', { name: /Jauna vecuma grupa/i }).click()

    await page.locator('input[placeholder="U10"]').fill('U10')
    // format select defaults to round_robin — leave as-is
    await page.getByRole('button', { name: 'Saglabāt' }).click()

    await expect(page.getByText('U10')).toBeVisible({ timeout: 8000 })

    // Capture the age-group UUID from the Teams link href
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

    // Create venue
    await page.getByRole('button', { name: /Jauna vieta/i }).click()
    await page.locator('input[name="name"]').fill('E2E Test Stadion')
    await page.getByRole('button', { name: 'Pievienot vietu' }).click()
    await expect(page.getByText('E2E Test Stadion')).toBeVisible({ timeout: 8000 })

    // Add pitch to the venue
    await page.getByRole('button', { name: /Jauns laukums/i }).click()
    await page.locator('input[placeholder="Laukuma nosaukums"]').fill('Galvenais laukums')
    await page.getByRole('button', { name: 'Pievienot' }).click()
    await expect(page.getByText('Galvenais laukums')).toBeVisible({ timeout: 8000 })
  })

  // ── 03: Add 4 teams ───────────────────────────────────────────────────────
  test('03 · add 4 teams to U10', async () => {
    await page.goto(`/admin/age-groups/${u10Id}/teams`)

    for (const name of ['Alpha FC', 'Beta FC', 'Gamma FC', 'Delta FC']) {
      await page.getByRole('button', { name: /\+ Jauna komanda/i }).click()
      // react-hook-form registers this as name="name" — no htmlFor/id association
      await page.locator('input[name="name"]').fill(name)
      await page.getByRole('button', { name: 'Pievienot' }).click()
      await expect(page.getByText(name)).toBeVisible({ timeout: 8000 })
    }
  })

  // ── 04: Bulk-confirm all teams ────────────────────────────────────────────
  test('04 · bulk-confirm all 4 teams', async () => {
    await page.goto(`/admin/age-groups/${u10Id}/teams`)

    // Accept the native confirm() dialog that bulkApprove() triggers
    page.once('dialog', d => d.accept())
    await page.getByRole('button', { name: 'Apstiprināt visas' }).click()

    // All 4 cards should flip to "Apstiprināta" (badge-success)
    await expect(page.locator('.badge-success')).toHaveCount(4, { timeout: 10000 })
  })

  // ── 05: Generate round-robin fixtures ────────────────────────────────────
  test('05 · generate 6 round-robin fixtures', async () => {
    await page.goto(`/admin/age-groups/${u10Id}/fixtures`)
    await page.getByRole('button', { name: /Ģenerēt spēles/i }).click()

    // 4-team round robin = 6 fixtures across 3 rounds
    await expect(page.getByText(/Kārta/i).first()).toBeVisible({ timeout: 10000 })
    // Each fixture card contains the "vs" text "pret" between team name spans;
    // JSX adjacent spans produce no whitespace, so match without surrounding spaces.
    const fixCards = page.locator('.card').filter({ hasText: /pret/i })
    await expect(fixCards).toHaveCount(6, { timeout: 10000 })
  })

  // ── 06: Set kickoff times + pitch on all fixtures ────────────────────────
  test('06 · set kickoff times and pitch on all fixtures', async () => {
    await page.goto(`/admin/age-groups/${u10Id}/fixtures`)

    // Use fixture cards (contains "pret") rather than bare date inputs so we
    // can also select the pitch select that follows each DateTimePicker.
    const fixCards = page.locator('.card').filter({ hasText: /pret/i })
    await expect(fixCards.first()).toBeVisible({ timeout: 5000 })
    const count = await fixCards.count()
    expect(count, 'should have 6 fixture cards').toBe(6)

    for (let i = 0; i < count; i++) {
      const card = fixCards.nth(i)
      const di = card.locator('input[type="date"]')
      await di.fill(TODAY)
      // onChange fires immediately and saves kickoff via updateFixture.
      // Wait for the Supabase round-trip + load() re-render to settle before
      // the next control — a mid-loop load() clears kickoffDrafts and can reset
      // the controlled input value before onBlur fires.
      await page.waitForTimeout(800)
      // Assign pitch — nth(0) is the time-slot select (inside DateTimePicker),
      // nth(1) is the pitch select that follows it.
      await card.locator('select').nth(1).selectOption({
        label: 'E2E Test Stadion — Galvenais laukums',
      })
      await page.waitForTimeout(800)
    }
    // Buffer so the last pitch save + load() fully completes before Matchday
    await page.waitForTimeout(500)
  })

  // ── 07: Enter scores via Matchday ─────────────────────────────────────────
  test('07 · enter scores on Matchday (home wins 2-1 everywhere)', async () => {
    await page.goto('/admin/matchday')

    // Matchday defaults to today; U10 group heading should appear
    await expect(page.getByRole('heading', { name: 'U10' })).toBeVisible({ timeout: 12000 })

    // Each fixture card has two input[type="number"] (home : away).
    // Matchday shows ALL admin fixtures for today — previous partial runs may have
    // left extra fixtures, so assert at least 6 and score them all.
    const fixtureCards = page.locator('.card').filter({
      has: page.locator('input[type="number"]'),
    })
    await expect(fixtureCards.first()).toBeVisible({ timeout: 8000 })
    const totalCards = await fixtureCards.count()
    expect(totalCards, 'should have at least 6 fixture cards').toBeGreaterThanOrEqual(6)

    // Fill all visible cards: home = 2, away = 1
    for (let i = 0; i < totalCards; i++) {
      const card = fixtureCards.nth(i)
      await card.locator('input[type="number"]').first().fill('2')
      await card.locator('input[type="number"]').nth(1).fill('1')
    }

    // Save all at once
    await page.getByRole('button', { name: 'Saglabāt visas' }).click()
    await expect(
      page.getByText('Visi rezultāti saglabāti!'),
    ).toBeVisible({ timeout: 10000 })
  })

  // ── 08: Admin standings ───────────────────────────────────────────────────
  test('08 · admin standings show 4 teams with points', async () => {
    await page.goto(`/admin/tournaments/${tournamentId}/standings`)

    await expect(page.getByText('Alpha FC')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Beta FC')).toBeVisible()
    await expect(page.getByText('Gamma FC')).toBeVisible()
    await expect(page.getByText('Delta FC')).toBeVisible()

    // Each team played 3 games; home team wins each → leaders have 9 pts
    // Just verify the table has 4 rows
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(4, { timeout: 8000 })
  })

  // ── 09: Public tournament page ────────────────────────────────────────────
  test('09 · public tournament page loads', async () => {
    await page.goto(`/t/${tournamentSlug}`)
    await expect(page.getByText(TOURNAMENT_NAME).first()).toBeVisible({ timeout: 12000 })
  })

  // ── 10: Public standings ──────────────────────────────────────────────────
  test('10 · public standings for U10 show 4 rows', async () => {
    // The public standings route uses the age-group UUID: /t/:slug/:ageGroupId
    await page.goto(`/t/${tournamentSlug}/${u10Id}`)

    await expect(page.getByText('Alpha FC')).toBeVisible({ timeout: 12000 })
    const rows = page.locator('table tbody tr')
    await expect(rows).toHaveCount(4, { timeout: 8000 })
  })

  // ── 11: Public schedule ───────────────────────────────────────────────────
  test('11 · public schedule shows fixtures with pitch info', async () => {
    await page.goto(`/t/${tournamentSlug}/${u10Id}/fixtures`)

    // At least one team name and the pitch info should be visible
    await expect(page.getByText('Alpha FC').first()).toBeVisible({ timeout: 12000 })
    await expect(page.getByText(/E2E Test Stadion/i).first()).toBeVisible({ timeout: 8000 })
  })
})
