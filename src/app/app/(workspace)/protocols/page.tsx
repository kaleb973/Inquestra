'use client';
// src/app/app/(workspace)/protocols/page.tsx
// Protocol & SOP Library — full-page view.
// Switches between the library browser and the protocol editor in-place (no navigation).

import { useEffect, useState } from 'react';
import { ProtocolLibrary } from '@/components/protocols/ProtocolLibrary';
import { ProtocolEditor } from '@/components/protocols/ProtocolEditor';
import { getCurrentUserProfile } from '@/actions/adminActions';
import type { Role } from '@prisma/client';
import { Loader2 } from 'lucide-react';

export default function ProtocolsPage() {
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingProtocolId, setEditingProtocolId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserProfile()
      .then((profile) => {
        if (profile) setUserRole(profile.role);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen">
        <p className="text-sm text-muted-foreground">Unable to load user profile.</p>
      </div>
    );
  }

  if (editingProtocolId) {
    return (
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <ProtocolEditor
          protocolId={editingProtocolId}
          currentUserRole={userRole}
          onBack={() => setEditingProtocolId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <ProtocolLibrary
        currentUserRole={userRole}
        onEditProtocol={(id) => setEditingProtocolId(id)}
      />
    </div>
  );
}
