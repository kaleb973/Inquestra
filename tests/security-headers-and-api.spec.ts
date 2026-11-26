import { test, expect } from '@playwright/test';
import { sanitizeTipTapAST } from '../src/lib/security/trialImportSanitizer';

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
});
