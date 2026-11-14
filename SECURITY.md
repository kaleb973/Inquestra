# Security Policy

At Inquestra, we take the security, integrity, and privacy of scientific research data seriously. We welcome contributions and reports from security researchers to help keep our platform and users safe.

---

## Supported Versions

Only the latest release on the `main` branch is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| < 0.1.0 | :x:                |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public GitHub issues, discussions, or social media.**

To report a vulnerability responsibly:

1. **GitHub Private Vulnerability Reporting (Preferred):**  
   Navigate to the [Security Advisories tab](https://github.com/kaleb973/Inquestra/security/advisories) on GitHub and click **"Report a vulnerability"**. This allows confidential triage, verification, and coordinated patch creation.

2. **Direct Contact:**  
   If GitHub Private Reporting is unavailable, you may submit disclosures through our secure contact channel at:  
   **[https://inquestra.org/contact](https://inquestra.org/contact)**

### What to Include in Your Report
To help us triage and resolve the issue quickly, please provide:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Any relevant request/response traces, code snippets, or browser console outputs.
- Suggested remediations or mitigations, if known.

---

## Response Timeline & Coordinated Disclosure

- **Acknowledgment:** We aim to acknowledge receipt of security reports within **48 hours**.
- **Assessment & Status Updates:** We will provide an assessment of validity and severity within **5 business days**.
- **Fix & Public Advisory:** Once a patch is developed and verified, we will coordinate public disclosure alongside a credited security notice.

---

## Scope & Architectural Security Model

Inquestra employs a defense-in-depth security model:

1. **Local-First Air-Gap Isolation:** Unauthenticated sessions run locally in browser storage (`localStorage` / IndexedDB). No research data leaves the user's browser unless cloud sync is explicitly enabled.
2. **Cryptographic Record Sealing:** Sealed notebook trials use SHA-256 hashes to guarantee provenance and detect post-seal tampering.
3. **Web Serial Hardware Isolation:** Telemetry inputs use the browser's native W3C permission gate (`navigator.serial.requestPort()`). Inquestra does not install native background daemons or kernel drivers.
4. **Export Sanitization:** All user-supplied HTML/SVG content is sanitized using DOMPurify before rendering or inclusion in export bundles.
5. **PostgreSQL Row-Level Security (RLS):** All multi-tenant database tables enforce tenant and user isolation at the database layer.

---

## Standards Compliance

Inquestra publishes machine-readable security metadata compliant with **RFC 9116** at:  
`https://inquestra.org/.well-known/security.txt`
