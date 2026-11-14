# ADR 0005: Academic Bench Repositioning & Technical Controls Alignment

## Status
Accepted (2026-11-13)

## Context
Commercial ELN platforms target enterprise pharmaceutical procurement with closed cloud architectures and broad GxP compliance claims. However, software alone cannot be "21 CFR Part 11 compliant" without institutional standard operating procedures (SOPs), installation qualification (IQ), and operational qualification (OQ). Advertising unconditional compliance creates regulatory ambiguity.

Furthermore, academic bench researchers, students, and multi-disciplinary labs face a different set of primary constraints: they require immediate, local-first protocol execution, air-gapped data sovereignty (ensuring unpublished IP never touches unvetted third-party cloud servers), and hardware telemetry capture (W3C Web Serial) without enterprise seat licensing.

## Decision
1. **Reframe Compliance to Technical Controls:** Replace broad "21 CFR Part 11 compliant" assertions with precise technical descriptions: "Part 11 technical controls: immutable SHA-256 audit trails, cryptographic signing manifests, and verifiable local exports."
2. **Elevate Local-First as Data Sovereignty:** Emphasize browser IndexedDB persistence as an intentional air-gapped security choice. Researchers keep complete ownership of their data with zero cloud vendor lock-in.
3. **Solve Communal Bench Computer Risks:** Integrate transparent session export prompts (JSON/CSV) to safeguard rotating students and researchers on shared university bench PCs against browser cache wipes.
4. **Publish Open Engineering Leadership:** Maintain transparent documentation of Inquestra's local-first architecture, open data schemas, and mission on the `/about` and `/architecture` pages.

## Consequences
- Prevents regulatory overclaiming and aligns with FDA industry guidance for electronic records.
- Solidifies trust with Principal Investigators (PIs), lab managers, and academic researchers.
- Differentiates Inquestra on open standards, bench hardware DAQ, and local data ownership.
