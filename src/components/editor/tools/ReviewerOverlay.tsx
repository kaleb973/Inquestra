'use client';
// src/components/editor/tools/ReviewerOverlay.tsx
// Strict PI Review Mode — Scans protocol blocks for skipped steps or missing timestamps.

import { useState } from 'react';
import { useNotebookStore } from '@/store/useNotebookStore';
import { ShieldAlert, CheckCircle, AlertOctagon, X } from 'lucide-react';

interface ProtocolReviewStep {
  text?: string;
  timestamp?: string | null;
  checkedAt?: string | null;
}

interface ReviewDocNode {
  type?: string;
  attrs?: {
    title?: string;
    steps?: ProtocolReviewStep[];
  };
  content?: ReviewDocNode[];
}

interface Deviation {
  id: string;
  protocolTitle: string;
  stepIndex: number;
  stepText: string;
}

export function ReviewerOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const content = useNotebookStore((s) => s.activeTrial.content) as ReviewDocNode;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-80 mr-4 z-40 bg-card border border-border text-foreground px-3 py-1.5 rounded-md text-xs font-mono font-medium hover:bg-accent transition-colors shadow-md backdrop-blur inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ShieldAlert className="w-3.5 h-3.5 text-primary" />
        Strict Review Mode
      </button>
    );
  }

  // Scan JSON tree for deviations
  const deviations: Deviation[] = [];

  const scanNode = (node: ReviewDocNode) => {
    if (node?.type === 'protocolBlock') {
      const steps = node.attrs?.steps || [];
      const title = node.attrs?.title || 'Unnamed Protocol';

      // Any protocol step missing a completion timestamp is flagged.
      steps.forEach((step, index) => {
        if (!step.checkedAt && !step.timestamp) {
          deviations.push({
            id: `${title}-${index}`,
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
    <div
      role="region"
      aria-label="PI Review Mode deviations"
      className="fixed bottom-4 right-80 mr-4 z-40 bg-card border border-border rounded-lg shadow-xl w-80 overflow-hidden flex flex-col max-h-[60vh]"
    >
      <div className="bg-muted/60 p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <ShieldAlert className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">PI Review Mode</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close review overlay"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {deviations.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <CheckCircle className="w-8 h-8 text-foreground mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No deviations found.</p>
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
