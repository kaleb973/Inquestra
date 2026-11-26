'use client';
// src/components/editor/nodes/InteractiveChartNode.tsx
// TipTap block NodeView rendering a multi-column laboratory dataset & visualization suite.
// - Live mode: polls Zustand store every 100ms (10 FPS throttle)
// - CSV / Lab Dataset mode: multi-column tabular grid, multi-category filtering,
//   group aggregations (Mean ± SD per cohort), and multi-channel visualization (Area, Line, Bar).

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Pause,
  Play,
  Download,
  X,
  FileSpreadsheet,
  Table2,
  BarChart3,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Columns,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import type { TelemetrySample } from '@/types/inquestra';
import {
  formatSafeCsvCell,
  inferLabColumnType,
  aggregateByCategory,
  parseCSVStream,
  type LabColumnMeta,
  type GroupAggregation,
} from '@/lib/csvParser';

const CHART_WINDOW = 300;
const POLL_INTERVAL_MS = 100;
const COLOR_PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

// ─── Unified chart point for live telemetry ──────────────────────────────────

interface LiveChartPoint {
  xKey: number;
  value: number;
}

function toChartPoints(samples: TelemetrySample[]): LiveChartPoint[] {
  return samples.map((s) => ({ xKey: s.timestamp, value: s.value }));
}

// ─── CSV dataset shape stored in TipTap node attributes ───────────────────────

export interface CsvDataAttr {
  headers: string[];
  rows: Record<string, number | string>[];
  numericKeys: string[];
  filename: string;
  rowCount?: number;
  columnsMeta?: LabColumnMeta[];
  categoryKeys?: string[];
  identifierKeys?: string[];
  statusKeys?: string[];
  timestampKeys?: string[];
}

type ViewMode = 'table' | 'chart' | 'groups' | 'meta';
type ChartType = 'area' | 'line' | 'bar';

// ─── Helper for QC / Status styling ──────────────────────────────────────────

function renderStatusBadge(value: string | number) {
  const str = String(value).toUpperCase().trim();
  if (['PASS', 'PASSED', 'VALID', 'OK', 'POSITIVE'].includes(str)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        {str}
      </span>
    );
  }
  if (['FAIL', 'FAILED', 'INVALID', 'ERROR', 'OUTLIER'].includes(str)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
        <XCircle className="w-3 h-3" />
        {str}
      </span>
    );
  }
  if (['REVIEW', 'FLAGGED', 'WARN', 'WARNING', 'RETEST'].includes(str)) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3 h-3" />
        {str}
      </span>
    );
  }
  return <span className="font-mono text-xs text-foreground">{String(value)}</span>;
}

// ─── NodeView Component ───────────────────────────────────────────────────────

function ChartNodeView({ deleteNode, node, updateAttributes, editor }: NodeViewProps) {
  const [paused, setPaused] = useState(false);
  const [displayData, setDisplayData] = useState<LiveChartPoint[]>([]);
  const [frozenData, setFrozenData] = useState<LiveChartPoint[]>([]);

  // CSV mode data
  const csvAttr = node.attrs.csvData as CsvDataAttr | null;
  const isCsvMode = csvAttr !== null && csvAttr !== undefined;

  // View mode tab: table | chart | groups | meta
  const [viewMode, setViewMode] = useState<ViewMode>(isCsvMode ? 'table' : 'chart');

  // Enriched column metadata (computed on the fly if missing from legacy saved nodes)
  const columnsMeta = useMemo<LabColumnMeta[]>(() => {
    if (!csvAttr) return [];
    if (csvAttr.columnsMeta && csvAttr.columnsMeta.length > 0) return csvAttr.columnsMeta;
    return csvAttr.headers.map((h) =>
      inferLabColumnType(
        h,
        csvAttr.rows.map((r) => r[h]),
        csvAttr.rows.length
      )
    );
  }, [csvAttr]);

  const categoryColumns = useMemo(
    () => columnsMeta.filter((c) => c.type === 'category' || c.type === 'status'),
    [columnsMeta]
  );

  const numericColumns = useMemo(
    () => columnsMeta.filter((c) => c.type === 'numeric'),
    [columnsMeta]
  );

  const identifierColumns = useMemo(
    () => columnsMeta.filter((c) => c.type === 'identifier'),
    [columnsMeta]
  );

  // ─── Table View State: Search, Multi-Category Filtering, Sorting, Pagination ─

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('');
  const [selectedCategoryValue, setSelectedCategoryValue] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // File input ref for replacing/uploading CSV
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize visible columns and default category filter
  useEffect(() => {
    if (csvAttr) {
      setVisibleColumns(csvAttr.headers);
      if (categoryColumns.length > 0 && !selectedCategoryKey) {
        setSelectedCategoryKey(categoryColumns[0]?.key ?? '');
      }
    }
  }, [csvAttr, categoryColumns, selectedCategoryKey]);

  // Options for active category filter
  const categoryFilterValues = useMemo(() => {
    if (!csvAttr || !selectedCategoryKey) return [];
    const counts: Record<string, number> = {};
    for (const r of csvAttr.rows) {
      const val = String(r[selectedCategoryKey] ?? '(Empty)');
      counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([val, count]) => ({ val, count }))
      .sort((a, b) => b.count - a.count);
  }, [csvAttr, selectedCategoryKey]);

  // Filtered & Sorted Rows
  const filteredRows = useMemo(() => {
    if (!csvAttr) return [];
    let rows = csvAttr.rows;

    // 1. Text search across all fields
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      rows = rows.filter((r) =>
        csvAttr.headers.some((h) => String(r[h] ?? '').toLowerCase().includes(q))
      );
    }

    // 2. Category / Factor filter
    if (selectedCategoryKey && selectedCategoryValue) {
      rows = rows.filter(
        (r) => String(r[selectedCategoryKey] ?? '(Empty)') === selectedCategoryValue
      );
    }

    // 3. Sorting
    if (sortColumn) {
      rows = [...rows].sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [csvAttr, searchTerm, selectedCategoryKey, selectedCategoryValue, sortColumn, sortAsc]);

  const totalFilteredCount = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // ─── Group Aggregation State (Mean ± SD per category) ────────────────────────

  const [aggCategoryKey, setAggCategoryKey] = useState<string>(
    categoryColumns[0]?.key || (csvAttr?.headers?.[0] ?? '')
  );
  const [aggMetricKey, setAggMetricKey] = useState<string>(
    numericColumns[0]?.key || (csvAttr?.numericKeys?.[0] ?? '')
  );

  useEffect(() => {
    if (!aggCategoryKey && categoryColumns.length > 0) {
      setAggCategoryKey(categoryColumns[0]!.key);
    }
    if (!aggMetricKey && numericColumns.length > 0) {
      setAggMetricKey(numericColumns[0]!.key);
    }
  }, [categoryColumns, numericColumns, aggCategoryKey, aggMetricKey]);

  const groupAggregations = useMemo<GroupAggregation[]>(() => {
    if (!csvAttr || !aggCategoryKey || !aggMetricKey) return [];
    return aggregateByCategory(filteredRows, aggCategoryKey, aggMetricKey);
  }, [csvAttr, filteredRows, aggCategoryKey, aggMetricKey]);

  // ─── Chart View State (Multi-Channel & Categorical X-Axis) ────────────────────

  const [chartType, setChartType] = useState<ChartType>('line');
  const [xAxisKey, setXAxisKey] = useState<string>(() => {
    if (csvAttr?.timestampKeys && csvAttr.timestampKeys.length > 0) {
      return csvAttr.timestampKeys[0]!;
    }
    const timeCandidate = csvAttr?.headers?.find((h) =>
      /^(time|time_s|time_ms|timestamp|timestamp_ms|date|datetime)/i.test(h)
    );
    return timeCandidate || '__row_index__';
  });
  const [selectedYChannels, setSelectedYChannels] = useState<string[]>(() => {
    if (!csvAttr?.numericKeys || csvAttr.numericKeys.length === 0) return [];
    const measurementCandidate = csvAttr.numericKeys.find(
      (k) => !/^(time|timestamp|date|id)/i.test(k)
    );
    return measurementCandidate ? [measurementCandidate] : (csvAttr.numericKeys[0] ? [csvAttr.numericKeys[0]] : []);
  });

  // Live polling (only active when NOT in CSV mode)
  useEffect(() => {
    if (isCsvMode || paused) return;

    let lastLen = -1;
    let lastTime = -1;

    const poll = () => {
      // Don't poll or re-render if the tab is hidden in background
      if (typeof document !== 'undefined' && document.hidden) return;

      const state = useNotebookStore.getState();
      const buffer = state.telemetryBuffer;

      const len = buffer.length;
      const latestTs = len > 0 ? buffer[len - 1].timestamp : 0;

      // Skip re-render if buffer has not changed (prevents 10 FPS idle loop)
      if (len === lastLen && latestTs === lastTime) {
        return;
      }

      lastLen = len;
      lastTime = latestTs;
      setDisplayData(toChartPoints(buffer.slice(-CHART_WINDOW)));
    };

    poll();

    const handleVisibility = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 250ms polling interval balances smooth DAQ updates with near-zero idle CPU usage
    const id = setInterval(poll, 250);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isCsvMode, paused]);

  const handlePauseToggle = useCallback(() => {
    if (!paused) setFrozenData([...displayData]);
    setPaused((p) => !p);
  }, [paused, displayData]);

  // Build CSV chart data based on chosen X-axis and Y-channels
  const chartData = useMemo(() => {
    if (!isCsvMode || !csvAttr) return [];
    return filteredRows.slice(0, 500).map((row, i) => {
      const item: Record<string, string | number> = {
        __row_index__: i + 1,
      };

      // X-Axis value
      if (xAxisKey !== '__row_index__') {
        const xVal = row[xAxisKey];
        item.xDisplay = xVal !== null && xVal !== undefined ? String(xVal) : `Row ${i + 1}`;
      } else {
        item.xDisplay = i + 1;
      }

      // Y-Channels
      for (const yKey of selectedYChannels) {
        const val = row[yKey];
        item[yKey] = typeof val === 'number' ? val : Number(val) || 0;
      }

      // Add Sample ID to tooltip if available
      if (identifierColumns.length > 0) {
        const idKey = identifierColumns[0]?.key;
        if (idKey && row[idKey] !== undefined) {
          item.__identifier__ = String(row[idKey]);
        }
      }

      return item;
    });
  }, [isCsvMode, csvAttr, filteredRows, xAxisKey, selectedYChannels, identifierColumns]);

  // ─── Actions: Export CSV, Insert TipTap Table, Replace CSV ──────────────────

  const handleExportCsv = useCallback(() => {
    if (!csvAttr) {
      // Export live buffer with elapsed time in seconds and ISO timestamp
      const liveData = paused ? frozenData : displayData;
      const t0 = liveData[0]?.xKey ?? Date.now();
      const header = 'time_s,value,timestamp_iso';
      const rows = liveData.map((p) => {
        const elapsedSec = ((p.xKey - t0) / 1000).toFixed(3);
        const iso = new Date(p.xKey).toISOString();
        return `${formatSafeCsvCell(elapsedSec)},${formatSafeCsvCell(p.value)},${formatSafeCsvCell(iso)}`;
      });
      const csv = [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `live_telemetry_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const header = csvAttr.headers.map((h) => formatSafeCsvCell(h)).join(',');
    const rows = filteredRows.map((row) =>
      csvAttr.headers.map((h) => formatSafeCsvCell(row[h] ?? '')).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dataset_${csvAttr.filename}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [csvAttr, paused, frozenData, displayData, filteredRows]);

  const handleInsertNativeTable = useCallback(() => {
    if (!csvAttr || !editor) return;
    const exportColumns = visibleColumns.length > 0 ? visibleColumns : csvAttr.headers;
    const maxRows = Math.min(filteredRows.length, 50);

    const thead = `<tr>${exportColumns.map((c) => `<th>${c}</th>`).join('')}</tr>`;
    const tbody = filteredRows
      .slice(0, maxRows)
      .map(
        (r) =>
          `<tr>${exportColumns.map((c) => `<td>${formatSafeCsvCell(r[c] ?? '')}</td>`).join('')}</tr>`
      )
      .join('');

    const html = `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
    editor.chain().focus().insertContent(html).run();
  }, [csvAttr, editor, visibleColumns, filteredRows]);

  const handleFileReplace = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const parsed = await parseCSVStream(file);
        updateAttributes({
          csvData: {
            headers: parsed.headers,
            rows: parsed.rows.slice(0, 5000),
            numericKeys: parsed.numericKeys,
            filename: file.name,
            columnsMeta: parsed.columnsMeta,
            categoryKeys: parsed.categoryKeys,
            identifierKeys: parsed.identifierKeys,
            statusKeys: parsed.statusKeys,
            timestampKeys: parsed.timestampKeys,
          },
        });
        const defaultX =
          parsed.timestampKeys?.[0] ||
          parsed.headers?.find((h) => /^(time|time_s|time_ms|timestamp|date)/i.test(h)) ||
          '__row_index__';
        const defaultY =
          parsed.numericKeys?.find((k) => k !== defaultX && !/^(time|timestamp|date|id)/i.test(k)) ||
          parsed.numericKeys?.[0];
        setXAxisKey(defaultX);
        if (defaultY) {
          setSelectedYChannels([defaultY]);
        }
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to replace CSV:', err);
      }
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper className="my-5">
      <div
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-xl overflow-hidden shadow-sm transition-all"
      >
        {/* Hidden File Input for CSV replacement */}
        <input
          ref={replaceFileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileReplace}
        />

        {/* ─── Top Header Bar ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground font-mono">
                  {isCsvMode ? csvAttr.filename : 'Live Telemetry Stream'}
                </span>
                {isCsvMode && (
                  <span className="text-[10px] bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                    {(csvAttr.rowCount ?? csvAttr.rows.length).toLocaleString()} rows · {csvAttr.headers.length} cols
                  </span>
                )}
                {!isCsvMode && paused && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                    PAUSED
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Tabs: Table | Group Stats | Visualizer | Metadata */}
          {isCsvMode && (
            <div className="flex items-center bg-background border border-border p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-muted text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                Table
              </button>
              {categoryColumns.length > 0 && numericColumns.length > 0 && (
                <button
                  onClick={() => setViewMode('groups')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                    viewMode === 'groups'
                      ? 'bg-muted text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Category Stats
                </button>
              )}
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'chart'
                    ? 'bg-muted text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Visualizer
              </button>
              <button
                onClick={() => setViewMode('meta')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'meta'
                    ? 'bg-muted text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Columns ({columnsMeta.length})
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {isCsvMode && (
              <>
                <button
                  onClick={() => replaceFileInputRef.current?.click()}
                  title="Replace with another CSV file"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1 rounded border border-border transition-colors font-medium"
                >
                  <Upload className="w-3 h-3" />
                  Replace
                </button>
                <button
                  onClick={handleInsertNativeTable}
                  title="Convert current view to editable TipTap Table block"
                  className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-accent px-2 py-1 rounded border border-border transition-colors font-medium"
                >
                  <Table2 className="w-3 h-3" />
                  Convert to Table
                </button>
              </>
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
              onClick={handleExportCsv}
              title="Download sanitized CSV"
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded hover:bg-accent border border-border"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={deleteNode}
              title="Remove block"
              className="text-muted-foreground hover:text-red-500 transition-colors p-1.5 rounded hover:bg-accent"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ─── TAB 1: MULTI-COLUMN LABORATORY TABLE VIEW ──────────────────── */}
        {isCsvMode && viewMode === 'table' && (
          <div className="p-4 space-y-3">
            {/* Filter & Search Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-lg border border-border">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search all sample fields, IDs, notes…"
                    className="w-full bg-background border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-sans"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Category / Factor Filter Selectors */}
                {categoryColumns.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <select
                      value={selectedCategoryKey}
                      onChange={(e) => {
                        setSelectedCategoryKey(e.target.value);
                        setSelectedCategoryValue('');
                        setCurrentPage(1);
                      }}
                      className="bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none"
                    >
                      {categoryColumns.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label} ({c.type})
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedCategoryValue}
                      onChange={(e) => {
                        setSelectedCategoryValue(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground focus:outline-none max-w-[180px]"
                    >
                      <option value="">All ({(csvAttr.rowCount ?? csvAttr.rows.length)})</option>
                      {categoryFilterValues.map(({ val, count }) => (
                        <option key={val} value={val}>
                          {val} ({count})
                        </option>
                      ))}
                    </select>

                    {selectedCategoryValue && (
                      <button
                        onClick={() => setSelectedCategoryValue('')}
                        title="Clear category filter"
                        className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded bg-muted border border-border"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Column Visibility Selector & Stats Badge */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowColumnPicker((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border rounded-md text-xs text-foreground hover:bg-muted font-medium transition-colors"
                  >
                    <Columns className="w-3.5 h-3.5 text-muted-foreground" />
                    Columns ({visibleColumns.length}/{csvAttr.headers.length})
                  </button>

                  {showColumnPicker && (
                    <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-lg shadow-xl p-2 w-56 max-h-64 overflow-y-auto space-y-1">
                      <div className="flex items-center justify-between pb-1 border-b border-border text-[11px] font-semibold text-muted-foreground px-1">
                        <span>Toggle Columns</span>
                        <button
                          onClick={() => setVisibleColumns(csvAttr.headers)}
                          className="text-foreground hover:underline"
                        >
                          Show All
                        </button>
                      </div>
                      {csvAttr.headers.map((header) => {
                        const checked = visibleColumns.includes(header);
                        return (
                          <label
                            key={header}
                            className="flex items-center gap-2 px-1.5 py-1 text-xs text-foreground hover:bg-muted rounded cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setVisibleColumns((prev) =>
                                  checked
                                    ? prev.filter((h) => h !== header)
                                    : [...prev, header]
                                );
                              }}
                              className="rounded border-border text-primary focus:ring-0"
                            />
                            <span className="truncate">{header}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <span className="text-[11px] font-mono text-muted-foreground">
                  {totalFilteredCount} matching rows
                </span>
              </div>
            </div>

            {/* Table Grid */}
            <div className="border border-border rounded-lg overflow-x-auto max-h-[420px] bg-background">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs border-b border-border z-10">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-12 text-center">
                      #
                    </th>
                    {visibleColumns.map((header) => {
                      const meta = columnsMeta.find((c) => c.key === header);
                      const isSorted = sortColumn === header;
                      return (
                        <th
                          key={header}
                          onClick={() => {
                            if (sortColumn === header) {
                              setSortAsc((a) => !a);
                            } else {
                              setSortColumn(header);
                              setSortAsc(true);
                            }
                          }}
                          className="px-3.5 py-2 text-[11px] font-semibold text-foreground whitespace-nowrap cursor-pointer hover:bg-accent/50 select-none transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{header}</span>
                            {meta?.unit && (
                              <span className="text-[9px] text-muted-foreground font-mono bg-muted px-1 rounded">
                                {meta.unit}
                              </span>
                            )}
                            <ArrowUpDown
                              className={`w-3 h-3 transition-opacity ${
                                isSorted ? 'opacity-100 text-foreground' : 'opacity-25'
                              }`}
                            />
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleColumns.length + 1}
                        className="p-8 text-center text-muted-foreground text-xs"
                      >
                        No samples match the search query or active category filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, idx) => {
                      const rowNum = (currentPage - 1) * pageSize + idx + 1;
                      return (
                        <tr
                          key={rowNum}
                          className="hover:bg-muted/40 transition-colors font-sans"
                        >
                          <td className="px-3 py-2 text-[10px] text-muted-foreground font-mono text-center bg-muted/10">
                            {rowNum}
                          </td>
                          {visibleColumns.map((colKey) => {
                            const val = row[colKey];
                            const meta = columnsMeta.find((c) => c.key === colKey);

                            if (meta?.type === 'status') {
                              return (
                                <td key={colKey} className="px-3.5 py-2 whitespace-nowrap">
                                  {renderStatusBadge(val ?? '')}
                                </td>
                              );
                            }

                            if (meta?.type === 'numeric') {
                              return (
                                <td
                                  key={colKey}
                                  className="px-3.5 py-2 font-mono text-foreground whitespace-nowrap"
                                >
                                  {val !== null && val !== undefined
                                    ? typeof val === 'number'
                                      ? val.toLocaleString(undefined, { maximumFractionDigits: 4 })
                                      : String(val)
                                    : '—'}
                                </td>
                              );
                            }

                            return (
                              <td
                                key={colKey}
                                className="px-3.5 py-2 text-foreground whitespace-nowrap max-w-xs truncate"
                                title={String(val ?? '')}
                              >
                                {val !== null && val !== undefined && val !== ''
                                  ? String(val)
                                  : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="font-mono text-[11px]">
                  Showing {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, totalFilteredCount)} of{' '}
                  {totalFilteredCount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: CATEGORY AGGREGATIONS (MEAN ± SD PER GROUP) ─────────── */}
        {isCsvMode && viewMode === 'groups' && (
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">Group by Category:</span>
                <select
                  value={aggCategoryKey}
                  onChange={(e) => setAggCategoryKey(e.target.value)}
                  className="bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none"
                >
                  {categoryColumns.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">Numeric Metric:</span>
                <select
                  value={aggMetricKey}
                  onChange={(e) => setAggMetricKey(e.target.value)}
                  className="bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none"
                >
                  {numericColumns.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label} {c.unit ? `(${c.unit})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aggregations Table */}
            <div className="border border-border rounded-lg overflow-x-auto bg-background">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/70 border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-foreground">Category Group</th>
                    <th className="px-4 py-2.5 font-semibold text-foreground font-mono">Count (N)</th>
                    <th className="px-4 py-2.5 font-semibold text-foreground font-mono">Mean ± SD</th>
                    <th className="px-4 py-2.5 font-semibold text-foreground font-mono">Median</th>
                    <th className="px-4 py-2.5 font-semibold text-foreground font-mono">Min – Max</th>
                    <th className="px-4 py-2.5 font-semibold text-foreground">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {groupAggregations.map((group) => {
                    // Normalize relative mean for mini bar visualization
                    const maxMean = Math.max(...groupAggregations.map((g) => g.mean), 1);
                    const barWidth = Math.max(4, Math.min(100, (group.mean / maxMean) * 100));

                    return (
                      <tr key={group.categoryValue} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          {renderStatusBadge(group.categoryValue)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">
                          {group.count}
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-foreground">
                          {group.mean.toFixed(3)} ± {group.stdDev.toFixed(3)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">
                          {group.median.toFixed(3)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">
                          {group.min.toFixed(2)} – {group.max.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 w-32">
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 3: MULTI-CHANNEL & CATEGORICAL VISUALIZER ──────────────── */}
        {(viewMode === 'chart' || !isCsvMode) && (
          <div className="p-4 space-y-4">
            {isCsvMode && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 p-3 rounded-lg border border-border">
                {/* X-Axis Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">X-Axis:</span>
                  <select
                    value={xAxisKey}
                    onChange={(e) => setXAxisKey(e.target.value)}
                    className="bg-background border border-border rounded px-2.5 py-1 text-xs text-foreground focus:outline-none font-mono"
                  >
                    <option value="__row_index__">Row Index (Sequential)</option>
                    {columnsMeta.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Y-Channels Selector (Multi-Select Pills) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Metrics (Y):</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {csvAttr.numericKeys.map((key, i) => {
                      const isSelected = selectedYChannels.includes(key);
                      const color = COLOR_PALETTE[i % COLOR_PALETTE.length];
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedYChannels((prev) =>
                              isSelected
                                ? prev.length > 1
                                  ? prev.filter((k) => k !== key)
                                  : prev
                                : [...prev, key]
                            );
                          }}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors border ${
                            isSelected
                              ? 'bg-card text-foreground font-semibold shadow-xs'
                              : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted'
                          }`}
                          style={{ borderColor: isSelected ? color : undefined }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {key}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chart Type Selector */}
                <div className="flex items-center gap-1 bg-background border border-border p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setChartType('area')}
                    className={`px-2 py-0.5 rounded ${
                      chartType === 'area' ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Area
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-2 py-0.5 rounded ${
                      chartType === 'line' ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-2 py-0.5 rounded ${
                      chartType === 'bar' ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Bar
                  </button>
                </div>
              </div>
            )}

            {/* Recharts Canvas */}
            <div className="pt-2">
              {isCsvMode && chartData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs">
                  No data points match current filter criteria.
                </div>
              ) : !isCsvMode && displayData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs">
                  Waiting for telemetry packets from USB hardware or simulator…
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  {chartType === 'bar' && isCsvMode ? (
                    <BarChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                      <XAxis
                        dataKey="xDisplay"
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card, #ffffff)',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 8,
                          fontSize: 11,
                          color: 'var(--foreground, #000000)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {selectedYChannels.map((yKey, i) => (
                        <Bar
                          key={yKey}
                          dataKey={yKey}
                          fill={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  ) : chartType === 'line' && isCsvMode ? (
                    <LineChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                      <XAxis
                        dataKey="xDisplay"
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card, #ffffff)',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 8,
                          fontSize: 11,
                          color: 'var(--foreground, #000000)',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {selectedYChannels.map((yKey, i) => (
                        <Line
                          key={yKey}
                          type="monotone"
                          dataKey={yKey}
                          stroke={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                          strokeWidth={1.8}
                          dot={chartData.length < 60 ? { r: 2 } : false}
                          isAnimationActive={false}
                        />
                      ))}
                    </LineChart>
                  ) : isCsvMode ? (
                    <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGradientCsv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                      <XAxis
                        dataKey="xDisplay"
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--card, #ffffff)',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 8,
                          fontSize: 11,
                          color: 'var(--foreground, #000000)',
                        }}
                      />
                      {selectedYChannels.map((yKey, i) => (
                        <Area
                          key={yKey}
                          type="monotone"
                          dataKey={yKey}
                          stroke={COLOR_PALETTE[i % COLOR_PALETTE.length]}
                          strokeWidth={1.8}
                          fill="url(#chartGradientCsv)"
                          dot={false}
                          isAnimationActive={false}
                        />
                      ))}
                    </AreaChart>
                  ) : chartType === 'area' ? (
                    <AreaChart
                      data={paused ? frozenData : displayData}
                      margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="chartGradientLive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/60" vertical={false} />
                      <XAxis
                        dataKey="xKey"
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        interval="preserveStartEnd"
                        tickFormatter={(ts: number) => {
                          const d = new Date(ts);
                          const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                          const ms = String(d.getMilliseconds()).padStart(3, '0').slice(0, 2);
                          return `${time}.${ms}`;
                        }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                      />
                      <Tooltip
                        labelFormatter={(ts) => {
                          const d = new Date(Number(ts));
                          return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`;
                        }}
                        contentStyle={{
                          background: 'var(--card, #ffffff)',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 8,
                          fontSize: 11,
                          color: 'var(--foreground, #000000)',
                        }}
                      />
                      <Area
                        type="linear"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#chartGradientLive)"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  ) : (
                    <LineChart
                      data={paused ? frozenData : displayData}
                      margin={{ top: 8, right: 12, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border/60" vertical={false} />
                      <XAxis
                        dataKey="xKey"
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        interval="preserveStartEnd"
                        tickFormatter={(ts: number) => {
                          const d = new Date(ts);
                          const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                          const ms = String(d.getMilliseconds()).padStart(3, '0').slice(0, 2);
                          return `${time}.${ms}`;
                        }}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fill: '#888888', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={45}
                      />
                      <Tooltip
                        labelFormatter={(ts) => {
                          const d = new Date(Number(ts));
                          return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`;
                        }}
                        contentStyle={{
                          background: 'var(--card, #ffffff)',
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 8,
                          fontSize: 11,
                          color: 'var(--foreground, #000000)',
                        }}
                      />
                      <Line
                        type="linear"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: METADATA & COLUMN REGISTRY ───────────────────────────── */}
        {isCsvMode && viewMode === 'meta' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {columnsMeta.map((col) => {
                return (
                  <div
                    key={col.key}
                    className="p-3 rounded-lg border border-border bg-background space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground font-mono">
                        {col.label}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          col.type === 'identifier'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : col.type === 'numeric'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : col.type === 'category'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                            : col.type === 'status'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                            : 'bg-muted text-muted-foreground border-border'
                        }`}
                      >
                        {col.type}
                      </span>
                    </div>

                    {col.unit && (
                      <p className="text-[11px] text-muted-foreground">
                        Detected Unit: <span className="font-mono text-foreground">{col.unit}</span>
                      </p>
                    )}

                    {col.numericStats && (
                      <div className="grid grid-cols-3 gap-1 text-[10px] font-mono pt-1 text-muted-foreground">
                        <div>Mean: {col.numericStats.mean}</div>
                        <div>SD: {col.numericStats.stdDev}</div>
                        <div>Median: {col.numericStats.median}</div>
                        <div>Min: {col.numericStats.min}</div>
                        <div>Max: {col.numericStats.max}</div>
                        <div>Valid: {col.numericStats.count}</div>
                      </div>
                    )}

                    {col.categoryStats && (
                      <div className="text-[10px] text-muted-foreground pt-1">
                        <span className="font-medium text-foreground">
                          {col.categoryStats.uniqueCount} distinct values:
                        </span>{' '}
                        {col.categoryStats.topValues
                          .slice(0, 4)
                          .map((t) => `${t.value} (${t.count})`)
                          .join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ─── TipTap Extension Registration ────────────────────────────────────────────

export const InteractiveChartExtension = Node.create({
  name: 'interactiveChart',
  group: 'block',
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      csvData: {
        default: null,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-csv');
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
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
