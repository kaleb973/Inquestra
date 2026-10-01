// src/lib/csvParser.ts
// High-speed client-side CSV streaming parser using PapaParse.
// Returns first 10,000 rows with auto-detected numeric columns.

import Papa from 'papaparse';

export interface ParsedTelemetryData {
  headers: string[];
  rows: Record<string, number | string>[];
  numericKeys: string[];
  rowCount: number;
}

const MAX_PREVIEW_ROWS = 10_000;

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

        // Auto-detect numeric columns — at least one row must have a number value
        const numericKeys = headers.filter((header) =>
          rows.some((row) => typeof row[header] === 'number')
        );

        resolve({
          headers,
          rows,
          numericKeys,
          rowCount: rows.length,
        });
      },

      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}

/**
 * Sanitizes a CSV cell value against CSV / Formula Injection (CWE-1236).
 * Prepends a single quote if the string begins with formula trigger characters (=, +, -, @, \t, \r).
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // OWASP CSV Formula Injection defense: escape leading formula triggers
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
export function serializeToCSV(data: ParsedTelemetryData): Blob {
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
