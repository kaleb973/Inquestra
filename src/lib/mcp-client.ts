// src/lib/mcp-client.ts
// Phase 4 & Enterprise Hardening — Model Context Protocol (MCP) JSON-RPC 2.0 client.
// Connects Inquestra to external LIMS / laboratory database MCP servers.
// Hardened with timeout deadlines and exponential backoff with full jitter to protect server actions.

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

/**
 * Calls a single tool on an MCP server via JSON-RPC 2.0 over HTTP POST.
 * Uses deadline timeouts and automatic retry with exponential backoff on transient failures.
 */
export async function callMCPTool(
  server: MCPServerConfig,
  tool: MCPToolCallParams
): Promise<MCPToolResult> {
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
          timeoutMs: server.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS,
        });

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
          return err instanceof Error && !err.message.includes('HTTP 4');
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (server.apiKey) headers['Authorization'] = `Bearer ${server.apiKey}`;

  try {
    const response = await withRetry(
      () =>
        fetchWithTimeout(server.url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: crypto.randomUUID(),
            method: 'tools/list',
            params: {},
          }),
          timeoutMs: server.timeoutMs ?? DEFAULT_MCP_TIMEOUT_MS,
        }),
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
