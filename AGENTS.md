# AGENTS.md

Configuration and guidelines for agents working in this project.



# Inquestra - Master System Architecture

## Core Identity
**Project:** Inquestra
**Mission:** A modern, unified Electronic Lab Notebook (ELN/ERN) and scientific research platform for Life Sciences, Chemistry, Biotech, and Engineering.
**Objective:** Unify protocol execution, chemical inventory LIMS, molecular structures, literature citations, 21 CFR Part 11 provenance, and bench DAQ in one reproducible, audit-ready research workspace.

## Technology Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript (Strict Mode enabled)
- **Styling:** Tailwind CSS + Shadcn UI (for clean, professional enterprise interfaces)
- **State Management:** Zustand (for real-time telemetry state)
- **Database/Backend:** PostgreSQL via Prisma ORM (for structured, relational research data)

## Operational Directives & Guardrails
1. **Never Hallucinate Context:** You are building an enterprise scientific research platform. Accuracy is paramount. If you lack context on a hardware integration or a database schema, ask for clarification before generating code.
2. **Immutable Data Provenance:** Research data must be treated as sacred. Never write code that allows a user to silently overwrite logged telemetry or timestamped observations. Implement strict append-only or audit-logged data mutations.
3. **TypeScript Strictly Enforced:** Do not use `any` types. All hardware payloads, API responses, and database schemas must be strongly typed.
4. **Artifact Generation First:** Before executing massive refactors or writing complex integrations (like serial port reading or WebSockets), you must output an implementation plan artifact for review.
5. **Strict API & Zero-Hallucination Enforced (Always On):** Never guess or invent function signatures, framework methods, library APIs, or import paths. Verify every method call, type, and import against installed package versions or source files before writing code.

## Code Style
- Write highly modular, DRY code.
- Prioritize server components where possible for performance, reserving client components strictly for interactive UI and real-time DAQ charts.
- Maintain a professional, clean UI architecture. Do not use cartoonish animations or casual language in the interface.