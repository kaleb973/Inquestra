'use client';
// src/components/protocols/ProtocolManager.tsx
// Client controller for the Protocol & SOP Library.
// Manages in-place switching between the library catalog and the SOP editor without browser navigation.

import { useState } from 'react';
import { ProtocolLibrary, type ProtocolSummary } from '@/components/protocols/ProtocolLibrary';
import { ProtocolEditor } from '@/components/protocols/ProtocolEditor';
import type { Role } from '@prisma/client';

interface ProtocolManagerProps {
  initialProtocols: ProtocolSummary[];
  currentUserRole: Role;
  orgName: string;
}

export function ProtocolManager({
  initialProtocols,
  currentUserRole,
  orgName,
}: ProtocolManagerProps) {
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);

  if (editingProtocolId) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ProtocolEditor
          protocolId={editingProtocolId}
          currentUserRole={currentUserRole}
          onBack={() => setEditingProtocolId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <ProtocolLibrary
        initialProtocols={initialProtocols}
        currentUserRole={currentUserRole}
        orgName={orgName}
        onEditProtocol={(id) => setEditingProtocolId(id)}
      />
    </div>
  );
}
