'use client';
// src/components/admin/LabSettings.tsx

import { useState, useTransition } from 'react';
import { updateStrictMode } from '@/actions/adminActions';
import { Loader2, ShieldAlert } from 'lucide-react';
import type { Organization } from '@prisma/client';

export function LabSettings({ org }: { org: Organization }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateStrictMode(!org.strictMode);
      if (!res.success) setError(res.error || 'Failed to update strict mode');
    });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden max-w-2xl">
      <div className="px-5 py-4 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          Compliance & Access Settings
        </h2>
      </div>

      <div className="p-5">
        {error && <div className="mb-4 p-3 bg-red-950/50 border border-red-900 text-red-400 text-sm rounded">{error}</div>}

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-medium text-neutral-200">21 CFR Part 11 Strict Mode</h3>
            <p className="text-sm text-neutral-500 max-w-lg">
              When enabled, Inquestra strictly enforces equipment calibration schedules. Hardware data acquisition will be blocked if any registered lab equipment is flagged as <span className="font-mono text-xs text-amber-500 bg-amber-950/30 px-1 rounded">NEEDS_CALIBRATION</span> or <span className="font-mono text-xs text-red-500 bg-red-950/30 px-1 rounded">BROKEN</span>.
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
              org.strictMode ? 'bg-purple-600' : 'bg-neutral-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                org.strictMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
