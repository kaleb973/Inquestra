'use client';
import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { useMemo, useState } from 'react';
import { Dna, Pencil, Copy, Check, Trash2, ArrowLeftRight } from 'lucide-react';

interface SequenceAnalysis {
  length: number;
  gcPercent: number | null;
  tmWallace: number | null;
  tmSaltAdjusted: number | null;
  primaryTm: number | null;
  tmMethodLabel: string | null;
}

function analyzeSequence(sequence: string, type: string): SequenceAnalysis {
  const clean = sequence.trim().toUpperCase();
  const length = clean.length;
  if (length === 0 || (type !== 'DNA' && type !== 'RNA')) {
    return {
      length,
      gcPercent: null,
      tmWallace: null,
      tmSaltAdjusted: null,
      primaryTm: null,
      tmMethodLabel: null,
    };
  }

  let aCount = 0;
  let tuCount = 0;
  let gCount = 0;
  let cCount = 0;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === 'A') aCount++;
    else if (ch === 'T' || ch === 'U') tuCount++;
    else if (ch === 'G') gCount++;
    else if (ch === 'C') cCount++;
  }

  const gcCount = gCount + cCount;
  const gcPercent = (gcCount / length) * 100;

  if (length < 6 || length > 200) {
    return {
      length,
      gcPercent,
      tmWallace: null,
      tmSaltAdjusted: null,
      primaryTm: null,
      tmMethodLabel: null,
    };
  }

  const tmWallace = 2 * (aCount + tuCount) + 4 * gcCount;
  // Standard salt-adjusted approximation (50 mM Na+)
  const tmSaltAdjusted = 81.5 + 16.6 * Math.log10(0.05) + 0.41 * gcPercent - 675 / length;

  const isShort = length <= 13;
  return {
    length,
    gcPercent,
    tmWallace,
    tmSaltAdjusted: isShort ? null : tmSaltAdjusted,
    primaryTm: isShort ? tmWallace : tmSaltAdjusted,
    tmMethodLabel: isShort ? 'Wallace ≤13 nt' : 'Salt-adj. >13 nt',
  };
}

function computeReverseComplement(sequence: string, type: string): string {
  const clean = sequence.trim().toUpperCase();
  const isRna = type === 'RNA';
  const map: Record<string, string> = {
    A: isRna ? 'U' : 'T',
    T: 'A',
    U: 'A',
    G: 'C',
    C: 'G',
  };
  let revComp = '';
  for (let i = clean.length - 1; i >= 0; i--) {
    revComp += map[clean[i]] ?? 'N';
  }
  return revComp;
}

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

function SequenceNode({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [copiedFasta, setCopiedFasta] = useState(false);
  const [copiedRevComp, setCopiedRevComp] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const sequence = String(node.attrs.sequence ?? '');
  const type = String(node.attrs.type ?? 'DNA');
  const name = String(node.attrs.name ?? 'Sequence 1');

  const analysis = useMemo(() => analyzeSequence(sequence, type), [sequence, type]);
  const unitLabel = type === 'Protein' ? 'aa' : type === 'RNA' ? 'nt' : 'bp';

  const getColor = (char: string) => {
    if (type !== 'DNA' && type !== 'RNA') return 'text-foreground';
    const c = char.toUpperCase();
    if (c === 'A') return 'text-red-600 dark:text-red-400 bg-red-500/10 rounded-sm px-0.5';
    if (c === 'T' || c === 'U') return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-sm px-0.5';
    if (c === 'G') return 'text-foreground bg-muted rounded-sm px-0.5';
    if (c === 'C') return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-sm px-0.5';
    return 'text-muted-foreground';
  };

  const getComplement = (char: string) => {
    if (type !== 'DNA' && type !== 'RNA') return '';
    const c = char.toUpperCase();
    if (c === 'A') return type === 'RNA' ? 'U' : 'T';
    if (c === 'T' || c === 'U') return 'A';
    if (c === 'G') return 'C';
    if (c === 'C') return 'G';
    return 'N';
  };

  const handleCopyFasta = () => {
    const fasta = `>${name}\n${sequence}`;
    navigator.clipboard.writeText(fasta).then(() => {
      setCopiedFasta(true);
      setTimeout(() => setCopiedFasta(false), 2000);
    });
  };

  const handleCopyRevComp = () => {
    const revComp = computeReverseComplement(sequence, type);
    navigator.clipboard.writeText(revComp).then(() => {
      setCopiedRevComp(true);
      setTimeout(() => setCopiedRevComp(false), 2000);
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
        <div className="bg-muted/60 px-4 py-2 flex items-center justify-between border-b border-border gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Dna className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
                title="Click to rename sequence"
              >
                {name}
              </h3>
            )}
          </div>
          <div className="flex gap-1.5 items-center shrink-0">
            {isEditing && (
              <select
                value={type}
                onChange={(e) => updateAttributes({ type: e.target.value })}
                aria-label="Sequence type"
                className="bg-background border border-border rounded px-2 py-0.5 text-xs text-foreground focus:outline-none shadow-sm"
              >
                <option value="DNA">DNA</option>
                <option value="RNA">RNA</option>
                <option value="Protein">Protein</option>
              </select>
            )}
            <span className="text-[11px] font-mono text-muted-foreground mr-1">
              {sequence.length} {unitLabel}
            </span>
            {(type === 'DNA' || type === 'RNA') && sequence.length > 0 && (
              <button
                type="button"
                onClick={handleCopyRevComp}
                title="Copy 5'→3' Reverse Complement"
                aria-label="Copy reverse complement"
                className="px-1.5 py-1 rounded text-[10px] font-mono text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition-colors flex items-center gap-1 border border-border/60 bg-background/60"
              >
                {copiedRevComp ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowLeftRight className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">{copiedRevComp ? 'Copied RC' : 'RevComp'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleCopyFasta}
              title="Copy as FASTA"
              aria-label="Copy as FASTA"
              className="p-1 rounded text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
            >
              {copiedFasta ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              title={isEditing ? 'Done editing' : 'Edit sequence'}
              aria-label={isEditing ? 'Done editing sequence' : 'Edit sequence'}
              className={`p-1 rounded transition-colors ${
                isEditing
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => deleteNode()}
              title="Remove sequence block"
              aria-label="Remove sequence block"
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
              placeholder="Paste nucleotide or amino acid sequence here..."
              className="w-full bg-background border border-border rounded p-3 text-sm font-mono text-foreground focus:outline-none focus:border-emerald-500 min-h-[150px] shadow-sm"
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

        {/* Primer & Sequence Analysis Stats Bar */}
        {sequence.length > 0 && (
          <div className="px-4 py-1.5 bg-muted/40 border-t border-border/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-muted-foreground">
            <span>
              Length: <strong className="text-foreground">{analysis.length} {unitLabel}</strong>
            </span>
            {analysis.gcPercent !== null && (
              <span>
                GC: <strong className="text-emerald-600 dark:text-emerald-400">{analysis.gcPercent.toFixed(1)}%</strong>
              </span>
            )}
            {analysis.primaryTm !== null && (
              <span
                title={
                  analysis.tmSaltAdjusted !== null && analysis.tmWallace !== null
                    ? `Salt-adjusted Tm (50 mM Na⁺): ${analysis.tmSaltAdjusted.toFixed(1)}°C | Basic Wallace rule: ${analysis.tmWallace.toFixed(1)}°C`
                    : `Wallace rule Tm = 2(A+T) + 4(G+C): ${analysis.primaryTm.toFixed(1)}°C`
                }
              >
                Tm:{' '}
                <strong className="text-sky-600 dark:text-sky-400">
                  {analysis.primaryTm.toFixed(1)}°C
                </strong>
                {analysis.tmMethodLabel && (
                  <span className="text-[10px] text-muted-foreground/80 ml-1">
                    ({analysis.tmMethodLabel})
                  </span>
                )}
                {analysis.tmSaltAdjusted !== null && analysis.tmWallace !== null && (
                  <span className="hidden md:inline text-[10px] text-muted-foreground/75 ml-2">
                    · Wallace: {analysis.tmWallace.toFixed(1)}°C
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
