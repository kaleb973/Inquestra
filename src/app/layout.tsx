import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'tippy.js/dist/tippy.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Inquestra — BME Research Platform',
  description:
    'Enterprise-grade Data Acquisition and Electronic Research Notebook for Biomedical Engineering.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
