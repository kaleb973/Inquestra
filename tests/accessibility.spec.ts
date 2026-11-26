import { test, expect } from '@playwright/test';

const AUDIT_ROUTES = ['/', '/demo', '/scan', '/app', '/app/login'];

test.describe('WCAG 2.2 Accessibility & Runtime Integrity', () => {
  test('core routes render cleanly with main landmark, zero runtime errors, labeled controls, and safe external links', async ({ page }) => {
    const pageErrors: string[] = [];
    const hydrationErrors: string[] = [];

    page.on('pageerror', (err) => {
      pageErrors.push(`${page.url()}: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (/Hydration|Minified React error|Uncaught/i.test(text)) {
          hydrationErrors.push(`${page.url()}: ${text}`);
        }
      }
    });

    for (const route of AUDIT_ROUTES) {
      await page.goto(route);

      if (route === '/app') {
        await expect(page.locator('input[placeholder="Untitled Trial"]')).toBeVisible();
      } else {
        await expect(page.locator('main')).toBeVisible();
      }

      // Every visible button must have an accessible name
      const unnamedButtons = await page.evaluate(() => {
        const results: string[] = [];
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const btn of buttons) {
          const style = window.getComputedStyle(btn);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          const rect = btn.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;

          const text = (btn.innerText || btn.textContent || '').trim();
          const ariaLabel = (btn.getAttribute('aria-label') || '').trim();
          const ariaLabelledBy = (btn.getAttribute('aria-labelledby') || '').trim();
          if (!text && !ariaLabel && !ariaLabelledBy) {
            results.push(btn.outerHTML.slice(0, 120));
          }
        }
        return results;
      });
      expect(unnamedButtons, `Unnamed buttons on ${route}`).toEqual([]);

      // Every external _blank link must include rel="noopener"
      const unsafeBlankLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[target="_blank"]'));
        return links
          .filter((a) => {
            const rel = (a.getAttribute('rel') || '').toLowerCase();
            return !rel.includes('noopener');
          })
          .map((a) => a.outerHTML.slice(0, 120));
      });
      expect(unsafeBlankLinks, `Unsafe target=_blank links on ${route}`).toEqual([]);
    }

    expect(pageErrors).toEqual([]);
    expect(hydrationErrors).toEqual([]);
  });

  test('keyboard Escape dismisses workspace Export and Import modals', async ({ page }) => {
    await page.goto('/app');
    await expect(page.locator('input[placeholder="Untitled Trial"]')).toBeVisible();

    // Test Export modal Escape dismissal
    await page.getByRole('button', { name: 'Export experiment' }).click();
    const exportDialog = page.getByRole('dialog');
    await expect(exportDialog).toBeVisible();
    await expect(exportDialog).toContainText('Export Experiment');
    await page.keyboard.press('Escape');
    await expect(exportDialog).toBeHidden();

    // Test Import modal Escape dismissal
    await page.getByRole('button', { name: 'Import trial from archive' }).click();
    const importDialog = page.getByRole('dialog');
    await expect(importDialog).toBeVisible();
    await expect(importDialog).toContainText('Import Trial & Research Notes');
    await page.keyboard.press('Escape');
    await expect(importDialog).toBeHidden();
  });
});
