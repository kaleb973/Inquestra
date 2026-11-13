# ADR 0005: Academic Bench Repositioning & Trust Overhaul

## Status
Accepted (2026-11-13)

## Context
A public AI search and credibility evaluation revealed that Inquestra was perceived as an "AI-generated indie prototype / MVP" rather than a serious research platform. The evaluation cited:
1. Formulaic LLM marketing copywriting ("Eliminate the five-app shuffle", "No IT department required").
2. Standalone "toy" interactive widgets on the landing page (SHA-256 calculator and C++ snippets).
3. Unverified enterprise compliance claims (advertising "21 CFR Part 11 compliant" without institutional qualification or audit backing).
4. Lack of founder transparency, triggering fear of intellectual property loss or project abandonment.

While ADR-0002 previously decided to focus on academic bench positioning, marketing copy on `src/app/(marketing)/page.tsx` drifted toward generic enterprise SaaS messaging.

## Decision
1. **Purge AI-Generated Copy Tells:** Eliminate SaaS clichés and em-dash marketing tropes. Speak in authentic, sober scientific and instrumentation language.
2. **Reframe 21 CFR Part 11:** Software alone cannot be Part 11 compliant without institutional SOPs. Replace all unqualified "Part 11 compliant" badges with "Part 11 technical controls: immutable SHA-256 audit trails, cryptographic signing, and verifiable local exports".
3. **Elevate Local-First as Security Sovereignty:** Frame IndexedDB storage not as a low-cost shortcut, but as a deliberate air-gapped security choice. Researchers keep their pre-publication data on their own hardware with zero cloud lock-in and complete JSON/CSV/PDF exportability.
4. **Solve the Shared Lab Machine Problem:** Add clear warnings and one-click export prompts so researchers on communal lab bench PCs do not risk cache wipe data loss.
5. **Publish Transparent Engineering & Founder Leadership:** Provide transparent documentation of Inquestra's open architecture, schema definitions, and mission on the `/about` and `/architecture` pages.

## Consequences
- Protects the project from regulatory misrepresentation.
- Restores credibility with Principal Investigators (PIs), lab managers, and academic researchers.
- Differentiates Inquestra from Benchling on freedom, hardware DAQ, and local data ownership rather than unverified enterprise claims.
