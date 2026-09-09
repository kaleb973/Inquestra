// src/types/inquestra.ts
// Strictly-typed data contracts for Inquestra Phase 1
// All hardware payloads, API responses, and store shapes must satisfy these types.

export type TrialStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "FAILED";

export interface TelemetrySample {
  timestamp: number;       // Unix epoch ms
  value: number;
  sensorId?: string;
  unit?: string;
}

export interface HardwareStatus {
  isConnected: boolean;
  portName: string | null;
  baudRate: number;
  packetsPerSec: number;
  totalBytes: number;
  isSimulated: boolean;
}

export interface MetadataEntry {
  id: string;
  key: string;
  value: string;
}

export interface TrialDocument {
  id: string;
  title: string;
  content: Record<string, unknown>; // TipTap ProseMirror JSON
  status: TrialStatus;
  metadata: MetadataEntry[];
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
  checksum?: string | null;
  sealedAt?: string | null;
  sealedBy?: string | null;
}

/**
 * Derived statistics computed by the store from telemetryBuffer.
 * Subscribers should prefer this over the raw buffer to avoid high-freq re-renders.
 */
export interface TelemetryStats {
  bufferCount: number;
  current: number | null;
  min: number | null;
  max: number | null;
}
