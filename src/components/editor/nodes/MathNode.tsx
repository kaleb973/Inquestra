'use client';
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import Latex from 'react-latex-next';
import { Sigma, Trash2, Copy, Check } from 'lucide-react';
import 'katex/dist/katex.min.css';

// ─── Presets ─────────────────────────────────────────────────────────────────
const MATH_PRESETS = [
  { label: 'Michaelis-Menten', latex: '\\frac{V_{max}[S]}{K_m + [S]}', caption: 'Enzyme kinetics' },
  { label: 'Nernst', latex: 'E = E^0 - \\frac{RT}{nF}\\ln Q', caption: 'Electrochemical potential' },
  { label: 'Beer-Lambert', latex: 'A = \\varepsilon l c', caption: 'Absorbance law' },
  { label: 'Arrhenius', latex: 'k = Ae^{-E_a/RT}', caption: 'Reaction rate constant' },
  { label: 'E=mc²', latex: 'E = mc^2', caption: 'Mass-energy equivalence' },
];

export const MathExtension = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: { default: 'E = mc^2' },
      caption: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mathBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mathBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNode);
  },
});

function MathNode(props: any) {
  const { node, updateAttributes, deleteNode } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const latex = node.attrs.latex;

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latex).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <NodeViewWrapper className="my-4 group">
      <div
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="border border-border bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col"
      >
        {/* Top action bar */}
        <div className="bg-muted/60 px-4 py-1.5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sigma className="w-3.5 h-3.5 text-foreground" />
            <span className="font-mono font-medium">KaTeX Equation</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLatex}
              title="Copy LaTeX source"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-primary/90/10 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => deleteNode()}
              title="Remove equation block"
              className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Rendered Math — click to edit */}
        <div
          className="p-6 flex flex-col items-center justify-center cursor-pointer min-h-[100px] bg-background text-foreground text-lg"
          onClick={() => setIsEditing(true)}
        >
          <Latex>{`$$${latex}$$`}</Latex>

          {node.attrs.caption && !isEditing && (
            <p className="text-xs text-muted-foreground mt-4 text-center">{node.attrs.caption}</p>
          )}
          {!latex && !isEditing && (
            <span className="text-muted-foreground text-sm italic">Click to edit equation</span>
          )}
        </div>

        {/* Editor */}
        {isEditing && (
          <div className="border-t border-border bg-muted/60 p-3 grid gap-2">
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              <span className="text-[10px] font-mono text-muted-foreground self-center uppercase tracking-wider mr-1">Presets:</span>
              {MATH_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => updateAttributes({ latex: p.latex, caption: p.caption })}
                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-border/70 bg-background hover:bg-primary/90/10 hover:border-border hover:text-indigo-600 dark:hover:text-muted-foreground transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Sigma className="w-3.5 h-3.5" /> KaTeX Equation
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded shadow-sm font-medium"
              >
                Done
              </button>
            </div>

            <textarea
              autoFocus
              value={latex}
              onChange={(e) => updateAttributes({ latex: e.target.value })}
              placeholder={`Enter LaTeX e.g. \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}`}
              className="bg-background border border-border rounded p-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary w-full min-h-[60px]"
            />

            <input
              type="text"
              value={node.attrs.caption}
              onChange={(e) => updateAttributes({ caption: e.target.value })}
              placeholder="Caption (optional)"
              className="bg-background border border-border rounded p-1.5 text-xs text-foreground focus:outline-none focus:border-primary w-full"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
