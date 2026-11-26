import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';

function solveProofOfWorkToken(): string {
  const timestamp = Date.now().toString();
  for (let nonce = 0; nonce < 500_000; nonce++) {
    const hash = createHash('sha256')
      .update(`${timestamp}:${nonce}`)
      .digest('hex');
    if (hash.startsWith('000')) {
      return `pow:${timestamp}:${nonce}:${hash}`;
    }
  }
  throw new Error('Failed to solve PoW challenge within test bound');
}

test.describe('Edge-First Pre-Auth Risk Shield & Cryptographic PoW', () => {
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
    // Production server must omit numeric riskScore to prevent threshold oracle calibration
    const isProductionServer = !res.headers()['content-security-policy']?.includes("'unsafe-eval'");
    if (isProductionServer) {
      expect(json.riskScore).toBeUndefined();
    } else {
      expect(json.riskScore).toBeGreaterThanOrEqual(30);
    }
  });

  test('rejects forged Proof-of-Work challenge tokens with HTTP 428', async ({ request }) => {
    const forgedToken = `pow:${Date.now()}:42:${'000'.padEnd(64, 'f')}`;
    const res = await request.post('/api/auth/login', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'x-turnstile-token': forgedToken,
        'Content-Type': 'application/json',
      },
      data: {
        email: 'forged@inquestra.org',
        password: 'testPassword123!',
        challengeToken: forgedToken,
      },
    });

    expect(res.status()).toBe(428);
    const json = await res.json();
    expect(json.code).toBe('CHALLENGE_REQUIRED');
  });

  test('accepts a valid SHA-256 Proof-of-Work token once and blocks replay attempts', async ({ request }) => {
    const validPow = solveProofOfWorkToken();

    const firstRes = await request.post('/api/auth/login', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'x-turnstile-token': validPow,
        'Content-Type': 'application/json',
      },
      data: {
        email: 'unknown-researcher@inquestra.org',
        password: 'testPassword123!',
        challengeToken: validPow,
      },
    });

    // Successfully passed the 428 challenge gate to credential verification (yielding 401 for unknown user)
    expect(firstRes.status()).toBe(401);

    // Replaying the exact same PoW token must be blocked at the challenge gate (428)
    const replayRes = await request.post('/api/auth/login', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'x-turnstile-token': validPow,
        'Content-Type': 'application/json',
      },
      data: {
        email: 'unknown-researcher@inquestra.org',
        password: 'testPassword123!',
        challengeToken: validPow,
      },
    });

    expect(replayRes.status()).toBe(428);
  });
});
