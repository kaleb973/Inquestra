'use client';
// src/components/admin/BarcodeLabel.tsx
// QR code generator and printable label for inventory items and storage locations.
// Uses the `qrcode` library to render a QR code into a canvas element client-side.
// No server required — pure client-side generation.

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Download, X, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BarcodeLabelItem {
  id: string;
  name: string;
  /** Barcode field stored in DB (may be null if not yet assigned) */
  barcode: string | null;
  /** Optional secondary line (e.g. location name, quantity) */
  subtitle?: string;
  /** Entity type for the QR payload URL */
  type: 'inventory' | 'storage' | 'equipment';
}

interface BarcodeLabelProps {
  item: BarcodeLabelItem;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Construct universal canonical URL for the QR payload.
 * When scanned by any camera, phone, or tablet, this routes to /scan?code=...
 * for instant specimen identification without requiring a pre-existing login session.
 */
function buildQrPayload(item: BarcodeLabelItem): string {
  const base =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://inquestra.org';

  const code = item.barcode || item.id;
  return `${base}/scan?code=${encodeURIComponent(code)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BarcodeLabel({ item, onClose }: BarcodeLabelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = buildQrPayload(item);
  const displayCode = item.barcode ?? item.id.toUpperCase().slice(0, 12);

  useEffect(() => {
    if (!canvasRef.current) return;
    setIsReady(false);
    setError(null);

    QRCode.toCanvas(canvasRef.current, payload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then(() => setIsReady(true))
      .catch((err: Error) => setError(err.message));
  }, [payload]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=500');
    if (!printWindow) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas ? canvas.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label — ${item.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 16px; }
            .label {
              border: 1px solid #000;
              padding: 12px;
              width: 280px;
              text-align: center;
            }
            .label img { width: 160px; height: 160px; display: block; margin: 0 auto 8px; }
            .name { font-size: 13px; font-weight: bold; margin-bottom: 2px; word-break: break-word; }
            .subtitle { font-size: 10px; color: #555; margin-bottom: 6px; }
            .code { font-size: 9px; letter-spacing: 0.05em; color: #333; }
            .badge { font-size: 8px; text-transform: uppercase; letter-spacing: 0.1em; color: #888; margin-top: 4px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${dataUrl}" alt="QR Code" />
            <div class="name">${item.name}</div>
            ${item.subtitle ? `<div class="subtitle">${item.subtitle}</div>` : ''}
            <div class="code">${displayCode}</div>
            <div class="badge">Inquestra LIMS · ${item.type}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${displayCode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xs mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30 rounded-t-2xl">
          <span className="text-sm font-semibold text-foreground">QR Label</span>
          <button
            onClick={onClose}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Label preview */}
        <div className="p-6 flex flex-col items-center gap-3">
          <div className="bg-white p-3 rounded-xl border border-border shadow-sm">
            {!isReady && !error && (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {error && (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-red-500 text-center px-2">
                QR generation failed: {error}
              </div>
            )}
            <canvas
              ref={canvasRef}
              className={isReady ? 'block' : 'hidden'}
              style={{ width: 200, height: 200 }}
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">{item.name}</p>
            {item.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
            )}
            <p className="text-[10px] font-mono text-muted-foreground mt-1">{displayCode}</p>
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mt-1 font-mono">
              Inquestra LIMS · {item.type}
            </p>
            <div className="mt-2">
              <Link
                href={`/scan?code=${encodeURIComponent(item.barcode || item.id)}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium"
              >
                Test Resolver Link
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleDownload}
            disabled={!isReady}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <button
            onClick={handlePrint}
            disabled={!isReady}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-40"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
