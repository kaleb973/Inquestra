import { test, expect } from '@playwright/test';

test.describe('Experiment Sealing & Provenance Controls', () => {
  test('protects /app/admin behind login and enforces guest auth guard & case-sensitive SEAL modal in /app', async ({ page }) => {
    // 1. Admin control plane must still require authentication
    await page.goto('/app/admin');
    await expect(page).toHaveURL(/\/app\/login/);

    // 2. Workspace operates in Local Notebook mode for unauthenticated visitors
    await page.goto('/app');
    const titleInput = page.locator('input[placeholder="Untitled Trial"]');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toBeEnabled();

    // 3. Open Seal confirmation modal via Header Regulatory Actions menu
    await page.getByRole('button', { name: 'More actions and regulatory tools' }).click();
    await page.getByRole('button', { name: 'Seal Trial Record…' }).click();

    const sealDialog = page.getByRole('dialog');
    await expect(sealDialog).toBeVisible();
    await expect(sealDialog).toContainText('Seal Experiment Permanently');
    // Unauthenticated Local Notebook users are informed server-side cryptographic sealing requires an account
    await expect(sealDialog).toContainText('require an authenticated account');

    const confirmBtn = sealDialog.getByRole('button', { name: 'Seal Experiment' });
    const confirmInput = sealDialog.locator('#seal-confirm-input');

    // Lowercase "seal" must NOT enable permanent sealing
    await confirmInput.fill('seal');
    await expect(confirmBtn).toBeDisabled();
    await expect(sealDialog).toContainText('Must be capital letters');

    // Exact uppercase "SEAL" unlocks the confirmation button
    await confirmInput.fill('SEAL');
    await expect(confirmBtn).toBeEnabled();

    // Escape key dismisses modal
    await page.keyboard.press('Escape');
    await expect(sealDialog).toBeHidden();
  });

  test('interactive /demo console computes deterministic 64-hex SHA-256 seal', async ({ page }) => {
    await page.goto('/demo');
    const sealBtn = page.getByRole('button', { name: 'Seal Trial Record' });
    await expect(sealBtn).toBeVisible();
    await sealBtn.click();

    await expect(page.getByText('Trial Sealed (Read-Only)')).toBeVisible();
    await expect(page.locator('dd').filter({ hasText: /^[a-f0-9]{64}$/ })).toBeVisible();
  });
});
