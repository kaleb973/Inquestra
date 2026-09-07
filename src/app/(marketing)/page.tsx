// src/app/(marketing)/page.tsx
import Link from 'next/link';
import { ArrowRight, Activity, ShieldCheck, Database } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Navbar */}
      <header className="border-b border-neutral-900 bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span className="font-bold text-xl tracking-tight">Inquestra</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={process.env.NODE_ENV === 'development' ? 'http://app.localhost:3000/login' : 'https://app.inquestra.org/login'}
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Sign In
            </a>
            <a
              href={process.env.NODE_ENV === 'development' ? 'http://app.localhost:3000/signup' : 'https://app.inquestra.org/signup'}
              className="text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-2 rounded-md transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-32 bg-gradient-to-b from-neutral-900 to-neutral-950">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Data Acquisition
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            Unify Your Hardware and Your Hypotheses
          </h1>
          <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The first Electronic Research Notebook built specifically for Biomedical Engineering. Stream ESP32 telemetry directly into your research protocols with cryptographic data provenance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={process.env.NODE_ENV === 'development' ? 'http://app.localhost:3000' : 'https://app.inquestra.org'}
              className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-lg font-semibold hover:bg-neutral-200 transition-colors text-lg w-full sm:w-auto justify-center"
            >
              Enter Workspace <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 border-t border-neutral-900 bg-neutral-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <Activity className="w-10 h-10 text-emerald-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Live Hardware DAQ</h3>
              <p className="text-neutral-400 leading-relaxed">
                Connect ESP32s and Arduinos via Web Serial. Stream 100Hz telemetry directly into your experimental record without copying CSVs.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <Database className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Inventory</h3>
              <p className="text-neutral-400 leading-relaxed">
                Slash commands let you deduct reagents directly from your protocol steps. Admins get low-stock alerts automatically.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <ShieldCheck className="w-10 h-10 text-amber-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">PI Audit Trails</h3>
              <p className="text-neutral-400 leading-relaxed">
                Immutable, timestamped protocol executions. The Strict Mode Reviewer flags deviations immediately for PI sign-off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-12 text-center text-neutral-500">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-neutral-600" />
            <span className="font-semibold text-neutral-400">Inquestra</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Inquestra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
