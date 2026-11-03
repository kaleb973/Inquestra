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
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TextAlign from '@tiptap/extension-text-align';
import tippy, { type Instance } from 'tippy.js';
import {
  BarChart3,
  Table2,
  Timer,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  FlaskConical,
  Upload,
  ClipboardList,
  Database,
  FileSpreadsheet,
  Loader2,
  Check,
  AlertCircle,
  Circle,
  Quote,
  List,
  ListOrdered,
  ListTodo,
  Code as CodeIcon,
  Minus as MinusIcon,
  Download,
  FileLock2,
  ScrollText,
  Sigma,
  Dna,
} from 'lucide-react';

import { useNotebookStore } from '@/store/useNotebookStore';
import { InteractiveChartExtension } from '@/components/editor/nodes/InteractiveChartNode';
import { ReagentExtension } from '@/components/editor/nodes/ReagentNode';
import { ProtocolExtension } from '@/components/editor/nodes/ProtocolBlock';
import { MoleculeExtension } from '@/components/editor/nodes/MoleculeNode';
import { MathExtension } from '@/components/editor/nodes/MathNode';
import { SequenceExtension } from '@/components/editor/nodes/SequenceNode';
import { EquipmentExtension } from '@/components/editor/nodes/EquipmentBlock';
import { TrialReferenceExtension } from '@/components/editor/nodes/TrialReferenceNode';
import { CitationExtension } from '@/components/editor/nodes/CitationNode';
import { TimerExtension } from '@/components/editor/nodes/TimerBlock';
import { BlockGuardExtension } from '@/components/editor/extensions/BlockGuardExtension';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorBubbleMenu } from '@/components/editor/EditorBubbleMenu';
import { SlashMenu, type SlashMenuRef, type SlashCommand } from './SlashMenu';
import { parseCSVStream } from '@/lib/csvParser';
import { ReviewerOverlay } from '@/components/editor/tools/ReviewerOverlay';
import { SignaturePanel } from '@/components/editor/tools/SignaturePanel';
import { CanvasContextMenu } from './CanvasContextMenu';
import { saveTrial, sealTrial } from '@/actions/trialActions';
import { getCurrentUserProfile } from '@/actions/adminActions';
import type { Role } from '@prisma/client';




// ─── Slash command helpers ───────────────────────────────────────────────────

function parseCommandArg(editor: Editor, range: Range): string {
  try {
    const raw = editor.state.doc.textBetween(range.from, range.to);
    return raw.replace(/^\/?[^\s]+\s*/, '').trim();
  } catch {
    return '';
  }
}

function parseTimerSeconds(arg: string): number {
  if (!arg) return 300;
  const combinedMatch = arg.match(/^(\d+)m\s*(\d+)s$/i);
  if (combinedMatch) {
    return parseInt(combinedMatch[1], 10) * 60 + parseInt(combinedMatch[2], 10);
  }
  const hMatch = arg.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours)$/i);
  if (hMatch) return Math.round(parseFloat(hMatch[1]) * 3600);
  const sMatch = arg.match(/^(\d+)\s*(s|sec|secs|seconds)$/i);
  if (sMatch) return parseInt(sMatch[1], 10);
  const mMatch = arg.match(/^(\d+(?:\.\d+)?)\s*(m|min|mins|minutes)?$/i);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 60);
  const num = parseInt(arg, 10);
  return isNaN(num) || num <= 0 ? 300 : num;
}

function parseReagentAttrs(arg: string): { initialChemical: string; initialQuantity: string; initialUnit: string } {
  let initialChemical = '';
  let initialQuantity = '';
  let initialUnit = 'mL';
  if (!arg) return { initialChemical, initialQuantity, initialUnit };

  const parsed = arg.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Zµμ]+)?\s*(.*)$/);
  if (parsed && parsed[1]) {
    initialQuantity = parsed[1];
    if (parsed[2]) initialUnit = parsed[2];
    if (parsed[3]) initialChemical = parsed[3].trim();
  } else {
    initialChemical = arg;
  }
  return { initialChemical, initialQuantity, initialUnit };
}

// ─── Slash command definitions ────────────────────────────────────────────────

function buildSlashCommands(): SlashCommand[] {
  return [
    // ── Document Formatting ──
    {
      title: 'Table',
      description: 'Insert a structured data table',
      category: 'Formatting',
      keywords: ['table', 'grid', 'matrix', 'data', 'cells', 'rows', 'columns'],
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
      category: 'Formatting',
      keywords: ['heading 1', 'h1', 'header 1', 'title', 'large'],
      icon: <Heading1 className="w-4 h-4" />,
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
      category: 'Formatting',
      keywords: ['heading 2', 'h2', 'header 2', 'section', 'medium'],
      icon: <Heading2 className="w-4 h-4" />,
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
      title: 'Heading 3',
      description: 'Small subsection heading',
      category: 'Formatting',
      keywords: ['heading 3', 'h3', 'header 3', 'subsection', 'small'],
      icon: <Heading3 className="w-4 h-4" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHeading({ level: 3 })
          .run();
      },
    },
    {
      title: 'Task Checklist',
      description: 'To-do checklist with interactive checkboxes',
      category: 'Formatting',
      keywords: ['task checklist', 'todo', 'tasks', 'checklist', 'checkbox', 'check'],
      icon: <ListTodo className="w-4 h-4 text-emerald-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleTaskList()
          .run();
      },
    },
    {
      title: 'Bulleted List',
      description: 'Standard unordered bullet list',
      category: 'Formatting',
      keywords: ['bulleted list', 'ul', 'bullets', 'list', 'points'],
      icon: <List className="w-4 h-4" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleBulletList()
          .run();
      },
    },
    {
      title: 'Numbered List',
      description: 'Ordered sequential step list',
      category: 'Formatting',
      keywords: ['numbered list', 'ol', 'numbers', 'ordered', 'steps'],
      icon: <ListOrdered className="w-4 h-4" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleOrderedList()
          .run();
      },
    },
    {
      title: 'Callout Note',
      description: 'Highlighted observation or hypothesis blockquote',
      category: 'Formatting',
      keywords: ['callout note', 'quote', 'blockquote', 'callout', 'note', 'info', 'hypothesis', 'observation'],
      icon: <Quote className="w-4 h-4 text-primary" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleBlockquote()
          .run();
      },
    },
    {
      title: 'Code Block',
      description: 'Preformatted code or protocol script',
      category: 'Formatting',
      keywords: ['code block', 'code', 'snippet', 'pre', 'script', 'python', 'r'],
      icon: <CodeIcon className="w-4 h-4 text-sky-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleCodeBlock()
          .run();
      },
    },
    {
      title: 'Divider Line',
      description: 'Horizontal section divider',
      category: 'Formatting',
      keywords: ['divider line', 'hr', 'divider', 'separator', 'rule', 'line'],
      icon: <MinusIcon className="w-4 h-4 opacity-70" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setHorizontalRule()
          .run();
      },
    },

    // ── Protocols & SOPs ──
    {
      title: 'Protocol (Blank)',
      description: 'Insert an empty step-by-step protocol checklist',
      category: 'Protocols & SOPs',
      keywords: ['protocol', 'sop', 'checklist', 'steps', 'procedure', 'blank', 'workflow', 'lab'],
      icon: <ClipboardList className="w-4 h-4 text-amber-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        const arg = parseCommandArg(editor, range);
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'protocolBlock',
            attrs: { title: arg || 'New Protocol', version: 1, steps: [] },
          })
          .run();
      },
    },
    {
      title: 'Protocol: PCR Amplification',
      description: 'Standard PCR thermocycling SOP (denaturation, annealing, extension)',
      category: 'Protocols & SOPs',
      keywords: ['protocol: pcr', 'pcr', 'thermocycling', 'amplification', 'polymerase', 'dna'],
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
      category: 'Protocols & SOPs',
      keywords: ['protocol: western blot', 'western blot', 'wb', 'sds-page', 'protein', 'antibody', 'blot'],
      icon: <ClipboardList className="w-4 h-4 text-emerald-500" />,
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
      category: 'Protocols & SOPs',
      keywords: ['protocol: cell passaging', 'cell passaging', 'cell culture', 'trypsin', 'passaging', 'split'],
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
      category: 'Protocols & SOPs',
      keywords: ['protocol: flow cytometry', 'flow cytometry', 'facs', 'staining', 'fluorophore', 'antibody'],
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

    // ── Scientific Blocks ──
    {
      title: 'Molecule (SMILES)',
      description: 'Draw 2D chemical structure',
      category: 'Scientific',
      keywords: ['molecule', 'smiles', 'chemical', 'structure', 'compound', 'chem', 'formula', 'draw', 'benzene', 'organic'],
      icon: <FlaskConical className="w-4 h-4 text-sky-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        const arg = parseCommandArg(editor, range);
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'moleculeBlock',
            attrs: {
              smiles: arg || 'c1ccccc1',
              name: arg ? 'Custom Compound' : 'Benzene',
            },
          })
          .run();
      },
    },
    {
      title: 'Math Equation',
      description: 'Insert KaTeX formula',
      category: 'Scientific',
      keywords: ['math', 'equation', 'formula', 'latex', 'katex', 'sigma', 'calculus', 'integral', 'kinetics', 'nernst'],
      icon: <span className="w-4 h-4 font-serif italic font-bold">∑</span>,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        const arg = parseCommandArg(editor, range);
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'mathBlock',
            attrs: {
              latex: arg || 'E = mc^2',
            },
          })
          .run();
      },
    },
    {
      title: 'Sequence (DNA/RNA)',
      description: 'Biological sequence alignment',
      category: 'Scientific',
      keywords: ['sequence', 'dna', 'rna', 'protein', 'nucleotide', 'genome', 'fasta', 'pcr', 'primer', 'atgc', 'alignment', 'bio'],
      icon: <span className="w-4 h-4 font-mono font-bold text-teal-500">GC</span>,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        const arg = parseCommandArg(editor, range);
        const cleanSeq = arg ? arg.replace(/[^a-zA-Z]/g, '').toUpperCase() : '';
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'sequenceBlock',
            attrs: {
              sequence: cleanSeq || 'ATGCGTACGTAGCTAGCTAGCTGATCG',
              name: 'Sequence 1',
            },
          })
          .run();
      },
    },
    {
      title: 'Reagent',
      description: 'Log a chemical deduction from inventory',
      category: 'Scientific',
      keywords: ['reagent', 'chemical', 'inventory', 'deduct', 'stock', 'ethanol', 'buffer', 'solution', 'lims', 'consume'],
      icon: <FlaskConical className="w-4 h-4 text-emerald-400" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        const arg = parseCommandArg(editor, range);
        const attrs = parseReagentAttrs(arg);
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'reagentBlock',
            attrs,
          })
          .run();
      },
    },
    {
      title: 'Literature Citation',
      description: 'Search & cite peer-reviewed papers from Europe PMC / PubMed',
      category: 'Scientific',
      keywords: ['citation', 'literature', 'pubmed', 'paper', 'reference', 'doi', 'journal', 'cite', 'bibliogr', 'ncbi', 'pmid'],
      icon: <Quote className="w-4 h-4 text-emerald-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'citationBlock' }).run();
      },
    },
    {
      title: 'Equipment Link',
      description: 'Link an instrument or sensor to this trial',
      category: 'Scientific',
      keywords: ['equipment', 'eq', 'instrument', 'device', 'hardware', 'link', 'sensor', 'potentiostat'],
      icon: <span className="w-4 h-4 font-bold text-sky-500">EQ</span>,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'equipmentBlock' }).run();
      },
    },
    {
      title: 'Reference Experiment',
      description: 'Retrieve & embed parameters from another trial by name',
      category: 'Scientific',
      keywords: ['reference', 'trial', 'experiment', 'parameter', 'ref'],
      icon: <Database className="w-4 h-4 text-sky-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).insertContent({ type: 'trialReferenceBlock' }).run();
      },
    },

    // ── Data & DAQ ──
    {
      title: 'Chart',
      description: 'Insert a live telemetry chart node',
      category: 'Data & DAQ',
      keywords: ['chart', 'graph', 'plot', 'telemetry', 'visualization', 'data', 'bar', 'line', 'daq'],
      icon: <BarChart3 className="w-4 h-4 text-sky-400" />,
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
      title: 'Lab Dataset (CSV)',
      description: 'Import multi-column laboratory assay, plate reader, or telemetry data',
      category: 'Data & DAQ',
      keywords: ['lab dataset (csv)', 'csv', 'dataset', 'import', 'spreadsheet', 'data', 'upload', 'plate'],
      icon: <FileSpreadsheet className="w-4 h-4 text-blue-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).run();
        const input = document.getElementById('inquestra-csv-upload-input') as HTMLInputElement | null;
        if (input) {
          input.value = '';
          input.click();
        }
      },
    },

    // ── Actions & Compliance ──
    {
      title: 'Timer',
      description: 'Insert an interactive countdown incubation timer',
      category: 'Actions & Compliance',
      keywords: ['timer', 'countdown', 'incubation', 'stopwatch', 'minutes', 'alarm', 'wait', 'clock'],
      icon: <Timer className="w-4 h-4 text-amber-500" />,
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        const arg = parseCommandArg(editor, range);
        const duration = parseTimerSeconds(arg);
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'timerBlock',
            attrs: { duration, label: arg ? `Timer (${arg})` : 'Incubation Timer' },
          })
          .run();
      },
    },
    {
      title: 'Export Trial',
      description: 'Download trial as ZIP archive (Markdown + HTML + signatures)',
      category: 'Actions & Compliance',
      keywords: ['export', 'zip', 'download', 'archive', 'backup', 'markdown', 'pdf', 'package'],
      icon: <Download className="w-4 h-4 text-sky-500" />,
      command: (_params: { editor: Editor; range: Range }) => {
        _params.editor.chain().focus().deleteRange(_params.range).run();
        window.dispatchEvent(new CustomEvent('inquestra:trigger-export'));
      },
    },
    {
      title: 'Sign Trial (21 CFR § 11)',
      description: 'Apply electronic signature — seals trial for regulatory compliance',
      category: 'Actions & Compliance',
      keywords: ['sign', 'signature', 'seal', 'attest', 'cfr', 'part11', 'witness', 'electronic', 'lock', 'approve'],
      icon: <FileLock2 className="w-4 h-4 text-emerald-500" />,
      command: (_params: { editor: Editor; range: Range }) => {
        _params.editor.chain().focus().deleteRange(_params.range).run();
        window.dispatchEvent(new CustomEvent('inquestra:trigger-seal'));
      },
    },
    {
      title: 'Audit Trail',
      description: 'Open compliance & audit log panel (SHA-256 provenance)',
      category: 'Actions & Compliance',
      keywords: ['audit', 'history', 'provenance', 'revisions', 'integrity', 'checksum', 'sha256', 'compliance', 'log'],
      icon: <ScrollText className="w-4 h-4 text-emerald-500" />,
      command: (_params: { editor: Editor; range: Range }) => {
        _params.editor.chain().focus().deleteRange(_params.range).run();
        useNotebookStore.getState().setRightDrawerMode('COMPLIANCE');
      },
    }
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
        allowSpaces: true,

        items: ({ query }: { query: string; editor: Editor }) => {
          const commands = buildSlashCommands();
          if (!query) return commands;
          // Dismiss if query has too many words (user is typing prose, not a command)
          const words = query.trim().split(/\s+/);
          if (words.length > 6) return [];
          const cmdToken = words[0]?.toLowerCase() || '';
          const q = query.toLowerCase();
          return commands.filter((c) => {
            const titleMatches = c.title.toLowerCase().includes(q);
            const descMatches = c.description.toLowerCase().includes(q);
            const kwMatches = (c.keywords ?? []).some(
              (kw) =>
                kw.toLowerCase().includes(q) ||
                (words.length > 1 && (kw.toLowerCase() === cmdToken || kw.toLowerCase().startsWith(cmdToken)))
            );
            const tokenMatches = words.length > 1 && c.title.toLowerCase().startsWith(cmdToken);
            return titleMatches || descMatches || kwMatches || tokenMatches;
          });
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
                popperOptions: {
                  modifiers: [
                    {
                      name: 'preventOverflow',
                      options: {
                        boundary: 'viewport',
                        padding: 12,
                      },
                    },
                    {
                      name: 'flip',
                      options: {
                        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
                      },
                    },
                  ],
                },
              });
            },

            onUpdate: (props) => {
              component?.updateProps(props);
              if (!props.clientRect) return;
              popup?.[0]?.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              });
            },

            onKeyDown: (props) => {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit: () => {
              popup?.[0]?.destroy();
              component?.destroy();
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

// ─── Static TipTap Extensions & Options ─────────────────────────────────────────
// Memoized at module level so TipTap's internal compareOptions doesn't trigger
// setOptions / createView infinite loops on every component render in React 19.

const EDITOR_EXTENSIONS = [
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
  Underline,
  Highlight.configure({ multicolor: true }),
  TaskList,
  TaskItem.configure({ nested: true }),
  Subscript,
  Superscript,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
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
  TrialReferenceExtension,
  CitationExtension,
  TimerExtension,
  SlashCommandExtension,
  BlockGuardExtension,
];

const EDITOR_PROPS = {
  attributes: {
    class:
      'prose dark:prose-invert prose-sm max-w-none focus:outline-none min-h-[calc(100vh-14rem)] px-2 py-4 text-foreground',
  },
};

// ─── Editor Canvas Component ───────────────────────────────────────────────────

export function EditorCanvas() {
  const trialUpdatedAt = useNotebookStore((s) => s.activeTrial.updatedAt);
  const cloudTrialId = useNotebookStore((s) => s.cloudTrialId);
  const updateContent = useNotebookStore((s) => s.updateContent);
  const updateTitle = useNotebookStore((s) => s.updateTitle);
  const title = useNotebookStore((s) => s.activeTrial.title);
  const checksum = useNotebookStore((s) => s.activeTrial.checksum);
  const activeTrialId = useNotebookStore((s) => s.activeTrial.id);
  const saveStatus = useNotebookStore((s) => s.saveStatus);
  const saveError = useNotebookStore((s) => s.saveError);
  const lastSavedAt = useNotebookStore((s) => s.lastSavedAt);
  const isLoadingTrial = useNotebookStore((s) => s.isLoadingTrial);
  const setSaveStatus = useNotebookStore((s) => s.setSaveStatus);
  const setSaveError = useNotebookStore((s) => s.setSaveError);
  const setLastSavedAt = useNotebookStore((s) => s.setLastSavedAt);

  // Initial document content for TipTap instantiation (stable ref)
  const initialContentRef = useRef(
    (() => {
      const c = useNotebookStore.getState().activeTrial.content;
      return c && typeof c === 'object' && Object.keys(c).length > 0 ? c : undefined;
    })()
  );

  // Track if TipTap editor update is programmatic (from setContent on trial switch) vs user typing
  const isProgrammaticUpdateRef = useRef(false);
  const loadedTrialIdRef = useRef<string | null>(null);

  // Debounced save timer & pending save payload
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{
    trialId: string;
    title: string;
    content: Record<string, unknown>;
    metadata: { key: string; value: string }[];
  } | null>(null);

  const lastSavedRef = useRef<{
    trialId: string;
    title: string;
    contentString: string;
  } | null>(null);

  // Execution function for saving to server
  const executeServerSave = useCallback(
    async (payload: {
      trialId: string;
      title: string;
      content: Record<string, unknown>;
      metadata: { key: string; value: string }[];
    }) => {
      // If trial is sealed, don't attempt to save
      const currentTrial = useNotebookStore.getState().activeTrial;
      if (currentTrial.checksum) return;

      const contentString = JSON.stringify(payload.content);
      // Dirty check: skip network and DB transaction if identical to last saved state
      if (
        lastSavedRef.current &&
        lastSavedRef.current.trialId === payload.trialId &&
        lastSavedRef.current.title === payload.title &&
        lastSavedRef.current.contentString === contentString
      ) {
        setSaveStatus('SAVED');
        return;
      }

      setSaveStatus('SAVING');
      try {
        const result = await saveTrial({
          trialId: payload.trialId,
          title: payload.title,
          content: payload.content,
          metadata: payload.metadata,
          createRevision: false,
        });

        if (result.success) {
          lastSavedRef.current = {
            trialId: payload.trialId,
            title: payload.title,
            contentString,
          };
          setSaveStatus('SAVED');
          setLastSavedAt(result.savedAt || new Date().toISOString());
          setSaveError(null);
        } else {
          setSaveStatus('ERROR');
          setSaveError(result.error || 'Autosave failed');
        }
      } catch (err) {
        setSaveStatus('ERROR');
        setSaveError(err instanceof Error ? err.message : 'Network error');
      }
    },
    [setSaveStatus, setLastSavedAt, setSaveError]
  );

  // Trigger debounced autosave
  const triggerDebouncedSave = useCallback(
    (newContent?: Record<string, unknown>, newTitle?: string) => {
      const state = useNotebookStore.getState();
      const currentCloudTrialId = state.cloudTrialId;
      const targetTrialId = currentCloudTrialId || state.activeTrial.id;

      // Update in-memory state
      if (newContent) {
        updateContent(newContent);
      }
      if (newTitle !== undefined) {
        updateTitle(newTitle);
      }

      // If trial is not synced yet (no cloudTrialId), store is updated in localStorage
      if (!currentCloudTrialId) {
        setSaveStatus('SAVED');
        setLastSavedAt(new Date().toISOString());
        return;
      }

      // Mark locally as unsaved immediately for server sync
      setSaveStatus('UNSAVED');

      // Record pending save targeted explicitly to this trialId
      const latestTrial = useNotebookStore.getState().activeTrial;
      pendingSaveRef.current = {
        trialId: targetTrialId,
        title: newTitle !== undefined ? newTitle : latestTrial.title,
        content: newContent || latestTrial.content,
        metadata: (latestTrial.metadata || []).map((m) => ({ key: m.key, value: m.value })),
      };

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 2500ms debounce ensures gentle background persistence without flooding the DB
      saveTimeoutRef.current = setTimeout(() => {
        if (pendingSaveRef.current) {
          const payload = pendingSaveRef.current;
          pendingSaveRef.current = null;
          executeServerSave(payload);
        }
      }, 2500);
    },
    [updateContent, updateTitle, setSaveStatus, setLastSavedAt, executeServerSave]
  );

  // Flush pending save before switching trials or unmounting
  const flushPendingSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (pendingSaveRef.current) {
      const payload = pendingSaveRef.current;
      pendingSaveRef.current = null;
      executeServerSave(payload);
    }
  }, [executeServerSave]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      flushPendingSave();
    };
  }, [flushPendingSave]);

  // Global Ctrl+S / Cmd+S shortcut to flush immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        flushPendingSave();
        window.dispatchEvent(new CustomEvent('inquestra:trigger-snapshot'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flushPendingSave]);

  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: EDITOR_EXTENSIONS,
    content: initialContentRef.current,
    onUpdate: ({ editor: ed }) => {
      if (isProgrammaticUpdateRef.current) return;
      const json = ed.getJSON() as Record<string, unknown>;
      triggerDebouncedSave(json);
    },
    editorProps: EDITOR_PROPS,
    immediatelyRender: false,
  });

  // Track previous loading state so we know when a trial just finished loading from server or store
  const wasLoadingRef = useRef(false);

  // Keep editor content in sync when switching trials or when initial load finishes
  useEffect(() => {
    if (!editor) return;
    if (isLoadingTrial) {
      wasLoadingRef.current = true;
      return;
    }

    const justFinishedLoading = wasLoadingRef.current;
    wasLoadingRef.current = false;

    // Check if this trial has not yet been loaded into this editor instance OR if it just finished loading
    if (loadedTrialIdRef.current !== activeTrialId || justFinishedLoading) {
      flushPendingSave();
      loadedTrialIdRef.current = activeTrialId;

      isProgrammaticUpdateRef.current = true;
      const currentContent = useNotebookStore.getState().activeTrial.content;
      const targetContent =
        currentContent && typeof currentContent === 'object' && Object.keys(currentContent).length > 0
          ? currentContent
          : { type: 'doc', content: [] };

      editor.commands.setContent(targetContent, false);
      isProgrammaticUpdateRef.current = false;
    }
  }, [activeTrialId, editor, isLoadingTrial, flushPendingSave]);

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

  // Listen for citation insert events (e.g. clicked from Literature panel)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<any>).detail;
      if (editorRef.current && detail) {
        editorRef.current
          .chain()
          .focus('end')
          .insertContent({
            type: 'citationBlock',
            attrs: {
              paperId: detail.paperId || detail.id || null,
              title: detail.title || '',
              authors: detail.authors || [],
              journal: detail.journal || null,
              pubYear: detail.pubYear || null,
              doi: detail.doi || null,
              pmid: detail.pmid || null,
              pmcid: detail.pmcid || null,
              url: detail.url || null,
              pdfUrl: detail.pdfUrl || null,
              isOpenAccess: !!detail.isOpenAccess,
              citationCount: detail.citationCount || 0,
              notes: detail.notes || '',
            },
          })
          .run();
      }
    };
    window.addEventListener('inquestra:insert-citation', handler);
    return () => window.removeEventListener('inquestra:insert-citation', handler);
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

  const handleCSVUpload = useCallback(
    async (file: File) => {
      if (!editorRef.current) return;
      try {
        const parsed = await parseCSVStream(file);
        // Insert a dataset / chart node pre-loaded with multi-column CSV data
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
                rowCount: parsed.rowCount,
                columnsMeta: parsed.columnsMeta,
                categoryKeys: parsed.categoryKeys,
                identifierKeys: parsed.identifierKeys,
                statusKeys: parsed.statusKeys,
                timestampKeys: parsed.timestampKeys,
              },
            },
          })
          .run();
      } catch (err) {
        console.error('CSV parse error:', err);
        alert(err instanceof Error ? err.message : 'Failed to parse CSV file');
      }
    },
    []
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = Array.from(e.dataTransfer.files).find(
        (f) => f.name.endsWith('.csv') || f.type === 'text/csv'
      );
      if (!file) return;
      await handleCSVUpload(file);
    },
    [handleCSVUpload]
  );

  // ─────────────────────────────────────────────────────────────────────────

  const [isMounted, setIsMounted] = useState(false);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    getCurrentUserProfile().then((profile) => {
      if (profile) {
        setUserRole(profile.role);
        setUserEmail(profile.email);
      }
    }).catch(console.error);
  }, []);

  const displayTime = lastSavedAt || trialUpdatedAt;
  const formattedTime = isMounted && displayTime 
    ? new Date(displayTime).toLocaleTimeString([], {
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
      {/* Hidden file input for slash-command / button local CSV upload */}
      <input
        id="inquestra-csv-upload-input"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            handleCSVUpload(f);
            e.target.value = '';
          }
        }}
      />

      {/* Drag-over overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 bg-muted/95 border-2 border-dashed border-blue-500 rounded-xl px-12 py-8 shadow-2xl">
            <Upload className="w-8 h-8 text-blue-500 animate-bounce" />
            <p className="text-foreground text-sm font-semibold">Drop CSV to import laboratory dataset & telemetry</p>
            <p className="text-muted-foreground text-xs font-mono">Auto-detects sample IDs, categories, conditions & measurements</p>
          </div>
        </div>
      )}

      {/* Notebook Paper Sheet */}
      <div className="max-w-5xl mx-auto my-3 sm:my-6 px-2 sm:px-4 md:px-8 transition-all">
        <div 
          className="bg-card border border-border/80 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-10 transition-all cursor-text relative"
          onClick={(e) => {
            if (e.target === e.currentTarget && editor && !editor.isFocused) {
              editor.commands.focus('end');
            }
          }}
          onContextMenu={(e) => {
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) {
              return; // Allow native browser context menu for text selection / copying
            }
            e.preventDefault();
            setCanvasContextMenu({ x: e.clientX, y: e.clientY });
          }}
        >
          {/* Subtle notebook binder margin indicator on the left */}
          <div className="absolute top-8 bottom-8 left-3 w-[2px] bg-gradient-to-b from-border/80 via-border/40 to-transparent rounded-full pointer-events-none" />

          {/* Document header / Title */}
          <div className="pb-4 border-b border-border/60 mb-6 pl-2">
            <input
              type="text"
              value={title}
              disabled={!!checksum}
              onChange={(e) => {
                const newTitle = e.target.value;
                triggerDebouncedSave(undefined, newTitle);
              }}
              placeholder="Untitled Trial"
              className="w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-70"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 font-mono">
              <div className="flex items-center gap-2" suppressHydrationWarning>
                {saveStatus === 'SAVING' && (
                  <span className="text-primary flex items-center gap-1.5 font-medium animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving…
                  </span>
                )}
                {saveStatus === 'SAVED' && (
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-500" />
                    {formattedTime ? `Saved · ${formattedTime}` : 'All changes saved'}
                  </span>
                )}
                {saveStatus === 'UNSAVED' && (
                  <span className="text-amber-500/90 flex items-center gap-1.5">
                    <Circle className="w-2 h-2 fill-amber-500" />
                    Unsaved changes
                  </span>
                )}
                {saveStatus === 'ERROR' && (
                  <button
                    type="button"
                    onClick={() => triggerDebouncedSave()}
                    className="text-red-500 hover:text-red-400 flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
                    title={saveError || 'Autosave failed. Click to retry.'}
                  >
                    <AlertCircle className="w-3 h-3" />
                    Save error — click to retry
                  </button>
                )}
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-muted-foreground">
                Type <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-foreground font-mono text-[10px]">/</kbd> for commands, reagents, charts
              </span>
            </div>
          </div>

          {/* Loading overlay when switching trials — solid opaque to prevent text bleed */}
          {isLoadingTrial && (
            <div className="absolute inset-0 bg-background z-30 flex flex-col items-center justify-center rounded-2xl gap-3 animate-in fade-in duration-100 min-h-[500px]">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-card border border-border rounded-lg shadow-xl text-xs font-mono text-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading experiment notebook…</span>
              </div>
            </div>
          )}

          {/* Rich Note-Taking Formatting Toolbar */}
          <div className="mb-4 rounded-lg border border-border/60 bg-muted/20 relative z-20">
            <EditorToolbar editor={editor} />
          </div>

          {/* Floating Bubble Menu on text selection */}
          <EditorBubbleMenu editor={editor} />

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

      {canvasContextMenu && (
        <CanvasContextMenu
          x={canvasContextMenu.x}
          y={canvasContextMenu.y}
          isOpen={true}
          onClose={() => setCanvasContextMenu(null)}
          editor={editor}
          onTriggerSave={flushPendingSave}
        />
      )}
    </div>
  );
}

