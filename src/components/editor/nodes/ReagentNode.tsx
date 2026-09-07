'use client';
// src/components/editor/nodes/ReagentNode.tsx
// TipTap block NodeView for the /reagent slash command.
// Renders an interactive reagent deduction form that calls the deductReagent
// Server Action and shows stock-level feedback inline in the notebook.

import { useState, useCallback } from 'react';
import { Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { FlaskConical, Minus, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { deductReagent } from '@/actions/reagentActions';

// ─── NodeView component ────────────────────────────────────────────────────────

function ReagentNodeView({ deleteNode }: NodeViewProps) {
  const [chemical, setChemical] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('mL');
  const [trialId] = useState(() =>
    typeof crypto !== 'undefined' ? crypto.randomUUID() : 'local'
  );

  type FeedbackState =
    | { type: 'idle' }
    | { type: 'loading' }
    | { type: 'success'; remaining: number; unit: string; chemical: string; alert: boolean }
    | { type: 'error'; message: string };

  const [feedback, setFeedback] = useState<FeedbackState>({ type: 'idle' });

  const handleDeduct = useCallback(async () => {
    const qty = parseFloat(quantity);
    if (!chemical.trim() || isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', message: 'Enter a valid chemical name and quantity.' });
      return;
    }
    setFeedback({ type: 'loading' });
    try {
      const result = await deductReagent({
        chemical: chemical.trim(),
        quantity: qty,
        unit,
        trialId,
      });
      if (result.success) {
        setFeedback({
          type: 'success',
          remaining: result.remaining ?? 0,
          unit: result.unit ?? unit,
          chemical: result.chemical ?? chemical,
          alert: result.alert ?? false,
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Deduction failed.',
      });
    }
  }, [chemical, quantity, unit, trialId]);

  const isCommitted = feedback.type === 'success';

  return (
    <NodeViewWrapper className="my-3" data-drag-handle>
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-mono text-neutral-400">Reagent Deduction</span>
            {isCommitted && (
              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900 px-1.5 py-0.5 rounded font-mono">
                LOGGED
              </span>
            )}
          </div>
          <button
            onClick={deleteNode}
            className="text-neutral-700 hover:text-red-400 transition-colors p-1 rounded hover:bg-neutral-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-4 py-3">
          {!isCommitted ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Chemical name"
                value={chemical}
                onChange={(e) => setChemical(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors font-mono"
              />
              <input
                type="number"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min={0}
                step="any"
                className="w-20 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors font-mono text-right"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1.5 text-xs text-neutral-300 focus:outline-none focus:border-neutral-600 transition-colors font-mono"
              >
                {['mL', 'L', 'µL', 'g', 'mg', 'µg', 'units', 'drops'].map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <button
                onClick={handleDeduct}
                disabled={feedback.type === 'loading'}
                className="flex items-center gap-1 bg-purple-900/40 hover:bg-purple-900/70 border border-purple-900 text-purple-300 text-xs font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50"
              >
                <Minus className="w-3 h-3" />
                {feedback.type === 'loading' ? 'Logging…' : 'Deduct'}
              </button>
            </div>
          ) : null}

          {/* Feedback */}
          {feedback.type === 'error' && (
            <p className="text-red-400 text-xs mt-2 font-mono">{feedback.message}</p>
          )}
          {feedback.type === 'success' && (
            <div className={`flex items-start gap-2 ${!isCommitted ? 'mt-2' : ''}`}>
              {feedback.alert ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs text-neutral-200 font-mono">
                  <span className="text-purple-300">{feedback.chemical}</span>
                  {' '}deducted — {feedback.remaining.toFixed(2)} {feedback.unit} remaining
                </p>
                {feedback.alert && (
                  <p className="text-[11px] text-amber-500 mt-0.5">
                    ⚠ Stock below threshold — order required.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// ─── TipTap Extension ──────────────────────────────────────────────────────────

export const ReagentExtension = Node.create({
  name: 'reagentBlock',
  group: 'block',
  atom: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="reagent-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'reagent-block', ...HTMLAttributes }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ReagentNodeView);
  },
});
