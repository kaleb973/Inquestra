'use client';
// src/components/layout/RightDrawer.tsx
// 320px right panel: live DAQ telemetry stats + NIH FAIR metadata key-value manager.

import { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import { TelemetryMonitor } from '@/components/hardware/TelemetryMonitor';
import type { MetadataEntry } from '@/types/inquestra';

export function RightDrawer() {
  const metadata = useNotebookStore((s) => s.activeTrial?.metadata || []);
  const addMetadata = useNotebookStore((s) => s.addMetadata);
  const removeMetadata = useNotebookStore((s) => s.removeMetadata);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAddTag = () => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) return;

    const entry: MetadataEntry = {
      id:
        typeof crypto !== 'undefined'
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      key,
      value,
    };
    addMetadata(entry);
    setNewKey('');
    setNewValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddTag();
  };

  return (
    <aside className="w-[320px] bg-neutral-950/80 backdrop-blur-md border-l border-neutral-800/80 flex flex-col shrink-0 overflow-y-auto shadow-2xl z-10">
      {/* Live DAQ stats */}
      <TelemetryMonitor />

      {/* NIH FAIR Metadata */}
      <div className="border-t border-neutral-800/60 p-5 flex-1 bg-neutral-900/20">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            NIH FAIR Metadata
          </span>
        </div>

        {/* Existing tags */}
        <div className="space-y-2 mb-5">
          {metadata.length === 0 && (
            <p className="text-[11px] text-neutral-700 italic">
              No metadata tags yet.
            </p>
          )}
          {metadata.map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 group">
              <div className="flex-1 bg-neutral-900/50 border border-neutral-800/80 rounded-lg px-3 py-2 min-w-0 shadow-sm">
                <span className="block text-[10px] font-mono text-neutral-500 truncate mb-0.5">
                  {entry.key}
                </span>
                <span className="block text-xs text-neutral-200 break-words">{entry.value}</span>
              </div>
              <button
                onClick={() => removeMetadata(entry.id)}
                title="Remove tag"
                className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-red-400 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new tag */}
        <div className="space-y-2.5">
          <input
            type="text"
            placeholder="Key (e.g. organism)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600 transition-all shadow-inner"
          />
          <input
            type="text"
            placeholder="Value (e.g. Homo sapiens)"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-neutral-950/80 border border-neutral-800/80 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600 transition-all shadow-inner"
          />
          <button
            onClick={handleAddTag}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/80 text-xs text-neutral-300 font-medium transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Metadata Tag
          </button>
        </div>
      </div>
    </aside>
  );
}
