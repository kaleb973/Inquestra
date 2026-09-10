"use client";
import { useState, useEffect } from 'react';
import { Tag, Plus, X, Activity, Box, FileKey } from 'lucide-react';
import { useNotebookStore, RightDrawerMode } from '@/store/useNotebookStore';
import { TelemetryMonitor } from '@/components/hardware/TelemetryMonitor';
import type { MetadataEntry } from '@/types/inquestra';
import { AIAssistant } from '@/components/layout/AIAssistant';

export function RightDrawer() {
  const metadata = useNotebookStore((s) => s.activeTrial?.metadata || []);
  const addMetadata = useNotebookStore((s) => s.addMetadata);
  const removeMetadata = useNotebookStore((s) => s.removeMetadata);
  const isSealed = !!useNotebookStore((s) => s.activeTrial?.checksum);
  
  const rightDrawerMode = useNotebookStore((s) => s.rightDrawerMode);
  const setRightDrawerMode = useNotebookStore((s) => s.setRightDrawerMode);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAddTag = () => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) return;

    const entry: MetadataEntry = {
      id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
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
    <aside className="w-[340px] bg-background/80 backdrop-blur-md border-l border-border flex flex-col shrink-0 overflow-hidden z-10">
      {/* Drawer Mode Tabs */}
      <div className="flex border-b border-border bg-muted/30">
        <button 
          onClick={() => setRightDrawerMode('TELEMETRY')}
          className={`flex-1 py-3 text-[11px] font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${rightDrawerMode === 'TELEMETRY' ? 'border-primary text-primary bg-muted' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Activity className="w-4 h-4" />
          DAQ & AI
        </button>
        <button 
          onClick={() => setRightDrawerMode('INVENTORY')}
          className={`flex-1 py-3 text-[11px] font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${rightDrawerMode === 'INVENTORY' ? 'border-primary text-primary bg-muted' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Box className="w-4 h-4" />
          LIMS
        </button>
        <button 
          onClick={() => setRightDrawerMode('COMPLIANCE')}
          className={`flex-1 py-3 text-[11px] font-medium transition-colors border-b-2 flex flex-col items-center gap-1 ${rightDrawerMode === 'COMPLIANCE' ? 'border-primary text-primary bg-muted' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <FileKey className="w-4 h-4" />
          Compliance
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-muted/10">
        {rightDrawerMode === 'TELEMETRY' && (
          <>
            <TelemetryMonitor />
            <div className="p-4 overflow-y-auto flex-1 border-t border-border">
               <AIAssistant />
            </div>
          </>
        )}

        {rightDrawerMode === 'INVENTORY' && (
          <div className="p-5 overflow-y-auto flex-1">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Linked Inventory (LIMS)</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Scan barcode or search to link an inventory lot to this experiment.
            </p>
            <div className="bg-muted rounded-md p-3 text-center border border-dashed border-border">
               <span className="text-xs text-muted-foreground">No inventory linked to this trial.</span>
            </div>
          </div>
        )}

        {rightDrawerMode === 'COMPLIANCE' && (
          <div className="p-5 overflow-y-auto flex-1">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Signatures & Compliance</h3>
            <p className="text-xs text-muted-foreground mb-4">
              21 CFR Part 11 Electronic Signatures.
            </p>
            {isSealed ? (
               <div className="bg-green-500/10 text-green-500 border border-green-500/20 rounded p-3 text-xs">
                 Document cryptographically sealed.
               </div>
            ) : (
               <button className="w-full bg-primary text-primary-foreground text-xs py-2 rounded font-medium">
                 Sign & Seal Document
               </button>
            )}
            
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  NIH FAIR Metadata
                </span>
              </div>
              <div className="space-y-2 mb-5">
                {metadata.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic">No metadata tags yet.</p>
                )}
                {metadata.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2 group">
                    <div className="flex-1 bg-background border border-border rounded px-3 py-2 min-w-0 shadow-sm">
                      <span className="block text-[10px] font-mono text-muted-foreground truncate mb-0.5">{entry.key}</span>
                      <span className="block text-xs text-foreground break-words">{entry.value}</span>
                    </div>
                    {!isSealed && (
                      <button
                        onClick={() => removeMetadata(entry.id)}
                        className="mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!isSealed && (
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Key (e.g. organism)"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Homo sapiens)"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddTag}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-secondary hover:bg-secondary/80 border border-border text-xs text-secondary-foreground font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Metadata Tag
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
