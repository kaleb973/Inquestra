import { test, expect } from '@playwright/test';

test.describe('Trial Save and Load Routing & Auth Guards', () => {
  test('redirects unauthenticated users trying to access trial workspace to login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/.*login/);
  });

  test('login page contains necessary authentication elements for trial access', async ({ page }) => {
    await page.goto('/app/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
