import { test, expect } from '@playwright/test';

const MARKETING_ROUTES = [
  '/',
  '/compare',
  '/compare/benchling-alternative',
  '/compare/labarchives-alternative',
  '/faq',
  '/about',
  '/hardware',
  '/provenance',
  '/architecture',
  '/demo',
  '/contact',
  '/terms',
  '/privacy',
];

test.describe('Marketing SSR, SEO Metadata & Crawlability', () => {
  test('all public marketing pages render full SSR HTML with unique title, H1, description, and canonical link', async ({ request }) => {
    for (const route of MARKETING_ROUTES) {
      const res = await request.get(route);
      expect(res.status(), `Route ${route} should return 200`).toBe(200);

      const html = await res.text();
      expect(html, `Route ${route} should SSR an <h1>`).toMatch(/<h1[^>]*>[\s\S]+?<\/h1>/i);
      expect(html, `Route ${route} should SSR a <title>`).toMatch(/<title>[^<]+<\/title>/i);
      expect(html, `Route ${route} should SSR meta description`).toMatch(/<meta[^>]+name="description"[^>]+content="[^"]+"/i);
      const expectedCanonicalPattern =
        route === '/'
          ? /<link[^>]+rel="canonical"[^>]+href="https:\/\/inquestra\.org\/?"/i
          : new RegExp(`<link[^>]+rel="canonical"[^>]+href="https://inquestra\\.org${route}"`, 'i');
      expect(html, `Route ${route} should SSR canonical URL`).toMatch(expectedCanonicalPattern);
    }
  });

  test('homepage includes SoftwareApplication structured JSON-LD and OG tags in SSR HTML', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);

    const html = await res.text();
    expect(html).toContain('application/ld+json');
    expect(html).toContain('SoftwareApplication');
    expect(html).toMatch(/<meta[^>]+property="og:title"/i);
  });

  test('sitemap.xml and robots.txt are valid and reflect live routes', async ({ request }) => {
    const sitemapRes = await request.get('/sitemap.xml');
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain('<urlset');
    expect(sitemapXml).toContain('https://inquestra.org/compare');
    expect(sitemapXml).toContain('https://inquestra.org/hardware');
    expect(sitemapXml).toContain('https://inquestra.org/demo');
    expect(sitemapXml).toContain('https://inquestra.org/privacy');

    const robotsRes = await request.get('/robots.txt');
    expect(robotsRes.status()).toBe(200);
    const robotsTxt = await robotsRes.text();
    expect(robotsTxt).toContain('Disallow: /app/');
    expect(robotsTxt).toContain('Disallow: /api/');
    expect(robotsTxt).toContain('Sitemap: https://inquestra.org/sitemap.xml');
  });

  test('removed /constellation route returns HTTP 404', async ({ request }) => {
    const res = await request.get('/constellation');
    expect(res.status()).toBe(404);
  });
});
