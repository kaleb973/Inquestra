'use client';
// src/components/editor/EditorBubbleMenu.tsx
// Floating context menu that appears over highlighted text selection for rapid formatting.

import { BubbleMenu } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
} from 'lucide-react';

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 100, placement: 'top', animation: false }}
      className="bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl shadow-black/40 px-1.5 py-1 flex items-center gap-0.5 z-40 text-foreground"
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded text-xs transition-colors ${
          editor.isActive('bold')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded text-xs transition-colors ${
          editor.isActive('italic')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded text-xs transition-colors ${
          editor.isActive('underline')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Underline"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1 rounded text-xs transition-colors ${
          editor.isActive('strike')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1 rounded text-xs transition-colors ${
          editor.isActive('code')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Inline Code"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1 rounded text-xs transition-colors ${
          editor.isActive('highlight')
            ? 'bg-amber-500/20 text-amber-500 font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Highlight"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>

      <div className="h-3 w-px bg-border/60 mx-0.5" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        className={`p-1 rounded text-xs transition-colors ${
          editor.isActive('subscript')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Subscript (H₂O)"
      >
        <SubscriptIcon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        className={`p-1 rounded text-xs transition-colors ${
          editor.isActive('superscript')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Superscript (Ca²⁺)"
      >
        <SuperscriptIcon className="w-3.5 h-3.5" />
      </button>
    </BubbleMenu>
  );
}
