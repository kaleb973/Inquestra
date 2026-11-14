import { test, expect } from '@playwright/test';

test.describe('Inventory Routing', () => {
  test('should redirect unauthenticated users to login when accessing admin', async ({ page }) => {
    // Navigate to admin
    await page.goto('/app/admin');
    
    // Check if redirected to login page due to lack of admin auth session
    await expect(page).toHaveURL(/.*login/);
  });
});
