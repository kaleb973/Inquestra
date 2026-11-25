# Inquestra

Browser-based Electronic Lab Notebook (ELN) and research workspace for life sciences, chemistry, biotech, materials science, and engineering.

## Features

- **Local-first workspace:** Runs in browser `localStorage` without requiring an account ([inquestra.org/app](https://inquestra.org/app)).
- **Web Serial hardware DAQ:** Streams live serial telemetry directly from benchtop instruments, microcontrollers, balances, and probes via `navigator.serial` ([inquestra.org/demo](https://inquestra.org/demo)).
- **Scientific editor blocks:** TipTap block canvas with protocol checklists, step timers, KaTeX equations, PubChem chemical structure resolution, DNA/RNA sequence ($T_m$, GC%) calculators, and PubMed / Europe PMC citations.
- **Provenance & inventory:** Optional PostgreSQL persistence via Prisma ORM with SHA-256 record sealing, append-only audit logs, reagent lot tracking, and 2D/QR label scanning.

## Stack

- Next.js 15 (App Router), React 19, TypeScript (strict mode)
- Tailwind CSS, Zustand, TipTap
- PostgreSQL + Prisma ORM, Supabase Auth (optional cloud persistence)

## Local Development

```bash
git clone https://github.com/kaleb973/Inquestra.git
cd Inquestra
npm install
npm run dev
```

- Site: [http://localhost:3000](http://localhost:3000)
- Workspace: [http://localhost:3000/app](http://localhost:3000/app)
- DAQ Simulator: [http://localhost:3000/demo](http://localhost:3000/demo)

The local-first workspace runs without environment configuration. Optional PostgreSQL, Supabase, Stripe, Resend, and analytics credentials can be placed in `.env.local` for cloud sync.

## Documentation & Policies

- [System Architecture](docs/ARCHITECTURE.md)
- [Security Policy](SECURITY.md)
- [MIT License](LICENSE)
