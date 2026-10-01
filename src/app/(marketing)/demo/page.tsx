"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, RotateCcw, Shield, Terminal, Activity, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function DemoPage() {
  const [isRunning, setIsRunning] = useState(true);
  const [samplesCount, setSamplesCount] = useState(1420);
  const [rate, setRate] = useState(100);
  const [dataPoints, setDataPoints] = useState<number[]>([
    45, 52, 48, 56, 92, 14, 48, 51, 50, 47, 53, 89, 21, 46, 52, 48, 54, 94, 18, 47, 51, 50, 48, 55, 90, 19, 49, 52, 50, 48, 53, 51
  ]);
  const [isSealed, setIsSealed] = useState(false);
  const [checksum, setChecksum] = useState("a8f4c2198031dbe89412f...");

  useEffect(() => {
    if (!isRunning || isSealed) return;
    const interval = setInterval(() => {
      setSamplesCount((prev) => prev + 10);
      setDataPoints((prev) => {
        const nextVal = Math.floor(40 + Math.random() * 25 + (Math.random() > 0.85 ? 30 : 0));
        return [...prev.slice(1), nextVal];
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, isSealed]);

  const handleSeal = () => {
    setIsSealed(true);
    setIsRunning(false);
    setChecksum("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  };

  const handleReset = () => {
    setIsSealed(false);
    setIsRunning(true);
    setSamplesCount(100);
    setChecksum("pending_protocol_lock");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {/* Top Bar */}
      <nav className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5 text-foreground" />
              <span className="font-semibold text-sm">Inquestra DAQ Demo</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
              Interactive Test Environment
            </span>
            <Link
              href="/app"
              className="text-xs font-medium bg-foreground text-background hover:bg-foreground/90 px-3.5 py-1.5 rounded transition-colors"
            >
              Launch Full App
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Interactive Demo Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mb-8">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Interactive System Preview
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-normal text-foreground tracking-tight mb-3">
            Hardware Acquisition &amp; Protocol Sealing In Real Time
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Test the live streaming engine below. Toggle sampling rates, observe incoming serial biopotential
            telemetry packets, and execute a cryptographic seal to lock the trial record.
          </p>
        </div>

        {/* Demo Dashboard Card */}
        <div className="bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                disabled={isSealed}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-background border border-border hover:bg-accent text-foreground disabled:opacity-50 transition-colors"
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? "Pause Stream" : "Resume Stream"}
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-background border border-border hover:bg-accent text-foreground transition-colors"
                title="Reset Simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-phosphor animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-muted-foreground">DEVICE:</span>
                <span className="text-foreground">Simulated ESP32-UART</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-muted-foreground">THROUGHPUT:</span>
                <span className="text-foreground">{rate} Hz</span>
              </div>
              <div>
                <span className="text-muted-foreground">SAMPLES:</span>
                <span className="text-foreground font-semibold">{samplesCount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              {isSealed ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-caution/10 border border-caution/30 text-caution">
                  <Shield className="w-3.5 h-3.5" />
                  Trial Sealed (Read-Only)
                </div>
              ) : (
                <button
                  onClick={handleSeal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Seal Trial Record (SHA-256)
                </button>
              )}
            </div>
          </div>

          {/* Interactive Screen Grid */}
          <div className="grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Waveform Canvas Simulation */}
            <div className="md:col-span-8 p-6 bg-background">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-phosphor" />
                  <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                    Live Channel: Cardiac Lead II (ECG Biopotential)
                  </span>
                </div>
                <span className="text-xs font-mono text-phosphor">
                  {isRunning ? "STREAMING ACTIVE" : isSealed ? "RECORD SEALED" : "STREAM PAUSED"}
                </span>
              </div>

              {/* Graphical Display */}
              <div className="h-64 w-full bg-muted/20 border border-border/80 rounded relative flex items-end p-3 gap-1.5 overflow-hidden">
                <div className="absolute inset-0 grid grid-rows-6 grid-cols-8 pointer-events-none opacity-20 border-b border-border">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border-r border-t border-border/40" />
                  ))}
                </div>
                {dataPoints.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-phosphor/80 rounded-t-sm transition-all duration-100"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 text-xs font-mono">
                <div className="bg-muted/30 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block text-[10px]">Peak Amplitude</span>
                  <span className="text-foreground font-semibold">1.42 mV</span>
                </div>
                <div className="bg-muted/30 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block text-[10px]">Noise Floor (RMS)</span>
                  <span className="text-foreground font-semibold">8.2 µV</span>
                </div>
                <div className="bg-muted/30 p-2.5 rounded border border-border">
                  <span className="text-muted-foreground block text-[10px]">Packet Loss</span>
                  <span className="text-phosphor font-semibold">0.00% (Strict)</span>
                </div>
              </div>
            </div>

            {/* Protocol Metadata & Verification Ledger */}
            <div className="md:col-span-4 p-6 bg-card flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground block mb-2">
                  Audit Ledger &amp; Integrity
                </span>
                <h3 className="font-semibold text-sm text-foreground mb-4">
                  21 CFR Part 11 Trial Package
                </h3>

                <div className="space-y-3 text-xs font-mono">
                  <div className="bg-background p-2.5 rounded border border-border space-y-1">
                    <span className="text-muted-foreground block text-[10px]">Protocol ID</span>
                    <span className="text-foreground">TR-ECG-2026-LIVE</span>
                  </div>

                  <div className="bg-background p-2.5 rounded border border-border space-y-1">
                    <span className="text-muted-foreground block text-[10px]">Checksum Status</span>
                    <span className={isSealed ? "text-caution truncate block" : "text-muted-foreground truncate block"}>
                      {checksum}
                    </span>
                  </div>

                  <div className="bg-background p-2.5 rounded border border-border space-y-1">
                    <span className="text-muted-foreground block text-[10px]">Electronic Signature</span>
                    <span className="text-foreground">
                      {isSealed ? "Verified: Dr. K. Vance (Lead PI)" : "Awaiting Sealing Signature"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border">
                <Link
                  href="/app"
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background hover:bg-foreground/90 rounded text-xs font-semibold transition-colors"
                >
                  Connect Real ESP32 in Workspace
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Explainer */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
          <div className="p-4 bg-muted/20 border border-border rounded">
            <h4 className="font-semibold text-foreground text-xs uppercase font-mono mb-1">
              Zero Drivers Required
            </h4>
            <p className="text-xs leading-relaxed">
              Modern Chromium browsers expose direct hardware serial ports. Inquestra uses standard Web Serial
              without needing custom USB kernel extensions or local bridge daemons.
            </p>
          </div>
          <div className="p-4 bg-muted/20 border border-border rounded">
            <h4 className="font-semibold text-foreground text-xs uppercase font-mono mb-1">
              High-Frequency Ingestion
            </h4>
            <p className="text-xs leading-relaxed">
              Buffered streams process continuous analog sensor packets with microsecond accuracy,
              formatting binary telemetry for instant tabular or graphical visualization.
            </p>
          </div>
          <div className="p-4 bg-muted/20 border border-border rounded">
            <h4 className="font-semibold text-foreground text-xs uppercase font-mono mb-1">
              Deterministic Packaging
            </h4>
            <p className="text-xs leading-relaxed">
              When an experiment concludes, the protocol, sensor arrays, notes, and reagent metadata are packed
              into a single tamper-evident archive ready for regulatory submission.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
