// src/app/(workspace)/billing/page.tsx
// Billing — coming soon. Stripe integration deferred until commercial launch.

import Link from 'next/link';
import { Clock, FlaskConical, Zap, Building2, Check } from 'lucide-react';

const tiers = [
  {
    name: 'Free Open-Core',
    price: '$0',
    period: 'forever',
    icon: <FlaskConical className="w-5 h-5 text-muted-foreground" />,
    features: [
      'Local storage (no cloud)',
      'Web Serial DAQ (unlimited Hz)',
      'TipTap research notebook',
      'Telemetry simulator',
    ],
    current: true,
  },
  {
    name: 'Pro',
    price: '$15',
    period: 'per user / month',
    icon: <Zap className="w-5 h-5 text-indigo-400" />,
    features: [
      'Everything in Free',
      'Cloud persistence',
      'Supabase Auth + RBAC',
      '100 GB R2 storage',
      'Multi-trial management',
    ],
    current: false,
  },
  {
    name: 'Enterprise',
    price: '$5,000+',
    period: 'per year',
    icon: <Building2 className="w-5 h-5 text-purple-400" />,
    features: [
      'Everything in Pro',
      'SSO / SAML',
      'SHA-256 provenance',
      'NIH FAIR audit export',
      'MCP AI querying',
      'Reagent automation',
    ],
    current: false,
  },
];

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-amber-950/40 border border-amber-900 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Clock className="w-3.5 h-3.5" />
            Paid plans coming soon
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Inquestra Pricing</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Cloud and enterprise tiers are in development. Everything below is currently
            available free while we prepare for launch.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-3 gap-6 mt-10 mb-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-muted rounded-xl border p-6 flex flex-col ${
                tier.current ? 'border-indigo-800' : 'border-border opacity-70'
              }`}
            >
              {tier.current && (
                <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-900 rounded-full px-2.5 py-0.5 w-fit mb-3 uppercase tracking-wider">
                  Your plan
                </span>
              )}

              <div className="flex items-center gap-2 mb-1">
                {tier.icon}
                <span className="text-sm font-semibold text-white">{tier.name}</span>
              </div>

              <div className="mb-5 mt-3">
                <span className="text-3xl font-bold text-white">{tier.price}</span>
                <span className="text-xs text-muted-foreground ml-1">{tier.period}</span>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                    <Check className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div
                className={`w-full py-2.5 rounded-lg text-sm font-medium text-center ${
                  tier.current
                    ? 'bg-neutral-800 text-muted-foreground cursor-default'
                    : 'bg-neutral-800/50 text-neutral-600 cursor-not-allowed'
                }`}
              >
                {tier.current ? 'Active' : 'Coming soon'}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-neutral-700">
          Questions?{' '}
          <Link href="/" className="text-indigo-600 hover:text-indigo-500 transition-colors">
            Return to workspace
          </Link>
        </p>
      </div>
    </div>
  );
}
