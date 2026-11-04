# Phase 5 Implementation Plan: Multi-Trial, Exports, Reagent UI, & Linear-Style Polish

## Goal
Implement a robust multi-trial save/load system using PostgreSQL, build data export functionality (PDF/HTML), refine the Reagent TipTap node UI, and overhaul the application's aesthetic to mimic modern top-tier SaaS (like Linear and Vercel) instead of looking "AI generated".

## Proposed Changes

### 1. Modern SaaS UI Polish (Linear/Vercel Aesthetic)
- **Globals & Layout**: 
  - Update `globals.css` with a refined color palette (zinc/slate instead of neutral), customized scrollbars, and modern typography (using Geist or Inter with tight tracking).
  - Add frosted glass effects (`backdrop-blur`) to headers and overlays.
- **Marketing Page (`src/app/(marketing)/page.tsx`)**:
  - Replace the heavy gradient background with a subtle, dark grid or mesh gradient.
  - Refine buttons with inner shadows, tight borders, and glowing hover states.
  - Make feature cards use subtle radial gradients on hover.
- **App Workspace**:
  - Update the sidebar and header to use slightly translucent backgrounds and tight, crisp borders.

### 2. Database Adjustments & JIT Provisioning
#### [MODIFY] `src/actions/authActions.ts`
- Ensure that when a new Organization is provisioned, a default `Project` (e.g., "Default Workspace") is also created. This guarantees that new trials have a valid `projectId`.

### 3. Multi-Trial Support
#### [NEW] `src/actions/trialActions.ts`
- Create server actions: `getTrials()`, `createTrial()`, `updateTrial(id, data)`, `deleteTrial(id)`.
- Use the user's ID to fetch the default project.

#### [MODIFY] `src/store/useNotebookStore.ts`
- Add actions for switching active trials, fetching trials from the server, and syncing the active trial's TipTap JSON up to PostgreSQL automatically via debounced calls.

#### [MODIFY] `src/components/layout/LeftSidebar.tsx`
- Replace the static placeholder lab and dummy trial with a live list fetched from `useNotebookStore`.
- Add a "New Trial" button that hits `createTrial()` and immediately opens it in the canvas.

#### [MODIFY] `src/components/canvas/EditorCanvas.tsx`
- Tie the TipTap `editor` content to the specific `trialId`. When the active trial changes, the editor must reset its content.

### 4. Reagent Node UI Tweaks
#### [MODIFY] `src/components/editor/nodes/ReagentNode.tsx`
- Instead of a plain border box, style the Reagent block to look like a Notion/Linear embedded widget.
- Use an elegant icon, small uppercase labels, and a sleek dropdown for the chemical selector.

### 5. Data Exporting
#### [NEW] `src/components/canvas/ExportMenu.tsx` (or update Header)
- Use standard browser `window.print()` triggered via a button that injects a print stylesheet, generating a clean PDF of the experimental record.

## Verification Plan
1. **Automated / Build**: Run `next build` to verify no TS issues.
2. **Manual Check**:
   - Verify that logging in creates a Project if one doesn't exist.
   - Verify that trials can be created, switched between, and auto-saved to Postgres.
   - Verify the Reagent node looks polished.
   - Verify the marketing and app UI aesthetics resemble Linear/Vercel.
