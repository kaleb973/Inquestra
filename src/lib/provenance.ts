// src/lib/provenance.ts
// Phase 4 — SHA-256 cryptographic trial sealing engine.
// Called when Trial.status transitions ACTIVE → COMPLETED.
// Produces a deterministic, tamper-evident checksum stored in Trial.checksum.

import { createHash } from 'crypto';

export interface CanonicalTrialPayload {
  trialId: string;
  projectId: string;
  userId: string;
  contentJson: string;   // Deterministically stringified TipTap JSON
  metadata: { key: string; value: string }[];
  telemetryUrls: string[];
  sealedAt: string;      // ISO 8601 UTC timestamp
}

/**
 * Generates a SHA-256 hex digest from a canonically ordered TrialPayload.
 * Key ordering ensures identical payloads always produce identical hashes,
 * regardless of property insertion order (object key sort is deterministic).
 */
export function generateTrialChecksum(payload: CanonicalTrialPayload): string {
  // Sort keys so serialisation is deterministic across environments
  const canonicalString = JSON.stringify(payload, Object.keys(payload).sort() as (keyof CanonicalTrialPayload)[]);
  return createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Verifies a stored checksum against a reconstructed payload.
 * Returns true only if hashes match — any tamper causes false.
 */
export function verifyTrialChecksum(
  payload: CanonicalTrialPayload,
  storedChecksum: string
): boolean {
  const recomputed = generateTrialChecksum(payload);
  return recomputed === storedChecksum;
}
