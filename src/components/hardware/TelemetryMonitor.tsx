'use client';
// src/components/hardware/TelemetryMonitor.tsx
// Comprehensive DAQ telemetry control hub: stats, buffer reset, CSV export,
// direct USB connection, hardware simulation, and live mini oscilloscope preview.

import { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Gauge,
  Database,
  TrendingUp,
  Plug,
  PlugZap,
  Trash2,
  Download,
  Cpu,
  Square,
} from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import { useWebSerial } from '@/hooks/useWebSerial';
import { useTelemetrySim, SimMode } from '@/hooks/useTelemetrySim';
import { formatSafeCsvCell } from '@/lib/csvParser';
import { checkLabCompliance } from '@/actions/adminActions';
import { trackAnalyticsEvent } from '@/lib/analytics/events';

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600] as const;

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

function StatCard({ label, value, unit, Icon, accent }: StatCardProps) {
  return (
    <div className="bg-card border border-border/80 rounded-xl p-3 shadow-sm hover:border-border transition-colors">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className={`font-mono text-sm font-semibold tracking-tight ${
            accent ? 'text-sky-600 dark:text-sky-400' : 'text-foreground'
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-[10px] text-muted-foreground font-mono">{unit}</span>}
      </div>
    </div>
  );
}

export function TelemetryMonitor() {
  const stats = useNotebookStore((s) => s.telemetryStats);
  const buffer = useNotebookStore((s) => s.telemetryBuffer);
  const hardwareStatus = useNotebookStore((s) => s.hardwareStatus);
  const resetTelemetry = useNotebookStore((s) => s.resetTelemetry);

  const { connect, disconnect } = useWebSerial();
  const { startSimulation, stopSimulation } = useTelemetrySim();

  const [selectedBaud, setSelectedBaud] = useState<number>(115200);
  const [selectedSimMode, setSelectedSimMode] = useState<SimMode>('thermistor');
  const [isWebSerialSupported, setIsWebSerialSupported] = useState(true);

  useEffect(() => {
    setIsWebSerialSupported(typeof navigator !== 'undefined' && 'serial' in navigator);
  }, []);

  const hz = hardwareStatus.packetsPerSec;

  const fmtNum = (n: number | null, decimals = 3) =>
    n !== null ? n.toFixed(decimals) : '—';

  const rangeStr =
    stats.min !== null && stats.max !== null
      ? `${stats.min.toFixed(2)} – ${stats.max.toFixed(2)}`
      : '—';

  // Mini oscilloscope SVG path generated from the last 80 samples
  const sparklinePoints = useMemo(() => {
    if (buffer.length < 2) return '';
    const slice = buffer.slice(-80);
    const values = slice.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const width = 240;
    const height = 48;

    return slice
      .map((p, i) => {
        const x = (i / (slice.length - 1)) * width;
        const y = height - ((p.value - min) / range) * (height - 8) - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [buffer]);

  const handleExportCsv = () => {
    if (buffer.length === 0) return;
    const t0 = buffer[0]?.timestamp ?? Date.now();
    const header = 'time_s,value,unit,timestamp_iso';
    const rows = buffer.map((p) => {
      const elapsedSec = ((p.timestamp - t0) / 1000).toFixed(3);
      const iso = new Date(p.timestamp).toISOString();
      return `${formatSafeCsvCell(elapsedSec)},${formatSafeCsvCell(p.value)},${formatSafeCsvCell(p.unit ?? '')},${formatSafeCsvCell(iso)}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inquestra_telemetry_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Live DAQ Telemetry
          </span>
        </div>
        {hardwareStatus.isConnected && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wider text-phosphor">
            <span className="w-1.5 h-1.5 rounded-xs bg-phosphor animate-pulse" />
            {hardwareStatus.isSimulated ? 'SIM' : 'LIVE'}
          </span>
        )}
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Buffer" value={stats.bufferCount} unit="pts" Icon={Database} />
        <StatCard label="Rate" value={hz} unit="Hz" Icon={Gauge} accent={hz > 0} />
        <StatCard label="Current" value={fmtNum(stats.current)} Icon={Activity} accent={stats.current !== null} />
        <StatCard label="Range" value={rangeStr} Icon={TrendingUp} />
      </div>

      {/* Mini Oscilloscope / Sparkline preview */}
      <div className="bg-card border border-border/80 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>Signal Preview (Last 80 pts)</span>
          <span>{stats.current !== null ? `${fmtNum(stats.current)} ${buffer[buffer.length - 1]?.unit || ''}` : 'Idle'}</span>
        </div>
        <div className="h-14 w-full bg-neutral-950 border border-neutral-800 rounded-lg flex items-center justify-center overflow-hidden relative shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)]">
          {sparklinePoints ? (
            <svg className="w-full h-full p-1" viewBox="0 0 240 48" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparklinePoints}
              />
            </svg>
          ) : (
            <span className="text-[11px] text-muted-foreground/60 italic font-mono">
              Waiting for telemetry data...
            </span>
          )}
        </div>
      </div>

      {/* Buffer Action Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={buffer.length === 0}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          title="Download live telemetry buffer as CSV"
        >
          <Download className="w-3.5 h-3.5 text-muted-foreground" />
          Export CSV
        </button>
        <button
          type="button"
          onClick={resetTelemetry}
          disabled={buffer.length === 0}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 text-muted-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          title="Clear telemetry buffer and reset stats"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Hardware Connection Card */}
      <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Plug className="w-3.5 h-3.5" /> Physical Hardware
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Web Serial</span>
        </div>

        {!isWebSerialSupported && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
            <strong>Chromium Required:</strong> Native Web Serial DAQ requires Google Chrome, Microsoft Edge, Opera, or Brave. On Safari or Firefox, please test telemetry using the virtual simulator below.
          </div>
        )}

        {hardwareStatus.isConnected && !hardwareStatus.isSimulated ? (
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg border border-emerald-500/30 dark:border-emerald-500/30 bg-muted/50 text-xs font-mono flex items-center justify-between text-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">{hardwareStatus.portName || 'Connected USB'}</span>
              </div>
              <span className="text-[11px]">{hardwareStatus.baudRate} baud</span>
            </div>
            <button
              type="button"
              onClick={disconnect}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
            >
              <PlugZap className="w-3.5 h-3.5" />
              Disconnect Device
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">Baud</span>
              <select
                aria-label="Serial baud rate"
                value={selectedBaud}
                onChange={(e) => setSelectedBaud(Number(e.target.value))}
                disabled={hardwareStatus.isConnected}
                className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-40"
              >
                {BAUD_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate.toLocaleString()} baud
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={async () => {
                const res = await checkLabCompliance();
                if (!res.compliant) {
                  alert(res.reason);
                  return;
                }
                trackAnalyticsEvent('daq_stream_started', {
                  portType: 'serial',
                  baudRate: selectedBaud,
                });
                await connect(selectedBaud);
              }}
              disabled={hardwareStatus.isConnected || !isWebSerialSupported}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 border border-neutral-700/60 dark:border-neutral-300/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_4px_rgba(0,0,0,0.25)] transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isWebSerialSupported ? (
                <>
                  <Plug className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-600" />
                  Connect USB Device
                </>
              ) : (
                <>
                  <Plug className="w-3.5 h-3.5 opacity-40" />
                  Web Serial Unsupported (Use Chrome/Edge)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Telemetry Simulator Card */}
      <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> In-Browser Simulator
          </span>
          <span className="text-[10px] text-sky-500 dark:text-sky-400 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3" /> Virtual Generator
          </span>
        </div>

        {hardwareStatus.isSimulated ? (
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-xs font-mono flex items-center justify-between text-amber-700 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-semibold">{hardwareStatus.portName}</span>
              </div>
              <span className="text-[11px]">{hz} Hz</span>
            </div>
            <button
              type="button"
              onClick={stopSimulation}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              Stop Simulator
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">Signal</span>
              <select
                aria-label="Telemetry simulation signal"
                value={selectedSimMode}
                onChange={(e) => setSelectedSimMode(e.target.value as SimMode)}
                disabled={hardwareStatus.isConnected}
                className="flex-1 bg-background border border-border rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary disabled:opacity-40"
              >
                <option value="thermistor">Thermal Probe (50 Hz, °C)</option>
                <option value="ecg">Lead-II Biopotential (100 Hz, mV)</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                trackAnalyticsEvent('daq_stream_started', {
                  portType: 'mock',
                  mode: selectedSimMode,
                });
                startSimulation(selectedSimMode);
              }}
              disabled={hardwareStatus.isConnected}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-accent border border-border text-foreground transition-colors disabled:opacity-40 shadow-xs"
            >
              <Activity className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              Start {selectedSimMode === 'ecg' ? 'Biopotential' : 'Temperature'} Stream
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
