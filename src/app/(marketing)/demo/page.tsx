import type { Metadata } from 'next';
import { HardwareSealingDemo } from '@/components/marketing/HardwareSealingDemo';

export const metadata: Metadata = {
  title: 'Live Hardware DAQ & SHA-256 Sealing Demo',
  description:
    'Interactive Web Serial telemetry and cryptographic sealing demo. Test live bench packet streaming and SHA-256 trial sealing directly in your browser.',
  alternates: {
    canonical: '/demo',
  },
  openGraph: {
    title: 'Live Hardware DAQ & SHA-256 Sealing Demo | Inquestra',
    description:
      'Test live simulated serial instrument streaming and deterministic SHA-256 trial sealing inside Inquestra.',
  },
  twitter: {
    title: 'Live Hardware DAQ & SHA-256 Sealing Demo | Inquestra',
    description:
      'Test live simulated serial instrument streaming and deterministic SHA-256 trial sealing inside Inquestra.',
  },
};

export default function DemoPage() {
  return <HardwareSealingDemo />;
}
