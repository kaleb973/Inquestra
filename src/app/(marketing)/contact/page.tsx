import type { Metadata } from 'next';
import { ContactChannels } from '@/components/marketing/ContactChannels';

export const metadata: Metadata = {
  title: 'Contact & Lab Support',
  description:
    'Contact Inquestra for technical support, Web Serial hardware DAQ integration, protocol imports, self-hosted lab setups, or privacy inquiries.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact & Lab Support | Inquestra',
    description:
      'Reach out for technical support, serial hardware integration questions, self-hosted deployments, or privacy inquiries.',
  },
  twitter: {
    title: 'Contact & Lab Support | Inquestra',
    description:
      'Reach out for technical support, serial hardware integration questions, self-hosted deployments, or privacy inquiries.',
  },
};

export default function ContactPage() {
  return <ContactChannels />;
}
