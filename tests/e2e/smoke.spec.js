import { expect, test } from '@playwright/test';

const tournamentSlug = process.env.PLAYWRIGHT_PUBLIC_TOURNAMENT_SLUG || 'demo';

test('public homepage loads', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Fixturday/i);
  await expect(page.getByRole('link', { name: 'Ielogoties' })).toBeVisible();
});

test('public tournament page loads', async ({ page }) => {
  await page.goto(`/t/${tournamentSlug}`);

  await expect(page).toHaveURL(new RegExp(`/t/${tournamentSlug.replaceAll('.', '\\.')}`));
  await expect(page.locator('body')).toBeVisible();
});
