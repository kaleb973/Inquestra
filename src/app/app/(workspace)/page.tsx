'use client';
// src/app/page.tsx
// 3-column enterprise BME workspace shell.
// All children are client components; this page is also client-only (DAQ, editor).

import { Header } from '@/components/layout/Header';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightDrawer } from '@/components/layout/RightDrawer';
import { EditorCanvas } from '@/components/canvas/EditorCanvas';

export default function WorkspacePage() {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <Header />

      {/* 3-column body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: 260px project nav + hardware controls */}
        <LeftSidebar />

        {/* Center: TipTap WYSIWYG canvas (flex-1) */}
        <EditorCanvas />

        {/* Right: 320px live telemetry + metadata drawer */}
        <RightDrawer />
      </div>
    </div>
  );
}
