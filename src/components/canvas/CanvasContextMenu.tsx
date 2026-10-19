'use client';
// src/components/canvas/CanvasContextMenu.tsx
// Specialized right-click context menu for the Editor Canvas.
// Allows researchers to quickly insert BME blocks, charts, reagents, and save snapshots.

import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import {
  BarChart3,
  FlaskConical,
  ClipboardList,
  FileSpreadsheet,
  Table2,
  Bookmark,
  Share2,
} from 'lucide-react';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  onTriggerSave?: () => void;
}

export function CanvasContextMenu({
  x,
  y,
  isOpen,
  onClose,
  editor,
  onTriggerSave,
}: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !editor) return null;

  // Prevent viewport clipping
  const menuWidth = 230;
  const menuHeight = 280;
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

  let posX = x;
  let posY = y;
  if (posX + menuWidth > screenW - 12) posX = screenW - menuWidth - 12;
  if (posY + menuHeight > screenH - 12) posY = screenH - menuHeight - 12;

  const insertNode = (type: string, attrs?: Record<string, unknown>) => {
    editor.chain().focus().insertContent({ type, attrs }).run();
    onClose();
  };

  const handleUploadCSV = () => {
    onClose();
    const input = document.getElementById('inquestra-csv-upload-input') as HTMLInputElement | null;
    if (input) {
      input.value = '';
      input.click();
    }
  };

  return (
    <div
      ref={menuRef}
      style={{ top: `${Math.max(12, posY)}px`, left: `${Math.max(12, posX)}px` }}
      className="fixed z-50 w-56 rounded-xl bg-card border border-border shadow-2xl py-1.5 text-xs text-foreground font-sans animate-in fade-in-50 zoom-in-95 duration-100 divide-y divide-border/50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-mono">
        <span className="font-semibold text-foreground">Insert Scientific Node</span>
      </div>

      <div className="py-1">
        <button
          onClick={() => insertNode('interactiveChart', { csvData: null })}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
          <span>Live Telemetry Chart</span>
        </button>

        <button
          onClick={() => insertNode('reagentBlock')}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5 text-emerald-500" />
          <span>Reagent Deduction</span>
        </button>

        <button
          onClick={() =>
            insertNode('protocolBlock', { title: 'New Protocol', version: 1, steps: [] })
          }
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
          <span>Protocol Checklist</span>
        </button>

        <button
          onClick={() => insertNode('moleculeBlock')}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
          <span>Chemical Molecule (SMILES)</span>
        </button>

        <button
          onClick={() => insertNode('mathBlock')}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <span className="w-3.5 h-3.5 font-serif italic font-bold text-center">∑</span>
          <span>KaTeX Math Formula</span>
        </button>

        <button
          onClick={handleUploadCSV}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-sky-500" />
          <span>Import Laboratory CSV</span>
        </button>

        <button
          onClick={() => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <Table2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Data Table</span>
        </button>
      </div>

      <div className="py-1">
        <button
          onClick={() => {
            onClose();
            if (onTriggerSave) {
              onTriggerSave();
            } else {
              window.dispatchEvent(new CustomEvent('inquestra:trigger-snapshot'));
            }
          }}
          className="w-full flex items-center justify-between px-3 py-1.5 text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-3.5 h-3.5 text-primary" />
            <span>Save Snapshot</span>
          </div>
          <kbd className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
            Ctrl+S
          </kbd>
        </button>
      </div>
    </div>
  );
}
