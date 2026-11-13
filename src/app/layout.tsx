import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, DM_Serif_Display } from 'next/font/google';
import 'tippy.js/dist/tippy.css';
import './globals.css';
import { cn } from "@/lib/utils";
import { ThemeProvider } from '@/components/theme-provider';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { DeploymentSkewWatcher } from '@/components/providers/DeploymentSkewWatcher';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

const serifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Inquestra — Free Electronic Lab Notebook (ELN)',
    template: '%s — Inquestra',
  },
  description:
    'Free electronic lab notebook (ELN) for life sciences, chemistry & engineering. Protocols, chemical inventory, molecular structures & DAQ. Free for all labs.',
  metadataBase: new URL('https://inquestra.org'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://inquestra.org',
    siteName: 'Inquestra',
    title: 'Inquestra — Free Electronic Lab Notebook (ELN)',
    description:
    'Free electronic lab notebook (ELN) for life sciences, chemistry & engineering. Protocols, chemical inventory, molecular structures & DAQ. Free for all labs.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inquestra — Free Electronic Lab Notebook (ELN)',
    description:
      'Free electronic lab notebook (ELN) for life sciences, chemistry & engineering. Protocols, chemical inventory, molecular structures & DAQ. Free for all labs.',
  },
  icons: {
    icon: [
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-icon?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        plexSans.variable,
        plexMono.variable,
        serifDisplay.variable
      )}
    >
      <body className="bg-background text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <CookieConsent />
          <AnalyticsProvider />
          <DeploymentSkewWatcher />
        </ThemeProvider>
      </body>
    </html>
  );
}
