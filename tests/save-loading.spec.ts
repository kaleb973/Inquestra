import { test, expect } from '@playwright/test';

test.describe('Trial Persistence, Routing & Login Flow', () => {
  test('persists local notebook title edits across page reloads', async ({ page }) => {
    await page.goto('/app');

    const titleInput = page.locator('input[placeholder="Untitled Trial"]');
    await expect(titleInput).toBeVisible();

    const uniqueTitle = 'Catalytic Hydrolysis Run #42';
    await titleInput.fill(uniqueTitle);
    await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(page.locator('input[placeholder="Untitled Trial"]')).toHaveValue(uniqueTitle);
  });

  test('redirects protected billing routes to login and completes step-1 -> step-2 login form', async ({ page }) => {
    await page.goto('/app/billing');
    await expect(page).toHaveURL(/\/app\/login\?redirectTo=%2Fapp%2Fbilling/);

    await page.goto('/app/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    await emailInput.fill('researcher@inquestra.org');
    await page.getByRole('button', { name: /Continue/ }).click();

    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show password' })).toBeVisible();
  });
});
