import Link from 'next/link';
import { FlaskConical, Check, ArrowLeft, Heart, Shield, Cpu, Boxes } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 font-sans selection:bg-primary/20">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Back */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
            <span className="font-semibold text-sm text-foreground">Inquestra</span>
          </Link>
          <Link
            href="/app"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Workspace
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-muted border border-border text-muted-foreground text-xs font-mono px-3 py-1 rounded mb-4">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            Free &amp; Open Development
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-normal text-foreground tracking-tight mb-4">
            Inquestra is free while in open development.
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            All core research tools, including protocol editing, chemical inventory LIMS, sequence calculations, and hardware DAQ, are free to use. There are no subscriptions, paywalls, or feature gates.
          </p>
        </div>

        {/* Current Active Plan Card */}
        <div className="bg-card rounded-xl border border-border p-6 sm:p-8 mb-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2.5">
                <FlaskConical className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Open Research Workspace</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Full-featured laboratory workspace running locally on your device.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-semibold text-foreground">$0</span>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-phosphor/10 text-phosphor border border-phosphor/20 font-semibold uppercase">
                Active
              </span>
            </div>
          </div>

          <div className="pt-6">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4 font-semibold">
              Included capabilities
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                <span>Protocol editor with KaTeX math, tables, and execution timers</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                <span>2D chemical structures from SMILES &amp; live PubChem lookup</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                <span>DNA/RNA sequence tools (melting temperature, GC%, reverse complement)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                <span>Chemical and biological inventory LIMS with lot tracking</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                <span>Web Serial hardware DAQ (Arduino, ESP32, USB instruments)</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                <span>PubMed &amp; Europe PMC literature search and direct citations</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                <span>Cryptographic SHA-256 trial sealing &amp; audit records</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-phosphor shrink-0 mt-0.5" />
                <span>Full data export to standard ZIP archives (Markdown, JSON, CSV)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Philosophy & Transparency Note */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="p-5 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Local-first data ownership</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your research data stays in your browser (<code className="font-mono">localStorage</code>). You don&apos;t need an account to use the notebook, and you can export your entire experimental history as ZIP, JSON, or Markdown at any time.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Self-hosting &amp; lab setups</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If your research group wants to self-host Inquestra with your own PostgreSQL instance or connect custom bench hardware, feel free to reach out directly.
            </p>
          </div>
        </div>

        {/* Contact Footer */}
        <div className="text-center text-xs text-muted-foreground border-t border-border pt-8">
          <p>
            Have questions or want to collaborate?{' '}
            <Link href="/contact" className="text-primary hover:underline font-medium">
              Contact the builder
            </Link>
            {' · '}
            <a
              href="https://github.com/kaleb973/Inquestra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              GitHub repository
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
