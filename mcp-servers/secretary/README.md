# Secretary MCP Server

Custom Model Context Protocol server exposing three tools the Email Secretary
uses: `mark_done`, `snooze`, `split_invoice`. Built with
`@modelcontextprotocol/sdk` over stdio.

## Run it

```bash
npx tsx mcp-servers/secretary/index.ts
```

## Add it to Claude Code

```bash
claude mcp add secretary --scope project -- npx tsx mcp-servers/secretary/index.ts
```

(or edit `.claude/settings.json` directly under the `mcpServers` key)

Then in Claude Code:

```
> Mark item-001 done
> Snooze item-002 until 2026-05-01
> Split this receipt 3 ways: /tmp/dinner.jpg
```

## Use it from the agent

The Anthropic Agent SDK (and the Vercel AI SDK with MCP support) can connect
to this server programmatically — point it at the `npx tsx ...` command above.

## State

In-memory, lost on restart. Fine for the demo. For production, swap the `Map`
for a key-value store.
