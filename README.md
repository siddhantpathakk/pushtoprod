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

## Repo layout — split by owner to avoid git conflicts

See `docs/EXECUTION.md` for the full execution plan and `hackaton_context.md`
+ `plan.md` for the original team planning docs.

```
backend/        Owner: Claude              Agent core, digest, prompts, subagents
email/          Owner: Human 1 + Human 3   EmailSource, Gmail MCP, fixtures (content)
frontend/       Owner: Human 2             React components, hooks, stub data
app/            Cross-cutting (small)       Next.js routes (pages + API), thin delegators
mcp-servers/    Owner: Claude              Custom MCP server (TBD)
.claude/        Owner: Claude + Human 3    Skills, hooks, slash commands (TBD)
docs/           Shared                      Plan, transcript, execution doc
```

Each owner folder has its own `README.md`. Cross-folder imports use TS path aliases:

- `@backend/...` → `backend/...`
- `@email/...` → `email/...`
- `@frontend/...` → `frontend/...`

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
