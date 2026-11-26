import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const DISALLOWED_PATHS = ['/app', '/app/', '/api/', '/scan'];

const CRAWLER_AGENTS = [
  '*',
  'GPTBot',
  'PerplexityBot',
  'ClaudeBot',
  'anthropic-ai',
  'Google-Extended',
  'Applebot-Extended',
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: CRAWLER_AGENTS.map((userAgent) => ({
      userAgent,
      allow: '/',
      disallow: DISALLOWED_PATHS,
    })),
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
