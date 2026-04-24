# Push to Prod — AI Email Secretary

A "Jarvis for your email." Two features:

1. **Chat with your mailbox** — natural-language Q&A over inbox content with citations.
2. **Daily action-item digest** — bills due, expiring loyalty points, unreplied emails,
   password expiries — surfaced proactively per persona.

Plus a **bill-splitter** stretch skill (vision-based receipt parsing).

## Stack

- **Next.js 15 App Router + TypeScript + Tailwind**, deployed to **Vercel**
- **Claude Agent SDK + Anthropic SDK** — agent loop, citations, prompt caching, extended thinking, tool use
- **Subagents** — Developer / Manager / Finance personas behind a router
- **MCP** — official Gmail MCP for live email; custom Node MCP server for `mark_done`, `snooze`, `split_invoice`
- **Skills + Hooks** — `invoice-splitter` and `digest-formatter` Skills; SessionStart hook auto-runs digest in Claude Code

## Local development

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

By default the app uses `FixtureEmailSource` (`fixtures/emails.json`) so it works
without Gmail OAuth. To use the live Gmail MCP locally, set `EMAIL_SOURCE=gmail-mcp`
in `.env.local` after Human 1's OAuth setup is complete.

## Hosted demo

Deployed on Vercel from `main` branch. **Hosted URL: TBD** — capture once Human 2 deploys.

## Repo layout

See `docs/EXECUTION.md` for the full execution plan, and `hackaton_context.md`
+ `plan.md` for the original team planning docs.

```
app/                    Next.js routes (UI + API)
components/             React components (UI)
lib/secretary/          Agent core, subagents, prompts, types
lib/secretary/sources/  EmailSource interface + fixtures + gmail-mcp
mcp-servers/secretary/  Custom MCP server (mark_done, snooze, split_invoice)
bin/                    CLI entrypoints (digest for SessionStart hook)
fixtures/emails.json    Seeded inbox (~45 emails target)
.claude/                Skills, hooks, slash commands
```

## Claude features in the demo

| Feature | Where |
|---|---|
| Claude Agent SDK | `lib/secretary/agent.ts` |
| MCP (Gmail) | `lib/secretary/sources/gmail-mcp.ts` |
| MCP (custom) | `mcp-servers/secretary/index.ts` |
| Subagents | `lib/secretary/subagents/` |
| Skills | `.claude/skills/` |
| Hooks | `.claude/settings.json` (SessionStart) |
| Prompt caching | system prompt + email index |
| Extended thinking | digest call only |
| Tool use w/ structured output | digest `ActionItem` schema |
| Citations | chat answers cite source email |
| Vision | invoice splitter |
| Streaming | `/api/ask` SSE |
