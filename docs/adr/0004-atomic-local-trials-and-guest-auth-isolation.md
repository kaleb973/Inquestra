# 0004. Atomic Local Trials & Guest Auth Isolation

Date: 2026-11-02

## Status

Accepted

## Context

Inquestra supports zero-login Local Notebook mode so researchers can immediately log wet-lab protocols without registering. Previously:
1. `setActiveTrial` assigned `cloudTrialId = trial.id` indiscriminately, fooling the application into believing local trials were cloud-synced, resulting in failed DB autosave calls and false "Unsaved changes" flags.
2. `LeftSidebar` maintained a diverging React state `trials` alongside Zustand's `localTrials` and evaluated guest mode through cached project counts, causing clicks on local trials to fall through to remote `getTrial` queries that failed with `Unauthorized`.
3. Newly created trials in guest mode failed to switch or persist on reload.

## Decision

1. **Explicit Supabase Auth Detection**: `LeftSidebar` monitors client auth state directly via Supabase browser client. When unauthenticated, any stale `cloudProjectId` or `cloudTrialId` in `localStorage` is purged.
2. **Dedicated Synchronous Local Switching**: Added `selectLocalTrial(id)` to `useNotebookStore.ts`. When in Local Notebook mode, trial selection executes synchronously with 0ms network latency.
3. **Strict Cloud ID Hygiene**: `setActiveTrial` only maintains `cloudTrialId` if the active workspace is explicitly authenticated (`state.cloudProjectId`).
4. **Deterministic Storage**: Local trials are serialized atomically to `localStorage`, guaranteeing `activeTrial` is always present in `localTrials`.

## Consequences

- Switching between trials in Local Notebook mode is instantaneous with 0ms latency.
- Page reloads preserve all created trials, titles, and note edits.
- The UI status indicator cleanly reads "Saved in browser" and "✓ Saved" without conflicting "Unsaved changes" warnings.
