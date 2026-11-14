'use client';
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import SmilesDrawer from 'smiles-drawer';
import { FlaskConical, Trash2, Search, Loader2, Copy, Check } from 'lucide-react';

interface CompoundPreset {
  label: string;
  smiles: string;
  name: string;
  mw: string;
  formula: string;
  iupacName: string;
  inchiKey: string;
}

// ─── Presets ─────────────────────────────────────────────────────────────────
const PRESETS: CompoundPreset[] = [
  {
    label: 'Benzene',
    smiles: 'c1ccccc1',
    name: 'Benzene',
    mw: '78.11',
    formula: 'C6H6',
    iupacName: 'benzene',
    inchiKey: 'UHOVQNZJYSORNB-UHFFFAOYSA-N',
  },
  {
    label: 'Caffeine',
    smiles: 'Cn1c(=O)c2c(ncn2C)n(c1=O)C',
    name: 'Caffeine',
    mw: '194.19',
    formula: 'C8H10N4O2',
    iupacName: '1,3,7-trimethylpurine-2,6-dione',
    inchiKey: 'RYYVLZVUVIJVGH-UHFFFAOYSA-N',
  },
  {
    label: 'Aspirin',
    smiles: 'CC(=O)Oc1ccccc1C(=O)O',
    name: 'Aspirin',
    mw: '180.16',
    formula: 'C9H8O4',
    iupacName: '2-acetyloxybenzoic acid',
    inchiKey: 'BSYNRYMUTXBXSQ-UHFFFAOYSA-N',
  },
  {
    label: 'Glucose',
    smiles: 'OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O',
    name: 'Glucose',
    mw: '180.16',
    formula: 'C6H12O6',
    iupacName: '(3R,4S,5S,6R)-6-(hydroxymethyl)oxane-2,3,4,5-tetrol',
    inchiKey: 'WQZGKKKJIJFFOK-GASJEMHNSA-N',
  },
  {
    label: 'Ethanol',
    smiles: 'CCO',
    name: 'Ethanol',
    mw: '46.07',
    formula: 'C2H6O',
    iupacName: 'ethanol',
    inchiKey: 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N',
  },
];

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
};

function formatSubscriptFormula(formula: string): string {
  return formula.replace(/[0-9]/g, (digit) => SUBSCRIPT_MAP[digit] ?? digit);
}

interface PubChemPropertyRecord {
  CID?: number;
  IsomericSMILES?: string;
  CanonicalSMILES?: string;
  SMILES?: string;
  ConnectivitySMILES?: string;
  MolecularFormula?: string;
  MolecularWeight?: string | number;
  IUPACName?: string;
  InChIKey?: string;
}

interface PubChemPropertyResponse {
  PropertyTable?: {
    Properties?: PubChemPropertyRecord[];
  };
}

export const MoleculeExtension = Node.create({
  name: 'moleculeBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      smiles: { default: 'c1ccccc1' },
      name: { default: 'Benzene' },
      mw: { default: '78.11' },
      formula: { default: 'C6H6' },
      iupacName: { default: 'benzene' },
      inchiKey: { default: 'UHOVQNZJYSORNB-UHFFFAOYSA-N' },
      lookupMode: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="moleculeBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'moleculeBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MoleculeNode);
  },
});

function MoleculeNode({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastLookedUpRef = useRef<string>('');
  const lookupAbortRef = useRef<AbortController | null>(null);

  const smiles = String(node.attrs.smiles ?? '');
  const name = String(node.attrs.name ?? 'Unknown Compound');
  const mw = String(node.attrs.mw ?? '');
  const formula = String(node.attrs.formula ?? '');
  const iupacName = String(node.attrs.iupacName ?? '');
  const inchiKey = String(node.attrs.inchiKey ?? '');

  const [isEditingName, setIsEditingName] = useState(false);
  const [lookupQuery, setLookupQuery] = useState(
    node.attrs.lookupMode ? (name !== 'Unknown Compound' ? name : '') : ''
  );
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [copiedInchi, setCopiedInchi] = useState(false);
  const [fetchingInchi, setFetchingInchi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      lookupAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !smiles.trim()) return;
    try {
      type SmilesDrawerCtor = typeof SmilesDrawer;
      const wrapped = SmilesDrawer as unknown as { default?: SmilesDrawerCtor };
      const SD: SmilesDrawerCtor = wrapped.default ?? SmilesDrawer;
      const DrawerClass = SD.Drawer;
      const parseFn = SD.parse;
      if (!DrawerClass || !parseFn) {
        setError('smiles-drawer failed to load');
        return;
      }
      const options = { width: 300, height: 200, padding: 5 };
      const drawer = new DrawerClass(options);
      const canvas = canvasRef.current;
      const isDark =
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      parseFn(
        smiles,
        (tree) => {
          drawer.draw(tree, canvas, isDark ? 'dark' : 'light', false);
          setError(null);
        },
        () => {
          setError('Invalid SMILES string');
        }
      );
    } catch (err) {
      console.error('[MoleculeNode] draw error:', err);
      setError('Render error — check SMILES syntax');
    }
  }, [smiles]);

  const handlePubChemLookup = useCallback(
    async (rawQuery: string, force = false) => {
      const trimmed = rawQuery.trim();
      if (!trimmed) return;
      if (!force && lastLookedUpRef.current.toLowerCase() === trimmed.toLowerCase()) return;

      lookupAbortRef.current?.abort();
      const controller = new AbortController();
      lookupAbortRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      lastLookedUpRef.current = trimmed;
      setIsLookingUp(true);
      setLookupError(null);

      try {
        const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
          trimmed
        )}/property/IsomericSMILES,MolecularFormula,MolecularWeight,IUPACName,InChIKey/JSON`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          setLookupError('Compound not found — enter SMILES manually');
          return;
        }

        const data = (await response.json()) as PubChemPropertyResponse;
        const prop = data.PropertyTable?.Properties?.[0];
        const resolvedSmiles =
          prop?.IsomericSMILES ??
          prop?.CanonicalSMILES ??
          prop?.SMILES ??
          prop?.ConnectivitySMILES ??
          '';

        if (!prop || !resolvedSmiles) {
          setLookupError('Compound not found — enter SMILES manually');
          return;
        }

        updateAttributes({
          name: trimmed,
          smiles: resolvedSmiles,
          mw: prop.MolecularWeight !== undefined ? String(prop.MolecularWeight) : '',
          formula: prop.MolecularFormula ?? '',
          iupacName: prop.IUPACName ?? '',
          inchiKey: prop.InChIKey ?? '',
          lookupMode: false,
        });
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setLookupError('Lookup timed out — enter SMILES manually');
        } else {
          setLookupError('Compound not found — enter SMILES manually');
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLookingUp(false);
      }
    },
    [updateAttributes]
  );

  const handleCopyInChIKey = async () => {
    if (inchiKey) {
      await navigator.clipboard.writeText(inchiKey);
      setCopiedInchi(true);
      setTimeout(() => setCopiedInchi(false), 2000);
      return;
    }

    if (!smiles.trim()) return;
    setFetchingInchi(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(
        smiles.trim()
      )}/property/InChIKey/JSON`;
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        setLookupError('InChIKey unavailable for this SMILES');
        return;
      }
      const data = (await response.json()) as PubChemPropertyResponse;
      const resolvedKey = data.PropertyTable?.Properties?.[0]?.InChIKey;
      if (!resolvedKey) {
        setLookupError('InChIKey unavailable for this SMILES');
        return;
      }
      updateAttributes({ inchiKey: resolvedKey });
      await navigator.clipboard.writeText(resolvedKey);
      setCopiedInchi(true);
      setTimeout(() => setCopiedInchi(false), 2000);
    } catch {
      setLookupError('Could not fetch InChIKey from PubChem');
    } finally {
      clearTimeout(timeoutId);
      setFetchingInchi(false);
    }
  };

  return (
    <NodeViewWrapper className="my-4 group">
      <div
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="border border-border bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
      >
        {/* Header */}
        <div className="bg-muted/60 px-4 py-2 flex items-center justify-between border-b border-border gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {isEditingName ? (
              <input
                autoFocus
                className="bg-background border border-border rounded px-2 py-0.5 text-sm text-foreground focus:outline-none focus:border-emerald-500 w-48 shadow-sm"
                value={name}
                onChange={(e) => updateAttributes({ name: e.target.value })}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              />
            ) : (
              <h3
                className="font-medium text-foreground text-sm cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate"
                onClick={() => setIsEditingName(true)}
                title="Click to rename compound"
              >
                {name}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-mono text-muted-foreground">
              MW: {mw ? `${mw} g/mol` : '?'}
            </span>
            <button
              type="button"
              onClick={() => deleteNode()}
              title="Remove molecule block"
              aria-label="Remove molecule block"
              className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Name Lookup & Presets */}
        <div className="px-4 py-2 space-y-2 border-b border-border/50 bg-muted/30">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handlePubChemLookup(lookupQuery, true);
            }}
            className="flex items-center gap-1.5"
          >
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={lookupQuery}
                autoFocus={Boolean(node.attrs.lookupMode)}
                onChange={(e) => {
                  setLookupQuery(e.target.value);
                  if (lookupError) setLookupError(null);
                }}
                onBlur={() => {
                  if (lookupQuery.trim()) {
                    handlePubChemLookup(lookupQuery);
                  }
                }}
                placeholder="PubChem lookup by name or IUPAC (e.g. Aspirin, Caffeine)…"
                aria-label="PubChem compound lookup"
                className="w-full bg-background border border-border rounded-md pl-8 pr-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLookingUp || !lookupQuery.trim()}
              className="px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shrink-0"
            >
              {isLookingUp ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Search className="w-3 h-3" />
              )}
              <span>Lookup</span>
            </button>
          </form>

          {lookupError && <p className="text-[11px] text-amber-600 dark:text-amber-400">{lookupError}</p>}

          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-mono text-muted-foreground mr-1 uppercase tracking-wider">
              Presets:
            </span>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setLookupError(null);
                  setError(null);
                  updateAttributes({
                    smiles: p.smiles,
                    name: p.name,
                    mw: p.mw,
                    formula: p.formula,
                    iupacName: p.iupacName,
                    inchiKey: p.inchiKey,
                    lookupMode: false,
                  });
                }}
                className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/70 bg-background hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              SMILES String
            </label>
            <textarea
              value={smiles}
              onChange={(e) =>
                updateAttributes({ smiles: e.target.value, inchiKey: '' })
              }
              placeholder="Enter SMILES..."
              className="bg-background border border-border rounded p-2 text-xs font-mono text-foreground focus:outline-none focus:border-emerald-500 min-h-[84px]"
            />
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={mw}
                onChange={(e) => updateAttributes({ mw: e.target.value })}
                placeholder="MW (g/mol)"
                aria-label="Molecular weight"
                className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-emerald-500 w-28"
              />
              <button
                type="button"
                onClick={handleCopyInChIKey}
                disabled={fetchingInchi || (!inchiKey && !smiles.trim())}
                title={inchiKey ? `Copy InChIKey: ${inchiKey}` : 'Resolve & copy InChIKey'}
                className="px-2.5 py-1 rounded border border-border bg-muted/50 hover:bg-muted text-xs font-mono text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {fetchingInchi ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : copiedInchi ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedInchi ? 'Copied InChIKey' : 'Copy InChIKey'}</span>
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 rounded-lg min-h-[168px] border border-border gap-2">
            {smiles.trim() ? (
              <canvas ref={canvasRef} className="max-w-full" />
            ) : (
              <span className="text-xs text-muted-foreground font-mono">
                Enter compound name or SMILES to render
              </span>
            )}
            {(formula || mw || iupacName) && (
              <div className="w-full border-t border-border/50 pt-2 text-center space-y-0.5">
                {(formula || mw) && (
                  <p className="text-xs font-mono text-foreground">
                    {formula ? formatSubscriptFormula(formula) : ''}
                    {formula && mw ? ' — ' : ''}
                    {mw ? `MW: ${mw} g/mol` : ''}
                  </p>
                )}
                {iupacName && (
                  <p className="text-[10px] text-muted-foreground truncate px-2" title={iupacName}>
                    IUPAC: {iupacName}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
