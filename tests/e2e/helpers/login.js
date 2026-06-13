export async function loginAsAdmin(page) {
  const email = process.env.PLAYWRIGHT_ADMIN_EMAIL;
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set PLAYWRIGHT_ADMIN_EMAIL and PLAYWRIGHT_ADMIN_PASSWORD before running admin tests.');
  }

  await page.context().clearCookies();
  await page.addInitScript(() => window.localStorage.clear());
  await page.goto('/admin');

  await page.getByLabel('E-pasts').fill(email);
  await page.getByLabel('Parole').fill(password);
  await page.getByRole('button', { name: 'Pieslēgties' }).click();

  await page.waitForURL('**/admin/dashboard', { timeout: 60_000 });
}
