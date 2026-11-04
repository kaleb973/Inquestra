# Product Requirements Document (PRD)
## Inquestra — Phase 4: Enterprise B2B SaaS, Cryptographic Provenance & Autonomous Logistics

**Project:** Inquestra (`inquestra.org`)  
**Phase:** 4 of 4  
**Target Milestone:** Institutional Commercialization, NIH FAIR Compliance, Autonomous Inventory, and MCP AI  
**Audience:** Solo Developer / Antigravity CLI / AI Pair Programmer  
**Status:** Ready for Execution  

---

## 1. Executive Summary & Objectives

Phase 4 elevates Inquestra from a technical tool into a commercial B2B platform ready for institutional deployment in university research centers (e.g., UNC Charlotte CBES) and commercial biotech labs.

### Core Deliverables
1. **Cryptographic Checksum Engine (SHA-256):** Mathematically proves data immutability and patent defense upon trial completion.
2. **Autonomous Logistics & Reagent Deduct:** Automatic chemical inventory deduction via notebook slash commands (`/reagent 50mL Ethanol`).
3. **Web Worker Protocol Timers:** Background threads ensuring zero-drift incubation timing and desktop notifications even when tabs are throttled.
4. **Institutional Command Dashboard:** PI view for managing team roles (PI, Admin, Researcher, Viewer) and laboratory audit metrics.
5. **Model Context Protocol (MCP) Integration:** Enables AI to query historical LIMS datasets using natural language.
6. **Stripe Billing Integration:** Tiered subscriptions (Free Open-Core, Pro $15/user/mo, Enterprise $5,000+/yr).

---

## 2. Feature Specifications

### 2.1 Feature 1: Cryptographic Checksum Engine (`src/lib/provenance.ts`)
When a trial status shifts from `ACTIVE` to `COMPLETED`, the server seals the trial:
1. Canonicalizes TipTap JSON state, metadata array, user ID, and telemetry R2 URLs into a deterministic string.
2. Generates a SHA-256 hash using Node.js `crypto`.
3. Commits the hash to `Trial.checksum` in PostgreSQL. Any subsequent attempt to tamper with the document or metadata causes verification failure.

```typescript
import crypto from "crypto";

export interface CanonicalTrialPayload {
  trialId: string;
  projectId: string;
  userId: string;
  contentJson: string; // Deterministically stringified
  metadata: { key: string; value: string }[];
  telemetryUrls: string[];
  sealedAt: string;
}

export function generateTrialChecksum(payload: CanonicalTrialPayload): string {
  const canonicalString = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash("sha256").update(canonicalString).digest("hex");
}
```

### 2.2 Feature 2: Autonomous Reagent Inventory Deduction
- Implements slash command `/reagent` in TipTap.
- Example prompt in editor: `/reagent 50mL Ethanol`
- A background state-listener extracts:
  - Chemical Name: `Ethanol`
  - Quantity: `50`
  - Unit: `mL`
- Dispatches a silent mutation to the `Inventory` table in PostgreSQL.
- If current stock drops below `thresholdValue`, an alert flag is set for procurement.

### 2.3 Feature 3: Web Worker Timer Grid (`src/workers/timerWorker.ts`)
Browsers throttle `setTimeout` down to 1 execution per minute in inactive background tabs. To maintain strict laboratory incubation protocols and reaction step timers, timers run in an isolated Web Worker:

```typescript
// src/workers/timerWorker.ts
interface TimerMessage {
  command: "START" | "PAUSE" | "RESET";
  durationSeconds: number;
}

let intervalId: NodeJS.Timeout | null = null;
let remaining: number = 0;

self.onmessage = (e: MessageEvent<TimerMessage>) => {
  if (e.data.command === "START") {
    remaining = e.data.durationSeconds;
    if (intervalId) clearInterval(intervalId);

    intervalId = setInterval(() => {
      remaining -= 1;
      self.postMessage({ type: "TICK", remaining });

      if (remaining <= 0) {
        if (intervalId) clearInterval(intervalId);
        self.postMessage({ type: "EXPIRED" });
      }
    }, 1000);
  } else if (e.data.command === "PAUSE" && intervalId) {
    clearInterval(intervalId);
  }
};
```
- When `EXPIRED` is received, the main thread triggers the native browser `Notification` API to alert the researcher even if the browser is minimized.

### 2.4 Feature 4: Model Context Protocol (MCP) Unification
- Inquestra acts as an **MCP Client** communicating over JSON-RPC 2.0.
- Connects to laboratory MCP database servers (e.g. MCP Toolbox for Databases).
- Researchers can type natural language in Inquestra:
  > *"Query all flow cytometry runs from 2025 where incubation temp was > 37.0°C."*
- The LLM constructs an MCP tool execution request, queries the LIMS, and drops the retrieved dataset straight into the TipTap canvas as an interactive chart.

---

## 3. SaaS Monetization & Stripe Gates

```
+---------------------------------------------------------------------------------+
| TIER             | TARGET AUDIENCE         | PRICE          | GATED FEATURES    |
+---------------------------------------------------------------------------------+
| Free Open-Core   | Solo Students & Hackers | $0             | Local storage,    |
|                  |                         |                | Web Serial DAQ    |
+---------------------------------------------------------------------------------+
| Pro Tier         | Small Lab Teams (3-10)  | $15/user/mo    | Cloud persistence,|
|                  |                         |                | 100GB R2 storage  |
+---------------------------------------------------------------------------------+
| Enterprise       | Departments & Pharma R&D| $5,000+/yr     | SSO, SHA-256 seal,|
|                  |                         |                | FAIR audit export |
+---------------------------------------------------------------------------------+
```

---

## 4. Implementation Checklist

- [ ] Implement SHA-256 canonical hashing utility and hook into trial status update Server Action.
- [ ] Build `/reagent` TipTap slash command and PostgreSQL `Inventory` schema.
- [ ] Deploy Web Worker timer engine with browser system notification integration.
- [ ] Implement PI Admin Dashboard (`/admin`) with role management and audit logs.
- [ ] Add Stripe Checkout and Customer Portal integration (`@stripe/stripe-js`, `stripe`).
- [ ] Connect MCP Client layer for natural-language laboratory database querying.
