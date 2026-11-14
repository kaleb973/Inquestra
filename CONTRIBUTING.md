# Contributing to Inquestra

Thank you for your interest in contributing to Inquestra! We are building an open, browser-based Electronic Lab Notebook (ELN) and research workspace spanning Life Sciences, Chemistry, Biotech, Materials Science, and Engineering.

This guide outlines our development process, code standards, and how to get your contributions reviewed and merged.

---

## Code of Conduct

All contributors and maintainers are expected to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior through our official channels.

---

## Development Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Git**
- **Modern Chromium-based browser** (Chrome, Edge, Brave, Opera) if testing the native [W3C Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API) hardware telemetry features.

> **Note on Databases:** A live PostgreSQL database is **not** required for local notebook development. Inquestra runs fully local-first in browser storage (`localStorage` / IndexedDB). Cloud sync via Supabase and Prisma is only needed when testing multi-user persistence or administrative features.

---

## Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/Inquestra.git
   cd Inquestra
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   *(The default `.env.local.example` contains mock/placeholder keys suitable for offline UI and local-first development.)*

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   - Marketing & Docs: [http://localhost:3000](http://localhost:3000)
   - Local Research Workspace: [http://localhost:3000/app](http://localhost:3000/app)
   - Hardware DAQ Simulator: [http://localhost:3000/demo](http://localhost:3000/demo)

---

## Architecture & Codebase Overview

- **Framework:** Next.js 15 (App Router with Turbopack)
- **Editor Canvas:** TipTap v3 with custom React NodeViews (`src/components/editor/nodes/`)
- **State Management:** Zustand (`src/store/useNotebookStore.ts`) for granular, transient telemetry and local trials
- **Styling:** Tailwind CSS + Shadcn UI primitives (`src/components/ui/`)
- **Database & Auth (Cloud Mode):** PostgreSQL with Prisma ORM (`prisma/schema.prisma`) and Supabase Auth
- **Hardware Telemetry:** Direct-to-browser serial streaming via `navigator.serial` (`src/hooks/useWebSerial.ts`)

---

## Engineering Standards & Guardrails

To maintain scientific integrity and software reliability, all contributions must respect these core principles:

### 1. TypeScript Strictness (Zero `any`)
We run TypeScript in strict mode. All function signatures, API payloads, state stores, and hardware telemetry packets must be strongly typed. Verify your code with:
```bash
npm run type-check
```

### 2. Multi-Disciplinary Domain Neutrality
Inquestra is designed for researchers across **molecular biology, wet-lab chemistry, materials science, and physical instrumentation**. Generic components, template pickers, and telemetry parsers must not assume a narrow single-discipline bias.

### 3. Immutable Data Provenance & Scientific Integrity
Scientific data must never be silently overwritten or modified without an audit trail. Features touching experiment logs, telemetry recordings, or electronic signatures must preserve append-only history and cryptographic SHA-256 integrity.

### 4. Zero Client-Side Secret Leakage
Never commit real API credentials, service role tokens, or private keys. All sensitive operations must run inside Next.js Server Actions or API routes, with secrets loaded via environment variables.

---

## Pull Request Guidelines

1. **Branch Naming:**
   - Features: `feat/short-description`
   - Bug fixes: `fix/short-description`
   - Documentation: `docs/short-description`
   - Performance: `perf/short-description`

2. **Commit Conventions:**
   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat: add IUPAC name autocomplete to molecule node`
   - `fix: prevent duplicate timestamp in Web Serial packet buffer`
   - `docs: update self-hosting deployment guide`

3. **Pre-Submission Checklist:**
   Before pushing your branch, ensure:
   - [ ] `npm run type-check` passes without errors.
   - [ ] `npm run lint` passes without errors.
   - [ ] New components or features follow existing code structure and styling.
   - [ ] No extraneous debug logs (`console.log`) or temporary test files are committed.

4. **Opening the PR:**
   Submit your pull request against the `main` branch. Fill out the PR template completely with screenshots, test steps, and relevant context.

---

## Questions & Community

- Have questions or want to discuss a feature before building it? Open an issue using the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) template or reach out via our [Contact Form](https://inquestra.org/contact).
- Found a security vulnerability? Please review [SECURITY.md](SECURITY.md) for our responsible disclosure process.
