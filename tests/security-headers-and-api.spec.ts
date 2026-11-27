import { test, expect } from '@playwright/test';
import { sanitizeTipTapAST } from '../src/lib/security/trialImportSanitizer';
import { createSerialStreamContext, parseSerialLine } from '../src/lib/serialParser';

test.describe('Security Headers, CSP & Payload Sanitization', () => {
  test('middleware enforces enterprise security headers and omits X-Powered-By', async ({ request }) => {
    for (const route of ['/', '/app', '/app/login']) {
      const res = await request.get(route);
      expect(res.status()).toBe(200);

      const headers = res.headers();
      expect(headers['x-powered-by']).toBeUndefined();
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['cross-origin-opener-policy']).toBe('same-origin');
      expect(headers['permissions-policy']).toContain('camera=()');

      const csp = headers['content-security-policy'];
      expect(csp).toBeDefined();
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'self'");
    }
  });

  test('/api/pilot-interest validates payloads and returns 422 on malformed input', async ({ request }) => {
    const res = await request.post('/api/pilot-interest', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        name: '',
        email: 'not-an-email\r\nBcc: attacker@evil.test',
        institution: '',
      },
    });

    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('Validation failed.');
    expect(json.dispatchError).toBeUndefined();
  });

  test('sanitizeTipTapAST strips script nodes, disallowed marks, and javascript: links', () => {
    const dirtyDoc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Safe reagent label',
              marks: [
                {
                  type: 'link',
                  attrs: { href: 'javascript:alert(1)' },
                },
                {
                  type: 'xssMark',
                },
              ],
            },
          ],
        },
        {
          type: 'script',
          attrs: { src: 'https://evil.example/payload.js' },
        },
      ],
    };

    const cleaned = sanitizeTipTapAST(dirtyDoc);
    expect(cleaned).not.toBeNull();
    const serialized = JSON.stringify(cleaned);
    expect(serialized).not.toContain('javascript:');
    expect(serialized).not.toContain('xssMark');
    expect(serialized).not.toContain('evil.example');
    expect(serialized).toContain('Safe reagent label');
  });

  test('parseSerialLine extracts measurements from FirmwareShowcase CSV, headers, JSON, and scalars', () => {
    const withHeader = createSerialStreamContext();
    expect(parseSerialLine('# inquestra:format=csv,channels=time_ms,value,unit=mV', withHeader)).toBeNull();
    expect(parseSerialLine('10240,1650', withHeader)).toEqual({
      value: 1650,
      unit: 'mV',
      sensorId: 'value',
    });

    const midStream = createSerialStreamContext();
    expect(parseSerialLine('12500,1423', midStream)).toEqual({ value: 1423 });
    expect(parseSerialLine('temp:25.4', midStream)).toEqual({ value: 25.4, sensorId: 'temp' });
    expect(parseSerialLine('{"mv":312.5,"unit":"mV"}', midStream)).toEqual({
      value: 312.5,
      unit: 'mV',
      sensorId: 'mv',
    });
    expect(parseSerialLine('42.1', midStream)).toEqual({ value: 42.1 });
  });

  test('/api/metrics accepts zero-PII aggregate counters, rejects invalid payloads, and blocks GA4 pre-consent', async ({ request, page }) => {
    const validRes = await request.post('/api/metrics', {
      headers: { 'Content-Type': 'application/json' },
      data: { event: 'export_triggered', format: 'csv' },
    });
    expect(validRes.status()).toBe(200);
    expect(await validRes.json()).toEqual({ ok: true });

    const invalidRes = await request.post('/api/metrics', {
      headers: { 'Content-Type': 'application/json' },
      data: { event: 'arbitrary_event', format: 'exe' },
    });
    expect(invalidRes.status()).toBe(422);

    await page.goto('/app');
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  });
});
