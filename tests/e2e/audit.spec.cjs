const { test, expect } = require('@playwright/test')

const BASE = 'http://localhost:5173'
const SCREENSHOT_DIR = 'tests/e2e/screenshots'

test.use({ viewport: { width: 1280, height: 800 } })

test('homepage loads', async ({ page }) => {
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/01-homepage.png` })
  const h1 = await page.locator('h1').first().textContent().catch(() => 'none')
  console.log('H1:', h1)
})

test('guide page - check latvian strings gone', async ({ page }) => {
  await page.goto(`${BASE}/guide`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/02-guide.png` })
  const body = await page.locator('body').textContent()
  const latvianHits = ['Laukums', 'Komanda', 'Jānis', 'janis@piemers', 'tavs-turnira']
  latvianHits.forEach(word => {
    if (body.includes(word)) console.warn(`LATVIAN STILL PRESENT: "${word}"`)
    else console.log(`OK: "${word}" not found`)
  })
})

test('tournaments list', async ({ page }) => {
  await page.goto(`${BASE}/tournaments`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/03-tournaments.png` })
  const cards = await page.locator('.card').count()
  console.log('Cards:', cards)
})

test('blog index', async ({ page }) => {
  await page.goto(`${BASE}/blog`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/04-blog.png` })
  const posts = await page.locator('a[href*="/blog/"]').count()
  console.log('Blog post links:', posts)
})

test('blog FAQ schema injection', async ({ page }) => {
  await page.goto(`${BASE}/blog/five-a-side-tournament-guide`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/05-blog-five-aside.png` })
  const faqScript = await page.locator('#faq-ld-five-a-side').count()
  console.log('FAQ LD script present:', faqScript > 0)
  const blogScript = await page.locator('script[type="application/ld+json"]').count()
  console.log('Total LD+JSON scripts:', blogScript)
})

test('admin login page accessible', async ({ page }) => {
  await page.goto(`${BASE}/admin`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/06-admin-login.png` })
  const emailInput = await page.locator('input[type="email"]').count()
  console.log('Email input present:', emailInput > 0)
})

test('auth guard - unauthenticated redirect', async ({ page }) => {
  await page.goto(`${BASE}/admin/tournaments`)
  await page.waitForLoadState('networkidle')
  const url = page.url()
  console.log('Lands at:', url)
  console.log('Auth guard working:', !url.includes('/admin/tournaments'))
  await page.screenshot({ path: `${SCREENSHOT_DIR}/07-auth-guard.png` })
})

test('mobile 390px - homepage no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/08-mobile-home.png` })
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5)
  if (overflow) console.warn('HORIZONTAL OVERFLOW on mobile home!')
  else console.log('OK: no overflow on mobile home')
})

test('mobile 390px - guide no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${BASE}/guide`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/09-mobile-guide.png` })
  const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5)
  if (overflow) console.warn('HORIZONTAL OVERFLOW on mobile guide!')
  else console.log('OK: no overflow on mobile guide')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/09b-mobile-guide-scroll.png`, fullPage: true })
})

test('404 page', async ({ page }) => {
  await page.goto(`${BASE}/definitely-does-not-exist-xyz`)
  await page.waitForLoadState('networkidle')
  await page.screenshot({ path: `${SCREENSHOT_DIR}/10-404.png` })
  const body = await page.locator('body').textContent()
  console.log('404 content preview:', body.trim().slice(0, 120))
})

test('console errors - homepage', async ({ page }) => {
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  if (errors.length) console.warn('CONSOLE ERRORS:', errors.join('\n'))
  else console.log('OK: zero console errors on homepage')
})

test('console errors - guide', async ({ page }) => {
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(`${BASE}/guide`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  if (errors.length) console.warn('CONSOLE ERRORS on guide:', errors.join('\n'))
  else console.log('OK: zero console errors on guide')
})

test('console errors - tournaments', async ({ page }) => {
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(`${BASE}/tournaments`)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
  if (errors.length) console.warn('CONSOLE ERRORS on tournaments:', errors.join('\n'))
  else console.log('OK: zero console errors on tournaments')
})
