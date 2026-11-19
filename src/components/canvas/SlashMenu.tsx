'use client';
// src/components/canvas/SlashMenu.tsx
// Keyboard-navigable slash-command popup rendered by the TipTap Suggestion extension.
// Receives items + command callback from the suggestion render() lifecycle.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useRef,
  type ReactNode,
} from 'react';
import type { Editor, Range } from '@tiptap/core';

// ─── Public types ──────────────────────────────────────────────────────────────

export interface SlashCommand {
  title: string;
  description: string;
  icon: ReactNode;
  /** Category grouping (e.g. 'Scientific', 'Protocols & SOPs', 'Data & DAQ', 'Actions & Compliance', 'Formatting') */
  category?: string;
  /** Alias keywords used for fuzzy search (e.g. 'chem', 'molecule', 'smiles') */
  keywords?: string[];
  command: (params: { editor: Editor; range: Range }) => void;
}

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashMenuProps {
  items: SlashCommand[];
  command: (item: SlashCommand) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Reset selection whenever the filtered item list changes
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    // Keep selected item visible within the scrollable dropdown
    useEffect(() => {
      const el = itemRefs.current[selectedIndex];
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }, [selectedIndex]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) command(item);
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        switch (event.key) {
          case 'ArrowUp':
            setSelectedIndex((i) => (i - 1 + items.length) % items.length);
            return true;
          case 'ArrowDown':
            setSelectedIndex((i) => (i + 1) % items.length);
            return true;
          case 'Enter':
            selectItem(selectedIndex);
            return true;
          default:
            return false;
        }
      },
    }));

    if (items.length === 0) return null;

    return (
      <div
        className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-lg w-64 max-h-72 overflow-y-auto overscroll-contain p-1 z-50 focus:outline-none select-none"
        role="listbox"
        aria-label="Slash commands"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 text-[10px] uppercase font-mono tracking-wider text-muted-foreground border-b border-border/50 mb-0.5">
          Insert Block
        </div>
        <div className="space-y-0.5">
          {items.map((item, index) => {
            const showCategoryHeader =
              Boolean(item.category) && (!index || item.category !== items[index - 1]?.category);
            return (
              <div key={item.title}>
                {showCategoryHeader && (
                  <div className="px-2 pt-1.5 pb-0.5 text-[9px] uppercase font-mono tracking-wider text-muted-foreground/70">
                    {item.category}
                  </div>
                )}
                <button
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onClick={() => selectItem(index)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <span className="w-5 h-5 rounded bg-muted/60 flex items-center justify-center text-muted-foreground shrink-0 text-xs">
                    {item.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium tracking-tight truncate">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate leading-tight">
                      {item.description}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

SlashMenu.displayName = 'SlashMenu';
