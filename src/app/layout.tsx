import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import 'tippy.js/dist/tippy.css';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Inquestra — BME Research Platform',
  description:
    'Enterprise-grade Data Acquisition and Electronic Research Notebook for Biomedical Engineering.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body className={`${inter.className} bg-neutral-950 text-neutral-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
