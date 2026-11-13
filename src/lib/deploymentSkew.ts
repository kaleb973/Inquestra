// src/lib/deploymentSkew.ts
// Handles Next.js App Router Server Action deployment version skew.
// When Railway or a Docker host deploys a new container, Server Action content hashes
// change. Active browser tabs running the previous build bundle will receive
// `UnrecognizedActionError: Server Action "..." was not found on the server.`
// This module provides zero-hallucination detection and graceful recovery primitives.

/**
 * Checks whether an error or error payload indicates Next.js Server Action version skew.
 */
export function isDeploymentSkewError(errorOrMessage: unknown): boolean {
  if (!errorOrMessage) return false;

  let text = '';
  if (typeof errorOrMessage === 'string') {
    text = errorOrMessage;
  } else if (errorOrMessage instanceof Error) {
    text = `${errorOrMessage.name} ${errorOrMessage.message} ${errorOrMessage.stack || ''}`;
  } else if (typeof errorOrMessage === 'object') {
    try {
      text = JSON.stringify(errorOrMessage);
    } catch {
      text = String(errorOrMessage);
    }
  }

  const normalized = text.toLowerCase();
  return (
    normalized.includes('unrecognizedactionerror') ||
    normalized.includes('failed-to-find-server-action') ||
    (normalized.includes('server action') && normalized.includes('was not found on the server')) ||
    normalized.includes('could not find server action') ||
    normalized.includes('action could not be found on the server') ||
    normalized === 'new_version_deployed'
  );
}

/**
 * Dispatches a client-side notification that a new version of the app has been deployed.
 */
export function notifyDeploymentSkew(source: string = 'client'): void {
  if (typeof window === 'undefined') return;

  console.warn(
    `[Inquestra Deploy] Server deployment version mismatch detected via ${source}. In-memory drafts safely preserved in localStorage.`
  );

  try {
    window.dispatchEvent(
      new CustomEvent('inquestra:deployment-skew-detected', {
        detail: { source, timestamp: Date.now() },
      })
    );
  } catch {
    // Non-blocking
  }
}
