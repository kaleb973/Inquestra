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

  test('hides cloud and admin links in default local mode while keeping direct login routes accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header a[href="/app/login"]')).toHaveCount(0);

    await page.goto('/app');
    await expect(page.locator('input[placeholder="Untitled Trial"]')).toBeVisible();

    await expect(page.getByRole('link', { name: /Sign In/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Back up to Cloud/i })).toHaveCount(0);
    await expect(page.locator('a[href="/app/admin"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'More actions and regulatory tools' }).click();
    const fallbackLogin = page.getByRole('link', { name: /Sign in \(existing account\)/i });
    await expect(fallbackLogin).toBeVisible();
    await expect(fallbackLogin).toHaveAttribute('href', '/app/login');
  });

  test('surfaces export backup alerts instead of claiming saved when localStorage quota is exceeded', async ({ page }) => {
    await page.goto('/app');

    const titleInput = page.locator('input[placeholder="Untitled Trial"]');
    await expect(titleInput).toBeVisible();
    await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 10_000 });

    await page.evaluate(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'inquestra-notebook-v1') {
          throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        }
        return originalSetItem.call(this, key, value);
      };
    });

    await titleInput.fill('Quota Overflow Experiment');

    const headerAlert = page.getByText('Storage full · Export backup');
    const canvasAlert = page.getByText('Storage limit reached · Export backup');
    await expect(headerAlert).toBeVisible({ timeout: 5_000 });
    await expect(canvasAlert).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Saved locally')).toHaveCount(0);

    await canvasAlert.click();
    await expect(page.getByRole('heading', { name: 'Export Experiment' })).toBeVisible();
  });

  test('captures and exports more than 500 telemetry samples in CSV while showing full session count', async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto('/app');

    await page.getByRole('button', { name: 'Toggle telemetry drawer' }).click();
    await page.getByLabel('Telemetry simulation signal').selectOption('ecg');
    await page.getByRole('button', { name: 'Start Biopotential Stream' }).click();

    const capturedCard = page
      .locator('.bg-card')
      .filter({ hasText: 'Captured' })
      .filter({ hasText: 'pts' })
      .first();

    await expect(async () => {
      const text = await capturedCard.innerText();
      const match = text.match(/(\d[\d,]*)\s*pts/);
      const count = match ? Number(match[1].replace(/,/g, '')) : 0;
      expect(count).toBeGreaterThan(505);
    }).toPass({ timeout: 25_000 });

    await page.getByRole('button', { name: 'Stop Simulator' }).click();

    const stoppedText = await capturedCard.innerText();
    const stoppedMatch = stoppedText.match(/(\d[\d,]*)\s*pts/);
    const finalCount = stoppedMatch ? Number(stoppedMatch[1].replace(/,/g, '')) : 0;
    expect(finalCount).toBeGreaterThan(505);

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export CSV' }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    let csv = '';
    for await (const chunk of stream) {
      csv += String(chunk);
    }

    const lines = csv.trim().split('\n');
    expect(lines[0]).toBe('time_s,value,unit,sensor_id,timestamp_iso');
    expect(lines.length).toBe(finalCount + 1);

    await page.getByRole('button', { name: 'Export experiment' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(`${finalCount.toLocaleString()} telemetry samples`)).toBeVisible();
    await expect(dialog.getByText('telemetry.csv')).toBeVisible();
  });
});
