import { test, expect } from '@playwright/test';

test.describe('Health & Liveness Probes', () => {
  test('liveness probe returns HTTP 200 without leaking runtime configuration', async ({ request }) => {
    const response = await request.get('/api/health?type=live');
    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');

    const json = await response.json();
    expect(json.status).toBe('healthy');
    expect(json.probe).toBe('liveness');
    expect(typeof json.timestamp).toBe('string');

    // Verify internal fingerprinting / env key disclosure stays redacted
    expect(json.uptime).toBeUndefined();
    expect(json.detectedMatchingKeys).toBeUndefined();
    expect(json.resendConfigured).toBeUndefined();
  });

  test('readiness probe omits raw database error stacks or connection strings', async ({ request }) => {
    const response = await request.get('/api/health?type=ready');
    expect([200, 503]).toContain(response.status());

    const json = await response.json();
    expect(json.probe).toBe('readiness');
    expect(json.database).toBeDefined();
    expect(json.database.error).toBeUndefined();
    expect(json.detectedMatchingKeys).toBeUndefined();
  });
});
