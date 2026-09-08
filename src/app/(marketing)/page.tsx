// src/app/(marketing)/page.tsx
import Link from 'next/link';
import { ArrowRight, Activity, ShieldCheck, Database } from 'lucide-react';

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-emerald-500/30 font-sans antialiased relative overflow-hidden">
      {/* Subtle Background Mesh/Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-emerald-500 opacity-20 blur-[100px]" />

      {/* Navbar */}
      <header className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-lg tracking-tight">Inquestra</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/app/login"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/app/signup"
              className="text-sm font-medium bg-white hover:bg-neutral-200 text-black px-4 py-1.5 rounded-full transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-300 text-xs font-medium tracking-wide mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Data Acquisition
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Unify Your Hardware <br className="hidden md:block" /> and Your Hypotheses.
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            The first Electronic Research Notebook built specifically for Biomedical Engineering. Stream ESP32 telemetry directly into your research protocols with cryptographic data provenance.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app"
              className="group flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-medium hover:bg-neutral-200 transition-all text-sm w-full sm:w-auto justify-center"
            >
              Enter Workspace <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 border-t border-white/5 bg-black/50 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
              <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium mb-3 text-white">Live Hardware DAQ</h3>
              <p className="text-neutral-400 text-sm leading-relaxed font-light">
                Connect ESP32s and Arduinos via Web Serial. Stream 100Hz telemetry directly into your experimental record without copying CSVs.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
              <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium mb-3 text-white">Smart Inventory</h3>
              <p className="text-neutral-400 text-sm leading-relaxed font-light">
                Slash commands let you deduct reagents directly from your protocol steps. Admins get low-stock alerts automatically.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
              <div className="bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:bg-amber-500/20 transition-colors">
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-medium mb-3 text-white">PI Audit Trails</h3>
              <p className="text-neutral-400 text-sm leading-relaxed font-light">
                Immutable, timestamped protocol executions. The Strict Mode Reviewer flags deviations immediately for PI sign-off.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-neutral-500 relative z-10 bg-black">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-neutral-600" />
            <span className="font-medium text-neutral-400 text-sm tracking-tight">Inquestra</span>
          </div>
          <p className="text-xs font-light">© {new Date().getFullYear()} Inquestra. Built for BME.</p>
        </div>
      </footer>
    </div>
  );
}
