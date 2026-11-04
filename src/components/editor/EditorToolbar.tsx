'use client';
// src/components/editor/EditorToolbar.tsx
// Rich formatting toolbar for Inquestra Electronic Research Notebook (ERN).
// Provides 1-click access to headings, marks, scripts, lists, checklists, tables, and lab widgets.

import { useState, useRef, useEffect } from 'react';
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
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  Table2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  FlaskConical,
  Timer,
  BarChart3,
  ChevronDown,
  Trash2,
  Plus,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showHighlightPalette, setShowHighlightPalette] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);

  const tableMenuContainerRef = useRef<HTMLDivElement>(null);
  const highlightPaletteContainerRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tableMenuContainerRef.current &&
        !tableMenuContainerRef.current.contains(event.target as Node)
      ) {
        setShowTableMenu(false);
      }
      if (
        highlightPaletteContainerRef.current &&
        !highlightPaletteContainerRef.current.contains(event.target as Node)
      ) {
        setShowHighlightPalette(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowTableMenu(false);
        setShowHighlightPalette(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!editor) return null;

  const HIGHLIGHT_COLORS = [
    { label: 'Yellow', color: '#fef08a' },
    { label: 'Green', color: '#bbf7d0' },
    { label: 'Cyan', color: '#bae6fd' },
    { label: 'Purple', color: '#e9d5ff' },
    { label: 'Rose', color: '#fecdd3' },
  ];

  return (
    <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border/80 px-2.5 py-1.5 flex items-center gap-1 flex-wrap text-foreground select-none">
      {/* ── Headings & Paragraph ── */}
      <div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive('paragraph') && !editor.isActive('heading')
              ? 'bg-primary/20 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Paragraph / Normal Text"
          aria-label="Normal paragraph"
        >
          <Pilcrow className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-primary/20 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Heading 1"
          aria-label="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-primary/20 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Heading 2"
          aria-label="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded text-xs transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-primary/20 text-primary font-semibold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Heading 3"
          aria-label="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Inline Formatting ── */}
      <div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bold')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('italic')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('underline')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Underline (Ctrl+U)"
          aria-label="Underline"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('strike')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Strikethrough"
          aria-label="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('code')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Inline Code (`)"
          aria-label="Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Subscript & Superscript (Crucial for Chemistry & Formulas) ── */}
      <div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('subscript')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Subscript (e.g. H₂O)"
          aria-label="Subscript"
        >
          <SubscriptIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('superscript')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Superscript (e.g. Ca²⁺, 10⁶)"
          aria-label="Superscript"
        >
          <SuperscriptIcon className="w-3.5 h-3.5" />
        </button>

        {/* Highlight Color Picker */}
        <div ref={highlightPaletteContainerRef} className="relative">
          <button
            type="button"
            onClick={() => {
              if (editor.isActive('highlight')) {
                editor.chain().focus().unsetHighlight().run();
              } else {
                setShowHighlightPalette(!showHighlightPalette);
              }
            }}
            className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
              editor.isActive('highlight')
                ? 'bg-amber-500/20 text-amber-500 font-semibold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title="Highlight Text"
            aria-label="Highlight"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {showHighlightPalette && (
            <div className="absolute top-full left-0 mt-1.5 bg-card border border-border rounded-lg shadow-2xl p-1.5 flex items-center gap-1 z-50">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    editor.chain().focus().setHighlight({ color: c.color }).run();
                    setShowHighlightPalette(false);
                  }}
                  className="w-5 h-5 rounded-full border border-black/10 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.color }}
                  title={c.label}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setShowHighlightPalette(false);
                }}
                className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded border border-border"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Lists & Checklists ── */}
      <div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Bullet List"
          aria-label="Bullet list"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Numbered List"
          aria-label="Numbered list"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('taskList')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Interactive Task Checklist"
          aria-label="Task Checklist"
        >
          <ListTodo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Alignment ── */}
      <div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive({ textAlign: 'left' })
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Align Left"
          aria-label="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive({ textAlign: 'center' })
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Align Center"
          aria-label="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive({ textAlign: 'right' })
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Align Right"
          aria-label="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Quotes & Horizontal Rule ── */}
      <div className="flex items-center gap-0.5 border-r border-border/60 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="Callout / Blockquote"
          aria-label="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Divider Line"
          aria-label="Divider"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Tables ── */}
      <div ref={tableMenuContainerRef} className="relative flex items-center border-r border-border/60 pr-1.5 mr-1">
        <button
          type="button"
          onClick={() => {
            if (!editor.isActive('table')) {
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
            } else {
              setShowTableMenu(!showTableMenu);
            }
          }}
          className={`p-1.5 rounded transition-colors flex items-center gap-0.5 ${
            editor.isActive('table')
              ? 'bg-primary/20 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title={editor.isActive('table') ? 'Table Options' : 'Insert 3x3 Table'}
          aria-label="Table"
        >
          <Table2 className="w-3.5 h-3.5" />
          {editor.isActive('table') && <ChevronDown className="w-2.5 h-2.5 opacity-60" />}
        </button>

        {showTableMenu && editor.isActive('table') && (
          <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1.5 bg-card border border-border rounded-lg shadow-2xl p-1.5 space-y-1 w-44 z-50 text-xs">
            <button
              type="button"
              onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTableMenu(false); }}
              className="w-full text-left px-2 py-1 rounded hover:bg-muted flex items-center gap-1.5 text-foreground"
            >
              <Plus className="w-3 h-3 text-emerald-500" /> Add Row
            </button>
            <button
              type="button"
              onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }}
              className="w-full text-left px-2 py-1 rounded hover:bg-muted flex items-center gap-1.5 text-foreground"
            >
              <Plus className="w-3 h-3 text-emerald-500" /> Add Column
            </button>
            <button
              type="button"
              onClick={() => { editor.chain().focus().deleteRow().run(); setShowTableMenu(false); }}
              className="w-full text-left px-2 py-1 rounded hover:bg-muted flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" /> Delete Row
            </button>
            <button
              type="button"
              onClick={() => { editor.chain().focus().deleteColumn().run(); setShowTableMenu(false); }}
              className="w-full text-left px-2 py-1 rounded hover:bg-muted flex items-center gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" /> Delete Column
            </button>
            <button
              type="button"
              onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }}
              className="w-full text-left px-2 py-1 rounded hover:bg-destructive/10 text-destructive flex items-center gap-1.5 border-t border-border/60 pt-1"
            >
              <Trash2 className="w-3 h-3" /> Delete Table
            </button>
          </div>
        )}
      </div>

      {/* ── Research Quick Inserts ── */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().insertContent({ type: 'mathBlock' }).run()}
          className="px-2 py-1 rounded text-xs font-serif italic text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-1"
          title="Insert Math Equation"
        >
          <span>∑</span>
          <span className="text-[10px] font-sans font-normal hidden xl:inline">Equation</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertContent({ type: 'moleculeBlock' }).run()}
          className="px-2 py-1 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-1"
          title="Insert 2D Molecule"
        >
          <FlaskConical className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] hidden xl:inline">Molecule</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertContent({ type: 'interactiveChart', attrs: { csvData: null } }).run()}
          className="px-2 py-1 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-1"
          title="Insert Telemetry Chart"
        >
          <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] hidden xl:inline">Chart</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertContent({ type: 'timerBlock', attrs: { duration: 300, label: 'Incubation Timer' } }).run()}
          className="px-2 py-1 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-1"
          title="Insert Timer"
        >
          <Timer className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] hidden xl:inline">Timer</span>
        </button>
      </div>
    </div>
  );
}
