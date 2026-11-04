# Inquestra — Master Architectural Roadmap & AI Execution Guide

**Platform:** Inquestra (`inquestra.org` / `app.inquestra.org`)  
**Repository:** Local Inquestra Workspace  
**Status:** All 4 Development Phase PRDs Fully Specified  

---

## 🗺️ The 4-Phase Implementation Map

| Phase | Milestone Name | PRD Specification | Key Deliverables |
| :---: | :--- | :--- | :--- |
| **1** | **Local-First Core & Web Serial DAQ** | [`PHASE_1_PRD.md`](file:///c:/Users/khail/OneDrive/Documents/Inquestra/docs/PHASE_1_PRD.md) | Next.js 15, TipTap v3, Zustand, Web Serial API (`navigator.serial`), Recharts NodeView, Telemetry Simulator. |
| **2** | **Supabase Auth, PostgreSQL RLS & Cloud Persistence** | [`PHASE_2_PRD.md`](file:///c:/Users/khail/OneDrive/Documents/Inquestra/docs/PHASE_2_PRD.md) | Prisma ORM Schema, Next.js Server Actions + Zod, Supabase Auth, PostgreSQL Row-Level Security (RLS). |
| **3** | **Smart CSV Engine & Cloudflare R2 Storage** | [`PHASE_3_PRD.md`](file:///c:/Users/khail/OneDrive/Documents/Inquestra/docs/PHASE_3_PRD.md) | Cloudflare R2 (S3-compatible, **$0 egress**), Drag-and-drop PapaParse CSV streaming, interactive inline charts. |
| **4** | **Enterprise B2B SaaS, Cryptographic Provenance & MCP** | [`PHASE_4_PRD.md`](file:///c:/Users/khail/OneDrive/Documents/Inquestra/docs/PHASE_4_PRD.md) | SHA-256 Checksum Engine, Web Worker Protocol Timers, Autonomous Reagent Deduct, Model Context Protocol (MCP), Stripe. |

---

## 🚀 How to Prompt Claude Sonnet (or any AI) in a Fresh Chat

To avoid the `application/pdf` MIME error when switching to Claude Sonnet, simply open a **new chat session** and paste the exact prompt below:

```text
I am building Inquestra (inquestra.org), an enterprise-grade Data Acquisition (DAQ) and Electronic Research Notebook (ERN) for Life Sciences, Chemistry, Biotech, and Engineering.

The complete architectural specifications have been written to the repository docs:
- Phase 1: docs/PHASE_1_PRD.md
- Phase 2: docs/PHASE_2_PRD.md
- Phase 3: docs/PHASE_3_PRD.md
- Phase 4: docs/PHASE_4_PRD.md

Please read `docs/PHASE_1_PRD.md` and begin executing Phase 1:
1. Scaffold the Next.js 15 App Router project with TypeScript strict mode and Tailwind CSS.
2. Install the required dependencies (@tiptap/react, @tiptap/starter-kit, zustand, recharts, lucide-react).
3. Build the 3-column scientific research workspace layout.
4. Implement the `useWebSerial` hook and offline synthetic telemetry simulator.
5. Create the TipTap canvas with the inline `InteractiveChartNode` NodeView.
```

---

## 🔒 Cloudflare Integration Details
- **Apex Domain:** `inquestra.org` (Marketing / Documentation)
- **App Subdomain:** `app.inquestra.org` (Authenticated DAQ Canvas)
- **Object Storage:** Cloudflare R2 (zero egress fees, replaces AWS S3)
- **Edge Routing:** Cloudflare Hyperdrive for edge PostgreSQL acceleration
