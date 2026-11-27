import type { Metadata } from 'next';

export const SITE_URL = 'https://inquestra.org';
export const GITHUB_PROFILE_URL = 'https://github.com/kaleb973';
export const GITHUB_REPO_URL = 'https://github.com/kaleb973/Inquestra';

export const ENTITY_IDS = {
  organization: `${SITE_URL}/#organization`,
  founder: `${SITE_URL}/about#kaleb`,
  website: `${SITE_URL}/#website`,
  software: `${SITE_URL}/#software`,
  sourceCode: `${SITE_URL}/#source-code`,
} as const;

export const DEFAULT_OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'Inquestra: Open Electronic Lab Notebook',
} as const;

export type SchemaNode = Record<string, unknown>;

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  absoluteTitle?: boolean;
}

/**
 * Generates consistent route metadata with self-referencing canonicals, Open Graph, and Twitter cards.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  absoluteTitle = false,
}: PageMetadataOptions): Metadata {
  const canonicalUrl = path === '/' ? SITE_URL : `${SITE_URL}${path}`;
  const socialTitle = absoluteTitle ? title : `${title} | Inquestra`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: 'Inquestra',
      url: canonicalUrl,
      title: socialTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

/**
 * Builds the Person schema node for the project founder and lead maintainer.
 */
export function buildFounderPerson(): SchemaNode {
  return {
    '@type': 'Person',
    '@id': ENTITY_IDS.founder,
    name: 'Kaleb',
    alternateName: 'kaleb973',
    jobTitle: 'Founder and Lead Builder',
    url: `${SITE_URL}/about`,
    sameAs: [GITHUB_PROFILE_URL],
    worksFor: { '@id': ENTITY_IDS.organization },
    affiliation: { '@id': ENTITY_IDS.organization },
  };
}

/**
 * Builds the Organization schema node linking Inquestra to its founder, repo, and support contact.
 */
export function buildOrganizationSchema(): SchemaNode {
  return {
    '@type': 'Organization',
    '@id': ENTITY_IDS.organization,
    name: 'Inquestra',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
    },
    description:
      'Inquestra builds open research tools for experimental scientists, centering on a local-first Electronic Lab Notebook (ELN) with native W3C Web Serial hardware capture.',
    foundingDate: '2024',
    founder: { '@id': ENTITY_IDS.founder },
    email: 'support@inquestra.org',
    sameAs: [GITHUB_REPO_URL],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'technical support',
        email: 'support@inquestra.org',
        url: `${SITE_URL}/contact`,
        availableLanguage: 'English',
      },
    ],
  };
}

/**
 * Builds the WebSite schema node for the primary domain.
 */
export function buildWebSiteSchema(): SchemaNode {
  return {
    '@type': 'WebSite',
    '@id': ENTITY_IDS.website,
    url: SITE_URL,
    name: 'Inquestra',
    description:
      'Open, local-first Electronic Lab Notebook (ELN) pairing protocol documentation with reagent lots and direct USB serial instrument capture.',
    publisher: { '@id': ENTITY_IDS.organization },
  };
}

export interface SoftwareApplicationOverrides {
  url?: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
}

/**
 * Builds the SoftwareApplication schema node connected to the organization and founder graph.
 */
export function buildSoftwareApplicationSchema(
  overrides: SoftwareApplicationOverrides = {}
): SchemaNode {
  return {
    '@type': 'SoftwareApplication',
    '@id': ENTITY_IDS.software,
    name: 'Inquestra',
    url: overrides.url ?? SITE_URL,
    operatingSystem: 'Web Browser (Google Chrome, Microsoft Edge, Chromium)',
    applicationCategory: 'BrowserApplication',
    applicationSubCategory: 'Electronic Lab Notebook (ELN)',
    isAccessibleForFree: true,
    license: 'https://opensource.org/licenses/MIT',
    downloadUrl: GITHUB_REPO_URL,
    screenshot: `${SITE_URL}/screens/workspace-dark.png`,
    image: `${SITE_URL}/opengraph-image`,
    softwareHelp: {
      '@type': 'WebPage',
      url: `${SITE_URL}/faq`,
    },
    description:
      overrides.description ??
      'Browser-based research notebook pairing protocol documentation with chemical storage and serial instrument capture on your local machine.',
    featureList: [
      'Local-first TipTap protocol editor persisted in browser localStorage with full ZIP/Markdown/JSON export',
      'W3C Web Serial USB hardware data acquisition with 500-sample live preview and full-session CSV export',
      'Reagent and sample inventory LIMS with lot tracking and QR code labels',
      '2D SMILES chemical structure rendering via PubChem resolution',
      'DNA, RNA, and protein sequence statistics with FASTA export',
      'Inline PubMed, Europe PMC, and arXiv DOI literature citations',
      'Deterministic SHA-256 record sealing and open Markdown/JSON/CSV/ZIP exports',
      'Optional self-hosted PostgreSQL sync via Prisma ORM',
    ],
    author: { '@id': ENTITY_IDS.founder },
    creator: { '@id': ENTITY_IDS.founder },
    publisher: { '@id': ENTITY_IDS.organization },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    ...(overrides.datePublished ? { datePublished: overrides.datePublished } : {}),
    ...(overrides.dateModified ? { dateModified: overrides.dateModified } : {}),
  };
}

/**
 * Builds the SoftwareSourceCode schema node explicitly connecting inquestra.org to the GitHub repository.
 */
export function buildSoftwareSourceCodeSchema(): SchemaNode {
  return {
    '@type': 'SoftwareSourceCode',
    '@id': ENTITY_IDS.sourceCode,
    name: 'Inquestra',
    description:
      'Open-source, local-first Electronic Lab Notebook (ELN) and bench hardware data acquisition workspace built with Next.js, React, TypeScript, TipTap, Web Serial, and Prisma.',
    codeRepository: GITHUB_REPO_URL,
    url: GITHUB_REPO_URL,
    license: 'https://opensource.org/licenses/MIT',
    programmingLanguage: ['TypeScript', 'React', 'Next.js'],
    runtimePlatform: 'Chromium Web Browser / Node.js',
    author: { '@id': ENTITY_IDS.founder },
    maintainer: { '@id': ENTITY_IDS.founder },
    publisher: { '@id': ENTITY_IDS.organization },
    targetProduct: { '@id': ENTITY_IDS.software },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

/**
 * Builds a Schema.org BreadcrumbList node for subpages.
 */
export function buildBreadcrumbSchema(items: readonly BreadcrumbItem[]): SchemaNode {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path === '/' ? SITE_URL : `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Wraps multiple linked Schema.org nodes in a single JSON-LD @graph envelope.
 */
export function buildGraphSchema(nodes: readonly SchemaNode[]): SchemaNode {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}
