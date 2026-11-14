import { test, expect } from '@playwright/test';

test.describe('Health & Liveness Probes', () => {
  test('liveness probe returns HTTP 200 and healthy status', async ({ request }) => {
    const response = await request.get('/api/health?type=live');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.status).toBe('healthy');
    expect(json.probe).toBe('liveness');
    expect(typeof json.uptime).toBe('number');
  });
});
