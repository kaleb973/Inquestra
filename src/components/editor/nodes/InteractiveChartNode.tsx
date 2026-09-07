'use client';
// src/components/editor/nodes/InteractiveChartNode.tsx
// TipTap block NodeView rendering a live-streaming or static CSV Recharts AreaChart.
// - Live mode: polls Zustand store every 100ms (10 FPS throttle)
// - CSV mode: renders imported data from node attrs, with channel selector

import { useState, useEffect, useCallback } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Pause, Play, Download, X, FileSpreadsheet } from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import type { TelemetrySample } from '@/types/inquestra';

const CHART_WINDOW = 100;
const POLL_INTERVAL_MS = 100;

// ─── Unified chart point — both live and CSV modes use this shape ─────────────

interface ChartPoint {
  xKey: number;   // timestamp (live) or row index (CSV)
  value: number;
}

function toChartPoints(samples: TelemetrySample[]): ChartPoint[] {
  return samples.map((s) => ({ xKey: s.timestamp, value: s.value }));
}

// ─── CSV row shape stored in node attrs ───────────────────────────────────────

interface CsvDataAttr {
  headers: string[];
  rows: Record<string, number | string>[];
  numericKeys: string[];
  filename: string;
}

// ─── React Component ───────────────────────────────────────────────────────────

function ChartNodeView({ deleteNode, node, updateAttributes }: NodeViewProps) {
  const [paused, setPaused] = useState(false);
  const [displayData, setDisplayData] = useState<ChartPoint[]>([]);
  const [frozenData, setFrozenData] = useState<ChartPoint[]>([]);

  // CSV mode — data baked into node attrs
  const csvAttr = node.attrs.csvData as CsvDataAttr | null;
  const isCsvMode = csvAttr !== null && csvAttr !== undefined;
  const [selectedChannel, setSelectedChannel] = useState<string>(
    isCsvMode ? (csvAttr.numericKeys[0] ?? '') : ''
  );

  // Live polling (only active when NOT in CSV mode)
  useEffect(() => {
    if (isCsvMode || paused) return;
    const poll = () => {
      const buffer = useNotebookStore.getState().telemetryBuffer;
      setDisplayData(toChartPoints(buffer.slice(-CHART_WINDOW)));
    };
    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isCsvMode, paused]);

  const handlePauseToggle = useCallback(() => {
    if (!paused) setFrozenData([...displayData]);
    setPaused((p) => !p);
  }, [paused, displayData]);

  // Build chart data from CSV — normalized to ChartPoint
  const csvChartData: ChartPoint[] = isCsvMode
    ? csvAttr.rows.map((row, i) => ({
        xKey: i,
        value: typeof row[selectedChannel] === 'number' ? (row[selectedChannel] as number) : 0,
      }))
    : [];

  const activeData: ChartPoint[] = isCsvMode
    ? csvChartData
    : paused
    ? frozenData
    : displayData;


  const handleCsvExport = useCallback(() => {
    if (isCsvMode) {
      // Export the imported CSV back out
      const header = csvAttr.headers.join(',');
      const rows = csvAttr.rows.map((row) =>
        csvAttr.headers.map((h) => row[h] ?? '').join(',')
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = csvAttr.filename;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const liveData = paused ? frozenData : displayData;
      const header = 'xKey,value';
      const rows = liveData.map(
        (p) => `${p.xKey},${p.value}`
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telemetry_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [isCsvMode, csvAttr, paused, frozenData, displayData]);

  const timeFormatter = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const pointCount = isCsvMode ? csvChartData.length : activeData.length;

  return (
    <NodeViewWrapper className="my-4" data-drag-handle>
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/80">
          <div className="flex items-center gap-2">
            {isCsvMode ? (
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            ) : null}
            <span className="text-xs font-mono text-neutral-400">
              {isCsvMode ? csvAttr.filename : 'Live Telemetry'}
            </span>
            {!isCsvMode && paused && (
              <span className="text-[10px] bg-amber-900/40 text-amber-400 border border-amber-900 px-1.5 py-0.5 rounded font-mono">
                PAUSED
              </span>
            )}
            <span className="text-[10px] text-neutral-600 font-mono">{pointCount} pts</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Channel selector for CSV mode */}
            {isCsvMode && csvAttr.numericKeys.length > 1 && (
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded px-2 py-0.5 text-[10px] text-neutral-300 focus:outline-none font-mono"
              >
                {csvAttr.numericKeys.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            )}
            {!isCsvMode && (
              <button
                onClick={handlePauseToggle}
                title={paused ? 'Resume stream' : 'Pause stream'}
                className="text-neutral-500 hover:text-neutral-200 transition-colors p-1 rounded hover:bg-neutral-800"
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={handleCsvExport}
              title="Download CSV"
              className="text-neutral-500 hover:text-neutral-200 transition-colors p-1 rounded hover:bg-neutral-800"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={deleteNode}
              title="Remove chart"
              className="text-neutral-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-neutral-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chart body */}
        <div className="p-4">
          {pointCount === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-neutral-700 text-sm">
              {isCsvMode ? 'No numeric data in selected channel.' : 'Waiting for telemetry data…'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={activeData}
                margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isCsvMode ? '#60a5fa' : '#34d399'} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={isCsvMode ? '#60a5fa' : '#34d399'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis
                  dataKey="xKey"
                  tickFormatter={isCsvMode ? (v: number) => `${v}` : timeFormatter}
                  tick={{ fill: '#525252', fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: '#262626' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#525252', fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: '#171717',
                    border: '1px solid #404040',
                    borderRadius: 6,
                    fontSize: 11,
                  }}
                  labelStyle={{ color: '#737373' }}
                  itemStyle={{ color: isCsvMode ? '#60a5fa' : '#34d399' }}
                  labelFormatter={(v: unknown) =>
                    isCsvMode ? `Row ${v}` : typeof v === 'number' ? timeFormatter(v) : String(v)
                  }
                  formatter={(v: unknown) => [
                    typeof v === 'number' ? v.toFixed(4) : String(v),
                    isCsvMode ? selectedChannel : 'value',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isCsvMode ? '#60a5fa' : '#34d399'}
                  strokeWidth={1.5}
                  fill="url(#chartGradient)"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ─── TipTap Extension ──────────────────────────────────────────────────────────

export const InteractiveChartExtension = Node.create({
  name: 'interactiveChart',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      // null = live mode; object = CSV import mode
      csvData: {
        default: null,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-csv');
          if (!raw) return null;
          try { return JSON.parse(raw); } catch { return null; }
        },
        renderHTML: (attrs) => ({
          'data-csv': attrs.csvData ? JSON.stringify(attrs.csvData) : null,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="interactive-chart"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'interactive-chart' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChartNodeView);
  },
});
