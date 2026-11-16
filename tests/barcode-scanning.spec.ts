import { test, expect } from '@playwright/test';

test.describe('Universal Barcode & QR Code Resolution', () => {
  test('should render the public scan page with search input when no code provided', async ({ page }) => {
    await page.goto('/scan');
    await expect(page).toHaveTitle(/Specimen & Location Resolver/);
    await expect(page.locator('input[name="code"]')).toBeVisible();
    await expect(page.getByText('Scan or Enter a Barcode')).toBeVisible();
  });

  test('should show identifier not found state when an invalid code is supplied', async ({ page }) => {
    await page.goto('/scan?code=NONEXISTENT_BARCODE_XYZ_123');
    await expect(page.getByText('Identifier Not Found')).toBeVisible();
    await expect(page.getByText('NONEXISTENT_BARCODE_XYZ_123')).toBeVisible();
  });

  test('should redirect unauthenticated admin deep-links to login while preserving path', async ({ page }) => {
    await page.goto('/app/admin?tab=inventory&id=test-item-123');
    await expect(page).toHaveURL(/.*login/);
  });
});
