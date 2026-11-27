'use client';
// src/app/page.tsx
// 3-column enterprise scientific workspace shell.
// All children are client components; this page is also client-only (DAQ, editor).

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightDrawer } from '@/components/layout/RightDrawer';
import { EditorCanvas } from '@/components/canvas/EditorCanvas';
import { useNotebookStore } from '@/store/useNotebookStore';
import { trackAnalyticsEvent } from '@/lib/analytics/events';

export default function WorkspacePage() {
  const isLeftSidebarOpen = useNotebookStore((s) => s.isLeftSidebarOpen);
  const isRightDrawerOpen = useNotebookStore((s) => s.isRightDrawerOpen);
  const setLeftSidebarOpen = useNotebookStore((s) => s.setLeftSidebarOpen);
  const setRightDrawerOpen = useNotebookStore((s) => s.setRightDrawerOpen);
  const hasHydrated = useNotebookStore((s) => s._hasHydrated);
  const activeTrialId = useNotebookStore((s) => s.activeTrial.id);
  const [mounted, setMounted] = useState(false);

  // Wait for client mount + Zustand persist hydration to prevent SSR mismatch and preserve guest drafts
  useEffect(() => {
    setMounted(true);
    trackAnalyticsEvent('workspace_entered', { path: '/app' });
    if (!useNotebookStore.getState()._hasHydrated) {
      Promise.resolve(useNotebookStore.persist?.rehydrate()).finally(() => {
        useNotebookStore.getState().setHasHydrated(true);
      });
    }
  }, []);

  // Auto-collapse on small/tablet viewports on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setLeftSidebarOpen(false);
      setRightDrawerOpen(false);
    }
  }, [setLeftSidebarOpen, setRightDrawerOpen]);

  if (!mounted || !hasHydrated) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-card border border-border rounded-lg shadow-sm text-xs font-mono text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>Initializing Inquestra workspace…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden relative">
      {/* Top bar */}
      <Header />

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: 260px project nav + hardware controls */}
        <LeftSidebar />

        {/* Backdrop scrim for mobile/tablet left sidebar */}
        {isLeftSidebarOpen && (
          <div
            role="presentation"
            aria-hidden="true"
            onClick={() => setLeftSidebarOpen(false)}
            className="fixed inset-0 top-14 bg-black/50 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-200"
          />
        )}

        {/* Center: TipTap WYSIWYG canvas (keyed by activeTrialId for clean trial transitions) */}
        <EditorCanvas key={activeTrialId} />

        {/* Backdrop scrim for mobile/tablet right telemetry drawer */}
        {isRightDrawerOpen && (
          <div
            role="presentation"
            aria-hidden="true"
            onClick={() => setRightDrawerOpen(false)}
            className="fixed inset-0 top-14 bg-black/50 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-200"
          />
        )}

        {/* Right: 360px live telemetry + metadata drawer */}
        <RightDrawer />
      </div>
    </div>
  );
}
