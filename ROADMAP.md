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

## 2. 2-Person Electronic Signatures & Witnessing (21 CFR Part 11)
- **Concept**: Regulatory-grade dual-signoff workflow for compliance with FDA 21 CFR Part 11 and GLP/GxP.
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

## 4. First-User Community Pilot (r/labrats Outreach)
- **Concept**: Transition from zero users to 5 active academic/biotech pilot labs.
- **Key Capabilities**:
  - End-to-end verified deployment on Railway with sample demo lab workspace.
  - Value wedge: *"The only free, local-first ELN that includes specimen & freezer inventory."*
  - Authentic founder outreach campaign on `r/labrats` and academic lab networks following the non-promotional discovery playbook.

---

## 5. Operational & Security Checkpoints
- **Target Date**: October 15, 2026 (14-day observation window)
- **Action Item**: Transition DMARC enforcement policy from monitoring to strict quarantine.
  - Review Cloudflare DMARC Management dashboard for Resend and team mail volume.
  - Verify 100% SPF/DKIM alignment and 0 legitimate false-positive rejections.
  - In Cloudflare DNS records, update `_dmarc` TXT record value:
    ```text
    v=DMARC1; p=quarantine; pct=100; rua=mailto:bdce8a7102084d3293bc8f03ff81a100@dmarc-reports.cloudflare.net; aspf=r; adkim=r
    ```

---

## 6. Stripe & SaaS Billing Architecture (Phase 4 Milestone)
- **Status**: Deferred / Staged for execution when institutional monetization begins.
- **Specification Reference**: Full blueprint, security guardrails, and activation checklist documented in [`docs/PHASE_4_PRD.md`](docs/PHASE_4_PRD.md#31-stripe-launch--security-architecture-blueprint-activate-when-billing-starts).
- **Key Implementation Highlights**:
  - **Prisma Schema Updates**: Add `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `subscriptionTier` (`FREE`, `PRO`, `ENTERPRISE`), and `subscriptionStatus` to `Organization`.
  - **Endpoints**:
    - `POST /api/stripe/checkout`: Initiates checkout with idempotency keys (`checkout_org_${orgId}_tier_${tier}`).
    - `POST /api/stripe/portal`: Self-service seat management, invoicing, and cancellation.
    - `POST /api/stripe/webhook`: Cryptographically verified (`req.text()` + `stripe.webhooks.constructEvent`) to handle `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
  - **Security & Anti-Abuse**: Server-only secret key isolation, Stripe Radar SCA/3DS enabled, and hard software usage caps on metered R2 storage before billing sync.

---
*Created: September 19, 2026 | Last Updated: November 5, 2026*

