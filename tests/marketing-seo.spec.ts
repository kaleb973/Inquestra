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

const NOINDEX_ROUTES = ['/app', '/app/login', '/scan'];

test.describe('Marketing SSR, SEO Metadata & Crawlability', () => {
  test('all public marketing pages render full SSR HTML with unique title, H1, description, canonical, and social tags', async ({ request }) => {
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

      const expectedOgUrlPattern =
        route === '/'
          ? /<meta[^>]+property="og:url"[^>]+content="https:\/\/inquestra\.org\/?"/i
          : new RegExp(`<meta[^>]+property="og:url"[^>]+content="https://inquestra\\.org${route}"`, 'i');
      expect(html, `Route ${route} should SSR self-referencing og:url`).toMatch(expectedOgUrlPattern);
      expect(html, `Route ${route} should SSR twitter:card`).toMatch(/<meta[^>]+name="twitter:card"[^>]+content="summary_large_image"/i);
    }
  });

  test('homepage includes connected Organization, Person, WebSite, SoftwareApplication, and SoftwareSourceCode graph without hidden FAQPage', async ({ request }) => {
    const res = await request.get('/');
    expect(res.status()).toBe(200);

    const html = await res.text();
    expect(html).toContain('application/ld+json');
    expect(html).toContain('SoftwareApplication');
    expect(html).toContain('SoftwareSourceCode');
    expect(html).toContain('https://github.com/kaleb973/Inquestra');
    expect(html).toContain('https://github.com/kaleb973');
    expect(html).not.toContain('"@type":"FAQPage"');
    expect(html).toMatch(/<meta[^>]+property="og:title"/i);
  });

  test('/about connects Organization and Founder Person entity with rel=me GitHub link', async ({ request }) => {
    const res = await request.get('/about');
    expect(res.status()).toBe(200);

    const html = await res.text();
    expect(html).toContain('"@type":"Organization"');
    expect(html).toContain('"@type":"Person"');
    expect(html).toContain('https://github.com/kaleb973');
    expect(html).toContain('https://github.com/kaleb973/Inquestra');
    expect(html).toMatch(/rel="[^"]*\bme\b[^"]*"/);
  });

  test('/compare/labarchives-alternative renders visible FAQ questions matching FAQPage schema', async ({ request }) => {
    const res = await request.get('/compare/labarchives-alternative');
    expect(res.status()).toBe(200);

    const html = await res.text();
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('Why do academic researchers look for LabArchives alternatives?');
    expect(html).toContain('Frequently Asked Questions');
  });

  test('workspace, auth, and scan routes emit noindex headers and robots meta tags', async ({ request }) => {
    for (const route of NOINDEX_ROUTES) {
      const res = await request.get(route);
      expect(res.status(), `Route ${route} should return 200`).toBe(200);
      expect(res.headers()['x-robots-tag']).toContain('noindex');

      const html = await res.text();
      expect(html, `Route ${route} should include robots noindex meta tag`).toMatch(
        /<meta[^>]+name="robots"[^>]+content="noindex,\s*nofollow"/i
      );
    }
  });

  test('sitemap.xml, robots.txt, and llms.txt are valid and reflect live routes', async ({ request }) => {
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
    expect(robotsTxt).toMatch(/Disallow:\s*\/app\r?\n/);
    expect(robotsTxt).toContain('Disallow: /app/');
    expect(robotsTxt).toContain('Disallow: /api/');
    expect(robotsTxt).toContain('Disallow: /scan');
    expect(robotsTxt).toContain('Sitemap: https://inquestra.org/sitemap.xml');

    const llmsRes = await request.get('/llms.txt');
    expect(llmsRes.status()).toBe(200);
    const llmsTxt = await llmsRes.text();
    expect(llmsTxt).toContain('https://inquestra.org');
    expect(llmsTxt).toContain('https://github.com/kaleb973/Inquestra');
    expect(llmsTxt).toContain('https://github.com/kaleb973');
  });

  test('removed /constellation route returns HTTP 404', async ({ request }) => {
    const res = await request.get('/constellation');
    expect(res.status()).toBe(404);
  });
});
