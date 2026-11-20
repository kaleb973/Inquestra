# Inquestra Feature Roadmap

This document captures upcoming feature pillars and strategic initiatives for Inquestra.

---

## 1. Protocol & SOP Library (`/protocol` Template Hub)
- **Concept**: Standard Operating Procedure (SOP) authoring and version control hub.
- **Key Capabilities**:
  - Admin & researcher dashboard tab for creating, versioning (v1, v2, v3), and publishing standardized protocols (PCR, Western Blot, Cell Culture, Flow Cytometry).
  - `/protocol` slash command integration to pull versioned templates directly into trials with one click.
  - Interactive execution mode with step completion checkboxes, protocol timers, and deviation logging.
- **Database Model**: Uses existing Prisma [`ProtocolTemplate`](prisma/schema.prisma) model.

---

## 2. 2-Person Electronic Signatures & Witnessing
- **Concept**: Dual-signoff workflow supporting GLP and institutional audit trail policies.
- **Key Capabilities**:
  - Author Signature step: primary researcher signs with credential challenge and legal statement of truth.
  - Witness / PI Review step: countersigning workflow with peer review, password verification, and legal witnessing statement.
  - Cryptographic validation: SHA-256 hash linking the sealed trial snapshot, signer identities, and timestamps.
  - Visual Audit Certificate rendered in the trial footer and embedded into PDF/ZIP exports.
- **Database Model**: Uses existing Prisma [`Signature`](prisma/schema.prisma) and [`AuditLog`](prisma/schema.prisma) models.

---

## 3. Barcode & Printable QR Label Generator (Specimens & Freezers)
- **Concept**: Bridge digital inventory provenance with physical wet-lab tubes, racks, and boxes.
- **Key Capabilities**:
  - Auto-generation of 2D DataMatrix and QR barcodes for all inventory items and storage locations.
  - Printable label sheet generator calibrated for standard cryogenic labels (Avery, Brady).
  - Web camera & USB scanner barcode reader to rapidly check in/out reagents or link a scanned vial into an active notebook note.
- **Database Model**: Leverages `InventoryItem.barcode` and `StorageLocation` hierarchy in Prisma.

---

## 4. Academic Core Lab & iGEM Pilot Program
- **Concept**: Direct onboarding for academic research teams, university core facilities, and student wet-labs.
- **Key Capabilities**:
  - Pre-calibrated starter templates for molecular biology (PCR, cloning), chemistry, and biomechanics.
  - Direct collaboration on custom protocol blocks, hardware sensor calibration profiles, and open export schemas.
  - Deployment assistance for self-hosted institutional PostgreSQL instances and team workspace configurations.

---

## 5. Production Hardening & Edge Security
- **Concept**: Enterprise-grade infrastructure resilience and zero-trust edge protection.
- **Key Capabilities**:
  - Zero-trust rate limiting and anomaly scoring on authentication and trial export endpoints.
  - Automated deployment skew detection (`src/lib/deploymentSkew.ts`) preventing client-side cache desynchronization during rolling releases.
  - Strict transactional email provenance with 100% SPF, DKIM, and DMARC enforcement.

---

## 6. Multi-Tier Lab & Institutional Subscriptions (Stripe)
- **Concept**: Self-service billing infrastructure for university departments and commercial labs requiring managed cloud persistence and dedicated support.
- **Key Capabilities**:
  - Integration with Stripe Checkout and Customer Portal for self-service seat allocation, invoicing, and team billing.
  - Prisma `Organization` subscription models linking team seats to storage quotas and enterprise features.
  - Cryptographically verified webhook pipeline (`src/app/api/webhooks/stripe/route.ts`) handling real-time subscription lifecycle events.
  - Hard usage guardrails on Cloudflare R2 object storage to prevent runaway telemetry archive costs.

---
*Maintained by Inquestra Contributors*

