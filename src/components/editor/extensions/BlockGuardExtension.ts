// src/components/editor/extensions/BlockGuardExtension.ts
// TipTap extension providing safe block boundary deletion and accidental backspace protection.
// Guards complex BME blocks (Interactive Telemetry Charts, Protocols, Reagent Deductions, Molecules,
// Equations, Sequences, and Data Tables) against accidental single-keystroke vaporization while taking notes.

import { Extension } from '@tiptap/core';
import { TextSelection, NodeSelection, Selection } from '@tiptap/pm/state';

export const PROTECTED_BLOCK_NAMES = [
  'table',
  'interactiveChart',
  'reagentBlock',
  'protocolBlock',
  'moleculeBlock',
  'mathBlock',
  'sequenceBlock',
  'equipmentBlock',
  'trialReferenceBlock',
  'citationBlock',
  'timerBlock',
] as const;

export type ProtectedBlockName = (typeof PROTECTED_BLOCK_NAMES)[number];

export const BlockGuardExtension = Extension.create({
  name: 'blockGuard',

  addKeyboardShortcuts() {
    return {
      // ── 1. Safe Backspace ──────────────────────────────────────────────────
      Backspace: () => {
        try {
          const { state, dispatch } = this.editor.view;
          const { selection } = state;

          // Case A: Block is explicitly selected via NodeSelection (user clicked or focused the block).
          // Allow clean, intentional deletion.
          if (selection instanceof NodeSelection) {
            const nodeName = selection.node?.type?.name;
            if (nodeName && PROTECTED_BLOCK_NAMES.includes(nodeName as ProtectedBlockName)) {
              return this.editor.commands.deleteSelection();
            }
          }

          // Case B: Cursor at the start of a paragraph following a protected block or table
          if (selection instanceof TextSelection && selection.empty) {
            const { $cursor } = selection;
            if (!$cursor || $cursor.depth < 1) return false;

            if ($cursor.parentOffset === 0) {
              const cutDepth = $cursor.depth - 1;
              const index = $cursor.index(cutDepth);
              if (index > 0) {
                const parent = $cursor.node(cutDepth);
                const nodeBefore = parent.child(index - 1);

                if (nodeBefore && PROTECTED_BLOCK_NAMES.includes(nodeBefore.type.name as ProtectedBlockName)) {
                  // Guard B1: If current paragraph has notes/text, NEVER delete or join into preceding block!
                  if ($cursor.parent.content.size > 0) {
                    return true; // Intercept event: cursor stays at col 0, block above is 100% safe.
                  }

                  // Guard B2: If current paragraph is empty:
                  if ($cursor.parent.content.size === 0) {
                    const from = $cursor.before($cursor.depth);
                    const to = Math.min(state.doc.content.size, $cursor.after($cursor.depth));

                    if (from < to && from >= 0) {
                      // If nodeBefore is a table, safely delete empty line and move into last cell
                      if (nodeBefore.type.name === 'table') {
                        const tr = state.tr.delete(from, to);
                        const targetPos = Math.max(1, Math.min(tr.doc.content.size, from - 1));
                        const sel = Selection.near(tr.doc.resolve(targetPos), -1);
                        tr.setSelection(sel);
                        if (dispatch) dispatch(tr.scrollIntoView());
                        return true;
                      }

                      // If nodeBefore is an atom block:
                      // Check if there is an editable block before the atom block
                      const atomStart = from - nodeBefore.nodeSize;
                      if (atomStart > 1 && index > 1) {
                        const tr = state.tr.delete(from, to);
                        const targetPos = Math.max(1, Math.min(tr.doc.content.size, atomStart - 1));
                        const sel = Selection.near(tr.doc.resolve(targetPos), -1);
                        tr.setSelection(sel);
                        if (dispatch) dispatch(tr.scrollIntoView());
                        return true;
                      }

                      // If atom block is at the top (index === 1), keep the empty paragraph
                      // so the researcher always has an editable text area below the block.
                      return true;
                    }
                  }
                }
              }
            }
          }

          return false;
        } catch (err) {
          console.error('[BlockGuard] Safe fallback on Backspace error:', err);
          return false;
        }
      },

      // ── 2. Intentional Block Deletion via Delete key (Forward Delete) ────────
      Delete: () => {
        try {
          const { selection } = this.editor.state;
          if (selection instanceof NodeSelection) {
            const nodeName = selection.node?.type?.name;
            if (nodeName && PROTECTED_BLOCK_NAMES.includes(nodeName as ProtectedBlockName)) {
              return this.editor.commands.deleteSelection();
            }
          }
          return false;
        } catch (err) {
          console.error('[BlockGuard] Safe fallback on Delete error:', err);
          return false;
        }
      },

      // ── 3. Intentional Block Deletion via Mod-Backspace (Ctrl/Cmd + Backspace) ──
      'Mod-Backspace': () => {
        try {
          const { selection } = this.editor.state;
          if (selection instanceof NodeSelection) {
            const nodeName = selection.node?.type?.name;
            if (nodeName && PROTECTED_BLOCK_NAMES.includes(nodeName as ProtectedBlockName)) {
              return this.editor.commands.deleteSelection();
            }
          }
          return false;
        } catch (err) {
          console.error('[BlockGuard] Safe fallback on Mod-Backspace error:', err);
          return false;
        }
      },
    };
  },
});
