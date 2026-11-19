'use client';
// src/components/canvas/CanvasContextMenu.tsx
// Specialized right-click context menu for the Editor Canvas.
// Allows researchers to quickly insert protocol blocks, charts, reagents, and save snapshots.

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
      className="fixed z-50 w-52 rounded-lg bg-popover/95 backdrop-blur-sm border border-border shadow-lg p-1 text-xs text-popover-foreground font-sans animate-in fade-in-50 zoom-in-95 duration-75 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-2 py-1 text-[10px] text-muted-foreground font-mono uppercase tracking-wider border-b border-border/50 mb-1">
        Insert Block
      </div>

      <div className="space-y-0.5">
        <button
          onClick={() => insertNode('interactiveChart', { csvData: null })}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>Telemetry Chart</span>
        </button>

        <button
          onClick={() => insertNode('reagentBlock')}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>Reagent Deduction</span>
        </button>

        <button
          onClick={() =>
            insertNode('protocolBlock', { title: 'New Protocol', version: 1, steps: [] })
          }
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>Protocol Checklist</span>
        </button>

        <button
          onClick={() => insertNode('moleculeBlock')}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <FlaskConical className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>Molecule (SMILES)</span>
        </button>

        <button
          onClick={() => insertNode('mathBlock')}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <span className="w-3.5 h-3.5 font-serif italic text-muted-foreground text-center shrink-0">∑</span>
          <span>Math Formula</span>
        </button>

        <button
          onClick={() => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <Table2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>Data Table</span>
        </button>
      </div>

      <div className="my-1 h-px bg-border/50" />

      <div className="space-y-0.5">
        <button
          onClick={handleUploadCSV}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span>Import CSV…</span>
        </button>

        <button
          onClick={() => {
            onClose();
            if (onTriggerSave) {
              onTriggerSave();
            } else {
              window.dispatchEvent(new CustomEvent('inquestra:trigger-snapshot'));
            }
          }}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-left hover:bg-accent hover:text-foreground transition-colors"
        >
          <div className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>Save Snapshot</span>
          </div>
          <kbd className="text-[9px] font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded border border-border">
            Ctrl+S
          </kbd>
        </button>
      </div>
    </div>
  );
}
