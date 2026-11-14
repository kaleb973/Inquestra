# Inquestra — Master Architectural Roadmap

**Platform:** Inquestra (`inquestra.org` / `app.inquestra.org`)  
**Architecture:** Next.js 15 App Router, TypeScript (Strict), Tailwind CSS, PostgreSQL / Prisma ORM, Cloudflare R2  
**Status:** Multi-Phase Architecture Fully Specified  

---

## 🗺️ The 4-Phase Implementation Map

| Phase | Milestone Name | Specification | Key Deliverables |
| :---: | :--- | :--- | :--- |
| **1** | **Local-First Core & Web Serial DAQ** | [`PHASE_1_PRD.md`](file:///c:/Users/khail/OneDrive/Documents/Inquestra/docs/PHASE_1_PRD.md) | Next.js 15, TipTap v3, Zustand, Web Serial API (`navigator.serial`), Recharts NodeView, Telemetry Simulator. |
| **2** | **Supabase Auth, PostgreSQL RLS & Cloud Persistence** | [`PHASE_2_PRD.md`](file:///c:/Users/khail/OneDrive/Documents/Inquestra/docs/PHASE_2_PRD.md) | Prisma ORM Schema, Next.js Server Actions + Zod, Supabase Auth, PostgreSQL Row-Level Security (RLS). |
| **3** | **Smart CSV Engine & Cloudflare R2 Storage** | [`PHASE_3_PRD.md`](file:///c:/Users/khail/OneDrive/Documents/Inquestra/docs/PHASE_3_PRD.md) | Cloudflare R2 (S3-compatible, $0 egress), Drag-and-drop PapaParse CSV streaming, interactive inline charts. |
| **4** | **Enterprise Hardening & Cryptographic Provenance** | [`PHASE_4_PRD.md`](file:///c:/Users/khail/OneDrive/Documents/Inquestra/docs/PHASE_4_PRD.md) | SHA-256 Checksum Engine, Web Worker Protocol Timers, Autonomous Reagent Deduct, Model Context Protocol (MCP) integrations. |

---

## 🔒 Edge Routing & Storage Architecture
- **Apex Domain:** `inquestra.org` (Marketing, Documentation, Legal Disclosures)
- **App Workspace:** `inquestra.org/app` (Local-first & Authenticated Research Workspace)
- **Object Storage:** Cloudflare R2 (S3-compatible, zero egress fees for large telemetry streams)
- **Database Architecture:** PostgreSQL with Row-Level Security (RLS) via Prisma ORM
