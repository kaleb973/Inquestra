// src/components/editor/extensions/BlockGuardExtension.ts
// TipTap extension providing safe block boundary deletion and accidental backspace protection.
// Guards complex BME blocks (Interactive Telemetry Charts, Protocols, Reagent Deductions, Molecules,
// Equations, Sequences, and Data Tables) against accidental single-keystroke vaporization.

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
      // ── 1. Plain Backspace Guard ───────────────────────────────────────────
      Backspace: () => {
        const { state, dispatch } = this.editor.view;
        const { selection } = state;

        // Case A: Block is currently highlighted/selected via NodeSelection
        if (selection instanceof NodeSelection) {
          const nodeName = selection.node.type.name;
          if (PROTECTED_BLOCK_NAMES.includes(nodeName as ProtectedBlockName)) {
            // Guard against single accidental Backspace destroying the whole block.
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('inquestra:block-protected-notice', {
                  detail: {
                    nodeName,
                    action: 'delete_blocked',
                  },
                })
              );
            }
            return true; // Intercepted: keep the block safe!
          }
        }

        // Case B: Cursor at the start of a paragraph/block following a protected block or table
        if (selection instanceof TextSelection && selection.empty) {
          const { $cursor } = selection;
          if ($cursor && $cursor.parentOffset === 0) {
            const cutDepth = $cursor.depth - 1;
            const index = $cursor.index(cutDepth);
            if (index > 0) {
              const parent = $cursor.node(cutDepth);
              const nodeBefore = parent.child(index - 1);

              if (PROTECTED_BLOCK_NAMES.includes(nodeBefore.type.name as ProtectedBlockName)) {
                // B1: If current paragraph has notes/text, NEVER delete the preceding block!
                if ($cursor.parent.content.size > 0) {
                  return true; // Stop event: cursor stays at col 0, preceding block is safe.
                }

                // B2: If current paragraph is completely empty:
                if ($cursor.parent.content.size === 0) {
                  // If nodeBefore is a table, move cursor smoothly into the table's last cell
                  // and delete the orphan empty line.
                  if (nodeBefore.type.name === 'table') {
                    const deleteFrom = $cursor.before();
                    const deleteTo = $cursor.after();
                    const tr = state.tr.delete(deleteFrom, deleteTo);
                    const sel = Selection.near(tr.doc.resolve(deleteFrom - 1), -1);
                    tr.setSelection(sel);
                    if (dispatch) dispatch(tr.scrollIntoView());
                    return true;
                  }

                  // If nodeBefore is an atom block (chart, protocol, reagent, etc.):
                  // Check if there is an existing textblock before the atom block
                  if (index > 1) {
                    const deleteFrom = $cursor.before();
                    const deleteTo = $cursor.after();
                    const tr = state.tr.delete(deleteFrom, deleteTo);
                    const sel = Selection.near(
                      tr.doc.resolve(deleteFrom - nodeBefore.nodeSize),
                      -1
                    );
                    tr.setSelection(sel);
                    if (dispatch) dispatch(tr.scrollIntoView());
                    return true;
                  }

                  // If this empty paragraph is the only editable textblock below the atom,
                  // keep it in place so the researcher can continue taking notes.
                  return true;
                }
              }
            }
          }
        }

        return false;
      },

      // ── 2. Intentional Block Deletion via Mod-Backspace (Ctrl/Cmd + Backspace) ──
      'Mod-Backspace': () => {
        const { state, dispatch } = this.editor.view;
        const { selection } = state;

        if (selection instanceof NodeSelection) {
          const nodeName = selection.node.type.name;
          if (PROTECTED_BLOCK_NAMES.includes(nodeName as ProtectedBlockName)) {
            if (dispatch) {
              dispatch(state.tr.deleteSelection().scrollIntoView());
            }
            return true;
          }
        }
        return false;
      },

      // ── 3. Intentional Block Deletion via Delete key (Forward Delete) ────────
      Delete: () => {
        const { state, dispatch } = this.editor.view;
        const { selection } = state;

        if (selection instanceof NodeSelection) {
          const nodeName = selection.node.type.name;
          if (PROTECTED_BLOCK_NAMES.includes(nodeName as ProtectedBlockName)) {
            if (dispatch) {
              dispatch(state.tr.deleteSelection().scrollIntoView());
            }
            return true;
          }
        }
        return false;
      },
    };
  },
});
