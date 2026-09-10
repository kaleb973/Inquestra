import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import { Dna } from 'lucide-react';

export const SequenceExtension = Node.create({
  name: 'sequenceBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      sequence: {
        default: 'ATGCGTACGTAGCTAGCTAGCTGATCGATCGTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCTAGCT',
      },
      name: {
        default: 'Sequence 1',
      },
      type: {
        default: 'DNA', // DNA, RNA, Protein
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="sequenceBlock"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sequenceBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SequenceNode);
  },
});

function SequenceNode(props: any) {
  const { node, updateAttributes } = props;
  const [isEditing, setIsEditing] = useState(false);

  const sequence = node.attrs.sequence;
  const type = node.attrs.type;

  // Simple coloring for nucleotides
  const getColor = (char: string) => {
    if (type !== 'DNA' && type !== 'RNA') return 'text-neutral-300';
    const c = char.toUpperCase();
    if (c === 'A') return 'text-red-400 bg-red-950/30';
    if (c === 'T' || c === 'U') return 'text-blue-400 bg-blue-950/30';
    if (c === 'G') return 'text-indigo-400 bg-indigo-950/30';
    if (c === 'C') return 'text-amber-400 bg-amber-950/30';
    return 'text-neutral-500';
  };

  const getComplement = (char: string) => {
    if (type !== 'DNA') return '';
    const c = char.toUpperCase();
    if (c === 'A') return 'T';
    if (c === 'T') return 'A';
    if (c === 'G') return 'C';
    if (c === 'C') return 'G';
    return 'N';
  };

  return (
    <NodeViewWrapper className="my-4 group">
      <div className="border border-border bg-neutral-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ring-1 ring-white/5 relative">
        {/* Header */}
        <div className="bg-neutral-800/80 px-4 py-2 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4 text-purple-400" />
            {isEditing ? (
              <input
                autoFocus
                className="bg-neutral-950 border border-border rounded px-2 py-0.5 text-sm text-white focus:outline-none focus:border-purple-500 w-48"
                value={node.attrs.name}
                onChange={(e) => updateAttributes({ name: e.target.value })}
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
          <div className="flex gap-2">
            {isEditing && (
              <select
                value={type}
                onChange={(e) => updateAttributes({ type: e.target.value })}
                className="bg-background border border-border rounded px-2 py-0.5 text-xs text-white focus:outline-none"
              >
                <option value="DNA">DNA</option>
                <option value="RNA">RNA</option>
                <option value="Protein">Protein</option>
              </select>
            )}
            <span className="text-xs font-mono text-muted-foreground self-center">
              {sequence.length} bp
            </span>
            {isEditing && (
              <button 
                onClick={() => setIsEditing(false)}
                className="text-xs bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded text-white font-medium"
              >
                Done
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="p-3">
            <textarea
              value={sequence}
              onChange={(e) => updateAttributes({ sequence: e.target.value.replace(/\s/g, '').toUpperCase() })}
              placeholder="Paste sequence here..."
              className="w-full bg-background border border-border rounded p-3 text-sm font-mono text-neutral-300 focus:outline-none focus:border-purple-500 min-h-[150px]"
            />
          </div>
        ) : (
          <div className="p-4 overflow-x-auto bg-background">
            <div className="flex flex-col gap-1 w-max">
              {/* 5' -> 3' Strand */}
              <div className="flex font-mono text-xs tracking-[0.2em]">
                <span className="text-neutral-500 mr-4 select-none">5'</span>
                {sequence.split('').map((char: string, i: number) => (
                  <span key={`f-${i}`} className={getColor(char)}>{char}</span>
                ))}
                <span className="text-neutral-500 ml-4 select-none">3'</span>
              </div>
              
              {/* Matches */}
              {type === 'DNA' && (
                <div className="flex font-mono text-[10px] tracking-[0.2em] text-neutral-600 opacity-50 pl-[1.6rem]">
                  {sequence.split('').map((char: string, i: number) => (
                    <span key={`m-${i}`}>|</span>
                  ))}
                </div>
              )}
              
              {/* 3' -> 5' Complement */}
              {type === 'DNA' && (
                <div className="flex font-mono text-xs tracking-[0.2em]">
                  <span className="text-neutral-500 mr-4 select-none">3'</span>
                  {sequence.split('').map((char: string, i: number) => {
                    const comp = getComplement(char);
                    return <span key={`r-${i}`} className={getColor(comp)}>{comp}</span>;
                  })}
                  <span className="text-neutral-500 ml-4 select-none">5'</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
