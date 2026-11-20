# Inquestra

[![Website](https://img.shields.io/badge/workspace-inquestra.org-10b981?style=flat-square)](https://inquestra.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Hardware DAQ](https://img.shields.io/badge/Hardware-Web_Serial_API-f59e0b?style=flat-square)](https://inquestra.org/hardware)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![Roadmap](https://img.shields.io/badge/Roadmap-Active-6366f1?style=flat-square)](ROADMAP.md)

**Inquestra** is an open, browser-based Electronic Lab Notebook (ELN) and research workspace spanning **Life Sciences, Chemistry, Biotech, Materials Science, and Engineering**. It unifies structured protocol execution, reagent inventory logging, chemical structure lookup, oligonucleotide analysis, literature citations, immutable SHA-256 provenance, and real-time **Web Serial API** instrument telemetry inside a single zero-install tab.

---

## Why Inquestra?

- **Zero-Signup Local Mode:** Start documenting immediately at [inquestra.org/app](https://inquestra.org/app). Trials, metadata, checklists, and molecular blocks persist automatically in browser `localStorage` with zero procurement or IT approval.
- **Native Bench Hardware DAQ (Web Serial API):** Stream live serial telemetry directly from Arduino, ESP32, potentiostats, balances, pH meters, and microcontrollers into embedded interactive charts without Python middleware or proprietary vendor dongles.
- **Molecular & Analytical Primitives Inline:** Resolve compound names or IUPAC identifiers into canonical SMILES, formula, molar mass, and InChIKey via PubChem; calculate DNA/RNA oligonucleotide length, GC%, Wallace & salt-adjusted melting temperature ($T_m$), and reverse complements in real time.
- **Immutable Data Provenance:** Draft notes sync optionally to PostgreSQL (via Prisma ORM), append revision snapshots, and lock completed experiments with SHA-256 hash seals and append-only audit logs designed to support institutional compliance and reproducibility.
- **TypeScript-Strict & Self-Hostable:** Built on Next.js App Router, React, TipTap, Zustand, Tailwind CSS, and PostgreSQL with zero `any` types across client/server boundaries.

---

## Feature Comparison

| Capability | Inquestra | Benchling | LabArchives | SciNote |
|---|---|---|---|---|
| **No-Account Browser Guest Mode** | **Yes (localStorage)** | No | No | No |
| **Free Academic & Solo Access** | **Free (Local workspace & Cloud sync)** | Limited Academic | Limited / Paid | Freemium |
| **Multi-Discipline Support** | **Life Sciences, Chemistry, Materials, Eng.** | Biotech / Bio-focused | General ELN | General Lab / Bio |
| **Native Web Serial Hardware DAQ** | **Yes (built-in Chromium Serial API)** | No | No | No |
| **IUPAC / Name → SMILES + InChIKey** | **Yes (PubChem live lookup + 2D render)** | Enterprise Add-on | Limited | Chem module |
| **Primer GC% & Tm Calculator** | **Yes (Wallace + Salt-adjusted inline)** | Yes | No | Limited |
| **Interactive Step Checklists & Timers** | **Yes (per-step timestamps + deviations)** | Structured tables | Rich text | Task checklists |
| **SHA-256 Record Sealing & Audit Trail** | **Yes (Cryptographic digest & audit log)** | Enterprise tier | Institutional tier | Premium tier |
| **Transparent Codebase & Self-Hosting** | **Open repository (Next.js + Postgres)** | Closed SaaS | Closed SaaS | Open-core / Cloud |

> Full matrix available at [inquestra.org/compare](https://inquestra.org/compare).

---

## Protocol Templates & Inline Slash Commands

### Experiment Template Gallery
Create a new trial from the sidebar (`+`) to launch from a blank canvas or one of the pre-structured domain templates:

- **Molecular Biology:** `Standard PCR`, `Primer Design Worksheet`, `Plasmid Miniprep`
- **Cell Biology:** `Cell Passaging Log`, `Cell Viability Assay`
- **Chemistry:** `Buffer Preparation`, `Compound Library Entry`
- **Materials Science:** `Tensile Test Record`
- **General:** `Blank Experiment`

### Inline `/` Slash Commands
Type `/` anywhere inside the protocol editor to insert structured blocks or SOP checklists:

- **Protocols & SOPs:** `Protocol: PCR Amplification`, `Protocol: Western Blot`, `Protocol: Cell Passaging`, `Protocol: Flow Cytometry`, `Protocol: Bradford Assay`, `Protocol: Buffer Prep`, `Protocol: Miniprep`, `Protocol: Transformation`
- **Chemistry & Molecular Biology:** `IUPAC → SMILES`, `Primer Design`, `Molecule (SMILES)`, `Sequence (DNA/RNA)`, `Reagent`, `Math Equation` (KaTeX), `Literature Citation` (Europe PMC / PubMed), `Equipment Link`, `Reference Experiment`
- **Data & Instrumentation:** `Chart` (Interactive CSV / Web Serial DAQ), `Countdown Timer`

---

## Live Workspace & Simulator

- **Open Workspace (no signup):** [inquestra.org/app](https://inquestra.org/app)
- **In-Browser DAQ Hardware Simulator:** [inquestra.org/demo](https://inquestra.org/demo)
- **Frequently Asked Questions:** [inquestra.org/faq](https://inquestra.org/faq)

---

## Local Development

```bash
git clone https://github.com/kaleb973/Inquestra.git
cd Inquestra
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to browse the documentation pages or [http://localhost:3000/app](http://localhost:3000/app) to use the local-first ELN immediately (PostgreSQL / Supabase credentials in `.env.local` are only required when enabling cloud trial persistence).

---

## Community & Governance

- [Contributing Guide](CONTRIBUTING.md) — Local development setup, code standards, and PR process.
- [System Architecture](docs/ARCHITECTURE.md) — Overview of TipTap canvas, Web Serial DAQ, and persistence layers.
- [Feature Roadmap](ROADMAP.md) — Active milestones and upcoming platform initiatives.
- [Code of Conduct](CODE_OF_CONDUCT.md) — Contributor Covenant v2.1.
- [Security Policy](SECURITY.md) — Coordinated vulnerability disclosure guidelines.
- [License](LICENSE) — MIT License.

---

## Citation

If you use Inquestra in academic research, technical methods sections, or laboratory SOP documentation, please cite:

```bibtex
@software{inquestra_eln_2026,
  title   = {Inquestra: Open Browser-Based Electronic Lab Notebook with Native Web Serial DAQ and Cryptographic Provenance},
  author  = {{Inquestra Contributors}},
  year    = {2026},
  url     = {https://inquestra.org},
  note    = {Source repository: https://github.com/kaleb973/Inquestra}
}
```
