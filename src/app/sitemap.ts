import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const CORE_LAST_MODIFIED = new Date('2026-11-26T00:00:00Z');
const LEGAL_LAST_MODIFIED = new Date('2026-09-30T00:00:00Z');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/compare/benchling-alternative`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/compare/labarchives-alternative`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/hardware`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/provenance`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/architecture`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/demo`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: CORE_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: LEGAL_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}
