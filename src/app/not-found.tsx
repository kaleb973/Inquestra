import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { ArrowLeft, HardDrive } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 font-sans selection:bg-primary/20">
      <div className="max-w-md w-full text-center space-y-6">
        <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
          <Logo className="w-6 h-6 text-foreground group-hover:text-primary transition-colors" />
          <span className="font-semibold text-base tracking-tight text-foreground">Inquestra</span>
        </Link>

        <div className="bg-card border border-border rounded-lg p-8 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              404 / Port Unreachable
            </p>
            <h1 className="text-2xl font-bold text-foreground">
              Research Record Not Found
            </h1>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The requested protocol, experiment trial, or resource is either unindexed or has been relocated within the laboratory archive.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-semibold bg-foreground text-background hover:bg-foreground/90 transition-colors w-full"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Platform Home
            </Link>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-mono">
          System Status: Web Serial Registry Operational
        </p>
      </div>
    </div>
  );
}
