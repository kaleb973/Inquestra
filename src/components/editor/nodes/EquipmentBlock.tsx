import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { Microscope, ExternalLink } from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';

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

function EquipmentNode(props: NodeViewProps) {
  const { node } = props;
  const setRightDrawerMode = useNotebookStore((s) => s.setRightDrawerMode);

  return (
    <NodeViewWrapper className="my-4">
      <button
        type="button"
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-md text-foreground text-sm cursor-pointer hover:bg-primary/20 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setRightDrawerMode('INVENTORY')}
      >
        <Microscope className="w-4 h-4 text-foreground" />
        <span className="font-medium">
          {node.attrs.equipmentName ? `Equipment: ${String(node.attrs.equipmentName)}` : 'Link Equipment...'}
        </span>
        <ExternalLink className="w-3 h-3 opacity-60 ml-1" />
      </button>
    </NodeViewWrapper>
  );
}
