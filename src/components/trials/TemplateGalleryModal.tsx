'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Dna,
  FileText,
  FlaskConical,
  Gauge,
  Microscope,
  Plus,
  X,
} from 'lucide-react';
import {
  EXPERIMENT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type ExperimentTemplate,
  type TemplateCategory,
  type TemplateIconKey,
} from '@/lib/templates';

interface TemplateGalleryModalProps {
  open: boolean;
  isCreating?: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ExperimentTemplate) => void;
}

const CATEGORY_ACCENT: Record<TemplateCategory, string> = {
  'Molecular Biology': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Cell Biology': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Chemistry: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Materials Science': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  General: 'bg-muted text-muted-foreground border-border',
};

function TemplateIcon({ iconKey, className }: { iconKey: TemplateIconKey; className?: string }) {
  switch (iconKey) {
    case 'dna':
      return <Dna className={className} />;
    case 'flask':
      return <FlaskConical className={className} />;
    case 'microscope':
      return <Microscope className={className} />;
    case 'gauge':
      return <Gauge className={className} />;
    case 'file':
    default:
      return <FileText className={className} />;
  }
}

export default function TemplateGalleryModal({
  open,
  isCreating = false,
  onClose,
  onSelectTemplate,
}: TemplateGalleryModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | TemplateCategory>('All');

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isCreating, onClose]);

  const blankTemplate = useMemo(
    () => EXPERIMENT_TEMPLATES.find((t) => t.id === 'blank-experiment') ?? EXPERIMENT_TEMPLATES[0],
    []
  );

  const visibleTemplates = useMemo(() => {
    if (selectedCategory === 'All') {
      return EXPERIMENT_TEMPLATES.filter((t) => t.id !== 'blank-experiment');
    }
    return EXPERIMENT_TEMPLATES.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-gallery-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCreating) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border bg-card/50">
          <div>
            <h2
              id="template-gallery-title"
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              New Experiment Record
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Launch from a blank notebook page or pre-populate structured SOPs, primer blocks, reagents, and DAQ charts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            aria-label="Close template gallery"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Always-visible Start Blank quick bar */}
        <div className="px-6 py-3.5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">Start Blank</div>
              <div className="text-xs text-muted-foreground">
                Open an empty canvas and compose blocks inline with <code className="font-mono text-[11px] bg-muted px-1 py-0.5 rounded">/</code> commands.
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={isCreating}
            onClick={() => onSelectTemplate(blankTemplate)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Start Blank
          </button>
        </div>

        {/* Discipline Filter Pills */}
        <div className="px-6 py-3 border-b border-border flex items-center gap-2 overflow-x-auto bg-background">
          {(['All', ...TEMPLATE_CATEGORIES] as const).map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
                  active
                    ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-accent'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {visibleTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                disabled={isCreating}
                onClick={() => onSelectTemplate(template)}
                className="group text-left flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:border-emerald-500/45 hover:bg-emerald-500/[0.03] transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-emerald-500 group-hover:border-emerald-500/40 transition-colors">
                      <TemplateIcon iconKey={template.iconKey} className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${CATEGORY_ACCENT[template.category]}`}
                    >
                      {template.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                    {template.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-muted-foreground truncate">
                    {template.previewSummary}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
