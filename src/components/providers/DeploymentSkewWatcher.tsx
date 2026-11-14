'use client';
// src/components/providers/DeploymentSkewWatcher.tsx
// Global client-side watcher for Next.js App Router deployment version skew.
// If an unhandled Server Action error occurs due to container redeployment on Railway/Docker,
// this intercepts the rejection, alerts notebook state, and prevents silent sync failure.

import { useEffect } from 'react';
import { isDeploymentSkewError, notifyDeploymentSkew } from '@/lib/deploymentSkew';
import { useNotebookStore } from '@/store/useNotebookStore';

export function DeploymentSkewWatcher() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isDeploymentSkewError(event.reason)) {
        notifyDeploymentSkew('DeploymentSkewWatcher.unhandledrejection');
        const store = useNotebookStore.getState();
        store.setSaveStatus('ERROR');
        store.setSaveError('NEW_VERSION_DEPLOYED');
        // Prevent default browser crash/panic logs
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (isDeploymentSkewError(event.error || event.message)) {
        notifyDeploymentSkew('DeploymentSkewWatcher.error');
        const store = useNotebookStore.getState();
        store.setSaveStatus('ERROR');
        store.setSaveError('NEW_VERSION_DEPLOYED');
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null;
}
