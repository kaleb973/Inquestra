import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/app/', '/api/'] },
      { userAgent: 'GPTBot', allow: '/', disallow: ['/app/', '/api/'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/app/', '/api/'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/app/', '/api/'] },
      { userAgent: 'anthropic-ai', allow: '/', disallow: ['/app/', '/api/'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/app/', '/api/'] },
      { userAgent: 'Applebot-Extended', allow: '/', disallow: ['/app/', '/api/'] },
    ],
    sitemap: 'https://inquestra.org/sitemap.xml',
  };
}
