'use client';
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import SmilesDrawer from 'smiles-drawer';
import { FlaskConical, Trash2 } from 'lucide-react';

// ─── Presets ─────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Benzene', smiles: 'c1ccccc1', name: 'Benzene', mw: '78.11' },
  { label: 'Caffeine', smiles: 'Cn1c(=O)c2c(ncn2C)n(c1=O)C', name: 'Caffeine', mw: '194.19' },
  { label: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O', name: 'Aspirin', mw: '180.16' },
  { label: 'Glucose', smiles: 'OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O', name: 'Glucose', mw: '180.16' },
  { label: 'Ethanol', smiles: 'CCO', name: 'Ethanol', mw: '46.07' },
];

export const MoleculeExtension = Node.create({
  name: 'moleculeBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      smiles: { default: 'c1ccccc1' },
      name: { default: 'Unknown Compound' },
      mw: { default: '' },
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

function MoleculeNode(props: any) {
  const { node, updateAttributes, deleteNode } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const smiles = node.attrs.smiles;

  useEffect(() => {
    if (!canvasRef.current || !smiles) return;
    try {
      // ESM-safe access: smiles-drawer ships as ESM, CJS import wraps in .default
      const SD = (SmilesDrawer as any)?.default ?? SmilesDrawer;
      const DrawerClass = SD.Drawer;
      const parseFn = SD.parse;
      if (!DrawerClass || !parseFn) {
        setError('smiles-drawer failed to load');
        return;
      }
      const options = { width: 300, height: 200, padding: 5 };
      const drawer = new DrawerClass(options);
      const canvas = canvasRef.current;
      const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
      parseFn(
        smiles,
        (tree: any) => {
          drawer.draw(tree, canvas, isDark ? 'dark' : 'light', false);
          setError(null);
        },
        (_err: any) => {
          setError('Invalid SMILES string');
        }
      );
    } catch (err) {
      console.error('[MoleculeNode] draw error:', err);
      setError('Render error — check SMILES syntax');
    }
  }, [smiles]);

  return (
    <NodeViewWrapper className="my-4 group">
      <div
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="border border-border bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
      >
        {/* Header */}
        <div className="bg-muted/60 px-4 py-2 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-foreground" />
            {isEditing ? (
              <input
                autoFocus
                className="bg-background border border-border rounded px-2 py-0.5 text-sm text-foreground focus:outline-none focus:border-primary w-48 shadow-sm"
                value={node.attrs.name}
                onChange={(e) => updateAttributes({ name: e.target.value })}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              />
            ) : (
              <h3
                className="font-medium text-foreground text-sm cursor-pointer hover:text-indigo-600 dark:hover:text-muted-foreground transition-colors"
                onClick={() => setIsEditing(true)}
              >
                {node.attrs.name}
              </h3>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">MW: {node.attrs.mw || '?'}</span>
            <button
              type="button"
              onClick={() => deleteNode()}
              title="Remove molecule block"
              className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-b border-border/50 bg-muted/30">
          <span className="text-[10px] font-mono text-muted-foreground self-center mr-1 uppercase tracking-wider">Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => updateAttributes({ smiles: p.smiles, name: p.name, mw: p.mw })}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/70 bg-background hover:bg-primary/90/10 hover:border-border hover:text-indigo-600 dark:hover:text-muted-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">SMILES String</label>
            <textarea
              value={smiles}
              onChange={(e) => updateAttributes({ smiles: e.target.value })}
              placeholder="Enter SMILES..."
              className="bg-background border border-border rounded p-2 text-xs font-mono text-foreground focus:outline-none focus:border-primary min-h-[80px]"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={node.attrs.mw}
                onChange={(e) => updateAttributes({ mw: e.target.value })}
                placeholder="MW (g/mol)"
                className="bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary w-28"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
          <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-zinc-900 rounded-lg min-h-[160px] border border-border">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
