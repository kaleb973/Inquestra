# Security Policy

Inquestra takes the security, integrity, and privacy of scientific research data seriously. Responsible reports and disclosures from security researchers help maintain platform safety for all users.

---

## Supported Versions

Only the latest release on the `main` branch is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |
| < 0.1.0 | :x:                |

---

## Reporting a Vulnerability

**Please do not report security vulnerabilities via public GitHub issues, pull requests, or social media.**

To report a vulnerability responsibly:

1. **Secure Web Disclosure (Primary):**  
   Submit disclosures directly through the secure contact channel at:  
   **[https://inquestra.org/contact](https://inquestra.org/contact)**  
   or via email to **`support@inquestra.org`** with the subject line `[SECURITY DISCLOSURE]`.

2. **GitHub Private Vulnerability Reporting:**  
   If you have a GitHub account and the repository has Private Vulnerability Reporting enabled, you may navigate to the repository's **Security** tab and click **"Report a vulnerability"** to open a confidential advisory.

### What to Include in Your Report
To help triage and resolve the issue quickly, please provide:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Any relevant request/response traces, code snippets, or browser console outputs.
- Suggested remediations or mitigations, if known.

---

## Response Timeline & Coordinated Disclosure

- **Acknowledgment:** Security disclosures are acknowledged within **48 hours**.
- **Assessment & Status Updates:** An assessment of validity and severity is provided within **5 business days**.
- **Fix & Public Advisory:** Once a patch is developed and verified, coordinated public disclosure is issued alongside a credited security notice.

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
