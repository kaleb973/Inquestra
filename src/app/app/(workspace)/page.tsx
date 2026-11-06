'use client';
// src/app/page.tsx
// 3-column enterprise scientific workspace shell.
// All children are client components; this page is also client-only (DAQ, editor).

import { useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightDrawer } from '@/components/layout/RightDrawer';
import { EditorCanvas } from '@/components/canvas/EditorCanvas';
import { useNotebookStore } from '@/store/useNotebookStore';

export default function WorkspacePage() {
  const isLeftSidebarOpen = useNotebookStore((s) => s.isLeftSidebarOpen);
  const isRightDrawerOpen = useNotebookStore((s) => s.isRightDrawerOpen);
  const setLeftSidebarOpen = useNotebookStore((s) => s.setLeftSidebarOpen);
  const setRightDrawerOpen = useNotebookStore((s) => s.setRightDrawerOpen);

  // Auto-collapse on small/tablet viewports on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setLeftSidebarOpen(false);
      setRightDrawerOpen(false);
    }
  }, [setLeftSidebarOpen, setRightDrawerOpen]);

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

        {/* Center: TipTap WYSIWYG canvas (flex-1) */}
        <EditorCanvas />

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
