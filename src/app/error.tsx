'use client';
// src/app/error.tsx
// Global application error boundary. Catches unexpected client exceptions and provides
// a clean, graceful recovery interface without dropping the user into a blank white error screen.

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isDeploymentSkewError } from '@/lib/deploymentSkew';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isSkew = isDeploymentSkewError(error);

  useEffect(() => {
    if (isSkew) {
      console.warn('[Inquestra Error Boundary]: Deployment version skew detected. Tab should reload.');
    } else {
      console.error('[Inquestra Global Error Boundary]:', error);
    }
  }, [error, isSkew]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in duration-300">
        <div
          className={`w-14 h-14 rounded-2xl ${
            isSkew
              ? 'bg-primary/10 border border-primary/20 text-primary'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
          } flex items-center justify-center mx-auto shadow-inner`}
        >
          {isSkew ? <Sparkles className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
            {isSkew ? 'Application Update Deployed' : 'Client Exception Recovered'}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isSkew
              ? 'A newer version of Inquestra was deployed to the server. Your active trial data and local drafts are preserved in browser storage. Reload to complete the update.'
              : 'Inquestra intercepted an unexpected client-side error. Your research data and local trial drafts are cached safely.'}
          </p>
        </div>

        {error.message && !isSkew && (
          <div className="p-3 bg-muted/40 border border-border/60 rounded-lg text-left overflow-x-auto text-[11px] font-mono text-muted-foreground max-h-24">
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => {
              if (isSkew) {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-5 py-2.5 rounded-xl cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isSkew ? 'Update & Reload' : 'Reload Session'}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              window.location.href = '/app';
            }}
            className="w-full sm:w-auto gap-2 text-xs px-5 py-2.5 rounded-xl cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Notebook
          </Button>
        </div>
      </div>
    </div>
  );
}
