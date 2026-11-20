// src/lib/provenance.ts
// SHA-256 cryptographic trial sealing engine.
// Called when Trial.status transitions ACTIVE → COMPLETED or when electronically signed.
// Produces a deterministic, tamper-evident checksum stored in Trial.checksum.
// Provides cryptographic integrity verification for unalterable electronic research records.

import { createHash } from 'crypto';

export interface CanonicalTrialPayload {
  trialId: string;
  projectId?: string;
  userId?: string;
  title?: string;
  content: unknown;      // TipTap ProseMirror JSON or stringified representation
  metadata: { key: string; value: string }[];
  telemetryUrls?: string[];
  sealedAt: string;      // ISO 8601 UTC timestamp
}

/**
 * Deterministically stringifies any JavaScript value by recursively sorting object keys.
 * Arrays preserve their positional ordering.
 * Neutralizes property insertion order differences across Node/V8 runtimes.
 */
export function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalStringify(item)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const entries = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`
  );

  return `{${entries.join(',')}}`;
}

/**
 * Generates a SHA-256 hex digest from a canonical trial payload.
 * Deep key sorting guarantees that identical content always yields identical hashes,
 * regardless of runtime key order or serialization timing.
 */
export function generateTrialChecksum(payload: CanonicalTrialPayload): string {
  const normalized: Record<string, unknown> = {
    trialId: payload.trialId,
    content: payload.content,
    metadata: payload.metadata,
    sealedAt: payload.sealedAt,
  };

  if (payload.projectId) normalized.projectId = payload.projectId;
  if (payload.userId) normalized.userId = payload.userId;
  if (payload.title) normalized.title = payload.title;
  if (payload.telemetryUrls) normalized.telemetryUrls = payload.telemetryUrls;

  const canonicalString = canonicalStringify(normalized);
  return createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Legacy/Simple hash helper for quick verification across compliance modules.
 * Strictly typed (no `any`), uses canonical key-sorting.
 */
export function generateTrialHash(
  content: unknown,
  metadata: { key: string; value: string }[] | unknown,
  timestamp: string
): string {
  const canonicalString = canonicalStringify({ content, metadata, timestamp });
  return createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Verifies a stored checksum against a reconstructed payload.
 * Returns true only if hashes match; any tampering returns false.
 */
export function verifyTrialChecksum(
  payload: CanonicalTrialPayload,
  storedChecksum: string
): boolean {
  const recomputed = generateTrialChecksum(payload);
  return recomputed === storedChecksum;
}
