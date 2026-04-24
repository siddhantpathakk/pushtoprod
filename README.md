# Clarion — Clarity from the Chaos

> An AI chief-of-staff that reads your inbox, reasons about what actually needs your attention, and delivers a single prioritized briefing every morning.

**Push to Prod 2026 · Singapore**

---

## The problem

The average knowledge worker spends **28% of their workweek** (McKinsey) just managing messages. Not doing work — *deciding* what work to do. Buried across email, Slack, Teams, and a dozen notification feeds are unpaid invoices, expiring contracts, forgotten threads, and missed deadlines that nobody wrote down.

No one needs another notification tool. They need an AI that reads everything for them and tells them what's urgent.

## What Clarion does

### 1. Chat with your mailbox
Ask anything in plain English — get cited answers grounded in your real emails.

> *"What invoices are due this week?"* → returns the 5 pending bills with amounts, due dates, and a "Sources" expander showing the exact quoted snippet from each source email.

### 2. Daily action-item digest
A proactive, structured briefing — not a summary of *everything*, but a prioritized list of *what needs action*, organized by urgency and category. Bills, expiring items, unreplied threads, security alerts, deadlines — all surfaced in one glance.

### 3. Personas
The same agent serves three roles by swapping system prompts: **Developer** (CI failures, password expiries, cost alerts), **Manager** (escalations, unreplied teammates, hiring), **Finance** (invoices, renewals, payouts). One inbox, three perspectives.

---

## Try it

### Hosted demo
**🔗 https://pushtoprod.vercel.app** *(populate after deploy)*

Sign in with Google, pick a persona, refresh the digest, ask the chat anything.

### Local dev
```bash
npm install
cp .env.example .env.local      # add ANTHROPIC_API_KEY (and Google OAuth keys for sign-in)
npm run dev                     # → http://localhost:3000
```

The app reads from a 22-email fixture inbox by default ([email/fixtures/emails.json](email/fixtures/emails.json)) so the hosted demo works without OAuth. Set `EMAIL_SOURCE=gmail-mcp` to switch to a live Gmail inbox locally.

---

## Architecture

```
                       ┌──────────────────────────────────┐
                       │   Browser (judge / user)         │
                       └──────────────┬───────────────────┘
                                      │  HTTPS · Google OAuth gated
                                      ▼
            ┌────────────────────────────────────────────────┐
            │     Next.js 16 (App Router) · Vercel           │
            │                                                │
            │  app/page.tsx          Two-pane UI             │
            │     ├─ DigestList      streaming markdown chat │
            │     └─ Chat pane       cited answers           │
            │                                                │
            │  app/api/ask           SSE streaming           │
            │  app/api/digest        structured tool-use     │
            │  app/api/mark-done                             │
            │  app/api/snooze                                │
            │  app/api/cache-stats                           │
            │  app/api/auth/google   Google OAuth            │
            └──────────────┬─────────────────────┬───────────┘
                           │                     │
                           ▼                     ▼
        ┌────────────────────────────┐ ┌─────────────────────────┐
        │   backend/                 │ │   email/                │
        │                            │ │                         │
        │   agent.ts   ask()         │ │   sources/              │
        │   digest.ts  digest()      │ │   fixtures/emails.json  │
        │   prompts.ts (persona)     │ │   fixtures/gmail_client │
        │   anthropic.ts             │ │     .py (seed dummy GM) │
        │   documents.ts (citations) │ └────────────┬────────────┘
        │   types.ts (zod schemas)   │              │
        │   subagents/{dev,mgr,fin}  │              │
        └─────────────┬──────────────┘              │
                      │                             │
                      ▼                             ▼
        ┌─────────────────────────┐    ┌────────────────────────┐
        │   Anthropic API         │    │   Gmail MCP (optional) │
        │   - Sonnet 4.6 · chat   │    │   stdio · OAuth        │
        │   - Opus 4.7 · digest   │    │   live dummy inbox     │
        │   - Haiku 4.5 · dev     │    └────────────────────────┘
        │                         │
        │   ✓ streaming           │
        │   ✓ citations           │
        │   ✓ prompt caching      │
        │   ✓ extended thinking   │
        │   ✓ tool-use schema     │
        └─────────────────────────┘

   ┌─── Local Claude Code surface (power-user demo) ──────────────┐
   │                                                              │
   │   .claude/settings.json    SessionStart hook → bin/digest.ts │
   │   .claude/skills/          invoice-splitter, digest-formatter│
   │   .claude/commands/        /digest slash command             │
   │   mcp-servers/secretary/   custom MCP server (mark_done,…)   │
   └──────────────────────────────────────────────────────────────┘
```

---

## Repo walkthrough

The repo is split into ownership zones so three people could work in parallel without git conflicts.

| Folder | What lives here | Notes |
|---|---|---|
| [`backend/`](backend/) | Agent core: `ask()`, `digest()`, prompts, persona subagents, Anthropic SDK client, citation extraction, prompt-cache helpers | Pure TypeScript, called from API routes |
| [`email/`](email/) | `EmailSource` interface, `FixtureEmailSource` (default), `GmailMCPEmailSource` (toggleable), 22-email seed inbox, Python script that pushes seed emails into a real dummy Gmail | Hosted demo uses fixtures; local demo can hit Gmail MCP |
| [`frontend/`](frontend/) | Reusable React stubs and types | Most UI lives in `app/_components/` |
| [`app/`](app/) | Next.js routes (UI + API) — thin delegators to `backend/` | Includes login, onboarding, and Google OAuth callback |
| [`app/_components/`](app/_components/) | `DigestList`, `StatusBar`, `Brand`, types | Client components, Tailwind-styled |
| [`mcp-servers/secretary/`](mcp-servers/secretary/) | Custom Node MCP server exposing `mark_done`, `snooze`, `split_invoice` | Authored, not just consumed — auto-registered with Claude Code via [`.claude/settings.json`](.claude/settings.json) |
| [`.claude/`](.claude/) | Skills (`invoice-splitter`, `digest-formatter`), SessionStart hook, `/digest` slash command | The local Claude Code surface |
| [`bin/digest.ts`](bin/digest.ts) | CLI used by the SessionStart hook to print today's digest into Claude Code's startup greeting | tsx-runnable |
| [`lib/auth.ts`](lib/auth.ts) | HMAC-signed session cookies, OAuth state CSRF protection | Web-Crypto, no external auth dep |
| [`docs/`](docs/) | Execution plan, original transcript, planning context | For posterity |
| [`project_pitch.md`](project_pitch.md) | Long-form narrative pitch | Standalone read |

Cross-folder imports use TypeScript path aliases:

- `@backend/...` → `backend/...`
- `@email/...` → `email/...`
- `@frontend/...` → `frontend/...`

---

## Claude features used

Twelve distinct Claude / Anthropic platform capabilities, every one of them implemented and verifiable in the code:

| # | Feature | Where in the code | What it does |
|---|---------|-------------------|--------------|
| 1 | **Multi-model routing** | [`backend/anthropic.ts`](backend/anthropic.ts) | Sonnet 4.6 for chat, Opus 4.7 for digest, Haiku 4.5 for dev — env-driven |
| 2 | **Streaming (SSE)** | [`backend/agent.ts`](backend/agent.ts) (`askStream`), [`app/api/ask/route.ts`](app/api/ask/route.ts) | Chat tokens stream live to the UI; markdown rendered incrementally |
| 3 | **Citations** | [`backend/documents.ts`](backend/documents.ts), [`backend/agent.ts`](backend/agent.ts) | Every chat answer cites the source email with a quoted snippet, rendered as a "N sources" expander |
| 4 | **Prompt caching** | [`backend/documents.ts`](backend/documents.ts) (`withCacheBreakpoint`), `agent.ts`, `digest.ts` | Ephemeral cache on system prompt + serialized email index — dramatic cost & latency win on repeat calls |
| 5 | **Extended thinking** | [`backend/digest.ts`](backend/digest.ts) | Adaptive thinking on Opus, enabled thinking on Sonnet, off on Haiku (model-aware) |
| 6 | **Tool use w/ structured output** | [`backend/digest.ts`](backend/digest.ts) | Digest forced through a zod-validated `record_action_items` tool — no JSON parsing fragility |
| 7 | **Persona system prompts** | [`backend/prompts.ts`](backend/prompts.ts), [`backend/subagents/`](backend/subagents/) | Developer / Manager / Finance behaviours from one agent loop |
| 8 | **Custom MCP server (authored)** | [`mcp-servers/secretary/index.ts`](mcp-servers/secretary/index.ts) | stdio MCP exposing `mark_done`, `snooze`, `split_invoice` tools + `secretary://state` resource |
| 9 | **MCP-ready Gmail source** | [`email/sources/gmail-mcp.ts`](email/sources/gmail-mcp.ts), [`email/fixtures/gmail_client.py`](email/fixtures/gmail_client.py) | Toggle `EMAIL_SOURCE=gmail-mcp` for live inbox; Python script seeds 47 office-context emails into a dummy Gmail account |
| 10 | **Claude Code Skills** | [`.claude/skills/invoice-splitter/SKILL.md`](.claude/skills/invoice-splitter/SKILL.md), [`.claude/skills/digest-formatter/SKILL.md`](.claude/skills/digest-formatter/SKILL.md) | Two production-quality `SKILL.md` files with proper frontmatter |
| 11 | **SessionStart hook** | [`.claude/settings.json`](.claude/settings.json), [`bin/digest.ts`](bin/digest.ts) | Opening Claude Code in this repo auto-prints today's digest into the session greeting |
| 12 | **Slash command** | [`.claude/commands/digest.md`](.claude/commands/digest.md) | `/digest` invokes the CLI and offers MCP follow-up actions (mark done, snooze) |

### Two surfaces, twelve features

| Surface | What you see |
|---|---|
| **Public web app** (Vercel) | Streaming chat with citations, prompt caching, structured-output digest, extended thinking, persona switching, mark-done / snooze actions |
| **Local Claude Code** | SessionStart hook auto-greets with the digest, custom MCP for actions, two Skills, `/digest` slash command |

Same agent, two interfaces, every feature visible.

---

## Tech stack

- **Next.js 16 App Router · TypeScript · Tailwind 4** — UI + API in one codebase, deployed to Vercel
- **`@anthropic-ai/sdk`** — Anthropic SDK with citations, caching, extended thinking, tool use
- **`@modelcontextprotocol/sdk`** — Custom MCP server (~70 lines)
- **`ai` + `@ai-sdk/anthropic`** — Vercel AI SDK helpers
- **`zod`** — Schema validation for tool-use outputs and request payloads
- **`react-markdown` + `remark-gfm`** — Streamed markdown in chat answers
- **Web Crypto** — HMAC-signed session cookies, no external auth dep
- **`tsx`** — Runs TS scripts in `bin/` (the digest CLI for the SessionStart hook)

---

## Submission checklist

- [x] Public GitHub repo · https://github.com/siddhantpathakk/pushtoprod
- [x] Working local dev server
- [x] All 12 Claude features implemented
- [ ] Deployed demo URL *(in progress)*
- [ ] 2-min demo video
- [ ] Architecture diagram (above is the source)

---

## Team

Built by three humans + Claude over a 4-hour sprint at Push to Prod 2026, Singapore. The repo's three top-level folders (`backend/`, `email/`, `frontend/`) map to those three humans — split deliberately to enable parallel work without git conflicts.

---

## License

MIT (see `LICENSE` once added).
