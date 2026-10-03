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
import { MoleculeExtension } from '@/components/editor/nodes/MoleculeNode';
import { MathExtension } from '@/components/editor/nodes/MathNode';
import { SequenceExtension } from '@/components/editor/nodes/SequenceNode';
import { EquipmentExtension } from '@/components/editor/nodes/EquipmentBlock';
import { SlashMenu, type SlashMenuRef, type SlashCommand } from './SlashMenu';
import { parseCSVStream } from '@/lib/csvParser';
import { ReviewerOverlay } from '@/components/editor/tools/ReviewerOverlay';
import { SignaturePanel } from '@/components/editor/tools/SignaturePanel';
import { updateTrialContent, sealTrial } from '@/actions/trialActions';
import { getCurrentUserProfile } from '@/actions/adminActions';
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

// ─── Slash command definitions ────────────────────────────────────────────────

function buildSlashCommands(): SlashCommand[] {
  return [
    {
      title: 'Molecule (SMILES)',
      description: 'Draw 2D chemical structure',
      icon: <FlaskConical className="w-4 h-4 text-indigo-400" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'moleculeBlock' }).run();
      },
    },
    {
      title: 'Math Equation',
      description: 'Insert KaTeX formula',
      icon: <span className="w-4 h-4 font-serif italic font-bold">∑</span>,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'mathBlock' }).run();
      },
    },
    {
      title: 'Sequence (DNA/RNA)',
      description: 'Biological sequence alignment',
      icon: <span className="w-4 h-4 font-mono font-bold text-purple-400">GC</span>,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'sequenceBlock' }).run();
      },
    },
    {
      title: 'Equipment Link',
      description: 'Link an instrument to this trial',
      icon: <span className="w-4 h-4 font-bold text-indigo-400">EQ</span>,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'equipmentBlock' }).run();
      },
    },
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
      title: 'Protocol (Blank)',
      description: 'Insert an empty step-by-step protocol checklist',
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
      title: 'Protocol: PCR Amplification',
      description: 'Standard PCR thermocycling SOP (denaturation, annealing, extension)',
      icon: <ClipboardList className="w-4 h-4 text-emerald-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'protocolBlock',
            attrs: {
              title: 'PCR Amplification Protocol',
              version: 1,
              steps: [
                { id: 'pcr-1', text: 'Thaw 2X PCR Master Mix, forward/reverse primers, and template DNA on ice.', checked: false, checkedAt: null, deviation: null },
                { id: 'pcr-2', text: 'Prepare reaction mix (Master Mix 12.5 µL, Fwd Primer 1.0 µL, Rev Primer 1.0 µL, Template 2.0 µL, Nuclease-free H2O to 25 µL).', checked: false, checkedAt: null, deviation: null },
                { id: 'pcr-3', text: 'Gently vortex and spin down PCR tubes in microcentrifuge.', checked: false, checkedAt: null, deviation: null },
                { id: 'pcr-4', text: 'Initial denaturation: 95°C for 3 minutes.', checked: false, checkedAt: null, deviation: null },
                { id: 'pcr-5', text: 'Cycle 30x: 95°C for 30s (denature) → 58°C for 30s (anneal) → 72°C for 60s (extend).', checked: false, checkedAt: null, deviation: null },
                { id: 'pcr-6', text: 'Final extension: 72°C for 5 minutes, then hold at 4°C.', checked: false, checkedAt: null, deviation: null },
              ],
            },
          })
          .run();
      },
    },
    {
      title: 'Protocol: Western Blot',
      description: 'Standard SDS-PAGE, transfer, blocking, and antibody incubation SOP',
      icon: <ClipboardList className="w-4 h-4 text-violet-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'protocolBlock',
            attrs: {
              title: 'Western Blot Assay Protocol',
              version: 1,
              steps: [
                { id: 'wb-1', text: 'Lyse cells in RIPA buffer with protease/phosphatase inhibitors; quantify protein (BCA assay).', checked: false, checkedAt: null, deviation: null },
                { id: 'wb-2', text: 'Boil samples with 4X Laemmli sample buffer at 95°C for 5 minutes.', checked: false, checkedAt: null, deviation: null },
                { id: 'wb-3', text: 'Load 20-30 µg protein per well into 4-20% SDS-PAGE gel; run at 120V for ~70 minutes.', checked: false, checkedAt: null, deviation: null },
                { id: 'wb-4', text: 'Transfer to PVDF membrane at 100V for 60 minutes on ice (transfer buffer with 20% MeOH).', checked: false, checkedAt: null, deviation: null },
                { id: 'wb-5', text: 'Block membrane in 5% non-fat dry milk in TBST for 1 hour at room temperature.', checked: false, checkedAt: null, deviation: null },
                { id: 'wb-6', text: 'Incubate primary antibody (1:1000 in 5% BSA/TBST) overnight at 4°C with gentle rocking.', checked: false, checkedAt: null, deviation: null },
                { id: 'wb-7', text: 'Wash 3x 10min with TBST; incubate HRP-conjugated secondary (1:5000) 1h at RT.', checked: false, checkedAt: null, deviation: null },
                { id: 'wb-8', text: 'Wash 3x with TBST; apply ECL substrate and image chemiluminescence.', checked: false, checkedAt: null, deviation: null },
              ],
            },
          })
          .run();
      },
    },
    {
      title: 'Protocol: Cell Passaging',
      description: 'Standard adherent mammalian cell culture trypsinization and splitting SOP',
      icon: <ClipboardList className="w-4 h-4 text-sky-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'protocolBlock',
            attrs: {
              title: 'Cell Culture Passaging Protocol',
              version: 1,
              steps: [
                { id: 'cp-1', text: 'Examine cells under inverted microscope to verify 80-90% confluence and morphology.', checked: false, checkedAt: null, deviation: null },
                { id: 'cp-2', text: 'Aspirate spent growth media from culture dish in laminar flow hood.', checked: false, checkedAt: null, deviation: null },
                { id: 'cp-3', text: 'Gently wash cell monolayer with 5 mL sterile 1X DPBS (without Ca2+/Mg2+).', checked: false, checkedAt: null, deviation: null },
                { id: 'cp-4', text: 'Add 2 mL 0.25% Trypsin-EDTA; incubate at 37°C for 3-5 minutes until cells detach.', checked: false, checkedAt: null, deviation: null },
                { id: 'cp-5', text: 'Neutralize trypsin by adding 6 mL complete growth medium with 10% FBS.', checked: false, checkedAt: null, deviation: null },
                { id: 'cp-6', text: 'Centrifuge cell suspension at 300 x g for 5 minutes; aspirate supernatant and resuspend pellet.', checked: false, checkedAt: null, deviation: null },
                { id: 'cp-7', text: 'Count viable cells with trypan blue and hemocytometer; seed new flasks at 1:4 to 1:6 ratio.', checked: false, checkedAt: null, deviation: null },
              ],
            },
          })
          .run();
      },
    },
    {
      title: 'Protocol: Flow Cytometry',
      description: 'Standard cell surface fluorophore staining & FACS acquisition SOP',
      icon: <ClipboardList className="w-4 h-4 text-amber-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'protocolBlock',
            attrs: {
              title: 'Flow Cytometry Surface Staining Protocol',
              version: 1,
              steps: [
                { id: 'fc-1', text: 'Harvest 1x10^6 cells; wash once with 1 mL cold FACS buffer (PBS + 2% FBS + 1mM EDTA).', checked: false, checkedAt: null, deviation: null },
                { id: 'fc-2', text: 'Block Fc receptors with anti-CD16/32 (1:100 in FACS buffer) on ice for 10 minutes.', checked: false, checkedAt: null, deviation: null },
                { id: 'fc-3', text: 'Add fluorophore-conjugated primary antibodies at titration concentration; incubate 30 min in dark on ice.', checked: false, checkedAt: null, deviation: null },
                { id: 'fc-4', text: 'Wash 2x with 1 mL cold FACS buffer (centrifuge 300 x g for 5 min at 4°C).', checked: false, checkedAt: null, deviation: null },
                { id: 'fc-5', text: 'Resuspend pellet in 300 µL FACS buffer containing viability dye (e.g. 7-AAD / DAPI).', checked: false, checkedAt: null, deviation: null },
                { id: 'fc-6', text: 'Filter through 40 µm cell strainer cap and acquire on flow cytometer.', checked: false, checkedAt: null, deviation: null },
              ],
            },
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
      const cloudTrialId = useNotebookStore.getState().cloudTrialId;
      if (cloudTrialId) {
        updateTrialContent(
          cloudTrialId,
          JSON.parse(JSON.stringify(json)),
          useNotebookStore.getState().activeTrial.title
        ).catch(console.error);
      }
    }, 500)
  ).current;

  const debouncedTitleSave = useRef(
    debounce((newTitle: string) => {
      const cloudTrialId = useNotebookStore.getState().cloudTrialId;
      const currentContent = useNotebookStore.getState().activeTrial.content;
      if (cloudTrialId) {
        updateTrialContent(
          cloudTrialId,
          JSON.parse(JSON.stringify(currentContent || {})),
          newTitle
        ).catch(console.error);
      }
    }, 500)
  ).current;

  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading…';
          }
          return "Type '/' for commands, reagents, charts… or start typing notes";
        },
        includeChildren: true,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      InteractiveChartExtension,
      ReagentExtension,
      ProtocolExtension,
      MoleculeExtension,
      MathExtension,
      SequenceExtension,
      EquipmentExtension,
      SlashCommandExtension,
    ],
    content: content && typeof content === 'object' && Object.keys(content).length > 0 ? content : undefined,
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON() as Record<string, unknown>;
      debouncedSave(json);
    },
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm max-w-none focus:outline-none min-h-[calc(100vh-14rem)] px-2 py-4 text-foreground',
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
  const checksum = useNotebookStore((s) => s.activeTrial.checksum);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);
  useEffect(() => {
    if (editor) {
      editor.setEditable(!checksum, false);
    }
  }, [checksum, editor]);

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

  // Listen for reagent insert events (e.g. clicked from LIMS sidebar)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ name: string; unit: string; quantity?: number }>).detail;
      if (editorRef.current) {
        editorRef.current
          .chain()
          .focus('end')
          .insertContent({
            type: 'reagentBlock',
            attrs: {
              initialChemical: detail.name,
              initialUnit: detail.unit || 'mL',
              initialQuantity: detail.quantity ? String(detail.quantity) : '',
            },
          })
          .run();
      }
    };
    window.addEventListener('inquestra:insert-reagent', handler);
    return () => window.removeEventListener('inquestra:insert-reagent', handler);
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

  const [isMounted, setIsMounted] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    getCurrentUserProfile().then((profile) => {
      if (profile) {
        setUserRole(profile.role);
        setUserEmail(profile.email);
      }
    }).catch(console.error);
  }, []);

  const formattedTime = isMounted && updatedAt 
    ? new Date(updatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  return (
    <div
      className={`flex-1 bg-slate-100 dark:bg-background overflow-y-auto relative transition-colors cursor-default ${
        isDragOver ? 'bg-blue-950/20' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={(e) => {
        // Clicking outer void focuses the editor at the end
        if (e.target === e.currentTarget && editor) {
          editor.commands.focus('end');
        }
      }}
    >
      {/* Drag-over overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 bg-muted/90 border-2 border-dashed border-blue-600 rounded-xl px-12 py-8">
            <Upload className="w-8 h-8 text-blue-400" />
            <p className="text-blue-300 text-sm font-medium">Drop CSV to insert chart</p>
          </div>
        </div>
      )}

      {/* Notebook Paper Sheet */}
      <div className="max-w-4xl mx-auto my-6 px-4 md:px-8">
        <div 
          className="bg-card border border-border/80 rounded-2xl shadow-xl p-6 md:p-10 transition-all cursor-text relative"
          onClick={(e) => {
            if (e.target === e.currentTarget && editor && !editor.isFocused) {
              editor.commands.focus('end');
            }
          }}
        >
          {/* Subtle notebook binder margin indicator on the left */}
          <div className="absolute top-8 bottom-8 left-3 w-[2px] bg-gradient-to-b from-indigo-500/20 via-border/30 to-transparent rounded-full pointer-events-none" />

          {/* Document header / Title */}
          <div className="pb-4 border-b border-border/60 mb-6 pl-2">
            <input
              type="text"
              value={title}
              disabled={!!checksum}
              onChange={(e) => {
                const newTitle = e.target.value;
                updateTitle(newTitle);
                debouncedTitleSave(newTitle);
              }}
              placeholder="Untitled Trial"
              className="w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-70"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-mono">
              <span suppressHydrationWarning>
                {formattedTime ? `Auto-saved · ${formattedTime}` : 'Auto-save active'}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground">
                Type <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-foreground font-mono text-[10px]">/</kbd> for commands, reagents, charts
              </span>
            </div>
          </div>

          {/* TipTap editor content */}
          <div className="pl-2">
            <EditorContent editor={editor} />
          </div>

          {isMounted && (
            <SignaturePanel
              trialId={cloudTrialId}
              isSynced={!!cloudTrialId}
              isSealed={!!checksum}
              currentUserRole={userRole}
              currentUserEmail={userEmail}
              onRequestSeal={async () => {
                if (cloudTrialId) {
                  try {
                    await sealTrial(cloudTrialId);
                    alert('Trial successfully sealed.');
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Seal failed');
                  }
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

