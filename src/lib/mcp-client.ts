// src/lib/mcp-client.ts
// Phase 4 & Enterprise Hardening — Model Context Protocol (MCP) JSON-RPC 2.0 client.
// Connects Inquestra to external LIMS / laboratory database MCP servers.
// Hardened with timeout deadlines and exponential backoff with full jitter to protect server actions.

import { lookup } from 'node:dns/promises';
import net from 'node:net';
import { fetchWithTimeout, withRetry } from '@/lib/resilience';

export interface MCPToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: { type: string; text: string }[];
  isError?: boolean;
}

export interface MCPServerConfig {
  url: string;
  apiKey?: string;
  timeoutMs?: number;
}

const DEFAULT_MCP_TIMEOUT_MS = 10_000;

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true; // 0.0.0.0/8, 10/8, 127/8
  if (a === 169 && b === 254) return true; // link-local & cloud metadata 169.254/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
  if (a === 192 && b === 168) return true; // 192.168/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
  if (a >= 224) return true; // multicast & reserved
  return false;
}

function isPrivateOrReservedIp(ip: string): boolean {
  const clean = ip.replace(/^\[|\]$/g, '').split('%')[0].toLowerCase();
  const family = net.isIP(clean);
  if (family === 4) return isPrivateOrReservedIpv4(clean);
  if (family === 6) {
    if (clean === '::' || clean === '::1') return true;
    // IPv4-mapped IPv6 ::ffff:a.b.c.d
    if (clean.startsWith('::ffff:')) {
      const mapped = clean.slice('::ffff:'.length);
      if (net.isIP(mapped) === 4) return isPrivateOrReservedIpv4(mapped);
    }
    // Unique local addresses (fc00::/7), link-local (fe80::/10), multicast (ff00::/8)
    if (
      clean.startsWith('fc') ||
      clean.startsWith('fd') ||
      clean.startsWith('fe8') ||
      clean.startsWith('fe9') ||
      clean.startsWith('fea') ||
      clean.startsWith('feb') ||
      clean.startsWith('ff')
    ) {
      return true;
    }
    return false;
  }
  return false;
}

/**
 * Validates MCP server URL against SSRF, credential smuggling, non-standard IPs,
 * and internal/loopback hostnames. Local endpoints require explicit ALLOW_LOCAL_MCP=true.
 */
export function validateSafeMcpUrl(rawUrl: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid MCP server URL.');
  }

  if (url.username || url.password) {
    throw new Error('MCP server URL must not contain embedded credentials.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Invalid MCP server protocol. Only HTTP and HTTPS are permitted.');
  }

  const allowLocal = process.env.ALLOW_LOCAL_MCP === 'true';
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:' && !allowLocal) {
    throw new Error('SSRF Protection: HTTPS is required for MCP endpoints in production.');
  }

  if (allowLocal) {
    return;
  }

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    !hostname ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.arpa')
  ) {
    throw new Error('SSRF Protection: Access to loopback, link-local, or private hostnames is blocked.');
  }

  // Reject numeric integer / octal / hex single-label IP obfuscations (e.g. 2130706433, 0x7f000001)
  if (/^(0x[0-9a-f]+|0[0-7]+|\d+)$/i.test(hostname)) {
    throw new Error('SSRF Protection: Non-canonical numeric hostnames are blocked.');
  }

  if (net.isIP(hostname) !== 0 && isPrivateOrReservedIp(hostname)) {
    throw new Error('SSRF Protection: Access to loopback, link-local, or private IP ranges is blocked.');
  }
}

async function assertResolvedHostSafe(rawUrl: string): Promise<void> {
  if (process.env.ALLOW_LOCAL_MCP === 'true') return;
  const hostname = new URL(rawUrl).hostname.replace(/^\[|\]$/g, '');
  if (net.isIP(hostname) !== 0) return;

  const records = await lookup(hostname, { all: true });
  if (!records.length || records.some((r) => isPrivateOrReservedIp(r.address))) {
    throw new Error('SSRF Protection: Resolved MCP endpoint address points to a private or reserved network.');
  }
}

/**
 * Calls a single tool on an MCP server via JSON-RPC 2.0 over HTTP POST.
 * Uses deadline timeouts and automatic retry with exponential backoff on transient failures.
 */
export async function callMCPTool(
  server: MCPServerConfig,
  tool: MCPToolCallParams
): Promise<MCPToolResult> {
  validateSafeMcpUrl(server.url);
  await assertResolvedHostSafe(server.url);
  const requestId = crypto.randomUUID();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };

  if (server.apiKey) {
    headers['Authorization'] = `Bearer ${server.apiKey}`;
  }

  const payload = JSON.stringify({
    jsonrpc: '2.0',
    id: requestId,
    method: 'tools/call',
    params: {
      name: tool.name,
      arguments: tool.arguments,
    },
  });

  try {
    const response = await withRetry(
      async () => {
        const res = await fetchWithTimeout(server.url, {
          method: 'POST',
          headers,
          body: payload,
          redirect: 'manual',
          timeoutMs: server.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS,
        });

        if (res.status >= 300 && res.status < 400) {
          throw new Error('MCP server redirects are not permitted.');
        }

        // 5xx errors are retryable; 4xx errors are client errors and should fail fast
        if (res.status >= 500) {
          throw new Error(`MCP server HTTP ${res.status}`);
        }
        return res;
      },
      {
        retries: 2,
        minTimeoutMs: 300,
        maxTimeoutMs: 2000,
        retryIf: (err) => {
          // Retry on network errors, timeouts, and 5xx
          return err instanceof Error && !err.message.includes('HTTP 4') && !err.message.includes('redirects are not permitted');
        },
      }
    );

    if (!response.ok) {
      return {
        content: [{ type: 'text', text: `MCP server error: HTTP ${response.status}` }],
        isError: true,
      };
    }

    const json = (await response.json()) as {
      result?: MCPToolResult;
      error?: { message: string };
    };

    if (json.error) {
      return {
        content: [{ type: 'text', text: `MCP error: ${json.error.message}` }],
        isError: true,
      };
    }

    return json.result ?? { content: [{ type: 'text', text: 'No result from MCP server.' }] };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown communication error';
    return {
      content: [{ type: 'text', text: `MCP request failed: ${message}` }],
      isError: true,
    };
  }
}

/**
 * Lists available tools from an MCP server with timeout and retry protection.
 */
export async function listMCPTools(
  server: MCPServerConfig
): Promise<{ name: string; description: string }[]> {
  validateSafeMcpUrl(server.url);
  await assertResolvedHostSafe(server.url);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (server.apiKey) headers['Authorization'] = `Bearer ${server.apiKey}`;

  try {
    const response = await withRetry(
      async () => {
        const res = await fetchWithTimeout(server.url, {
          method: 'POST',
          headers,
          redirect: 'manual',
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: crypto.randomUUID(),
            method: 'tools/list',
            params: {},
          }),
          timeoutMs: server.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS,
        });
        if (res.status >= 300 && res.status < 400) {
          throw new Error('MCP server redirects are not permitted.');
        }
        return res;
      },
      { retries: 2, minTimeoutMs: 250, maxTimeoutMs: 1500 }
    );

    if (!response.ok) return [];

    const json = (await response.json()) as {
      result?: { tools: { name: string; description: string }[] };
    };

    return json.result?.tools ?? [];
  } catch (err) {
    console.error('[mcp-client] Failed to list MCP tools:', err);
    return [];
  }
}
