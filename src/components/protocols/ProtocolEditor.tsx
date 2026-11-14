'use client';
// src/components/protocols/ProtocolEditor.tsx
// TipTap-based editor for authoring Protocol & SOP template content.
// Saves content debounced to Postgres via updateProtocolContent server action.

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import {
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle2,
  Globe,
  Lock,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Table2,
  Minus,
} from 'lucide-react';
import { getProtocol, updateProtocolContent, toggleProtocolPublished } from '@/actions/protocolActions';
import type { Role } from '@prisma/client';

// ─── Debounce utility ─────────────────────────────────────────────────────────

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

import type { Editor } from '@tiptap/core';

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const btn = (
    isActive: boolean,
    onClick: () => void,
    title: string,
    icon: React.ReactNode
  ) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/20 flex-wrap">
      {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Bold', <Bold className="w-3.5 h-3.5" />)}
      {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italic', <Italic className="w-3.5 h-3.5" />)}
      <div className="w-px h-4 bg-border mx-1" />
      {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Heading 2', <Heading2 className="w-3.5 h-3.5" />)}
      {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Bullet list', <List className="w-3.5 h-3.5" />)}
      {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Ordered list', <ListOrdered className="w-3.5 h-3.5" />)}
      <div className="w-px h-4 bg-border mx-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert table"
        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Table2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Static Protocol Editor Extensions & Props ────────────────────────────────
// Extracted to module scope so TipTap compareOptions reference checks stay stable
// across component re-renders in React 19.

const PROTOCOL_EXTENSIONS = [
  StarterKit,
  Placeholder.configure({
    placeholder:
      'Write your Standard Operating Procedure here…\n\nTip: Use heading 2 for sections, ordered lists for steps, and tables for reagent quantities.',
    includeChildren: true,
  }),
  Table.configure({ resizable: true }),
  TableRow,
  TableHeader,
  TableCell,
];

const PROTOCOL_EDITOR_PROPS = {
  attributes: {
    class:
      'prose dark:prose-invert prose-sm max-w-none focus:outline-none min-h-[calc(100vh-22rem)] px-2 py-4 text-foreground',
  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface ProtocolEditorProps {
  protocolId: string;
  currentUserRole: Role;
  onBack: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function ProtocolEditor({ protocolId, currentUserRole, onBack }: ProtocolEditorProps) {
  const [name, setName] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [version, setVersion] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [isPending, setIsPending] = useState(false);

  const canManage = currentUserRole === 'PI' || currentUserRole === 'ADMIN';

  // Guard against programmatic updates triggering debounced save
  const isProgrammaticUpdateRef = useRef(false);

  // Stable refs for debounced save
  const nameRef = useRef(name);
  useEffect(() => { nameRef.current = name; }, [name]);

  const debouncedSave = useRef(
    debounce(async (content: Record<string, unknown>) => {
      setSaveState('saving');
      try {
        const result = await updateProtocolContent(protocolId, content, nameRef.current);
        setVersion(result.version);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } catch {
        setSaveState('error');
      }
    }, 800)
  ).current;

  const editor = useEditor({
    extensions: PROTOCOL_EXTENSIONS,
    onUpdate: ({ editor: ed }) => {
      if (isProgrammaticUpdateRef.current) return;
      const json = ed.getJSON() as Record<string, unknown>;
      debouncedSave(json);
    },
    editorProps: PROTOCOL_EDITOR_PROPS,
    immediatelyRender: false,
  });

  // Load protocol content on mount
  useEffect(() => {
    setIsLoading(true);
    getProtocol(protocolId)
      .then((protocol) => {
        if (!protocol) return;
        setName(protocol.name);
        setIsPublished(protocol.isPublished);
        setVersion(protocol.version);
        if (
          editor &&
          protocol.content &&
          typeof protocol.content === 'object' &&
          Object.keys(protocol.content).length > 0
        ) {
          isProgrammaticUpdateRef.current = true;
          editor.commands.setContent(protocol.content as Record<string, unknown>, false);
          isProgrammaticUpdateRef.current = false;
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [protocolId, editor]);

  const handleTogglePublish = useCallback(async () => {
    setIsPending(true);
    try {
      const result = await toggleProtocolPublished(protocolId);
      setIsPublished(result.isPublished);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle publish state.');
    } finally {
      setIsPending(false);
    }
  }, [protocolId]);

  const handleNameBlur = useCallback(() => {
    if (!editor) return;
    const json = editor.getJSON() as Record<string, unknown>;
    debouncedSave(json);
  }, [editor, debouncedSave]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onBack}
            className="px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors flex items-center gap-1 text-xs font-medium"
            title="Back to protocol library"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Library</span>
          </button>
          <Link
            href="/app"
            className="px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 transition-colors text-xs font-medium"
            title="Return to active notebook"
          >
            Notebook
          </Link>
        </div>

        <div className="h-4 w-px bg-border/80" />

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Protocol name…"
            className="w-full bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-muted-foreground">v{version}</span>
            {isPublished ? (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                Published
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
                Draft
              </span>
            )}
          </div>
        </div>

        {/* Save state indicator */}
        <div className="flex items-center gap-1.5 text-xs font-mono shrink-0">
          {saveState === 'saving' && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving…
            </span>
          )}
          {saveState === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          {saveState === 'error' && (
            <span className="text-red-500">Save failed</span>
          )}
          {saveState === 'idle' && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Save className="w-3.5 h-3.5" />
              Auto-save
            </span>
          )}
        </div>

        {/* Publish toggle — PI/Admin only */}
        {canManage && (
          <button
            onClick={handleTogglePublish}
            disabled={isPending}
            title={isPublished ? 'Unpublish this protocol' : 'Publish to lab team'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border transition-colors disabled:opacity-50 ${
              isPublished
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isPublished ? (
              <Globe className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            {isPublished ? 'Published' : 'Publish'}
          </button>
        )}
      </div>

      {/* Formatting toolbar */}
      <EditorToolbar editor={editor} />

      {/* Editor body */}
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-background">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto my-6 px-4">
            <div className="bg-card border border-border/80 rounded-2xl shadow-xl p-6 md:p-10">
              <EditorContent editor={editor} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
