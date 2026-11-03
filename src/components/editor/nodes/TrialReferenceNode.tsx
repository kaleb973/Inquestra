'use client';
// src/components/editor/nodes/TrialReferenceNode.tsx
// TipTap custom node for cross-experiment data referencing.
// Inspired by Cassini's "Retrieve data by name" feature.
// Links and embeds experiment metadata and parameters directly into the notebook.

import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useState, useEffect } from 'react';
import {
  Database,
  ExternalLink,
  ChevronDown,
  Tag,
  Check,
  Copy,
  Search,
  RefreshCw,
} from 'lucide-react';
import { fetchAllTrials, getTrial } from '@/actions/trialActions';
import { useNotebookStore } from '@/store/useNotebookStore';
import type { TrialSummaryItem, TrialStatus, MetadataEntry } from '@/types/inquestra';

export const TrialReferenceExtension = Node.create({
  name: 'trialReferenceBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      trialId: { default: null },
      trialTitle: { default: null },
      trialStatus: { default: null },
      trialMetadata: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="trialReferenceBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'trialReferenceBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TrialReferenceNode);
  },
});

const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-muted', text: 'text-muted-foreground' },
  ACTIVE: { bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30', text: '' },
  IN_REVIEW: { bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30', text: '' },
  COMPLETED: { bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30', text: '' },
  FAILED: { bg: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30', text: '' },
};

function TrialReferenceNode({ node, updateAttributes }: NodeViewProps) {
  const trialId = (node.attrs.trialId as string | null) ?? null;
  const trialTitle = (node.attrs.trialTitle as string | null) ?? null;
  const trialStatus = (node.attrs.trialStatus as TrialStatus | null) ?? null;
  const trialMetadata = (node.attrs.trialMetadata as MetadataEntry[] | undefined) ?? [];
  const setActiveTrial = useNotebookStore((s) => s.setActiveTrial);
  const setCloudIds = useNotebookStore((s) => s.setCloudIds);

  const [isSelecting, setIsSelecting] = useState(!trialId);
  const [availableTrials, setAvailableTrials] = useState<TrialSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isSelecting && availableTrials.length === 0) {
      setLoading(true);
      fetchAllTrials()
        .then((ts) => setAvailableTrials(ts as unknown as TrialSummaryItem[]))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isSelecting, availableTrials.length]);

  const handleSelectTrial = (selected: TrialSummaryItem) => {
    updateAttributes({
      trialId: selected.id,
      trialTitle: selected.title,
      trialStatus: selected.status,
      trialMetadata: selected.metadata ?? [],
    });
    setIsSelecting(false);
  };

  const handleJumpToTrial = async () => {
    if (!trialId) return;
    try {
      const fullTrial = await getTrial(trialId);
      if (fullTrial) {
        setActiveTrial({
          id: fullTrial.id,
          title: fullTrial.title,
          content: (fullTrial.content ?? { type: 'doc', content: [] }) as Record<string, unknown>,
          status: fullTrial.status as TrialStatus,
          metadata: (fullTrial.metadata ?? []) as MetadataEntry[],
          createdAt: fullTrial.createdAt instanceof Date ? fullTrial.createdAt.toISOString() : String(fullTrial.createdAt),
          updatedAt: fullTrial.updatedAt instanceof Date ? fullTrial.updatedAt.toISOString() : String(fullTrial.updatedAt),
          checksum: fullTrial.checksum ?? null,
          sealedAt: fullTrial.sealedAt instanceof Date ? fullTrial.sealedAt.toISOString() : (fullTrial.sealedAt ?? null),
          sealedBy: fullTrial.sealedBy ?? null,
        });

        setCloudIds({
          cloudTrialId: fullTrial.id,
          cloudProjectId: fullTrial.projectId,
        });
      }
    } catch (err) {
      console.error('Failed to jump to trial:', err);
    }
  };

  const handleCopyRef = () => {
    if (!trialId) return;
    navigator.clipboard.writeText(`@trial:${trialId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTrials = availableTrials.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <NodeViewWrapper className="my-4">
      {isSelecting ? (
        <div className="p-3 bg-card border border-border rounded-xl shadow-md max-w-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-foreground" />
              <span className="text-xs font-semibold text-foreground">
                Retrieve Experiment Data by Name
              </span>
            </div>
            {trialId && (
              <button
                onClick={() => setIsSelecting(false)}
                className="text-[11px] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiments by name..."
              className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center p-3 text-xs text-muted-foreground gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Loading experiments...
              </div>
            ) : filteredTrials.length === 0 ? (
              <p className="p-3 text-xs text-center text-muted-foreground">
                No matching experiments found.
              </p>
            ) : (
              filteredTrials.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTrial(t)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted text-left transition-colors border border-transparent hover:border-border/60"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="text-xs font-medium text-foreground block truncate">
                      {t.title}
                    </span>
                    {t.metadata && t.metadata.length > 0 && (
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {t.metadata.slice(0, 3).map((m) => `${m.key}: ${m.value}`).join(' · ')}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold bg-muted text-muted-foreground shrink-0">
                    {t.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="relative group max-w-xl bg-card border border-border/80 rounded-xl p-3.5 shadow-sm hover:border-border transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-muted text-foreground shrink-0 mt-0.5">
                <Database className="w-4 h-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Referenced Experiment
                  </span>
                  {trialStatus && (
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full uppercase ${
                        STATUS_PILL[trialStatus]?.bg ?? 'bg-muted'
                      }`}
                    >
                      {trialStatus}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-foreground truncate tracking-tight">
                  {trialTitle ?? 'Untitled Experiment'}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleCopyRef}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Copy reference token"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsSelecting(true)}
                className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
              >
                Change
              </button>
            </div>
          </div>

          {/* Parameters chips */}
          {trialMetadata && trialMetadata.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-wrap gap-1.5">
              {trialMetadata.map((m, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 text-[10px] bg-muted/60 border border-border/60 px-2 py-0.5 rounded-md font-mono text-muted-foreground"
                >
                  <Tag className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{m.key}:</span>
                  <span>{m.value}</span>
                </span>
              ))}
            </div>
          )}

          {/* Jump action */}
          <div className="mt-3 pt-2 flex items-center justify-end">
            <button
              onClick={handleJumpToTrial}
              className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-foreground transition-colors"
            >
              <span>Inspect Source Notebook</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}
