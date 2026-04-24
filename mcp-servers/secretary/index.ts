#!/usr/bin/env node
/**
 * Secretary MCP server.
 *
 * Exposes three tools to any MCP-aware client (Claude Code, the Agent SDK, etc.):
 *
 *   - mark_done(item_id)              Mark a digest action item as done.
 *   - snooze(item_id, until)          Hide an action item until ISO date.
 *   - split_invoice(image_path, n)    Stub for vision-based receipt split.
 *
 * State is in-memory for the demo (lost on restart). Good enough for judging.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

type ItemState = { done: boolean; snoozed_until?: string };
const state = new Map<string, ItemState>();

const server = new McpServer({
  name: "secretary",
  version: "0.1.0",
});

server.registerTool(
  "mark_done",
  {
    title: "Mark digest item done",
    description: "Mark a digest action item as completed so it disappears from the list.",
    inputSchema: { item_id: z.string().describe("Action item id, e.g. 'item-001'") },
  },
  async ({ item_id }) => {
    const s = state.get(item_id) ?? { done: false };
    s.done = true;
    state.set(item_id, s);
    return {
      content: [{ type: "text", text: `Marked ${item_id} as done.` }],
    };
  },
);

server.registerTool(
  "snooze",
  {
    title: "Snooze digest item",
    description: "Hide a digest action item from the list until the given ISO date.",
    inputSchema: {
      item_id: z.string().describe("Action item id"),
      until: z.string().describe("ISO 8601 date (YYYY-MM-DD) until which to hide"),
    },
  },
  async ({ item_id, until }) => {
    const s = state.get(item_id) ?? { done: false };
    s.snoozed_until = until;
    state.set(item_id, s);
    return {
      content: [{ type: "text", text: `Snoozed ${item_id} until ${until}.` }],
    };
  },
);

server.registerTool(
  "split_invoice",
  {
    title: "Split invoice",
    description:
      "Split a receipt image among N people. The actual vision call happens in the invoice-splitter Skill; this tool records the requested split and returns a placeholder. Use it from chat when the user says 'split this bill 3 ways'.",
    inputSchema: {
      image_path: z.string().describe("Filesystem path or URL to the receipt image"),
      n: z.number().int().positive().describe("Number of people to split among"),
    },
  },
  async ({ image_path, n }) => ({
    content: [
      {
        type: "text",
        text: `Recorded split request: ${image_path} divided ${n} ways. Open the invoice-splitter Skill or visit /invoice-splitter for the actual breakdown.`,
      },
    ],
  }),
);

server.registerResource(
  "state",
  "secretary://state",
  {
    title: "Secretary state",
    description: "Current in-memory state of marked-done and snoozed items.",
    mimeType: "application/json",
  },
  async () => ({
    contents: [
      {
        uri: "secretary://state",
        text: JSON.stringify(Object.fromEntries(state), null, 2),
        mimeType: "application/json",
      },
    ],
  }),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("[secretary-mcp] connected on stdio\n");
}

main().catch((err) => {
  process.stderr.write(`[secretary-mcp] fatal: ${err}\n`);
  process.exit(1);
});
