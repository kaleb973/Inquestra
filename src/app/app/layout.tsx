// src/app/app/layout.tsx
// Viewport container for the Inquestra application workspace.
// Prevents any absolute or floating popup (Tippy, dialogs, canvas) from scrolling the outer window.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workspace',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-background">
      {children}
    </div>
  );
}
