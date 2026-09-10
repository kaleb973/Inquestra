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
    <NodeViewWrapper className="my-4 group" data-drag-handle>
      <div className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
        isCommitted 
          ? 'bg-background/40 border border-border/60 hover:border-border/80'
          : 'bg-muted/50 backdrop-blur-md border border-border shadow-xl'
      }`}>
        {/* Sleek edge highlight */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500/50 to-transparent" />
        
        {/* Form / Content */}
        <div className="px-5 py-4 pl-6">
          {!isCommitted ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-purple-400" />
                <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Log Reagent Usage
                </span>
                <button
                  onClick={deleteNode}
                  className="ml-auto text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Chemical name"
                  value={chemical}
                  onChange={(e) => setChemical(e.target.value)}
                  className="flex-1 bg-background/80 border border-border/80 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                />
                <input
                  type="number"
                  placeholder="0.0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={0}
                  step="any"
                  className="w-24 bg-background/80 border border-border/80 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-right shadow-inner"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="bg-background/80 border border-border/80 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer"
                >
                  {['mL', 'L', 'µL', 'g', 'mg', 'µg', 'units', 'drops'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <button
                  onClick={handleDeduct}
                  disabled={feedback.type === 'loading'}
                  className="flex items-center gap-1.5 bg-white text-neutral-950 hover:bg-neutral-200 font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm shadow-sm"
                >
                  {feedback.type === 'loading' ? (
                    'Logging…'
                  ) : (
                    <>
                      <Minus className="w-3.5 h-3.5" />
                      Log Use
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {/* Feedback */}
          {feedback.type === 'error' && (
            <p className="text-red-400 text-xs mt-3">{feedback.message}</p>
          )}
          {feedback.type === 'success' && (
            <div className={`flex items-center gap-3 ${!isCommitted ? 'mt-3 pt-3 border-t border-border/60' : ''}`}>
              <div className="flex items-center gap-2">
                {feedback.alert ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                )}
                <span className="text-sm font-medium text-neutral-200">
                  Used <span className="text-white">{quantity} {unit}</span> of <span className="text-purple-300 font-semibold">{feedback.chemical}</span>
                </span>
              </div>
              <div className="h-4 w-px bg-neutral-800 mx-1" />
              <span className="text-xs text-muted-foreground font-mono">
                {feedback.remaining.toFixed(2)} {feedback.unit} remaining
              </span>
              {feedback.alert && (
                <span className="ml-auto text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium tracking-wide uppercase">
                  Low Stock
                </span>
              )}
              {isCommitted && (
                <button
                  onClick={deleteNode}
                  className="ml-auto text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
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
