import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, DM_Serif_Display } from 'next/font/google';
import 'tippy.js/dist/tippy.css';
import './globals.css';
import { cn } from "@/lib/utils";
import { ThemeProvider } from '@/components/theme-provider';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { DeploymentSkewWatcher } from '@/components/providers/DeploymentSkewWatcher';
import { DEFAULT_OG_IMAGE, GITHUB_PROFILE_URL, SITE_URL } from '@/lib/seo';

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
    default: 'Inquestra: Open Electronic Lab Notebook',
    template: '%s | Inquestra',
  },
  description:
    'A local-first electronic lab notebook with built-in serial instrument capture. Your experimental data never leaves your browser.',
  applicationName: 'Inquestra',
  authors: [{ name: 'Kaleb', url: GITHUB_PROFILE_URL }],
  creator: 'Kaleb',
  publisher: 'Inquestra',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Inquestra',
    title: 'Inquestra: Open Electronic Lab Notebook',
    description:
      'A local-first electronic lab notebook with built-in serial instrument capture. Your experimental data never leaves your browser.',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inquestra: Open Electronic Lab Notebook',
    description:
      'A local-first electronic lab notebook with built-in serial instrument capture. Your experimental data never leaves your browser.',
    images: [DEFAULT_OG_IMAGE.url],
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=4', sizes: 'any' },
      { url: '/icon.svg?v=4', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon?v=4', sizes: '180x180', type: 'image/png' },
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
