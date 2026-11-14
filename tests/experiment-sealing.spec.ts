import { test, expect } from '@playwright/test';

test.describe('Experiment Sealing', () => {
  test('should require authentication for accessing workspace', async ({ page }) => {
    // Navigate to workspace directly
    await page.goto('/app');
    
    // Inquestra redirects to login if unauthenticated
    await expect(page).toHaveURL(/.*login/);
  });
});
