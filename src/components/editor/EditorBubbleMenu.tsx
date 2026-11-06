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
      className="bg-card/95 backdrop-blur-md border border-border rounded-lg shadow-xl shadow-black/40 p-1 flex items-center gap-1 z-40 text-foreground"
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-label="Toggle bold"
        aria-pressed={editor.isActive('bold')}
        className={`min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] p-1.5 rounded text-xs transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          editor.isActive('bold')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Bold"
      >
        <Bold className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Toggle italic"
        aria-pressed={editor.isActive('italic')}
        className={`min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] p-1.5 rounded text-xs transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          editor.isActive('italic')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Italic"
      >
        <Italic className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Toggle underline"
        aria-pressed={editor.isActive('underline')}
        className={`min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] p-1.5 rounded text-xs transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          editor.isActive('underline')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Toggle strikethrough"
        aria-pressed={editor.isActive('strike')}
        className={`min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] p-1.5 rounded text-xs transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          editor.isActive('strike')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        aria-label="Toggle inline code"
        aria-pressed={editor.isActive('code')}
        className={`min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] p-1.5 rounded text-xs transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          editor.isActive('code')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Inline Code"
      >
        <Code className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        aria-label="Toggle highlight"
        aria-pressed={editor.isActive('highlight')}
        className={`min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] p-1.5 rounded text-xs transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          editor.isActive('highlight')
            ? 'bg-caution/20 text-caution font-semibold'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Highlight"
      >
        <Highlighter className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      <div className="h-4 w-px bg-border/80 mx-0.5" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        aria-label="Toggle subscript"
        aria-pressed={editor.isActive('subscript')}
        className={`min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] p-1.5 rounded text-xs transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          editor.isActive('subscript')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Subscript (H₂O)"
      >
        <SubscriptIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        aria-label="Toggle superscript"
        aria-pressed={editor.isActive('superscript')}
        className={`min-w-[32px] min-h-[32px] sm:min-w-[28px] sm:min-h-[28px] p-1.5 rounded text-xs transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          editor.isActive('superscript')
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
        title="Superscript (Ca²⁺)"
      >
        <SuperscriptIcon className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>
    </BubbleMenu>
  );
}
