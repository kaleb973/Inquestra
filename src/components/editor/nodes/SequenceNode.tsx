'use client';
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { useState } from 'react';
import { Dna, Pencil, Copy, Check, Trash2 } from 'lucide-react';

export const SequenceExtension = Node.create({
  name: 'sequenceBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      sequence: {
        default: 'ATGCGTACGTAGCTAGCTAGCTGATCG',
      },
      name: {
        default: 'Sequence 1',
      },
      type: {
        default: 'DNA', // DNA, RNA, Protein
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="sequenceBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sequenceBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SequenceNode);
  },
});

function SequenceNode(props: any) {
  const { node, updateAttributes, deleteNode } = props;
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const sequence = node.attrs.sequence;
  const type = node.attrs.type;

  const getColor = (char: string) => {
    if (type !== 'DNA' && type !== 'RNA') return 'text-foreground';
    const c = char.toUpperCase();
    if (c === 'A') return 'text-red-600 dark:text-red-400 bg-red-500/10 rounded-sm px-0.5';
    if (c === 'T' || c === 'U') return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-sm px-0.5';
    if (c === 'G') return 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 rounded-sm px-0.5';
    if (c === 'C') return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-sm px-0.5';
    return 'text-muted-foreground';
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

  const handleCopyFasta = () => {
    const fasta = `>${node.attrs.name}\n${sequence}`;
    navigator.clipboard.writeText(fasta).then(() => {
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
        className="border border-border bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative"
      >
        {/* Header */}
        <div className="bg-muted/60 px-4 py-2 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            {isEditingName ? (
              <input
                autoFocus
                className="bg-background border border-border rounded px-2 py-0.5 text-sm text-foreground focus:outline-none focus:border-purple-500 w-48 shadow-sm"
                value={node.attrs.name}
                onChange={(e) => updateAttributes({ name: e.target.value })}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              />
            ) : (
              <h3
                className="font-medium text-foreground text-sm cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                onClick={() => setIsEditingName(true)}
              >
                {node.attrs.name}
              </h3>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {isEditing && (
              <select
                value={type}
                onChange={(e) => updateAttributes({ type: e.target.value })}
                className="bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none shadow-sm"
              >
                <option value="DNA">DNA</option>
                <option value="RNA">RNA</option>
                <option value="Protein">Protein</option>
              </select>
            )}
            <span className="text-xs font-mono text-muted-foreground">{sequence.length} bp</span>
            <button
              type="button"
              onClick={handleCopyFasta}
              title="Copy as FASTA"
              className="p-1 rounded text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              title={isEditing ? 'Done editing' : 'Edit sequence'}
              className={`p-1 rounded transition-colors ${isEditing ? 'text-purple-500 bg-purple-500/10' : 'text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10'}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => deleteNode()}
              title="Remove sequence block"
              className="p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="p-3 bg-muted/20">
            <textarea
              value={sequence}
              onChange={(e) =>
                updateAttributes({ sequence: e.target.value.replace(/\s/g, '').toUpperCase() })
              }
              placeholder="Paste sequence here..."
              className="w-full bg-background border border-border rounded p-3 text-sm font-mono text-foreground focus:outline-none focus:border-purple-500 min-h-[150px] shadow-sm"
            />
          </div>
        ) : (
          <div className="p-4 overflow-x-auto bg-background">
            <div className="flex flex-col gap-1 w-max">
              {/* 5' -> 3' Strand */}
              <div className="flex font-mono text-xs tracking-[0.2em]">
                <span className="text-neutral-500 mr-4 select-none">5&apos;</span>
                {sequence.split('').map((char: string, i: number) => (
                  <span key={`f-${i}`} className={getColor(char)}>
                    {char}
                  </span>
                ))}
                <span className="text-neutral-500 ml-4 select-none">3&apos;</span>
              </div>

              {/* Match indicators */}
              {type === 'DNA' && (
                <div className="flex font-mono text-[10px] tracking-[0.2em] text-neutral-600 opacity-50 pl-[1.6rem]">
                  {sequence.split('').map((_char: string, i: number) => (
                    <span key={`m-${i}`}>|</span>
                  ))}
                </div>
              )}

              {/* 3' -> 5' Complement */}
              {type === 'DNA' && (
                <div className="flex font-mono text-xs tracking-[0.2em]">
                  <span className="text-neutral-500 mr-4 select-none">3&apos;</span>
                  {sequence.split('').map((char: string, i: number) => {
                    const comp = getComplement(char);
                    return (
                      <span key={`r-${i}`} className={getColor(comp)}>
                        {comp}
                      </span>
                    );
                  })}
                  <span className="text-neutral-500 ml-4 select-none">5&apos;</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
