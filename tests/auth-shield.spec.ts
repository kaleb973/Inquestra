import { test, expect } from '@playwright/test';

test.describe('Edge-First Pre-Auth Risk Shield & Bcrypt Protection', () => {
  test('drops high-risk automated script requests immediately with HTTP 403', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      headers: {
        'User-Agent': 'python-requests/2.31.0',
        'Content-Type': 'application/json',
      },
      data: {
        email: 'test@inquestra.org',
        password: 'password123',
      },
    });

    expect(res.status()).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('ACCESS_DENIED');
  });

  test('returns HTTP 428 Precondition Required when request lacks browser client hints', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Omits sec-ch-ua and accept-language -> triggers medium risk (challenge required)
        'Content-Type': 'application/json',
      },
      data: {
        email: 'researcher@inquestra.org',
        password: 'password123',
      },
    });

    expect(res.status()).toBe(428);
    const json = await res.json();
    expect(json.code).toBe('CHALLENGE_REQUIRED');
    expect(json.riskScore).toBeGreaterThanOrEqual(30);
  });

  test('bypasses step-up challenge gate when a valid challenge token is provided', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'x-turnstile-token': 'test-valid-challenge-token',
        'Content-Type': 'application/json',
      },
      data: {
        email: 'unknown-researcher@inquestra.org',
        password: 'testPassword123!',
        challengeToken: 'test-valid-challenge-token',
      },
    });

    // Successfully passed the 428 challenge gate to credential verification (yielding 401 for unknown user)
    expect(res.status()).toBe(401);
  });
});
