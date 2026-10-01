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
import { formatSafeCsvCell } from '@/lib/csvParser';

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
      // Export the imported CSV back out safely
      const header = csvAttr.headers.map((h) => formatSafeCsvCell(h)).join(',');
      const rows = csvAttr.rows.map((row) =>
        csvAttr.headers.map((h) => formatSafeCsvCell(row[h] ?? '')).join(',')
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
        (p) => `${formatSafeCsvCell(p.xKey)},${formatSafeCsvCell(p.value)}`
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
    <NodeViewWrapper className="my-4">
      <div 
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-lg overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            {isCsvMode ? (
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
            ) : null}
            <span className="text-xs font-mono text-muted-foreground">
              {isCsvMode ? csvAttr.filename : 'Live Telemetry'}
            </span>
            {!isCsvMode && paused && (
              <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                PAUSED
              </span>
            )}
            <span className="text-[10px] text-muted-foreground font-mono">{pointCount} pts</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Channel selector for CSV mode */}
            {isCsvMode && csvAttr.numericKeys.length > 1 && (
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="bg-background border border-border rounded px-2 py-0.5 text-[10px] text-foreground focus:outline-none font-mono"
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
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={handleCsvExport}
              title="Download CSV"
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={deleteNode}
              title="Remove chart"
              className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded hover:bg-accent"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chart body */}
        <div className="p-4">
          {pointCount === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
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
                    <stop offset="5%" stopColor={isCsvMode ? '#3b82f6' : '#6366f1'} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={isCsvMode ? '#3b82f6' : '#6366f1'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis
                  dataKey="xKey"
                  tickFormatter={isCsvMode ? (v: number) => `${v}` : timeFormatter}
                  tick={{ fill: '#888888', fontSize: 9 }}
                  tickLine={false}
                  axisLine={{ stroke: '#888888', strokeOpacity: 0.3 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#888888', fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card, #ffffff)',
                    border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: 8,
                    fontSize: 11,
                    color: 'var(--foreground, #000000)',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{ color: '#888888' }}
                  itemStyle={{ color: isCsvMode ? '#3b82f6' : '#6366f1' }}
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
                  stroke={isCsvMode ? '#3b82f6' : '#6366f1'}
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
  draggable: false,

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
