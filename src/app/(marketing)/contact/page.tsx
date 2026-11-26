import type { Metadata } from 'next';
import { ContactChannels } from '@/components/marketing/ContactChannels';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  ENTITY_IDS,
  SITE_URL,
  buildBreadcrumbSchema,
  buildFounderPerson,
  buildGraphSchema,
  buildOrganizationSchema,
  buildPageMetadata,
} from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contact & Lab Support',
  description:
    'Contact Inquestra for technical support, Web Serial hardware DAQ integration, protocol imports, self-hosted lab setups, or privacy inquiries.',
  path: '/contact',
});

export default function ContactPage() {
  const structuredData = buildGraphSchema([
    buildOrganizationSchema(),
    buildFounderPerson(),
    {
      '@type': 'ContactPage',
      name: 'Contact & Lab Support | Inquestra',
      url: `${SITE_URL}/contact`,
      mainEntity: { '@id': ENTITY_IDS.organization },
    },
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Contact', path: '/contact' },
    ]),
  ]);

  return (
    <>
      <JsonLd data={structuredData} />
      <ContactChannels />
    </>
  );
}
