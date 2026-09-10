'use client';
// src/components/editor/tools/ReviewerOverlay.tsx
// Strict PI Review Mode — Scans protocol blocks for skipped steps or missing timestamps.

import { useState } from 'react';
import { useNotebookStore } from '@/store/useNotebookStore';
import { ShieldAlert, CheckCircle, AlertOctagon, X } from 'lucide-react';

interface Deviation {
  id: string;
  protocolTitle: string;
  stepIndex: number;
  stepText: string;
}

export function ReviewerOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const content = useNotebookStore((s) => s.activeTrial.content) as any;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-80 mr-4 z-40 bg-purple-950/80 border border-purple-900 text-purple-400 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-purple-900 transition-colors shadow-lg shadow-purple-900/20 backdrop-blur"
      >
        Strict Review Mode
      </button>
    );
  }

  // Scan JSON tree for deviations
  const deviations: Deviation[] = [];
  
  const scanNode = (node: any) => {
    if (node?.type === 'protocolBlock') {
      const steps = node.attrs?.steps || [];
      const title = node.attrs?.title || 'Unnamed Protocol';
      
      // A protocol deviation is a step that is "completed" (true) but has NO timestamp, 
      // or a protocol that has a mix of completed and skipped steps without notes.
      // For this simple version: Any step missing a timestamp is flagged.
      steps.forEach((step: any, index: number) => {
        if (!step.timestamp) {
          deviations.push({
            id: `${node.attrs?.title}-${index}`,
            protocolTitle: title,
            stepIndex: index + 1,
            stepText: step.text || 'Empty step',
          });
        }
      });
    }
    
    if (node?.content) {
      node.content.forEach(scanNode);
    }
  };

  if (content?.type === 'doc') {
    scanNode(content);
  }

  return (
    <div className="fixed bottom-4 right-80 mr-4 z-40 bg-muted border border-purple-900 rounded-lg shadow-xl w-80 overflow-hidden flex flex-col max-h-[60vh]">
      <div className="bg-purple-950/50 p-3 border-b border-purple-900 flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-400">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">PI Review Mode</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-purple-400 hover:text-purple-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {deviations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <CheckCircle className="w-8 h-8 text-indigo-500 mb-2" />
            <p className="text-sm text-indigo-400 font-medium">No deviations found.</p>
            <p className="text-xs text-muted-foreground mt-1">All protocol steps are properly timestamped.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-400 mb-4 bg-red-950/30 p-2 rounded border border-red-900/50">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-medium">Found {deviations.length} untimestamped steps</span>
            </div>
            {deviations.map((d, i) => (
              <div key={i} className="bg-background border border-border p-3 rounded">
                <p className="text-xs font-semibold text-foreground mb-1">{d.protocolTitle}</p>
                <p className="text-xs text-muted-foreground font-mono">Step {d.stepIndex}: {d.stepText}</p>
                <div className="mt-2 text-[10px] text-red-400 uppercase font-semibold">Missing Timestamp</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
