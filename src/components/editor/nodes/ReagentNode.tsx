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
import { fetchInventoryForSearch } from '@/actions/adminActions';
import { useNotebookStore } from '@/store/useNotebookStore';

// ─── NodeView component ────────────────────────────────────────────────────────

function ReagentNodeView({ node, deleteNode }: NodeViewProps) {
  const activeTrial = useNotebookStore((s) => s.activeTrial);
  const trialId = activeTrial?.id || 'local';

  const [chemical, setChemical] = useState(node.attrs.initialChemical || '');
  const [quantity, setQuantity] = useState(node.attrs.initialQuantity || '');
  const [unit, setUnit] = useState(node.attrs.initialUnit || 'mL');

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const results = await fetchInventoryForSearch(query);
    setSuggestions(results);
    setShowSuggestions(true);
  };

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

        // Notify RightDrawer and other listeners to refresh trial inventory
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('inquestra:inventory-updated'));
        }
      } else {
        setFeedback({
          type: 'error',
          message: result.error || 'Deduction blocked.',
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
    <NodeViewWrapper className={`my-4 group relative ${showSuggestions ? 'z-50' : 'z-10'}`}>
      <div 
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className={`relative rounded-xl transition-all duration-300 ${
          isCommitted 
            ? 'bg-card border border-border hover:border-border/80 shadow-sm'
            : 'bg-card backdrop-blur-md border border-border shadow-xl'
        }`}
      >
        {/* Sleek edge highlight */}
        <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-gradient-to-b from-purple-500/50 to-transparent" />
        
        {/* Form / Content */}
        <div className="px-5 py-4 pl-6">
          {!isCommitted ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                  Log Reagent Usage
                </span>
                <button
                  onClick={deleteNode}
                  className="ml-auto text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 relative">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search reagent, chemical, plasmid..."
                    value={chemical}
                    onChange={(e) => {
                      setChemical(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    onFocus={() => { if (chemical.length > 0) setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all shadow-sm"
                  />
                  
                  {/* Autocomplete Dropdown - rendered with high z-index and no parent clipping */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-lg shadow-2xl z-[99999] max-h-56 overflow-y-auto divide-y divide-border py-1">
                      {suggestions.map((item) => (
                        <div
                          key={item.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setChemical(item.name);
                            setUnit(item.unit);
                            setShowSuggestions(false);
                          }}
                          className="px-3.5 py-2.5 hover:bg-accent cursor-pointer transition-colors flex justify-between items-center group/item"
                        >
                          <div>
                            <div className="text-sm font-medium text-foreground group-hover/item:text-purple-600 dark:group-hover/item:text-purple-300 transition-colors">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span className="uppercase tracking-wider font-mono text-[9px] bg-muted border border-border px-1 py-0.2 rounded text-foreground">{item.type}</span>
                              {item.location && <span>• {item.location.name}</span>}
                              {item.lotNumber && <span className="font-mono text-muted-foreground">• Lot {item.lotNumber}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-mono font-semibold text-foreground">{item.quantity} {item.unit}</div>
                            <div className="text-[9px] text-muted-foreground font-mono">available</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  placeholder="0.0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min={0}
                  step="any"
                  className="w-24 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-right shadow-sm"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  {['mL', 'L', 'µL', 'g', 'mg', 'µg', 'units', 'drops'].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                <button
                  onClick={handleDeduct}
                  disabled={feedback.type === 'loading'}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm shadow-sm"
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
            <p className="text-red-500 dark:text-red-400 text-xs mt-3">{feedback.message}</p>
          )}
          {feedback.type === 'success' && (
            <div className={`flex items-center gap-3 ${!isCommitted ? 'mt-3 pt-3 border-t border-border/60' : ''}`}>
              <div className="flex items-center gap-2">
                {feedback.alert ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-foreground" />
                )}
                <span className="text-sm font-medium text-muted-foreground">
                  Used <span className="text-foreground font-semibold">{quantity} {unit}</span> of <span className="text-indigo-600 dark:text-muted-foreground font-semibold">{feedback.chemical}</span>
                </span>
              </div>
              <div className="h-4 w-px bg-border mx-1" />
              <span className="text-xs text-muted-foreground font-mono">
                {feedback.remaining.toFixed(2)} {feedback.unit} remaining
              </span>
              {feedback.alert && (
                <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-caution font-mono font-semibold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-xs bg-caution" />
                  Low Stock
                </span>
              )}
              {isCommitted && (
                <button
                  onClick={deleteNode}
                  className="ml-auto text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <X className="w-4 h-4" />
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
  draggable: false,

  addAttributes() {
    return {
      initialChemical: {
        default: '',
      },
      initialUnit: {
        default: 'mL',
      },
      initialQuantity: {
        default: '',
      },
    };
  },

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
