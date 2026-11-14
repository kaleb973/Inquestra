import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

const SECURITY_TXT_CONTENT = `# Inquestra Coordinated Vulnerability Disclosure Policy
# RFC 9116 — https://inquestra.org/.well-known/security.txt

Contact: https://inquestra.org/contact
Expires: 2027-10-01T00:00:00.000Z
Preferred-Languages: en
Canonical: https://inquestra.org/.well-known/security.txt
Policy: https://inquestra.org/privacy
Acknowledgments: https://inquestra.org/contact
`;

export async function GET() {
  return new NextResponse(SECURITY_TXT_CONTENT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
