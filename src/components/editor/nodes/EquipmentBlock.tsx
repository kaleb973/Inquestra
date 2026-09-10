import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Microscope, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNotebookStore } from '@/store/useNotebookStore';
import Link from 'next/link';

export const EquipmentExtension = Node.create({
  name: 'equipmentBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      equipmentId: { default: null },
      equipmentName: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="equipmentBlock"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'equipmentBlock' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EquipmentNode);
  },
});

function EquipmentNode(props: any) {
  const { node, updateAttributes } = props;
  const setRightDrawerMode = useNotebookStore((s) => s.setRightDrawerMode);

  return (
    <NodeViewWrapper className="my-4">
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-950/40 border border-indigo-900/60 rounded-md text-indigo-200 text-sm cursor-pointer hover:bg-indigo-900/60 transition-colors"
        onClick={() => setRightDrawerMode('INVENTORY')}
      >
        <Microscope className="w-4 h-4 text-indigo-400" />
        <span className="font-medium">
          {node.attrs.equipmentName ? `Equipment: ${node.attrs.equipmentName}` : 'Link Equipment...'}
        </span>
        <ExternalLink className="w-3 h-3 opacity-50 ml-1" />
      </div>
    </NodeViewWrapper>
  );
}
