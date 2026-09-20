'use client';
// src/components/canvas/SlashMenu.tsx
// Keyboard-navigable slash-command popup rendered by the TipTap Suggestion extension.
// Receives items + command callback from the suggestion render() lifecycle.

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
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

    // Reset selection whenever the filtered item list changes
    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

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
        className="bg-muted border border-border rounded-lg shadow-2xl shadow-black/60 w-64 py-1 overflow-hidden"
        role="listbox"
        aria-label="Slash commands"
      >
        {items.map((item, index) => (
          <button
            key={item.title}
            role="option"
            aria-selected={index === selectedIndex}
            onClick={() => selectItem(index)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-muted/60 text-foreground'
            }`}
          >
            <span className="text-muted-foreground shrink-0">{item.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

SlashMenu.displayName = 'SlashMenu';
