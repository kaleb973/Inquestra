'use client';
// src/components/hardware/TelemetryMonitor.tsx
// Live DAQ stats card grid — subscribes only to telemetryStats and hardwareStatus
// to avoid re-renders on every raw telemetry append.

import { Activity, Gauge, Database, TrendingUp, Plug } from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

function StatCard({ label, value, unit, Icon, accent }: StatCardProps) {
  return (
    <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-sm hover:border-border transition-colors">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-[15px] font-medium tracking-tight ${accent ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'}`}>
          {value}
        </span>
        {unit && (
          <span className="text-[10px] text-muted-foreground font-mono">{unit}</span>
        )}
      </div>
    </div>
  );
}

export function TelemetryMonitor() {
  const stats = useNotebookStore((s) => s.telemetryStats);
  const hardwareStatus = useNotebookStore((s) => s.hardwareStatus);
  const hz = hardwareStatus.packetsPerSec;

  const fmtNum = (n: number | null, decimals = 3) =>
    n !== null ? n.toFixed(decimals) : '—';

  const rangeStr =
    stats.min !== null && stats.max !== null
      ? `${stats.min.toFixed(2)} – ${stats.max.toFixed(2)}`
      : '—';

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Live DAQ Telemetry
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <StatCard
          label="Buffer"
          value={stats.bufferCount}
          unit="pts"
          Icon={Database}
        />
        <StatCard
          label="Rate"
          value={hz}
          unit="Hz"
          Icon={Gauge}
          accent={hz > 0}
        />
        <StatCard
          label="Current"
          value={fmtNum(stats.current)}
          Icon={Activity}
          accent={stats.current !== null}
        />
        <StatCard
          label="Range"
          value={rangeStr}
          Icon={TrendingUp}
        />
      </div>

      {!hardwareStatus.isConnected ? (
        <div className="mt-5 p-5 rounded-xl border border-dashed border-border bg-card text-center space-y-2 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Plug className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">No Device Connected</p>
            <p className="text-[11px] text-muted-foreground mt-1 max-w-[220px] mx-auto leading-relaxed">
              Plug in your sensor or microcontroller via USB on the left to start streaming live data.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 text-xs font-mono flex items-center justify-between text-indigo-700 dark:text-indigo-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="font-semibold">{hardwareStatus.portName || 'Connected Device'}</span>
          </div>
          <span className="text-[11px]">{hardwareStatus.baudRate || 115200} baud</span>
        </div>
      )}
    </div>
  );
}
