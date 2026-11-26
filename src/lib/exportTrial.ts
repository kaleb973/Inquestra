'use client';
// src/lib/exportTrial.ts
// One-click trial export: bundles TipTap JSON + Markdown + metadata CSV
// into a .zip file and triggers a browser download.
// Uses turndown (HTML→Markdown) and jszip (ZIP bundler).

import JSZip from 'jszip';
import TurndownService from 'turndown';
import { formatSafeCsvCell } from '@/lib/csvParser';

export interface SignatureExport {
  role: 'AUTHOR' | 'WITNESS' | 'PI_APPROVAL';
  meaning: string;
  signedAt: Date | string;
  user: { email: string; role: string };
}

export interface ExportPayload {
  title: string;
  content: Record<string, unknown>;
  metadata: { key: string; value: string }[];
  status: string;
  createdAt: string;
  updatedAt: string;
  /** HTML string from editor.getHTML() */
  html: string;
  checksum?: string | null;
  sealedAt?: string | null;
  signatures?: SignatureExport[];
}

function escapeMarkdownCell(raw: string): string {
  return String(raw).replace(/[\r\n]+/g, ' ').replace(/\|/g, '\\|').trim();
}

export async function exportTrialAsZip(payload: ExportPayload): Promise<void> {
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  });

  const signatures = payload.signatures || [];
  const isSealed = !!payload.checksum;

  // ── 1. Markdown ─────────────────────────────────────────────────────────────
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(payload.title)}`,
    `status: ${JSON.stringify(payload.status)}`,
    `created: ${JSON.stringify(payload.createdAt)}`,
    `updated: ${JSON.stringify(payload.updatedAt)}`,
    ...(payload.checksum ? [`checksum_sha256: ${JSON.stringify(payload.checksum)}`] : []),
    ...(payload.sealedAt ? [`sealed_at: ${JSON.stringify(payload.sealedAt)}`] : []),
    '---',
    '',
    `# ${payload.title.replace(/[\r\n]+/g, ' ')}`,
    '',
  ].join('\n');

  let markdownBody = td.turndown(payload.html || '<p></p>');

  if (signatures.length > 0 || isSealed) {
    markdownBody += '\n\n---\n\n## Electronic Signatures & Audit Trail\n\n';
    if (isSealed) {
      markdownBody += `> **Cryptographic Seal (SHA-256):** \`${payload.checksum}\`  \n`;
      markdownBody += `> **Sealed At:** ${payload.sealedAt ? new Date(payload.sealedAt).toLocaleString() : 'N/A'}\n\n`;
    }
    markdownBody += '| Role | Signer | Date (UTC) | Legal Meaning |\n|---|---|---|---|\n';
    for (const sig of signatures) {
      markdownBody += `| **${escapeMarkdownCell(sig.role)}** | ${escapeMarkdownCell(sig.user.email)} (${escapeMarkdownCell(sig.user.role)}) | ${new Date(sig.signedAt).toISOString()} | ${escapeMarkdownCell(sig.meaning)} |\n`;
    }
  }

  const markdown = frontmatter + markdownBody;

  // ── 2. JSON (raw TipTap document + provenance) ──────────────────────────────
  const jsonExport = JSON.stringify(
    {
      title: payload.title,
      status: payload.status,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      checksum: payload.checksum ?? null,
      sealedAt: payload.sealedAt ?? null,
      signatures,
      metadata: payload.metadata,
      doc: payload.content,
    },
    null,
    2
  );

  // ── 3. Metadata CSV ─────────────────────────────────────────────────────────
  const csvRows = [
    'key,value',
    `title,${formatSafeCsvCell(payload.title)}`,
    `status,${formatSafeCsvCell(payload.status)}`,
    `created,${formatSafeCsvCell(payload.createdAt)}`,
    `updated,${formatSafeCsvCell(payload.updatedAt)}`,
    ...(payload.checksum ? [`checksum_sha256,${formatSafeCsvCell(payload.checksum)}`] : []),
    ...(payload.sealedAt ? [`sealed_at,${formatSafeCsvCell(payload.sealedAt)}`] : []),
    ...payload.metadata.map((m) => `${formatSafeCsvCell(m.key)},${formatSafeCsvCell(m.value)}`),
  ];
  const metadataCsv = csvRows.join('\n');

  // ── 4. Audit Certificate ────────────────────────────────────────────────────
  const certLines = [
    '# INQUESTRA ELECTRONIC RECORD AUDIT CERTIFICATE',
    '### Cryptographic Record Integrity & Signature Verification',
    '',
    `**Trial Title:** ${payload.title}`,
    `**Export Timestamp:** ${new Date().toISOString()}`,
    `**Trial Status:** ${payload.status}`,
    `**Cryptographically Sealed:** ${isSealed ? 'YES' : 'NO (DRAFT)'}`,
    '',
    '---',
    '',
    '### Cryptographic Integrity Digest',
    `- **Algorithm:** SHA-256`,
    `- **Digest Hash:** \`${payload.checksum || 'NOT_SEALED'}\``,
    `- **Timestamp:** ${payload.sealedAt || 'N/A'}`,
    '',
    '### Electronic Signatures & Witness Verifications',
    '',
  ];

  if (signatures.length === 0) {
    certLines.push('*No electronic signatures recorded on this trial snapshot.*');
  } else {
    for (const sig of signatures) {
      certLines.push(`#### Signature: ${sig.role}`);
      certLines.push(`- **Signer:** ${sig.user.email} (Role: ${sig.user.role})`);
      certLines.push(`- **Signed At:** ${new Date(sig.signedAt).toISOString()}`);
      certLines.push(`- **Statement of Intent:** "${sig.meaning}"`);
      certLines.push('');
    }
  }

  certLines.push('', '---', '*This certificate guarantees unalterable electronic research provenance generated by Inquestra Scientific Research Platform.*');
  const auditCert = certLines.join('\n');

  // ── 5. README ───────────────────────────────────────────────────────────────
  const readme = [
    `# ${payload.title}: Inquestra Export`,
    '',
    `**Exported:** ${new Date().toISOString()}`,
    `**Status:** ${payload.status}`,
    `**SHA-256 Checksum:** \`${payload.checksum || 'None'}\``,
    '',
    '## Files',
    '',
    '| File | Contents |',
    '|---|---|',
    '| `trial.md` | Research notes in Markdown with signature log |',
    '| `trial.json` | Full TipTap document JSON + signatures for re-import |',
    '| `metadata.csv` | Structured key-value metadata & cryptographic hash |',
    '| `AUDIT_CERTIFICATE.md` | Formal electronic signature audit certificate |',
    '',
    '## Re-import',
    '',
    'The `trial.json` file is the canonical source of truth.',
    'Import it or this entire `.zip` bundle into any Inquestra workspace via the **Import** button in the header toolbar or sidebar.',
    'Inquestra automatically verifies the archive, neutralizes unsafe inputs, resets provenance, and restores the run as a clean Draft under data integrity standards.',
    '',
    '---',
    '*Generated by [Inquestra](https://inquestra.org): Open Scientific Research Notebook*',
  ].join('\n');

  // ── 6. Bundle and download ──────────────────────────────────────────────────
  const zip = new JSZip();
  const slug = payload.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'trial';

  const folder = zip.folder(slug);
  if (!folder) throw new Error('Failed to create ZIP folder');

  folder.file('trial.md', markdown);
  folder.file('trial.json', jsonExport);
  folder.file('metadata.csv', metadataCsv);
  folder.file('AUDIT_CERTIFICATE.md', auditCert);
  folder.file('README.md', readme);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}_${Date.now()}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Download raw TipTap document JSON directly for importing into another Inquestra workspace.
 */
export function exportTrialAsJson(payload: ExportPayload): void {
  const jsonExport = JSON.stringify(
    {
      title: payload.title,
      status: payload.status,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      checksum: payload.checksum ?? null,
      sealedAt: payload.sealedAt ?? null,
      signatures: payload.signatures || [],
      metadata: payload.metadata,
      doc: payload.content,
    },
    null,
    2
  );

  const blob = new Blob([jsonExport], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug =
    payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'trial';

  a.href = url;
  a.download = `${slug}_${Date.now()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Download clean Markdown document.
 */
export function exportTrialAsMarkdown(payload: ExportPayload): void {
  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
  });

  const signatures = payload.signatures || [];
  const isSealed = !!payload.checksum;

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(payload.title)}`,
    `status: ${JSON.stringify(payload.status)}`,
    `created: ${JSON.stringify(payload.createdAt)}`,
    `updated: ${JSON.stringify(payload.updatedAt)}`,
    ...(payload.checksum ? [`checksum_sha256: ${JSON.stringify(payload.checksum)}`] : []),
    ...(payload.sealedAt ? [`sealed_at: ${JSON.stringify(payload.sealedAt)}`] : []),
    '---',
    '',
    `# ${payload.title.replace(/[\r\n]+/g, ' ')}`,
    '',
  ].join('\n');

  let markdownBody = td.turndown(payload.html || '<p></p>');

  if (signatures.length > 0 || isSealed) {
    markdownBody += '\n\n---\n\n## Electronic Signatures & Audit Trail\n\n';
    if (isSealed) {
      markdownBody += `> **Cryptographic Seal (SHA-256):** \`${payload.checksum}\`  \n`;
      markdownBody += `> **Sealed At:** ${payload.sealedAt ? new Date(payload.sealedAt).toLocaleString() : 'N/A'}\n\n`;
    }
    markdownBody += '| Role | Signer | Date (UTC) | Legal Meaning |\n|---|---|---|---|\n';
    for (const sig of signatures) {
      markdownBody += `| **${escapeMarkdownCell(sig.role)}** | ${escapeMarkdownCell(sig.user.email)} (${escapeMarkdownCell(sig.user.role)}) | ${new Date(sig.signedAt).toISOString()} | ${escapeMarkdownCell(sig.meaning)} |\n`;
    }
  }

  const markdown = frontmatter + markdownBody;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug =
    payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 40) || 'trial';

  a.href = url;
  a.download = `${slug}_${Date.now()}.md`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
