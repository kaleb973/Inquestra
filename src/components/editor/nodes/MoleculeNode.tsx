import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import SmilesDrawer from 'smiles-drawer';
import { FlaskConical } from 'lucide-react';

export const MoleculeExtension = Node.create({
  name: 'moleculeBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      smiles: {
        default: 'c1ccccc1', // Benzene default
      },
      name: {
        default: 'Unknown Compound',
      },
      mw: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="moleculeBlock"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'moleculeBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MoleculeNode);
  },
});

function MoleculeNode(props: any) {
  const { node, updateAttributes } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const smiles = node.attrs.smiles;

  useEffect(() => {
    if (canvasRef.current && smiles) {
      try {
        const options = { width: 300, height: 200, padding: 5 };
        const drawer = new SmilesDrawer.Drawer(options);
        const canvas = canvasRef.current;
        SmilesDrawer.parse(smiles, (tree: any) => {
          drawer.draw(tree, canvas, 'light', false);
          setError(null);
        }, (err: any) => {
          setError('Invalid SMILES');
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [smiles]);

  return (
    <NodeViewWrapper className="my-4 group">
      <div className="border border-border bg-neutral-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ring-1 ring-white/5 relative">
        {/* Header */}
        <div className="bg-neutral-800/80 px-4 py-2 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-indigo-500" />
            {isEditing ? (
              <input
                autoFocus
                className="bg-neutral-950 border border-border rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-indigo-500 w-48"
                value={node.attrs.name}
                onChange={(e) => updateAttributes({ name: e.target.value })}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
              />
            ) : (
              <h3 
                className="font-medium text-neutral-200 text-sm cursor-pointer hover:text-white"
                onClick={() => setIsEditing(true)}
              >
                {node.attrs.name}
              </h3>
            )}
          </div>
          <div className="text-xs font-mono text-muted-foreground flex gap-3">
            <span>MW: {node.attrs.mw || '?'}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">SMILES String</label>
            <textarea
              value={smiles}
              onChange={(e) => updateAttributes({ smiles: e.target.value })}
              placeholder="Enter SMILES..."
              className="bg-background border border-border rounded p-2 text-sm font-mono text-indigo-400 focus:outline-none focus:border-indigo-500 min-h-[80px]"
            />
            {error && <span className="text-xs text-red-400">{error}</span>}
          </div>
          
          <div className="flex items-center justify-center bg-white rounded-lg p-2 h-full min-h-[150px]">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
