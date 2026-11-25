"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Play, Pause, RotateCcw, Shield, Activity, ArrowRight } from "lucide-react";

export default function DemoPage() {
  const [isRunning, setIsRunning] = useState(true);
  const [samplesCount, setSamplesCount] = useState(1420);
  const [rate] = useState(100);
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

  const handleSeal = async () => {
    setIsSealed(true);
    setIsRunning(false);
    try {
      const msg = new TextEncoder().encode(`trial_demo_stream:${samplesCount}:${Date.now()}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msg);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setChecksum(hashHex);
    } catch {
      setChecksum("f663c9411d8a0366f692f86ddbf366bb28809e56c365662c47f624abe72c001d");
    }
  };

  const handleReset = () => {
    setIsSealed(false);
    setIsRunning(true);
    setSamplesCount(100);
    setChecksum("pending_protocol_lock");
  };

  return (
    <div className="pt-14 sm:pt-16 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight mb-3">
            Hardware acquisition and sealing in real time.
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Toggle streaming, inspect incoming telemetry packets, and execute a SHA-256 cryptographic seal.
          </p>
        </div>

        {/* Demo Instrument Panel (zero nested cards, zero shadow-xl, motion-reduce safe) */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 bg-muted/50 border-b border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRunning(!isRunning)}
                disabled={isSealed}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium bg-background border border-border hover:bg-muted text-foreground disabled:opacity-55 disabled:cursor-not-allowed transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? "Pause Stream" : "Resume Stream"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium bg-background border border-border hover:bg-muted text-foreground transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
                title="Reset Simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-phosphor motion-safe:animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-muted-foreground">Device:</span>
                <span className="text-foreground">Simulated ESP32-UART</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-muted-foreground">Rate:</span>
                <span className="text-foreground">{rate} Hz</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Samples:</span>
                <span className="text-foreground font-semibold num">{samplesCount.toLocaleString()}</span>
              </div>
            </div>

            <div>
              {isSealed ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono font-medium bg-caution/10 border border-caution/30 text-caution whitespace-nowrap">
                  <Shield className="w-3.5 h-3.5" />
                  Trial Sealed (Read-Only)
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSeal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-95 transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-px"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Seal Trial Record
                </button>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="md:col-span-8 p-6 bg-background">
              <div className="flex justify-between items-center mb-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-phosphor" />
                  <span className="text-muted-foreground">
                    Live Channel: Transducer Analog Input (mV)
                  </span>
                </div>
                <span className="text-phosphor font-medium">
                  {isRunning ? "Streaming" : isSealed ? "Sealed" : "Paused"}
                </span>
              </div>

              <div className="h-64 w-full bg-graphite rounded-md relative flex items-end p-3 gap-1.5 overflow-hidden">
                <div className="absolute inset-0 grid grid-rows-6 grid-cols-8 pointer-events-none opacity-15">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border-r border-t border-white/20" />
                  ))}
                </div>
                {dataPoints.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-phosphor/85 rounded-t-sm"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <dl className="flex flex-wrap items-center justify-between gap-6 border-t border-border mt-4 pt-4 text-xs font-mono">
                <div>
                  <dt className="font-sans text-muted-foreground">Peak amplitude</dt>
                  <dd className="text-foreground font-semibold mt-0.5">1.42 mV</dd>
                </div>
                <div>
                  <dt className="font-sans text-muted-foreground">Noise floor (RMS)</dt>
                  <dd className="text-foreground font-semibold mt-0.5">8.2 µV</dd>
                </div>
                <div>
                  <dt className="font-sans text-muted-foreground">Packet loss</dt>
                  <dd className="text-phosphor font-semibold mt-0.5">0.00%</dd>
                </div>
                <div>
                  <dt className="font-sans text-muted-foreground">Digest mode</dt>
                  <dd className="text-foreground font-semibold mt-0.5">SHA-256</dd>
                </div>
              </dl>
            </div>

            <div className="md:col-span-4 p-6 bg-muted/20 flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-base text-foreground mb-4">
                  Cryptographic trial record
                </h2>

                <dl className="divide-y divide-border border-y border-border text-xs font-mono">
                  <div className="py-3 space-y-1">
                    <dt className="font-sans text-muted-foreground">Protocol ID</dt>
                    <dd className="text-foreground font-medium">PR-2026-LIVE-01</dd>
                  </div>
                  <div className="py-3 space-y-1">
                    <dt className="font-sans text-muted-foreground">Checksum status</dt>
                    <dd className={isSealed ? "text-caution truncate block" : "text-muted-foreground truncate block"}>
                      {checksum}
                    </dd>
                  </div>
                  <div className="py-3 space-y-1">
                    <dt className="font-sans text-muted-foreground">Electronic signature</dt>
                    <dd className="text-foreground font-sans">
                      {isSealed ? "Verified: Lead Researcher [Signed]" : "Awaiting sealing signature"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-8 pt-4 border-t border-border">
                <Link
                  href="/app"
                  className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-95 rounded-md text-xs font-semibold transition-opacity whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Connect Real ESP32 in Workspace
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border border-y border-border py-6 text-sm text-muted-foreground">
          <div className="md:col-span-6 py-3 md:py-0 md:pr-8">
            <h3 className="font-semibold text-foreground text-base mb-1.5">
              Driverless Chromium Web Serial
            </h3>
            <p className="text-sm leading-relaxed">
              Modern Chromium browsers expose bench serial ports without USB kernel extensions while Web Worker ring buffers keep continuous analog frames smooth.
            </p>
          </div>
          <div className="md:col-span-6 py-3 md:py-0 md:pl-8">
            <h3 className="font-semibold text-foreground text-base mb-1.5">
              Deterministic archive sealing
            </h3>
            <p className="text-sm leading-relaxed">
              When a trial concludes, protocol text locks together with the recorded sensor stream and linked reagent batches inside one SHA-256 package.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
