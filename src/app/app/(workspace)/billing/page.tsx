import Link from 'next/link';
import { Clock, FlaskConical, Zap, Building2, Check, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const tiers = [
  {
    name: 'Free Open-Core',
    price: '$0',
    period: 'forever',
    icon: <FlaskConical className="w-4 h-4 text-muted-foreground" />,
    features: [
      'Local storage (no cloud lock-in)',
      'Web Serial DAQ (unlimited Hz)',
      'TipTap research notebook',
      'Telemetry waveform simulator',
      'Full data export (Markdown, JSON, CSV)',
    ],
    current: true,
  },
  {
    name: 'Pro Lab',
    price: '$15',
    period: 'per seat / month',
    icon: <Zap className="w-4 h-4 text-primary" />,
    features: [
      'Everything in Free',
      'Encrypted cloud persistence',
      'Role-based access control (RBAC)',
      '100 GB object storage archive',
      'Multi-trial protocol versioning',
      'Automated reagent inventory alerts',
    ],
    current: false,
    recommended: true,
  },
  {
    name: 'Enterprise / Hospital',
    price: 'Custom',
    period: 'annual institutional agreement',
    icon: <Building2 className="w-4 h-4 text-foreground" />,
    features: [
      'Everything in Pro',
      'Institutional SSO / SAML 2.0',
      'FDA 21 CFR Part 11 Audit Trail',
      'NIH FAIR compliance export package',
      'Custom UART / BLE hardware driver support',
      'On-premise / private VPC deployment',
    ],
    current: false,
  },
];

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4 font-sans selection:bg-primary/20">
      <div className="max-w-5xl mx-auto">
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
            <Clock className="w-3.5 h-3.5 text-caution" />
            Commercial Subscriptions Launching Soon
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-normal text-foreground tracking-tight mb-3">
            Predictable Research Pricing
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Free individual tier remains open-core and unrestricted. Commercial cloud and institutional compliance
            features are available in private preview.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-card rounded-lg border p-6 flex flex-col justify-between shadow-sm relative ${
                tier.recommended
                  ? 'border-primary ring-1 ring-primary/30'
                  : tier.current
                  ? 'border-border'
                  : 'border-border opacity-90'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {tier.icon}
                    <span className="text-sm font-semibold text-foreground">{tier.name}</span>
                  </div>
                  {tier.current && (
                    <span className="text-[10px] font-mono font-semibold text-phosphor bg-phosphor/10 border border-phosphor/30 rounded px-2 py-0.5 uppercase">
                      Current
                    </span>
                  )}
                  {tier.recommended && !tier.current && (
                    <span className="text-[10px] font-mono font-semibold text-primary bg-primary/10 border border-primary/30 rounded px-2 py-0.5 uppercase">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mb-6 mt-4">
                  <span className="text-3xl font-mono font-semibold text-foreground">{tier.price}</span>
                  <span className="text-xs text-muted-foreground ml-1.5 block sm:inline mt-0.5 sm:mt-0 font-mono">
                    {tier.period}
                  </span>
                </div>

                <div className="h-px bg-border mb-5" />

                <ul className="space-y-2.5 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-phosphor mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div
                  className={`w-full py-2.5 rounded text-xs font-semibold text-center ${
                    tier.current
                      ? 'bg-muted text-foreground border border-border cursor-default'
                      : 'bg-muted/40 text-muted-foreground border border-border/60 cursor-not-allowed'
                  }`}
                >
                  {tier.current ? 'Active Plan' : 'Coming Soon'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* California ARL & Subscription Policy Notice */}
        <div className="max-w-3xl mx-auto mb-10 p-5 rounded-lg bg-card border border-border text-center space-y-2">
          <p className="text-xs font-semibold text-foreground">
            Automatic Renewal &amp; Immediate Online Cancellation Policy
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All commercial plans renew automatically at the selected billing cycle (monthly or annually) until cancelled.
            Users may cancel online at any moment directly from the workspace settings with zero cancellation fees or retention friction.
            Read our{' '}
            <Link href="/terms" className="text-primary hover:underline font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Need an institutional BAA or volume grant licensing?{' '}
          <Link href="/contact" className="text-primary hover:underline font-medium">
            Contact Lab Partnerships →
          </Link>
        </p>
      </div>
    </div>
  );
}
