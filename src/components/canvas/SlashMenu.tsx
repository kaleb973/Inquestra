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
        className="bg-card/95 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl shadow-black/50 w-72 max-h-80 overflow-y-auto overscroll-contain py-1.5 z-50 focus:outline-none divide-y divide-border/20"
        role="listbox"
        aria-label="Slash commands"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-1 text-[10px] uppercase font-mono font-semibold tracking-wider text-muted-foreground/80">
          Commands &amp; Blocks
        </div>
        <div className="py-1">
          {items.map((item, index) => (
            <button
              key={item.title}
              ref={(el) => { itemRefs.current[index] = el; }}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => selectItem(index)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-muted/60 text-foreground'
              }`}
            >
              <span className="p-1.5 rounded-md bg-muted border border-border/60 text-foreground shrink-0 flex items-center justify-center">
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold tracking-tight">{item.title}</p>
                <p className="text-[10px] text-muted-foreground truncate leading-relaxed">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }
);

SlashMenu.displayName = 'SlashMenu';
