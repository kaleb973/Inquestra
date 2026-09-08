'use client';
// src/components/layout/LeftSidebar.tsx
// 260px left panel: project switcher stub, trial list, hardware serial controls.

import { FlaskConical, ChevronRight, Plus, HardDrive, BookOpen } from 'lucide-react';
import { useNotebookStore } from '@/store/useNotebookStore';
import { SerialControlPanel } from '@/components/hardware/SerialControlPanel';
import type { TrialStatus } from '@/types/inquestra';

const STATUS_DOT: Record<TrialStatus, string> = {
  DRAFT: 'bg-neutral-600',
  ACTIVE: 'bg-emerald-400',
  COMPLETED: 'bg-blue-400',
  FAILED: 'bg-red-400',
};

export function LeftSidebar() {
  const activeTrial = useNotebookStore((s) => s.activeTrial);

  return (
    <aside className="w-[260px] bg-neutral-950 border-r border-neutral-800 flex flex-col shrink-0 overflow-hidden">
      {/* Project Switcher */}
      <div className="px-3 py-2.5 border-b border-neutral-800">
        <button className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-neutral-800/60 transition-colors group">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-white font-medium truncate">BME Lab</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
        </button>
      </div>

      {/* Trial List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-neutral-600" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Trials
            </span>
          </div>
          <button className="text-neutral-600 hover:text-neutral-300 transition-colors p-0.5 rounded">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-0.5">
          {/* Active trial entry */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-neutral-800 border border-neutral-700">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[activeTrial.status]}`} />
            <span className="text-sm text-white truncate flex-1">{activeTrial.title}</span>
          </div>
        </div>

        {/* Phase 2 will list multiple trials from the DB */}
        <p className="text-[10px] text-neutral-700 mt-4 px-2 leading-snug">
          Multi-trial management and PostgreSQL persistence are coming in Phase 2.
        </p>

        <div className="mt-8 border-t border-neutral-800 pt-4">
          <a href="/app/admin" className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-neutral-600" />
            Admin Dashboard
          </a>
        </div>
      </div>

      {/* Hardware Controls */}
      <div className="border-t border-neutral-800 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
            Hardware
          </span>
        </div>
        <SerialControlPanel />
      </div>
    </aside>
  );
}
