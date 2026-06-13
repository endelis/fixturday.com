import { expect, test } from '@playwright/test';
import { loginAsAdmin } from '../helpers/login.js';

const hasAdminCredentials = Boolean(process.env.PLAYWRIGHT_ADMIN_EMAIL && process.env.PLAYWRIGHT_ADMIN_PASSWORD);
const adminTest = hasAdminCredentials ? test : test.skip;

test('redirects unauthenticated users to /admin', async ({ page }) => {
  await page.context().clearCookies();
  await page.addInitScript(() => window.localStorage.clear());

  await page.goto('/admin/dashboard');

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('button', { name: 'Pieslēgties' })).toBeVisible();
});

adminTest('logs in successfully', async ({ page }) => {
  await loginAsAdmin(page);

  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByRole('button', { name: 'Iziet' })).toBeVisible();
});

adminTest('logs out successfully', async ({ page }) => {
  await loginAsAdmin(page);

  await page.getByRole('button', { name: 'Iziet' }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('button', { name: 'Pieslēgties' })).toBeVisible();
});
