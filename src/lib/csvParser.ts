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

/** Convert parsed rows back to a CSV blob for re-upload or download */
export function serializeToCSV(data: ParsedTelemetryData): Blob {
  const csv = Papa.unparse({
    fields: data.headers,
    data: data.rows,
  });
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}
