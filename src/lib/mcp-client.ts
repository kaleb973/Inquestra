// src/lib/mcp-client.ts
// Phase 4 — Model Context Protocol (MCP) JSON-RPC 2.0 client.
// Connects Inquestra to external LIMS / laboratory database MCP servers.
// Researchers query historical datasets in natural language from the TipTap canvas.

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
}

/**
 * Calls a single tool on an MCP server via JSON-RPC 2.0 over HTTP POST.
 * Designed to be called from a Server Action to keep API keys server-side.
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

  const response = await fetch(server.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: tool.name,
        arguments: tool.arguments,
      },
    }),
  });

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
}

/**
 * Lists available tools from an MCP server.
 */
export async function listMCPTools(
  server: MCPServerConfig
): Promise<{ name: string; description: string }[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (server.apiKey) headers['Authorization'] = `Bearer ${server.apiKey}`;

  const response = await fetch(server.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      method: 'tools/list',
      params: {},
    }),
  });

  if (!response.ok) return [];

  const json = (await response.json()) as {
    result?: { tools: { name: string; description: string }[] };
  };

  return json.result?.tools ?? [];
}
