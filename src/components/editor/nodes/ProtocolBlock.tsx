'use client';
// src/components/editor/nodes/ProtocolBlock.tsx
// TipTap block NodeView for /protocol slash command.
// Supports:
//   - Adding/removing protocol steps
//   - Checking off steps at the bench (auto-timestamps)
//   - Inline deviation notes per step
//   - Forking to a fresh run (resets checkboxes, bumps version)
// All state lives in node attrs (persisted in TipTap JSON → Zustand → localStorage).

import { useState, useCallback } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  GitFork,
  X,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProtocolStep {
  id: string;
  text: string;
  checked: boolean;
  checkedAt: string | null;   // ISO timestamp
  deviation: string | null;   // deviation note
}

interface ProtocolAttrs {
  title: string;
  version: number;
  steps: ProtocolStep[];
}

function makeStep(text = ''): ProtocolStep {
  return {
    id: crypto.randomUUID(),
    text,
    checked: false,
    checkedAt: null,
    deviation: null,
  };
}

// ─── NodeView component ────────────────────────────────────────────────────────

function ProtocolNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as ProtocolAttrs;
  const [showDeviation, setShowDeviation] = useState<string | null>(null);
  const [deviationDraft, setDeviationDraft] = useState('');

  const update = useCallback(
    (patch: Partial<ProtocolAttrs>) => updateAttributes({ ...attrs, ...patch }),
    [attrs, updateAttributes]
  );

  // ── Step mutations ─────────────────────────────────────────────────────────

  const addStep = () =>
    update({ steps: [...attrs.steps, makeStep()] });

  const removeStep = (id: string) =>
    update({ steps: attrs.steps.filter((s) => s.id !== id) });

  const editStepText = (id: string, text: string) =>
    update({
      steps: attrs.steps.map((s) => (s.id === id ? { ...s, text } : s)),
    });

  const toggleStep = (id: string) =>
    update({
      steps: attrs.steps.map((s) =>
        s.id === id
          ? {
              ...s,
              checked: !s.checked,
              checkedAt: !s.checked ? new Date().toISOString() : null,
              deviation: !s.checked ? s.deviation : null,
            }
          : s
      ),
    });

  const saveDeviation = (id: string) => {
    update({
      steps: attrs.steps.map((s) =>
        s.id === id ? { ...s, deviation: deviationDraft.trim() || null } : s
      ),
    });
    setShowDeviation(null);
    setDeviationDraft('');
  };

  // ── Fork: copy steps, reset checks, bump version ──────────────────────────

  const forkProtocol = () =>
    update({
      version: attrs.version + 1,
      steps: attrs.steps.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        checked: false,
        checkedAt: null,
        deviation: null,
      })),
    });

  const completedCount = attrs.steps.filter((s) => s.checked).length;
  const totalCount = attrs.steps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <NodeViewWrapper className="my-4">
      <div 
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-lg overflow-hidden shadow-sm"
      >

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardList className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400 shrink-0" />
            <input
              value={attrs.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Protocol title…"
              className="bg-transparent text-xs font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none truncate"
            />
            <span className="text-[10px] text-muted-foreground font-mono shrink-0">
              v{attrs.version}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] text-muted-foreground font-mono mr-1">
              {completedCount}/{totalCount}
            </span>
            <button
              onClick={forkProtocol}
              title="Fork — new run with same steps"
              className="text-muted-foreground hover:text-violet-500 p-1 rounded hover:bg-accent transition-colors"
            >
              <GitFork className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={deleteNode}
              title="Remove protocol block"
              className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-accent transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="h-0.5 bg-muted">
            <div
              className="h-full bg-violet-600 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        {/* Steps */}
        <div className="px-4 py-3 space-y-1.5">
          {attrs.steps.length === 0 && (
            <p className="text-muted-foreground text-xs italic text-center py-2">
              No steps yet — add one below
            </p>
          )}

          {attrs.steps.map((step, idx) => (
            <div key={step.id} className="group">
              <div className="flex items-start gap-2">
                {/* Step number */}
                <span className="text-[10px] text-muted-foreground font-mono mt-1.5 w-4 shrink-0 text-right">
                  {idx + 1}
                </span>

                {/* Checkbox */}
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`mt-0.5 shrink-0 transition-colors ${
                    step.checked ? 'text-violet-500 dark:text-violet-400' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {step.checked ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                {/* Step text */}
                <input
                  value={step.text}
                  onChange={(e) => editStepText(step.id, e.target.value)}
                  placeholder={`Step ${idx + 1}…`}
                  className={`flex-1 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground font-mono py-0.5 ${
                    step.checked ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                />

                {/* Deviation + delete (shown on hover or when checked) */}
                <div className={`flex items-center gap-1 shrink-0 ${step.checked ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                  {step.checked && (
                    <button
                      onClick={() => {
                        setDeviationDraft(step.deviation ?? '');
                        setShowDeviation(step.id);
                      }}
                      title="Log deviation"
                      className={`p-1 rounded hover:bg-accent transition-colors ${
                        step.deviation ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={() => removeStep(step.id)}
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Timestamp */}
              {step.checkedAt && (
                <p className="text-[10px] text-muted-foreground font-mono ml-10 mt-0.5">
                  ✓ {new Date(step.checkedAt).toLocaleString()}
                  {step.deviation && (
                    <span className="text-amber-600 dark:text-amber-400 ml-2">⚠ {step.deviation}</span>
                  )}
                </p>
              )}

              {/* Deviation input */}
              {showDeviation === step.id && (
                <div className="ml-10 mt-1 flex gap-2">
                  <input
                    autoFocus
                    value={deviationDraft}
                    onChange={(e) => setDeviationDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveDeviation(step.id);
                      if (e.key === 'Escape') setShowDeviation(null);
                    }}
                    placeholder="Describe deviation from protocol…"
                    className="flex-1 bg-background border border-amber-500/40 rounded px-2.5 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none font-mono"
                  />
                  <button
                    onClick={() => saveDeviation(step.id)}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 px-2 font-medium"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add step footer */}
        <div className="px-4 pb-3">
          <button
            onClick={addStep}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-violet-500 transition-colors font-mono"
          >
            <Plus className="w-3.5 h-3.5" />
            Add step
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ─── TipTap Extension ──────────────────────────────────────────────────────────

export const ProtocolExtension = Node.create({
  name: 'protocolBlock',
  group: 'block',
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      title: { default: 'New Protocol' },
      version: { default: 1 },
      steps: { default: [] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="protocol-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'protocol-block' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProtocolNodeView);
  },
});
