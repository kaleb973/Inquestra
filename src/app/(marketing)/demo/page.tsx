import type { Metadata } from 'next';
import { HardwareSealingDemo } from '@/components/marketing/HardwareSealingDemo';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildBreadcrumbSchema,
  buildGraphSchema,
  buildPageMetadata,
} from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Live Hardware DAQ & SHA-256 Sealing Demo',
  description:
    'Interactive Web Serial telemetry and cryptographic sealing demo. Test live bench packet streaming and SHA-256 trial sealing directly in your browser.',
  path: '/demo',
});

export default function DemoPage() {
  const structuredData = buildGraphSchema([
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Live Demo', path: '/demo' },
    ]),
  ]);

  return (
    <>
      <JsonLd data={structuredData} />
      <HardwareSealingDemo />
    </>
  );
}
