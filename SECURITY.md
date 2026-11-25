# Security Policy

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues or pull requests.

Report vulnerabilities privately via:
- **Contact form:** [inquestra.org/contact](https://inquestra.org/contact)
- **Email:** `support@inquestra.org` with the subject `[SECURITY DISCLOSURE]`
- **GitHub:** Private Vulnerability Reporting under the repository's **Security** tab (when enabled)

Please include a description of the issue, reproduction steps or a minimal proof of concept, and any relevant logs. Disclosures are acknowledged within 48 hours.

## Security Model

- **Local-first storage:** Guest sessions keep notebook state in browser storage (`localStorage` / IndexedDB) with no cloud transmission unless sync is explicitly used.
- **Record sealing:** Sealed trials compute a SHA-256 digest over trial content and metadata, backed by append-only audit logs.
- **Browser hardware isolation:** Instrument streaming relies on the browser's W3C Web Serial permission prompt (`navigator.serial.requestPort()`).
- **Row-Level Security:** Multi-tenant PostgreSQL tables enforce organization boundaries via RLS policies in `prisma/rls.sql`.
- **RFC 9116:** Published at `https://inquestra.org/.well-known/security.txt`.
