import { MarketingNav } from '@/components/layout/MarketingNav';
import { MarketingFooter } from '@/components/layout/MarketingFooter';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-3.5 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:text-xs focus:font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <MarketingNav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
