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

import { useEffect, useState, useTransition } from 'react';
import { fetchAllTrials, createNewTrial, getTrial } from '@/actions/trialActions';

export function LeftSidebar() {
  const activeTrial = useNotebookStore((s) => s.activeTrial);
  const setActiveTrial = useNotebookStore((s) => s.setActiveTrial);
  
  const [trials, setTrials] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchAllTrials().then(setTrials).catch(console.error);
  }, []);

  const handleNewTrial = () => {
    startTransition(async () => {
      try {
        const newTrial = await createNewTrial();
        setTrials([newTrial, ...trials]);
        setActiveTrial(newTrial as any); // Update local store
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleSelectTrial = async (id: string) => {
    try {
      const trial = await getTrial(id);
      if (trial) {
        setActiveTrial(trial as any);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="w-[260px] bg-neutral-950/80 backdrop-blur-md border-r border-neutral-800/80 flex flex-col shrink-0 overflow-hidden shadow-2xl">
      {/* Project Switcher */}
      <div className="px-3 py-3 border-b border-neutral-800/60 bg-neutral-900/20">
        <button className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-neutral-800/80 transition-all duration-200 group">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/20 p-1 rounded">
              <FlaskConical className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <span className="text-sm text-neutral-200 font-medium truncate tracking-tight">BME Lab</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
        </button>
      </div>

      {/* Trial List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              Trials
            </span>
          </div>
          <button 
            onClick={handleNewTrial}
            disabled={isPending}
            className="text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all duration-200 p-1 rounded disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-1">
          {trials.map((t) => {
            const isActive = activeTrial.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTrial(t.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all duration-200 border ${
                  isActive 
                    ? 'bg-neutral-800/80 border-neutral-700/80 shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-neutral-900/50 hover:border-neutral-800/50'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[t.status as TrialStatus]}`} />
                <span className={`text-sm truncate flex-1 tracking-tight ${isActive ? 'text-white font-medium' : 'text-neutral-400'}`}>
                  {t.title}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 border-t border-neutral-800/60 pt-4">
          <a href="/app/admin" className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all duration-200 tracking-tight">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-neutral-600" />
            Lab Settings
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
