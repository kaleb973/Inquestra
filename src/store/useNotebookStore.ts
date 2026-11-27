// src/store/useNotebookStore.ts
// Zustand high-frequency reactive state store for Inquestra.
// Uses atomic subscriptions so TipTap canvas never re-renders on telemetry appends.

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type {
  TelemetrySample,
  HardwareStatus,
  MetadataEntry,
  TrialDocument,
  TelemetryStats,
  SaveStatus,
  TrialSummaryItem,
  TrialStatus,
} from '@/types/inquestra';
import type { ProjectWithLead } from '@/actions/projectActions';

const BUFFER_MAX = 500;
const SESSION_ARCHIVE_MAX = 250_000;
const SESSION_ARCHIVE_TRIM_TARGET = 200_000;

export const STORAGE_QUOTA_ERROR =
  'Browser storage limit reached (~5 MB). Export your active trial as ZIP or JSON now to prevent data loss.';

let sessionTelemetryArchive: TelemetrySample[] = [];
let lastStorageWriteFailed = false;

/**
 * Returns a snapshot of all telemetry samples captured during the current session,
 * independent of the 500-point reactive chart buffer.
 */
export function getSessionTelemetry(): TelemetrySample[] {
  return [...sessionTelemetryArchive];
}

const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
      if (lastStorageWriteFailed) {
        lastStorageWriteFailed = false;
        queueMicrotask(() => {
          const state = useNotebookStore.getState();
          if (state.saveStatus === 'ERROR' && state.saveError === STORAGE_QUOTA_ERROR) {
            useNotebookStore.setState({ saveStatus: 'SAVED', saveError: null });
          }
        });
      }
    } catch (err: unknown) {
      lastStorageWriteFailed = true;
      const isQuotaError =
        err instanceof DOMException &&
        (err.name === 'QuotaExceededError' ||
          err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
          err.code === 22);
      const message = isQuotaError
        ? STORAGE_QUOTA_ERROR
        : 'Failed to save draft to browser storage. Export a backup copy now.';
      queueMicrotask(() => {
        const state = useNotebookStore.getState();
        if (state.saveStatus !== 'ERROR' || state.saveError !== message) {
          useNotebookStore.setState({ saveStatus: 'ERROR', saveError: message });
        }
      });
    }
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* no-op */
    }
  },
};

export const STARTER_PCR_CONTENT: Record<string, unknown> = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Standard PCR Amplification & Gel Electrophoresis' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'High-fidelity PCR amplification of a 1.2 kb target construct followed by analytical 1.0% agarose gel electrophoresis. Check off bench steps and trigger timers directly below.',
        },
      ],
    },
    {
      type: 'protocolBlock',
      attrs: {
        title: 'PCR Thermal Cycling Procedure',
        version: 1,
        steps: [
          {
            id: 'pcr-step-1',
            text: 'Initial Denaturation: Heat reaction mixture at 98°C for 30s',
            checked: false,
            checkedAt: null,
            deviation: null,
            timerDuration: 30,
          },
          {
            id: 'pcr-step-2',
            text: '30 Cycles: Denature at 98°C (10s), Anneal at 58°C (30s), Extend at 72°C (45s)',
            checked: false,
            checkedAt: null,
            deviation: null,
            timerDuration: 45,
          },
          {
            id: 'pcr-step-3',
            text: 'Final Extension: Incubate at 72°C for 2m to ensure full-length amplicons',
            checked: false,
            checkedAt: null,
            deviation: null,
            timerDuration: 120,
          },
          {
            id: 'pcr-step-4',
            text: 'Hold at 4°C and transfer to ice for gel loading',
            checked: false,
            checkedAt: null,
            deviation: null,
            timerDuration: null,
          },
        ],
      },
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Agarose Gel Electrophoresis (1.0%)' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Prepare 50 mL 1.0% agarose in 1X TAE buffer. Cast gel with 10-well comb. Mix 5 µL PCR product with 1 µL 6X Loading Dye and load alongside 1 kb Plus DNA Ladder. Run at 100V for 30 minutes.',
        },
      ],
    },
    {
      type: 'timerBlock',
      attrs: {
        duration: 1800,
        label: 'Gel Electrophoresis Run (100V, 30m)',
      },
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Observations & Imaging Notes' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Document band migration under blue light transilluminator. Confirm target band at 1.2 kb without non-specific primer-dimer artifacts.',
        },
      ],
    },
  ],
};

const makeDefaultTrial = (): TrialDocument => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2),
  title: 'Standard PCR Amplification & Gel Electrophoresis',
  content: STARTER_PCR_CONTENT,
  status: 'ACTIVE',
  metadata: [
    { id: 'meta-1', key: 'Organism', value: 'E. coli DH5α' },
    { id: 'meta-2', key: 'Polymerase', value: 'Q5 High-Fidelity' },
    { id: 'meta-3', key: 'Target Amplicon', value: '1.2 kb' },
  ],
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
  totalCount: 0,
  current: null,
  min: null,
  max: null,
};

// ─── State shape ───────────────────────────────────────────────────────────────

export type RightDrawerMode = 'TELEMETRY' | 'INVENTORY' | 'LITERATURE' | 'COMPLIANCE' | 'HISTORY';
export type AuthResolutionStatus = 'UNKNOWN' | 'GUEST' | 'AUTHENTICATED';

const initialStarterTrial = makeDefaultTrial();

function upsertTrialInList(list: TrialDocument[], updated: TrialDocument): TrialDocument[] {
  const exists = list.some((t) => t.id === updated.id);
  return exists
    ? list.map((t) => (t.id === updated.id ? updated : t))
    : [updated, ...list];
}

interface NotebookState {
  isLeftSidebarOpen: boolean;
  isRightDrawerOpen: boolean;
  rightDrawerMode: RightDrawerMode;
  activeTrial: TrialDocument;
  /** In-browser collection of local trials for guest mode (persisted in localStorage) */
  localTrials: TrialDocument[];
  /** Supabase-side UUID for the synced trial (null = never synced) */
  cloudTrialId: string | null;
  /** Supabase-side UUID for the auto-provisioned project */
  cloudProjectId: string | null;
  /** Global real-time save state */
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  saveError: string | null;
  isLoadingTrial: boolean;
  /** Transient flag set true once Zustand persist finishes client hydration */
  _hasHydrated: boolean;
  /** Transient auth session state so workspace masks guest drafts during auth checks */
  authStatus: AuthResolutionStatus;
  /** In-memory / persisted project and trial caches for instant zero-lag navigation */
  cachedProjects: ProjectWithLead[];
  cachedTrials: TrialSummaryItem[];
  /** Rolling window of the last BUFFER_MAX telemetry samples (transient, not persisted). */
  telemetryBuffer: TelemetrySample[];
  /** Derived stats recomputed on each append — cheap for subscribers to read. */
  telemetryStats: TelemetryStats;
  hardwareStatus: HardwareStatus;
}

interface NotebookActions {
  toggleLeftSidebar: () => void;
  toggleRightDrawer: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightDrawerOpen: (open: boolean) => void;
  setRightDrawerMode: (mode: RightDrawerMode) => void;
  setActiveTrial: (trial: TrialDocument) => void;
  selectLocalTrial: (id: string) => void;
  updateLocalTrialStatus: (id: string, status: TrialStatus) => void;
  updateTrialStatusEverywhere: (id: string, status: TrialStatus) => void;
  updateLocalTrialMetadata: (id: string, metadata: MetadataEntry[]) => void;
  setCloudIds: (ids: { cloudTrialId: string; cloudProjectId: string }) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setLastSavedAt: (time: string | null) => void;
  setSaveError: (error: string | null) => void;
  setIsLoadingTrial: (loading: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  setAuthStatus: (status: AuthResolutionStatus) => void;
  setCachedProjects: (projects: ProjectWithLead[]) => void;
  setCachedTrials: (trials: TrialSummaryItem[]) => void;
  addLocalTrial: (trial: TrialDocument) => void;
  deleteLocalTrial: (id: string) => void;
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
      isLeftSidebarOpen: true,
      isRightDrawerOpen: false,
      rightDrawerMode: 'TELEMETRY' as RightDrawerMode,
      activeTrial: initialStarterTrial,
      localTrials: [initialStarterTrial],
      cloudTrialId: null,
      cloudProjectId: null,
      saveStatus: 'SAVED' as SaveStatus,
      lastSavedAt: null,
      saveError: null,
      isLoadingTrial: false,
      _hasHydrated: false,
      authStatus: 'UNKNOWN' as AuthResolutionStatus,
      cachedProjects: [],
      cachedTrials: [],
      telemetryBuffer: [],
      telemetryStats: DEFAULT_STATS,
      hardwareStatus: DEFAULT_HARDWARE,

      toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),
      toggleRightDrawer: () => set((state) => ({ isRightDrawerOpen: !state.isRightDrawerOpen })),
      setLeftSidebarOpen: (open) => set({ isLeftSidebarOpen: open }),
      setRightDrawerOpen: (open) => set({ isRightDrawerOpen: open }),
      setRightDrawerMode: (mode) => set({ rightDrawerMode: mode, isRightDrawerOpen: true }),
      setCachedProjects: (projects) => set({ cachedProjects: projects }),
      setCachedTrials: (trials) => set({ cachedTrials: trials }),
      setActiveTrial: (trial) =>
        set((state) => ({
          activeTrial: trial,
          cloudTrialId: state.cloudProjectId ? trial.id : null,
          saveStatus: 'SAVED',
          saveError: null,
          isLoadingTrial: false,
          lastSavedAt: trial.updatedAt || new Date().toISOString(),
        })),

      selectLocalTrial: (id) =>
        set((state) => {
          const found = state.localTrials.find((t) => t.id === id);
          if (!found) return state;
          return {
            activeTrial: found,
            cloudTrialId: null,
            saveStatus: 'SAVED',
            saveError: null,
            isLoadingTrial: false,
            lastSavedAt: found.updatedAt || new Date().toISOString(),
          };
        }),

      updateLocalTrialStatus: (id, status) =>
        set((state) => {
          const now = new Date().toISOString();
          const updated = state.localTrials.map((t) =>
            t.id === id ? { ...t, status, updatedAt: now } : t
          );
          const updatedActive =
            state.activeTrial.id === id
              ? { ...state.activeTrial, status, updatedAt: now }
              : state.activeTrial;
          const updatedCached = state.cachedTrials.map((t) =>
            t.id === id ? { ...t, status, updatedAt: now } : t
          );
          return {
            localTrials: updated,
            activeTrial: updatedActive,
            cachedTrials: updatedCached,
            saveStatus: 'SAVED',
          };
        }),

      updateTrialStatusEverywhere: (id, status) =>
        set((state) => {
          const now = new Date().toISOString();
          const updatedActive =
            state.activeTrial.id === id
              ? { ...state.activeTrial, status, updatedAt: now }
              : state.activeTrial;
          const updatedLocal = state.localTrials.map((t) =>
            t.id === id ? { ...t, status, updatedAt: now } : t
          );
          const updatedCached = state.cachedTrials.map((t) =>
            t.id === id ? { ...t, status, updatedAt: now } : t
          );
          return {
            activeTrial: updatedActive,
            localTrials: updatedLocal,
            cachedTrials: updatedCached,
          };
        }),

      updateLocalTrialMetadata: (id, metadata) =>
        set((state) => {
          const now = new Date().toISOString();
          const updated = state.localTrials.map((t) =>
            t.id === id ? { ...t, metadata, updatedAt: now } : t
          );
          const updatedActive =
            state.activeTrial.id === id
              ? { ...state.activeTrial, metadata, updatedAt: now }
              : state.activeTrial;
          return {
            localTrials: updated,
            activeTrial: updatedActive,
            saveStatus: 'SAVED',
          };
        }),

      setCloudIds: ({ cloudTrialId, cloudProjectId }) =>
        set({ cloudTrialId, cloudProjectId }),

      setSaveStatus: (status) => set({ saveStatus: status }),
      setLastSavedAt: (time) => set({ lastSavedAt: time }),
      setSaveError: (error) => set({ saveError: error }),
      setIsLoadingTrial: (loading) => set({ isLoadingTrial: loading }),
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setAuthStatus: (status) => set({ authStatus: status }),

      appendTelemetry: (point) =>
        set((state) => {
          const incoming = Array.isArray(point) ? point : [point];
          if (incoming.length > 0) {
            sessionTelemetryArchive.push(...incoming);
            if (sessionTelemetryArchive.length > SESSION_ARCHIVE_MAX) {
              sessionTelemetryArchive = sessionTelemetryArchive.slice(-SESSION_ARCHIVE_TRIM_TARGET);
            }
          }
          const next = [...state.telemetryBuffer, ...incoming].slice(-BUFFER_MAX);
          const values = next.map((p) => p.value);
          const last = values[values.length - 1];
          return {
            telemetryBuffer: next,
            telemetryStats: {
              bufferCount: next.length,
              totalCount: sessionTelemetryArchive.length,
              current: last ?? null,
              min: values.length > 0 ? Math.min(...values) : null,
              max: values.length > 0 ? Math.max(...values) : null,
            },
          };
        }),

      addLocalTrial: (trial) =>
        set((state) => ({
          localTrials: upsertTrialInList(state.localTrials, trial),
          activeTrial: trial,
          cloudTrialId: null,
          saveStatus: 'SAVED',
          saveError: null,
          isLoadingTrial: false,
          lastSavedAt: new Date().toISOString(),
        })),

      deleteLocalTrial: (id) =>
        set((state) => {
          const remaining = state.localTrials.filter((t) => t.id !== id);
          const nextActive = remaining.length > 0 ? remaining[0] : makeDefaultTrial();
          return {
            localTrials: remaining.length > 0 ? remaining : [nextActive],
            activeTrial: nextActive,
            cloudTrialId: null,
          };
        }),

      updateContent: (json) =>
        set((state) => {
          const now = new Date().toISOString();
          const updatedActive: TrialDocument = {
            ...state.activeTrial,
            content: json,
            updatedAt: now,
          };
          return {
            activeTrial: updatedActive,
            localTrials: upsertTrialInList(state.localTrials, updatedActive),
            saveStatus: state.cloudTrialId ? 'UNSAVED' : 'SAVED',
            lastSavedAt: now,
          };
        }),

      updateTitle: (title) =>
        set((state) => {
          const now = new Date().toISOString();
          const updatedActive: TrialDocument = {
            ...state.activeTrial,
            title,
            updatedAt: now,
          };
          const updatedCached = state.cachedTrials.map((t) =>
            t.id === updatedActive.id ? { ...t, title, updatedAt: now } : t
          );
          return {
            activeTrial: updatedActive,
            localTrials: upsertTrialInList(state.localTrials, updatedActive),
            cachedTrials: updatedCached,
            saveStatus: state.cloudTrialId ? 'UNSAVED' : 'SAVED',
            lastSavedAt: now,
          };
        }),

      setHardwareStatus: (status) =>
        set((state) => ({
          hardwareStatus: { ...state.hardwareStatus, ...status },
        })),

      addMetadata: (entry) =>
        set((state) => {
          const now = new Date().toISOString();
          const updatedActive: TrialDocument = {
            ...state.activeTrial,
            metadata: [...state.activeTrial.metadata, entry],
            updatedAt: now,
          };
          return {
            activeTrial: updatedActive,
            localTrials: upsertTrialInList(state.localTrials, updatedActive),
            saveStatus: state.cloudTrialId ? 'UNSAVED' : 'SAVED',
          };
        }),

      removeMetadata: (id) =>
        set((state) => {
          const now = new Date().toISOString();
          const updatedActive: TrialDocument = {
            ...state.activeTrial,
            metadata: state.activeTrial.metadata.filter((m) => m.id !== id),
            updatedAt: now,
          };
          return {
            activeTrial: updatedActive,
            localTrials: upsertTrialInList(state.localTrials, updatedActive),
            saveStatus: state.cloudTrialId ? 'UNSAVED' : 'SAVED',
          };
        }),

      resetTelemetry: () => {
        sessionTelemetryArchive = [];
        set({ telemetryBuffer: [], telemetryStats: DEFAULT_STATS });
      },
    }),
    {
      name: 'inquestra-notebook-v1',
      storage: createJSONStorage(() => safeLocalStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Persist document + cloud IDs + lastSavedAt + project/trial caches for instant 0ms restoration
      partialize: (state) => {
        const localTrials = upsertTrialInList(state.localTrials, state.activeTrial);
        return {
          activeTrial: state.activeTrial,
          localTrials,
          cloudTrialId: state.cloudProjectId ? state.cloudTrialId : null,
          cloudProjectId: state.cloudProjectId,
          lastSavedAt: state.lastSavedAt,
          cachedProjects: state.cachedProjects,
          cachedTrials: state.cachedTrials,
          isLeftSidebarOpen: state.isLeftSidebarOpen,
          isRightDrawerOpen: state.isRightDrawerOpen,
        };
      },
    }
  )
);
