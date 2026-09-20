import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import Latex from 'react-latex-next';
import { Sigma } from 'lucide-react';
import 'katex/dist/katex.min.css';

export const MathExtension = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: 'E = mc^2',
      },
      caption: {
        default: '',
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mathBlock"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mathBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNode);
  },
});

function MathNode(props: any) {
  const { node, updateAttributes } = props;
  const [isEditing, setIsEditing] = useState(false);

  const latex = node.attrs.latex;

  return (
    <NodeViewWrapper className="my-4 group">
      <div 
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="border border-border bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col"
      >
        {/* Rendered Math */}
        <div 
          className="p-6 flex flex-col items-center justify-center cursor-pointer min-h-[100px] bg-background text-foreground text-lg"
          onClick={() => setIsEditing(true)}
        >
          <Latex>{`$$${latex}$$`}</Latex>
          
          {node.attrs.caption && !isEditing && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              {node.attrs.caption}
            </p>
          )}
          {!latex && !isEditing && (
            <span className="text-muted-foreground text-sm italic">Click to edit equation</span>
          )}
        </div>

        {/* Editor (shows only when clicked) */}
        {isEditing && (
          <div className="border-t border-border bg-muted/60 p-3 grid gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
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
              placeholder="Enter LaTeX e.g. \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
              className="bg-background border border-border rounded p-2 text-sm font-mono text-indigo-700 dark:text-indigo-300 focus:outline-none focus:border-indigo-500 w-full min-h-[60px]"
            />
            
            <input
              type="text"
              value={node.attrs.caption}
              onChange={(e) => updateAttributes({ caption: e.target.value })}
              placeholder="Caption (optional)"
              className="bg-background border border-border rounded p-1.5 text-xs text-foreground focus:outline-none focus:border-indigo-500 w-full"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
