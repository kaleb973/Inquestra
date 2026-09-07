'use client';
// src/components/hardware/TelemetryMonitor.tsx
// Live DAQ stats card grid — subscribes only to telemetryStats and hardwareStatus
// to avoid re-renders on every raw telemetry append.

import { Activity, Gauge, Database, TrendingUp } from 'lucide-react';
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
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 text-neutral-500" />
        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-sm font-medium ${accent ? 'text-emerald-400' : 'text-neutral-200'}`}>
          {value}
        </span>
        {unit && (
          <span className="text-[10px] text-neutral-600">{unit}</span>
        )}
      </div>
    </div>
  );
}

export function TelemetryMonitor() {
  const stats = useNotebookStore((s) => s.telemetryStats);
  const hz = useNotebookStore((s) => s.hardwareStatus.packetsPerSec);

  const fmtNum = (n: number | null, decimals = 3) =>
    n !== null ? n.toFixed(decimals) : '—';

  const rangeStr =
    stats.min !== null && stats.max !== null
      ? `${stats.min.toFixed(2)} – ${stats.max.toFixed(2)}`
      : '—';

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-emerald-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Live DAQ Telemetry
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
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
    </div>
  );
}
