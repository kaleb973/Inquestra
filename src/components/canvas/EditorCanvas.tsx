'use client';
// src/components/canvas/EditorCanvas.tsx
// TipTap v2 WYSIWYG canvas with StarterKit, Table, slash commands,
// InteractiveChartNode, ReagentNode, and drag-and-drop CSV ingestion.

import { useEffect, useRef, useCallback, useState } from 'react';
import { EditorContent, ReactRenderer, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';
import type { Editor, Range } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import tippy, { type Instance } from 'tippy.js';
import { BarChart3, Table2, Timer, Heading, FlaskConical, Upload, ClipboardList } from 'lucide-react';

import { useNotebookStore } from '@/store/useNotebookStore';
import { InteractiveChartExtension } from '@/components/editor/nodes/InteractiveChartNode';
import { ReagentExtension } from '@/components/editor/nodes/ReagentNode';
import { ProtocolExtension } from '@/components/editor/nodes/ProtocolBlock';
import { SlashMenu, type SlashMenuRef, type SlashCommand } from './SlashMenu';
import { parseCSVStream } from '@/lib/csvParser';
import { ReviewerOverlay } from '@/components/editor/tools/ReviewerOverlay';


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

// ─── Slash command definitions ────────────────────────────────────────────────

function buildSlashCommands(): SlashCommand[] {
  return [
    {
      title: 'Chart',
      description: 'Insert a live telemetry chart node',
      icon: <BarChart3 className="w-4 h-4" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({ type: 'interactiveChart', attrs: { csvData: null } })
          .run();
      },
    },
    {
      title: 'Reagent',
      description: 'Log a chemical deduction from inventory',
      icon: <FlaskConical className="w-4 h-4" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({ type: 'reagentBlock' })
          .run();
      },
    },
    {
      title: 'Protocol',
      description: 'Insert a step-by-step protocol checklist',
      icon: <ClipboardList className="w-4 h-4" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'protocolBlock',
            attrs: { title: 'New Protocol', version: 1, steps: [] },
          })
          .run();
      },
    },
    {
      title: 'Table',
      description: 'Insert a structured data table',
      icon: <Table2 className="w-4 h-4" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    },
    {
      title: 'Heading 1',
      description: 'Large section heading',
      icon: <Heading className="w-4 h-4" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 1 })
          .run();
      },
    },
    {
      title: 'Heading 2',
      description: 'Medium section heading',
      icon: <Heading className="w-4 h-4 opacity-70" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 2 })
          .run();
      },
    },
    {
      title: 'Timer',
      description: 'Insert a protocol incubation timer',
      icon: <Timer className="w-4 h-4" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'paragraph',
            content: [{ type: 'text', text: '⏱ Protocol Timer — 00:00' }],
          })
          .run();
      },
    },
  ];
}

// ─── Slash Command TipTap Extension ───────────────────────────────────────────

const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommand>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,

        items: ({ query }: { query: string; editor: Editor }) => {
          const commands = buildSlashCommands();
          if (!query) return commands;
          const q = query.toLowerCase();
          return commands.filter((c) => c.title.toLowerCase().includes(q));
        },

        render: () => {
          let component: ReactRenderer<SlashMenuRef, { items: SlashCommand[]; command: (item: SlashCommand) => void }>;
          let popup: Instance[];

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashMenu, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) return;

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                animation: false,
              });
            },

            onUpdate: (props) => {
              component.updateProps(props);
              if (!props.clientRect) return;
              popup[0]?.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              });
            },

            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup[0]?.hide();
                return true;
              }
              return component.ref?.onKeyDown(props) ?? false;
            },

            onExit: () => {
              popup[0]?.destroy();
              component.destroy();
            },
          };
        },

        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: SlashCommand;
        }) => {
          props.command({ editor, range });
        },
      }),
    ];
  },
});
// ─── Editor Canvas Component ───────────────────────────────────────────────────

export function EditorCanvas() {
  const content = useNotebookStore((s) => s.activeTrial.content);
  const updateContent = useNotebookStore((s) => s.updateContent);
  const updateTitle = useNotebookStore((s) => s.updateTitle);
  const title = useNotebookStore((s) => s.activeTrial.title);
  const updatedAt = useNotebookStore((s) => s.activeTrial.updatedAt);

  // Stable ref to always call the latest updateContent without recreating debounce
  const updateContentRef = useRef(updateContent);
  useEffect(() => {
    updateContentRef.current = updateContent;
  }, [updateContent]);

  const debouncedSave = useRef(
    debounce((json: Record<string, unknown>) => {
      updateContentRef.current(json);
    }, 500)
  ).current;

  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Begin your research notes… Type / for commands, or drop a .csv file here.',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      InteractiveChartExtension,
      ReagentExtension,
      ProtocolExtension,
      SlashCommandExtension,
    ],
    content: Object.keys(content).length > 0 ? content : undefined,
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON() as Record<string, unknown>;
      debouncedSave(json);
      
      // Fire-and-forget sync to DB
      if (useNotebookStore.getState().activeTrial.id) {
        import('@/actions/trialActions').then(({ updateTrialContent }) => {
          updateTrialContent(
            useNotebookStore.getState().activeTrial.id,
            json,
            useNotebookStore.getState().activeTrial.title
          ).catch(console.error);
        });
      }
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[calc(100vh-9rem)] px-12 py-8',
      },
    },
    immediatelyRender: false,
  });

  const activeTrialId = useNotebookStore((s) => s.activeTrial.id);

  // Keep editor content in sync when switching trials
  useEffect(() => {
    if (editor && content) {
      const currentJson = editor.getJSON();
      if (JSON.stringify(currentJson) !== JSON.stringify(content)) {
        editor.commands.setContent(content, false);
      }
    }
  }, [activeTrialId, editor]); // Depend on the reactive ID

  // Keep editorRef in sync for drag-drop handler and HTML export
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Listen for export HTML requests from Header
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ resolve: (html: string) => void }>).detail;
      if (editorRef.current) {
        detail.resolve(editorRef.current.getHTML());
      } else {
        detail.resolve('');
      }
    };
    document.addEventListener('inquestra:request-html', handler);
    return () => document.removeEventListener('inquestra:request-html', handler);
  }, []);

  // ─── Drag-and-drop CSV handler ─────────────────────────────────────────────

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    const hasCSV = Array.from(e.dataTransfer.items).some(
      (item) => item.kind === 'file' && (item.type === 'text/csv' || item.type === '')
    );
    if (hasCSV) {
      e.preventDefault();
      setIsDragOver(true);
    }
  }, [setIsDragOver]);

  const handleDragLeave = useCallback(() => setIsDragOver(false), [setIsDragOver]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = Array.from(e.dataTransfer.files).find(
        (f) => f.name.endsWith('.csv') || f.type === 'text/csv'
      );
      if (!file || !editorRef.current) return;

      try {
        const parsed = await parseCSVStream(file);
        // Insert a chart node pre-loaded with CSV data
        editorRef.current
          .chain()
          .focus()
          .insertContent({
            type: 'interactiveChart',
            attrs: {
              csvData: {
                headers: parsed.headers,
                rows: parsed.rows.slice(0, 5000), // Cap at 5000 rows in node attrs
                numericKeys: parsed.numericKeys,
                filename: file.name,
              },
            },
          })
          .run();
      } catch (err) {
        console.error('CSV parse error:', err);
      }
    },
    [setIsDragOver]
  );

  // ─────────────────────────────────────────────────────────────────────────

  const formattedTime = new Date(updatedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      className={`flex-1 bg-neutral-950 overflow-y-auto relative transition-colors ${
        isDragOver ? 'bg-blue-950/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag-over overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 bg-neutral-900/90 border-2 border-dashed border-blue-600 rounded-xl px-12 py-8">
            <Upload className="w-8 h-8 text-blue-400" />
            <p className="text-blue-300 text-sm font-medium">Drop CSV to insert chart</p>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto relative">
        {/* Document title */}
        <div className="px-12 pt-10 pb-3">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              const newTitle = e.target.value;
              updateTitle(newTitle);
              if (activeTrialId) {
                import('@/actions/trialActions').then(({ updateTrialContent }) => {
                  updateTrialContent(activeTrialId, content, newTitle).catch(console.error);
                });
              }
            }}
            placeholder="Untitled Trial"
            className="w-full bg-transparent text-3xl font-bold text-white placeholder:text-neutral-800 focus:outline-none"
          />
          <p className="text-[11px] text-neutral-700 mt-1 font-mono">
            Auto-saved · {formattedTime}
          </p>
        </div>

        {/* TipTap editor content */}
        <EditorContent editor={editor} />
      </div>

      <ReviewerOverlay />
    </div>
  );
}

