# Inquestra System Architecture

This document provides an overview of the architectural design, data flow, and subsystems powering **Inquestra**.

---

## 1. High-Level Architecture

Inquestra is designed around a **local-first, privacy-preserving, hybrid architecture**:

```mermaid
graph TD
    subgraph Browser ["Client Browser (Air-Gapped Sandbox)"]
        UI["Next.js App Router UI<br/>(Tailwind + Shadcn)"]
        Canvas["TipTap v3 Block Canvas<br/>(Custom NodeViews)"]
        Zustand["Zustand Reactive Store<br/>(State & Telemetry Buffer)"]
        Storage["Browser Storage<br/>(IndexedDB / localStorage)"]
        WebSerial["Web Serial API<br/>(navigator.serial)"]
        ProvEngine["SHA-256 Provenance<br/>(Crypto Hash & Sealing)"]

        WebSerial -->|High-speed serial stream| Zustand
        Canvas <-->|State bindings| Zustand
        Zustand <-->|Local sync| Storage
        Zustand -->|Snapshot on seal| ProvEngine
    end

    subgraph Hardware ["Physical Benchtop Instruments"]
        MCU["Microcontrollers & Sensors<br/>(Arduino / ESP32 / DAQ / Balances)"]
        MCU -->|USB-CDC / Serial 115200| WebSerial
    end

    subgraph Cloud ["Optional Cloud Persistence Layer"]
        ServerActions["Next.js Server Actions<br/>(Zod Validated)"]
        Auth["Supabase Auth<br/>(Session & JWT)"]
        DB[(PostgreSQL + RLS<br/>Prisma ORM)]
        R2["Cloudflare R2<br/>(S3-compatible, $0 egress)"]

        Zustand -.->|Cloud Sync (Optional)| ServerActions
        ServerActions --> Auth
        ServerActions --> DB
        ServerActions --> R2
    end
```

---

## 2. Core Subsystems

### A. TipTap v3 Block Canvas
The primary research canvas is implemented with [TipTap v3](https://tiptap.dev/) (`src/components/canvas/EditorCanvas.tsx`), providing an extensible, block-based rich text editor:
- **Custom NodeViews (`src/components/editor/nodes/`)**:
  - `MoleculeNode`: Renders 2D chemical structures from SMILES or IUPAC names via PubChem.
  - `SequenceNode`: Real-time DNA/RNA GC% and melting temperature ($T_m$) calculators.
  - `InteractiveChartNode`: Inline zoomable charts for CSV telemetry streams and live sensor DAQ.
  - `ProtocolBlock`: Checklist items with timestamps, deviation tracking, and timer bindings.
  - `CitationNode`: Resolves literature metadata via Europe PMC and PubMed.
  - `MathNode`: Inline and display LaTeX equations evaluated with KaTeX.

### B. Native Web Serial DAQ (`navigator.serial`)
Hardware telemetry is captured directly inside the browser using the W3C Web Serial API (`src/hooks/useWebSerial.ts`):
- Connects directly to microcontrollers, pH meters, scales, and potentiostats over USB-CDC without requiring native desktop drivers or Python daemons.
- Reads line-delimited serial packets at 115,200 baud using `TextDecoderStream`.
- Streams parsed readings into a bounded ring buffer in Zustand (`src/store/useNotebookStore.ts`), decoupling chart rendering from UI thread execution.

### C. Local-First & Air-Gapped Persistence
- Unauthenticated guest mode stores notes, protocol state, and hardware profiles entirely within browser `localStorage` and IndexedDB.
- Guarantees zero unvetted cloud transmission for unpublished intellectual property.
- Full offline session export and import via sanitized JSON/CSV packages.

### D. Cryptographic Provenance & Technical Controls
- **SHA-256 Record Sealing (`src/lib/provenance.ts`)**: When an experiment is locked, Inquestra computes a SHA-256 digest across the canvas content, timestamps, and author metadata.
- **Audit Trails**: Appends timestamped events (`SIGNED`, `SEALED`, `EXPORTED`) to maintain a tamper-evident chain of custody.

### E. Cloud Synchronization & Multi-Tenant Isolation (Optional)
- When cloud backup is enabled, state transitions sync via Next.js Server Actions (`src/actions/`).
- Database mutations run through Prisma ORM (`prisma/schema.prisma`) backed by PostgreSQL.
- PostgreSQL Row-Level Security (RLS) policies (`prisma/rls.sql`) enforce multi-tenant organization and lab boundaries.

---

## 3. Directory Structure

```
Inquestra/
├── .github/                  # Community workflows, issue templates & PR config
│   ├── ISSUE_TEMPLATE/       # Bug report & feature request forms
│   └── workflows/ci.yml      # Automated GitHub Actions CI pipeline
├── docs/                     # Architectural documentation & developer guides
│   ├── ARCHITECTURE.md       # High-level architecture and subsystem map
│   └── README.md             # Documentation directory overview
├── prisma/                   # Database schema & migrations
│   ├── schema.prisma         # Data models (Trial, Signature, AuditLog, Inventory)
│   └── rls.sql               # PostgreSQL Row-Level Security policies
├── public/                   # Static assets, icons, and RFC 9116 security.txt
├── src/
│   ├── actions/              # Next.js Server Actions (Auth, Trials, Protocols, Reagents)
│   ├── app/                  # Next.js App Router (Marketing & Workspace routes)
│   │   ├── (marketing)/      # Public pages (/about, /architecture, /compare, /demo, /faq)
│   │   └── app/              # Authenticated & guest research workspace (/app)
│   ├── components/           # Reusable UI & Scientific Components
│   │   ├── admin/            # Inventory, equipment, and lab settings
│   │   ├── canvas/           # TipTap editor canvas, slash menus, context menus
│   │   ├── editor/           # Custom TipTap NodeViews & formatting tools
│   │   ├── hardware/         # Web Serial control panel & live monitors
│   │   ├── literature/       # Europe PMC paper search & citation importer
│   │   └── ui/               # Base UI primitives (buttons, dialogs, inputs)
│   ├── hooks/                # React hooks (useWebSerial, useTelemetrySim)
│   ├── lib/                  # Utilities, provenance hashing, sanitization, Supabase client
│   ├── store/                # Zustand client stores (useNotebookStore, useAuthStore)
│   └── types/                # Strict TypeScript interfaces & hardware schemas
├── CONTRIBUTING.md           # Contributor guide & development setup
├── LICENSE                   # MIT Open Source License
├── package.json              # Dependencies and build scripts
├── README.md                 # Project landing page & quickstart
├── ROADMAP.md                # Feature roadmap & upcoming milestones
└── SECURITY.md               # Vulnerability reporting & security policy
```
