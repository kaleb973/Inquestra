'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Activity, ShieldCheck, Lock, Unlock, Play, Pause, Zap, CheckCircle2, Sliders, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';

type SignalModality = 'emg' | 'ecg' | 'loadcell';

interface ModalityConfig {
  id: SignalModality;
  label: string;
  channelName: string;
  unit: string;
  nominalBaud: number;
  sampleRate: string;
  description: string;
  reagentLot: string;
  protocolTitle: string;
  stimulusLabel: string;
}

const MODALITIES: Record<SignalModality, ModalityConfig> = {
  emg: {
    id: 'emg',
    label: 'Surface EMG',
    channelName: 'Ch 01: Differential Biopotential (mV)',
    unit: 'mV',
    nominalBaud: 115200,
    sampleRate: '1,000 Hz',
    description: 'Biceps brachii isometric contraction study. Differential electrode array on anterior compartment.',
    reagentLot: 'Conductive Gel Lot #EL-2026-B',
    protocolTitle: 'Isometric Muscle Fatigue & Mean Frequency Shift',
    stimulusLabel: 'Trigger Isometric Burst',
  },
  ecg: {
    id: 'ecg',
    label: 'Lead II ECG',
    channelName: 'Ch 01: Lead II Vector (mV)',
    unit: 'mV',
    nominalBaud: 115200,
    sampleRate: '500 Hz',
    description: 'Lead II Einthoven arrangement measuring ventricular depolarization and QT interval dispersion.',
    reagentLot: 'Ag/AgCl Electrodes Lot #EC-8841-A',
    protocolTitle: 'Ventricular Conduction Velocity Assessment',
    stimulusLabel: 'Induce Tachycardia Sweep',
  },
  loadcell: {
    id: 'loadcell',
    label: 'Materials Tensile Testing',
    channelName: 'Ch 01: Full-Bridge Strain Gauge (N)',
    unit: 'N',
    nominalBaud: 230400,
    sampleRate: '250 Hz',
    description: 'Polymer matrix stress-strain deformation assay. Uniaxial load cell instrumentation.',
    reagentLot: 'PBS Hydration Buffer Lot #PB-4402',
    protocolTitle: 'Polymer Sample Ultimate Tensile Strength',
    stimulusLabel: 'Apply 40 N Tensile Step',
  },
};

// Generates waveform data points based on modality and tick
function generateWaveform(modality: SignalModality, tick: number, isStimulated: boolean): number[] {
  const points: number[] = [];
  const count = 36;

  for (let i = 0; i < count; i++) {
    const t = tick + i * 0.4;
    let val = 0;

    if (modality === 'emg') {
      // Interference pattern with baseline noise + burst
      const noise = (Math.sin(t * 1.7) * 0.3 + Math.cos(t * 3.1) * 0.2 + (Math.random() - 0.5) * 0.2);
      const envelope = isStimulated ? 0.85 : 0.35;
      val = 50 + (noise * envelope * 45);
    } else if (modality === 'ecg') {
      // Periodic QRS-like waveform
      const phase = (t % 6) / 6;
      if (phase > 0.35 && phase < 0.40) {
        val = 58; // P wave
      } else if (phase >= 0.40 && phase < 0.43) {
        val = 42; // Q dip
      } else if (phase >= 0.43 && phase < 0.47) {
        val = isStimulated ? 96 : 88; // R peak
      } else if (phase >= 0.47 && phase < 0.50) {
        val = 30; // S dip
      } else if (phase >= 0.54 && phase < 0.62) {
        val = 62; // T wave
      } else {
        val = 50 + (Math.random() - 0.5) * 1.5; // isoelectric baseline
      }
    } else {
      // Load cell tensile ramp
      const cycle = (t % 10) / 10;
      const base = 25 + Math.sin(cycle * Math.PI) * 40;
      val = isStimulated ? Math.min(95, base + 35) : base;
      val += (Math.random() - 0.5) * 1.2;
    }

    points.push(Math.max(10, Math.min(95, val)));
  }

  return points;
}

export function InteractiveBenchConsole() {
  const [modality, setModality] = useState<SignalModality>('emg');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isStimulated, setIsStimulated] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(0);
  const [isSealed, setIsSealed] = useState<boolean>(true);
  const [sha256Hash, setSha256Hash] = useState<string>('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  const [lastValue, setLastValue] = useState<number>(1.284);

  const activeConfig = MODALITIES[modality];

  // Live timer for oscilloscope sweep
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 80);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Compute live waveform
  const waveform = useMemo(() => {
    return generateWaveform(modality, tick, isStimulated);
  }, [modality, tick, isStimulated]);

  // Update current scalar readout
  useEffect(() => {
    const latest = waveform[waveform.length - 1];
    let converted = 0;
    if (modality === 'emg') {
      converted = ((latest - 50) / 50) * 2.5; // -2.5 to +2.5 mV
    } else if (modality === 'ecg') {
      converted = ((latest - 50) / 45) * 1.5; // mV
    } else {
      converted = (latest / 100) * 50; // Newtons
    }
    setLastValue(Number(converted.toFixed(3)));
  }, [waveform, modality]);

  // Deterministic cryptographic hash calculation
  const recalculateHash = useCallback(async (currentModality: SignalModality, val: number, sealed: boolean) => {
    const payload = `${currentModality}:${val.toFixed(4)}:sealed=${sealed}:audit_seq=14802:inquestra_v1`;
    try {
      const msgUint8 = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setSha256Hash(hashHex);
    } catch {
      // Fallback
      setSha256Hash('7a82c40d512a8335b2e81743a18a09b3f36a87c1265d648218a598217349abcf');
    }
  }, []);

  useEffect(() => {
    recalculateHash(modality, lastValue, isSealed);
  }, [modality, lastValue, isSealed, recalculateHash]);

  return (
    <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden transition-all text-left">
      {/* Console Top Toolbar */}
      <div className="px-4 py-3 bg-muted/50 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Modality Selector Tabs */}
        <div className="flex items-center gap-1.5 p-0.5 bg-background/80 rounded border border-border">
          {(Object.keys(MODALITIES) as SignalModality[]).map((key) => {
            const item = MODALITIES[key];
            const isActive = modality === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setModality(key)}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-medium transition-all',
                  isActive
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Hardware Status & Port Info */}
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isRunning ? 'bg-phosphor animate-pulse' : 'bg-muted-foreground'
              )}
            />
            <span className="text-foreground font-semibold">ESP32-S3 USB-CDC</span>
            <span className="text-muted-foreground hidden sm:inline">
              COM4 · {activeConfig.nominalBaud.toLocaleString()} baud · {activeConfig.sampleRate}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={isRunning ? 'Pause incoming telemetry stream' : 'Resume incoming telemetry stream'}
          >
            {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-phosphor" />}
            <span>{isRunning ? 'Pause' : 'Stream'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Oscilloscope DAQ (Left) + Immutable Protocol Document (Right) */}
      <div className="grid lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left Column: Oscilloscope Telemetry Monitor */}
        <div className="lg:col-span-7 p-5 sm:p-6 bg-background flex flex-col justify-between">
          <div>
            {/* Channel Header */}
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="text-muted-foreground uppercase tracking-wider font-medium">
                {activeConfig.channelName}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">Scalar:</span>
                <span className="text-sm font-semibold text-foreground font-mono">
                  {lastValue > 0 ? `+${lastValue}` : lastValue} {activeConfig.unit}
                </span>
              </div>
            </div>

            {/* Simulated Phosphor Oscilloscope Screen */}
            <div className="h-44 sm:h-48 w-full bg-muted/15 border border-border/90 rounded-lg relative flex items-end p-2 gap-1 overflow-hidden select-none">
              {/* Oscilloscope Grid Lines */}
              <div className="absolute inset-0 grid grid-rows-4 grid-cols-8 pointer-events-none opacity-20 border-b border-border">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div key={i} className="border-r border-t border-border/40" />
                ))}
              </div>

              {/* Center Zero-Reference Line */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-phosphor/20 border-dashed pointer-events-none" />

              {/* Waveform Bars */}
              {waveform.map((height, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 rounded-t-xs transition-[height] duration-75',
                    isStimulated ? 'bg-amber-500/80' : 'bg-phosphor/85'
                  )}
                  style={{ height: `${height}%` }}
                />
              ))}

              {/* Live Badge */}
              <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-xs border border-border px-2 py-0.5 rounded text-[10px] font-mono text-phosphor flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-phosphor animate-ping" />
                <span>Web Serial Ingestion · Buffer: 500 Samples</span>
              </div>
            </div>

            {/* Telemetry Scope Controls */}
            <div className="flex flex-wrap items-center justify-between mt-3 gap-2 text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center gap-3">
                <span>Sweep: 100 ms/div</span>
                <span>·</span>
                <span>Off-Thread Web Worker</span>
              </div>

              {/* Dynamic Stimulus Trigger */}
              <button
                type="button"
                onMouseDown={() => setIsStimulated(true)}
                onMouseUp={() => setIsStimulated(false)}
                onTouchStart={() => setIsStimulated(true)}
                onTouchEnd={() => setIsStimulated(false)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors cursor-pointer select-none',
                  isStimulated
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                    : 'bg-muted/40 text-foreground border-border hover:bg-muted'
                )}
              >
                <Zap className="w-3 h-3 text-amber-500" />
                <span>{activeConfig.stimulusLabel} (Hold)</span>
              </button>
            </div>
          </div>

          {/* Microcontroller Packet Diagnostics */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>Packet: [Timestamp_MS: uint32] [Payload: float32] [CRC16: uint16]</span>
            </div>
            <span className="text-phosphor font-medium hidden sm:inline">Dropped Packets: 0 (0.00%)</span>
          </div>
        </div>

        {/* Right Column: Immutable Protocol Document (Electronic Lab Notebook) */}
        <div className="lg:col-span-5 p-5 sm:p-6 bg-card flex flex-col justify-between">
          <div className="space-y-4">
            {/* Protocol Meta Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
                Protocol #TR-2026-SCI
              </span>
              <button
                type="button"
                onClick={() => setIsSealed(!isSealed)}
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded border inline-flex items-center gap-1 transition-colors',
                  isSealed
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                )}
                title="Toggle seal state to verify cryptographic checksum response"
              >
                {isSealed ? (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>SEALED SHA-256</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>DRAFT (UNSEALED)</span>
                  </>
                )}
              </button>
            </div>

            <div>
              <h3 className="font-semibold text-sm text-foreground mb-1 leading-snug">
                {activeConfig.protocolTitle}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeConfig.description}
              </p>
            </div>

            {/* Metadata & Cryptographic Provenance Manifest */}
            <div className="space-y-2 text-xs font-mono bg-background p-3.5 rounded-lg border border-border">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Reagent Lot:</span>
                <span className="text-foreground font-medium">{activeConfig.reagentLot}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Operator Role:</span>
                <span className="text-foreground font-medium">Primary Instrument Operator [OP-4]</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted-foreground">Audit Signature:</span>
                <span className="text-phosphor font-medium">PI Reviewer [ECDSA P-256 Validated]</span>
              </div>

              {/* SHA-256 Digest Box */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Deterministic SHA-256 Record Digest:</span>
                  <span className="text-foreground font-semibold">RFC 3161 Timestamped</span>
                </div>
                <div className="bg-muted/40 p-1.5 rounded font-mono text-[10px] text-muted-foreground truncate select-all">
                  {sha256Hash}
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Verification Guarantee */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-phosphor" />
              <span>Technical Controls for 21 CFR Part 11 &amp; GAMP 5</span>
            </div>
            <span className="text-[11px] font-mono text-foreground font-medium">
              Tamper-Evident Ledger
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
