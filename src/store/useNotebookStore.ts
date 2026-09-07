// src/store/useNotebookStore.ts
// Zustand high-frequency reactive state store for Inquestra.
// Uses atomic subscriptions so TipTap canvas never re-renders on telemetry appends.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  TelemetrySample,
  HardwareStatus,
  MetadataEntry,
  TrialDocument,
  TelemetryStats,
} from '@/types/inquestra';

const BUFFER_MAX = 500;

const makeDefaultTrial = (): TrialDocument => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  title: 'Untitled Trial',
  content: {},
  status: 'DRAFT',
  metadata: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const DEFAULT_HARDWARE: HardwareStatus = {
  isConnected: false,
  portName: null,
  baudRate: 115200,
  packetsPerSec: 0,
  totalBytes: 0,
  isSimulated: false,
};

const DEFAULT_STATS: TelemetryStats = {
  bufferCount: 0,
  current: null,
  min: null,
  max: null,
};

// ─── State shape ───────────────────────────────────────────────────────────────

interface NotebookState {
  activeTrial: TrialDocument;
  /** Supabase-side UUID for the synced trial (null = never synced) */
  cloudTrialId: string | null;
  /** Supabase-side UUID for the auto-provisioned project */
  cloudProjectId: string | null;
  /** Rolling window of the last BUFFER_MAX telemetry samples (transient, not persisted). */
  telemetryBuffer: TelemetrySample[];
  /** Derived stats recomputed on each append — cheap for subscribers to read. */
  telemetryStats: TelemetryStats;
  hardwareStatus: HardwareStatus;
}

interface NotebookActions {
  setActiveTrial: (trial: TrialDocument) => void;
  setCloudIds: (ids: { cloudTrialId: string; cloudProjectId: string }) => void;
  /**
   * Append one or many samples to the rolling buffer (cap: BUFFER_MAX).
   * Also recomputes telemetryStats in the same set() call.
   */
  appendTelemetry: (point: TelemetrySample | TelemetrySample[]) => void;
  /** Debounced-persisted update of the active TipTap document JSON. */
  updateContent: (json: Record<string, unknown>) => void;
  updateTitle: (title: string) => void;
  setHardwareStatus: (status: Partial<HardwareStatus>) => void;
  addMetadata: (entry: MetadataEntry) => void;
  removeMetadata: (id: string) => void;
  resetTelemetry: () => void;
}

type NotebookStore = NotebookState & NotebookActions;

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useNotebookStore = create<NotebookStore>()(
  persist(
    (set) => ({
      activeTrial: makeDefaultTrial(),
      cloudTrialId: null,
      cloudProjectId: null,
      telemetryBuffer: [],
      telemetryStats: DEFAULT_STATS,
      hardwareStatus: DEFAULT_HARDWARE,

      setActiveTrial: (trial) => set({ activeTrial: trial }),

      setCloudIds: ({ cloudTrialId, cloudProjectId }) =>
        set({ cloudTrialId, cloudProjectId }),

      appendTelemetry: (point) =>
        set((state) => {
          const incoming = Array.isArray(point) ? point : [point];
          const next = [...state.telemetryBuffer, ...incoming].slice(-BUFFER_MAX);
          const values = next.map((p) => p.value);
          const last = values[values.length - 1];
          return {
            telemetryBuffer: next,
            telemetryStats: {
              bufferCount: next.length,
              current: last ?? null,
              min: values.length > 0 ? Math.min(...values) : null,
              max: values.length > 0 ? Math.max(...values) : null,
            },
          };
        }),

      updateContent: (json) =>
        set((state) => ({
          activeTrial: {
            ...state.activeTrial,
            content: json,
            updatedAt: new Date().toISOString(),
          },
        })),

      updateTitle: (title) =>
        set((state) => ({
          activeTrial: {
            ...state.activeTrial,
            title,
            updatedAt: new Date().toISOString(),
          },
        })),

      setHardwareStatus: (status) =>
        set((state) => ({
          hardwareStatus: { ...state.hardwareStatus, ...status },
        })),

      addMetadata: (entry) =>
        set((state) => ({
          activeTrial: {
            ...state.activeTrial,
            metadata: [...state.activeTrial.metadata, entry],
            updatedAt: new Date().toISOString(),
          },
        })),

      removeMetadata: (id) =>
        set((state) => ({
          activeTrial: {
            ...state.activeTrial,
            metadata: state.activeTrial.metadata.filter((m) => m.id !== id),
            updatedAt: new Date().toISOString(),
          },
        })),

      resetTelemetry: () =>
        set({ telemetryBuffer: [], telemetryStats: DEFAULT_STATS }),
    }),
    {
      name: 'inquestra-notebook-v1',
      storage: createJSONStorage(() => localStorage),
      // Persist document + cloud IDs — hardware status and telemetry are transient.
      partialize: (state) => ({
        activeTrial: state.activeTrial,
        cloudTrialId: state.cloudTrialId,
        cloudProjectId: state.cloudProjectId,
      }),
    }
  )
);
