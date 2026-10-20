// src/lib/csvParser.ts
// High-speed client-side CSV streaming parser using PapaParse.
// Extended with multi-column laboratory semantics, category inference, and statistical profiling.

import Papa from 'papaparse';

export type LabColumnType =
  | 'identifier'  // Sample ID, Specimen ID, Well A01-H12, Barcode, Accession
  | 'numeric'     // Measurements, Concentration, OD450, Temp, Voltage, etc.
  | 'category'    // Experimental factors: Cell Line, Treatment, Timepoint, Operator, Replicate
  | 'status'      // QC Flag: PASS, FAIL, REVIEW, FLAGGED, OUTLIER, VALID
  | 'timestamp'   // Dates, ISO strings, run elapsed time
  | 'text';       // Notes, observations, long descriptions

export interface LabNumericStats {
  count: number;
  missing: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
}

export interface LabCategoryStats {
  uniqueCount: number;
  valueCounts: Record<string, number>;
  topValues: { value: string; count: number }[];
}

export interface LabColumnMeta {
  key: string;
  label: string;
  type: LabColumnType;
  unit?: string;
  numericStats?: LabNumericStats;
  categoryStats?: LabCategoryStats;
}

export interface GroupAggregation {
  categoryValue: string;
  count: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
}

export interface ParsedTelemetryData {
  headers: string[];
  rows: Record<string, number | string>[];
  numericKeys: string[];
  rowCount: number;
  // Extended multi-column laboratory metadata
  columnsMeta: LabColumnMeta[];
  categoryKeys: string[];
  identifierKeys: string[];
  statusKeys: string[];
  timestampKeys: string[];
}

const MAX_PREVIEW_ROWS = 10_000;

/**
 * Extracts measurement unit from header string if enclosed in parentheses or brackets.
 * e.g., "Concentration (ug/mL)" -> "ug/mL", "Absorbance [OD450]" -> "OD450"
 */
export function extractColumnUnit(header: string): string | undefined {
  const match = header.match(/\(([^)]+)\)|\[([^\]]+)\]/);
  if (match) {
    const raw = (match[1] || match[2] || '').trim();
    if (raw.length > 0 && raw.length <= 20) {
      return raw;
    }
  }
  return undefined;
}

/**
 * Computes descriptive statistics for a list of numeric values.
 */
export function calculateNumericStats(
  values: unknown[],
  totalRowCount: number
): LabNumericStats {
  const validNumbers: number[] = [];
  let missing = 0;

  for (const v of values) {
    if (v === null || v === undefined || v === '') {
      missing++;
      continue;
    }
    const num = typeof v === 'number' ? v : Number(v);
    if (!isNaN(num) && isFinite(num)) {
      validNumbers.push(num);
    } else {
      missing++;
    }
  }

  const count = validNumbers.length;
  if (count === 0) {
    return {
      count: 0,
      missing: totalRowCount,
      mean: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      median: 0,
    };
  }

  const sum = validNumbers.reduce((acc, val) => acc + val, 0);
  const mean = sum / count;

  const variance =
    count > 1
      ? validNumbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (count - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  const sorted = [...validNumbers].sort((a, b) => a - b);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0
      ? sorted[mid]!
      : (sorted[mid - 1]! + sorted[mid]!) / 2;

  return {
    count,
    missing,
    mean: Number(mean.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    median: Number(median.toFixed(4)),
  };
}

/**
 * Computes category distribution and unique frequency counts.
 */
export function calculateCategoryStats(values: unknown[]): LabCategoryStats {
  const valueCounts: Record<string, number> = {};

  for (const v of values) {
    const str =
      v === null || v === undefined || v === '' ? '(Empty)' : String(v).trim();
    valueCounts[str] = (valueCounts[str] || 0) + 1;
  }

  const entries = Object.entries(valueCounts).map(([value, count]) => ({
    value,
    count,
  }));
  entries.sort((a, b) => b.count - a.count);

  return {
    uniqueCount: entries.length,
    valueCounts,
    topValues: entries.slice(0, 10),
  };
}

/**
 * Infers laboratory semantic role and metadata for a single column.
 */
export function inferLabColumnType(
  header: string,
  sampleValues: unknown[],
  totalRows: number
): LabColumnMeta {
  const cleanHeader = header.trim();
  const lower = cleanHeader.toLowerCase();
  const unit = extractColumnUnit(cleanHeader);

  // Check numeric viability
  const nonNullValues = sampleValues.filter(
    (v) => v !== null && v !== undefined && v !== ''
  );
  const numericCount = nonNullValues.filter(
    (v) => typeof v === 'number' || (!isNaN(Number(v)) && typeof v !== 'boolean')
  ).length;

  const isPredominantlyNumeric =
    nonNullValues.length > 0 && numericCount / nonNullValues.length >= 0.75;

  // 1. Explicit ID column check
  const isIdName =
    /^(id|sample_?id|specimen_?id|subject_?id|patient_?id|donor_?id|tube_?id|well|well_?id|barcode|accession)/i.test(
      lower
    );

  if (isIdName) {
    return {
      key: cleanHeader,
      label: cleanHeader,
      type: 'identifier',
      categoryStats: calculateCategoryStats(sampleValues),
    };
  }

  // 2. Numeric measurement
  if (isPredominantlyNumeric) {
    return {
      key: cleanHeader,
      label: cleanHeader,
      type: 'numeric',
      unit,
      numericStats: calculateNumericStats(sampleValues, totalRows),
    };
  }

  // 3. Status / QC Flag check
  const isStatusName =
    /(qc|status|flag|call|result|evaluation|verdict|pass_?fail)/i.test(lower);
  const statusTokens = new Set([
    'pass',
    'fail',
    'retest',
    'flagged',
    'review',
    'valid',
    'invalid',
    'outlier',
    'pos',
    'neg',
    'positive',
    'negative',
    'true',
    'false',
  ]);
  const hasStatusValues = nonNullValues.some((v) =>
    statusTokens.has(String(v).toLowerCase().trim())
  );

  if (isStatusName || hasStatusValues) {
    return {
      key: cleanHeader,
      label: cleanHeader,
      type: 'status',
      categoryStats: calculateCategoryStats(sampleValues),
    };
  }

  // 4. Timestamp check
  const isTimeName =
    /(timestamp|date|datetime|time_?elapsed|run_?time|created_?at)/i.test(lower);
  const hasIsoDates = nonNullValues.some((v) =>
    /\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}/.test(String(v))
  );

  if (isTimeName || hasIsoDates) {
    return {
      key: cleanHeader,
      label: cleanHeader,
      type: 'timestamp',
      categoryStats: calculateCategoryStats(sampleValues),
    };
  }

  // 5. Category / Factor check
  const categoryStats = calculateCategoryStats(sampleValues);
  const isCategoryName =
    /(cell_?line|treatment|condition|group|cohort|organism|tissue|assay|operator|analyst|replicate|batch|lot|dose|buffer|strain|media|type|protocol|method)/i.test(
      lower
    );

  const hasLowCardinality =
    categoryStats.uniqueCount <= 50 ||
    categoryStats.uniqueCount <= Math.max(5, totalRows * 0.5);

  if (isCategoryName || hasLowCardinality) {
    return {
      key: cleanHeader,
      label: cleanHeader,
      type: 'category',
      categoryStats,
    };
  }

  // 6. Free text / Notes
  return {
    key: cleanHeader,
    label: cleanHeader,
    type: 'text',
    categoryStats,
  };
}

/**
 * Aggregates a numeric metric by a categorical grouping column.
 * Returns Mean, StdDev, Min, Max, Count for each distinct category value.
 */
export function aggregateByCategory(
  rows: Record<string, number | string>[],
  categoryKey: string,
  metricKey: string
): GroupAggregation[] {
  const groups: Record<string, number[]> = {};

  for (const row of rows) {
    const rawCat = row[categoryKey];
    const cat =
      rawCat === null || rawCat === undefined || rawCat === ''
        ? '(Unspecified)'
        : String(rawCat);

    const val = row[metricKey];
    const num = typeof val === 'number' ? val : Number(val);
    if (!isNaN(num) && isFinite(num)) {
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(num);
    }
  }

  return Object.entries(groups).map(([catValue, numbers]) => {
    const stats = calculateNumericStats(numbers, numbers.length);
    return {
      categoryValue: catValue,
      count: stats.count,
      mean: stats.mean,
      stdDev: stats.stdDev,
      min: stats.min,
      max: stats.max,
      median: stats.median,
    };
  });
}

/**
 * High-speed client-side CSV streaming parser using PapaParse.
 * Auto-detects laboratory column semantics, categories, and numeric channels.
 */
export function parseCSVStream(file: File): Promise<ParsedTelemetryData> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, number | string>>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      preview: MAX_PREVIEW_ROWS,

      complete: (results) => {
        const headers = (results.meta.fields ?? []) as string[];
        const rows = results.data;
        const rowCount = rows.length;

        // Auto-detect numeric columns — at least one row must have a number value
        const numericKeys = headers.filter((header) =>
          rows.some((row) => typeof row[header] === 'number')
        );

        // Classify all columns with laboratory semantic heuristics
        const columnsMeta = headers.map((header) => {
          const sampleValues = rows.map((r) => r[header]);
          return inferLabColumnType(header, sampleValues, rowCount);
        });

        const categoryKeys = columnsMeta
          .filter((c) => c.type === 'category')
          .map((c) => c.key);

        const identifierKeys = columnsMeta
          .filter((c) => c.type === 'identifier')
          .map((c) => c.key);

        const statusKeys = columnsMeta
          .filter((c) => c.type === 'status')
          .map((c) => c.key);

        const timestampKeys = columnsMeta
          .filter((c) => c.type === 'timestamp')
          .map((c) => c.key);

        resolve({
          headers,
          rows,
          numericKeys,
          rowCount,
          columnsMeta,
          categoryKeys,
          identifierKeys,
          statusKeys,
          timestampKeys,
        });
      },

      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}

/**
 * Sanitizes a CSV cell value against CSV / Formula Injection (CWE-1236).
 * Prepends a single quote if the string begins with formula trigger characters (=, +, -, @, \t, \r),
 * while preserving valid numeric integers and floats (e.g. -0.17, +1.5) without corruption.
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '';
  }
  const str = String(value);
  const trimmed = str.trim();
  // Legitimate numeric values (e.g. biopotential readings, temperatures) are safe from formula execution
  if (
    trimmed !== '' &&
    !trimmed.startsWith('=') &&
    !trimmed.startsWith('@') &&
    !isNaN(Number(trimmed)) &&
    Number.isFinite(Number(trimmed))
  ) {
    return str;
  }
  // OWASP CSV Formula Injection defense: escape leading formula triggers for non-numeric text
  if (/^[=\+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Formats and escapes a cell value safely for standard CSV rows (neutralizing formula injection).
 */
export function formatSafeCsvCell(value: unknown): string {
  const sanitized = sanitizeCsvCell(value);
  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }
  return sanitized;
}

/** Convert parsed rows back to a CSV blob for re-upload or download */
export function serializeToCSV(data: {
  headers: string[];
  rows: Record<string, number | string>[];
}): Blob {
  const safeHeaders = data.headers.map((h) => sanitizeCsvCell(h));
  const safeRows = data.rows.map((row) => {
    const safeRow: Record<string, number | string> = {};
    for (const h of data.headers) {
      const val = row[h];
      const safeKey = sanitizeCsvCell(h);
      safeRow[safeKey] = typeof val === 'string' ? sanitizeCsvCell(val) : (val ?? '');
    }
    return safeRow;
  });

  const csv = Papa.unparse({
    fields: safeHeaders,
    data: safeRows,
  });
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}
