# Hackathon Execution Strategy — Email Secretary ("Jarvis for Email")

## Context

3-4 hour hackathon. Team of 4. Nothing built yet — empty repo with just `plan.txt` and `transcript.txt`. The team has converged on an AI personal secretary over Gmail with two non-negotiable features:

1. **Chat with mailbox** — natural language Q&A over emails ("how many KrisFlyer points do I have?")
2. **Daily action-item digest** — proactive list of bills due, expiring passwords, unreplied emails, insurance claims, etc.

**Key constraints**
- **Next.js (App Router) deployed to Vercel** is the primary demo surface — public URL judges can hit.
- Dummy Gmail + Gmail MCP must be set up from scratch (~60-90 min risk).
- Demo must show breadth across 3 personas: Developer, Manager, Finance/HR.
- Both core features MUST ship — no "either/or."
- TypeScript end-to-end: frontend, API routes, Agent SDK calls, custom MCP server.

**The single biggest risk** is Gmail MCP / OAuth setup eating the timeline. The strategy below de-risks this by having the rest of the team build against local email fixtures in parallel, then swapping the data source to the real Gmail MCP at integration time.

**This is an Anthropic-centered hackathon — bonus points for visibly using Claude features.** See "Claude Features Showcase" below for the explicit feature stack we're putting on display.

---

## Claude Features Showcase (the bonus-point checklist)

Every feature below maps to a concrete part of the demo. We pick these because they (a) are recognizable to Anthropic judges, (b) genuinely fit the use case, and (c) are achievable in 3-4 hours. Each line names which workstream owns it.

| # | Claude feature | Where it shows up in the demo | Owner |
|---|----------------|--------------------------------|-------|
| 1 | **Claude Agent SDK (TypeScript)** | Core agent loop (`lib/secretary/agent.ts`) — orchestrates email tools, MCP, subagents | Claude |
| 2 | **MCP (Gmail)** | Live email source via official Gmail MCP server | Human 1 |
| 3 | **MCP (custom)** | Custom Node MCP server `mcp-servers/secretary/index.ts` (`mark_done`, `snooze`, `split_invoice`) using `@modelcontextprotocol/sdk` | Claude |
| 4 | **Subagents** | Three persona subagents (Developer / Manager / Finance) behind a router | Claude |
| 5 | **Skills** | `invoice-splitter` (vision + math) and `digest-formatter` (structured action items) — proper `SKILL.md` files | Claude builds, Human 3 polishes |
| 6 | **Hooks (Claude Code)** | `SessionStart` hook auto-runs the digest when a user opens Claude Code | Claude |
| 7 | **Prompt caching** | System prompt + email index cached across turns; cache-hit metric in sidebar | Claude (SDK) + Human 2 (UI) |
| 8 | **Extended thinking** | Digest call only; thinking trace expandable in the UI | Claude (call) + Human 2 (UI) |
| 9 | **Tool use w/ structured output** | Digest returns strict `ActionItem` schema via tool-call | Claude |
| 10 | **Citations** | Chat answers cite source email; UI renders "Sources" expander | Claude (returns) + Human 2 (renders) |
| 11 | **Vision** | Invoice splitter reads line items from a receipt image | Claude |
| 12 | **Streaming** | Chat responses stream via SSE / Vercel AI SDK into the chat pane | Claude (server) + Human 2 (client) |
| 13 | **Claude Code dev surface** | `/digest` slash command + SessionStart hook (run locally on the demo laptop) | Claude (stretch) |

**Mention every one of these in the README and the demo script.** Judges scan for these.

---

## Hosting

We need a public URL judges can hit. **Next.js + Vercel** is the obvious pairing — Next.js is Vercel's first-class framework.

**Choice: Vercel + GitHub.**
- Free hobby tier; OAuth-connected to GitHub; auto-deploys on every push to `main` with a per-PR preview URL; supports env vars via the dashboard; subdomain like `pushtoprod.vercel.app`.
- API routes run as serverless functions — Agent SDK calls work fine; **Edge runtime is NOT compatible with the Anthropic SDK's streaming, so use the default Node runtime** for `/api/ask` and `/api/digest`.
- Vercel function timeout on hobby plan: **60s**. Digest calls with extended thinking can approach this — set `export const maxDuration = 60` in route handlers and keep the email index small.

**What gets hosted vs stays local:**
- **Hosted (Vercel)**: chat UI, digest UI, invoice-splitter page. Default email source = `FixtureEmailSource` so the public URL works without OAuth.
- **Local only (demoed live on the laptop)**: Gmail MCP (interactive OAuth), Claude Code surface (SessionStart hook, custom MCP server connected to Claude Code, `/digest` slash command).

**Hosting workflow** (Claude scaffolds; the human with the GitHub/Vercel login does the deploy clicks):
1. **Claude (0-30 min, parallel with agent core)**: scaffold Next.js (`create-next-app` with App Router + TypeScript + Tailwind), write `package.json`, `next.config.ts`, `vercel.json` (if needed for function timeouts), `.env.example` (`ANTHROPIC_API_KEY`), update `README.md` with the hosted URL placeholder. Push initial commit to GitHub.
2. **Human with GitHub access (~10 min, around the 60-min mark)**: log into vercel.com with GitHub → Import the `pushtoprod` repo → Vercel auto-detects Next.js → paste `ANTHROPIC_API_KEY` into Environment Variables → deploy. Capture the URL.
3. **Continuous**: every push to `main` redeploys (~30s). Open PRs get preview URLs — useful for testing risky changes without breaking the main demo URL.
4. **Pre-demo (final 30 min)**: warm the URL with one request so the first serverless cold start doesn't hit during judging.

**Secrets handling**: only `ANTHROPIC_API_KEY` goes to Vercel. Gmail OAuth tokens stay local — `credentials.json` and `token.json` in `.gitignore` from commit one. Use `.env.local` for local dev.

**Fallback**: if Vercel fails (build error, function timeout in production), fall back to `npm run dev` locally and expose via `ngrok http 3000` — public URL in 30s. Have both options ready.

---

## Workstream Split (3 humans + Claude, parallel from minute 0)

The split below puts on humans the work that benefits from human judgment (browser OAuth, visual taste, demo voice) and on Claude the coding-heavy backend that benefits from parallel file generation.

### Human 1 — Gmail + Data (critical path; must be human)
- **0-30 min**: Create dummy Gmail account; enable Gmail API; complete OAuth in the browser. (Claude can't drive the browser flow.)
- **30-75 min**: Install Gmail MCP server locally; verify `list_messages` and `get_message` work end-to-end against the dummy inbox.
- **75-150 min**: Seed ~45 realistic sample emails into the inbox (see "Seed Email Catalogue"). Use a second Gmail to send, or use Gmail's `messages.insert` API with the OAuth token to backdate. Vary `Date:` headers so urgency reasoning has signal.
- **150-end**: Pair with Claude on the MCP→agent swap; surface auth/rate-limit issues from the live inbox.

### Human 2 — Next.js UI (visual taste matters; human-led)
- **0-30 min**: After Claude scaffolds the Next.js app, build the two-pane layout in `app/page.tsx` (digest left, chat right) using Tailwind. Use a stubbed `lib/stub-data.ts` returning hardcoded `ActionItem` and `Answer` objects so layout work isn't blocked on the agent.
- **30-90 min**: Chat pane wired to `/api/ask` with streaming via `useChat` (Vercel AI SDK) or a hand-rolled SSE reader. Digest cards (`components/DigestCard.tsx`) with category badge, urgency color, "Sources" expander rendering citation `subject` + quoted snippet.
- **~60 min checkpoint**: deploy to Vercel (log into vercel.com with GitHub, import the repo, paste `ANTHROPIC_API_KEY`). Capture the public URL into the README.
- **90-150 min**: Persona selector (Developer / Manager / Finance) calls the subagent router. "Refresh digest" button hits `/api/digest`. Sidebar widget reads `/api/cache-stats` for prompt-cache hit rate.
- **150-210 min**: Wire to the real agent endpoints (replace stubs). Loading states, errors. Confirm the hosted URL redeploys cleanly on each push.
- **210-end**: Visual polish — Tailwind tweaks, persona avatars, demo-friendly defaults so the judge's first frame looks impressive. Warm the hosted URL right before the demo.

### Human 3 — Demo + Content + Skills polish (human voice + judgment)
- **0-60 min**: Pair with Human 1 on seed email content. Write the actual email bodies — humans know what realistic complaint emails, KrisFlyer statements, and CI alerts look like. Specific numbers and dates judges can verify ("3,247 KrisFlyer points expiring May 18").
- **60-120 min**: Build the **demo script** — exact questions per persona, exact digest items the judges should see, the 3 "wow moment" interactions. Identify the visual hooks (citation popovers, thinking trace, cache metric, persona switch).
- **120-180 min**: Polish the `SKILL.md` files Claude generates — judges read these. Add concrete trigger examples, snippets, and screenshots to `invoice-splitter/SKILL.md`. Author the README pitch.
- **180-end**: Full dress rehearsal. Time the demo (target 3-4 min). Catch any gap and feed it back to Claude or the relevant human.

### Claude (me) — Next.js scaffold + agent core + subagents + custom MCP + Skills + hooks
This is the coding-heavy backend. I can ship many files in parallel.

- **0-45 min**: Scaffold Next.js (`npx create-next-app@latest pushtoprod --ts --tailwind --app --src-dir=false --eslint`). Add deps: `@anthropic-ai/claude-agent-sdk`, `@anthropic-ai/sdk`, `@modelcontextprotocol/sdk`, `ai` (Vercel AI SDK), `zod`. Write `EmailSource` interface, `FixtureEmailSource`, `fixtures/emails.json` skeleton (Human 3 fills bodies). Set up `.env.example`, `.gitignore` (with Gmail tokens excluded), `vercel.json` if needed. Push initial commit to GitHub. Confirm Human 2 can deploy a "hello" page to Vercel.
- **45-120 min**: Build the agent core in parallel:
  - `lib/secretary/agent.ts` — `ask(query, persona)` with streaming + citations, prompt caching on system prompt + email index.
  - `lib/secretary/digest.ts` — `digest(persona)` with extended thinking + strict `ActionItem` tool-use schema (zod-validated).
  - `lib/secretary/subagents/{developer,manager,finance}.ts` — three persona subagents with focused system prompts and tool allowlists.
  - `app/api/ask/route.ts` — POST handler, streams via SSE.
  - `app/api/digest/route.ts` — POST handler, returns structured items + thinking trace. `export const maxDuration = 60`.
  - `app/api/cache-stats/route.ts` — small helper for the cache-hit widget.
  - `bin/digest.ts` — `npx tsx bin/digest.ts --persona=X` for the SessionStart hook.
- **120-180 min**: Build the Claude-Code surface:
  - `mcp-servers/secretary/index.ts` — custom MCP server using `@modelcontextprotocol/sdk` with `mark_done`, `snooze`, `split_invoice`. Registered with the Agent SDK and addable to a user's Claude Code via `claude mcp add`.
  - `.claude/skills/invoice-splitter/SKILL.md` + handler — vision call on uploaded receipt, returns line items + N-way split.
  - `.claude/skills/digest-formatter/SKILL.md` — formatting guidance for `ActionItem[]` rendering.
  - `.claude/settings.json` — SessionStart hook calling `npx tsx bin/digest.ts`.
  - `.claude/commands/digest.md` — `/digest` slash command (only if time).
- **180-210 min**: Swap `FixtureEmailSource` for `GmailMCPEmailSource` once Human 1's Gmail MCP is up. Debug pagination, body parsing, label filters. Note: Gmail MCP runs locally only; the hosted Vercel deploy stays on fixtures.
- **210-end**: On standby for bug fixes the dress rehearsal surfaces.

---

## Critical Files To Create

```
pushtoprod/
├── app/
│   ├── page.tsx                              # Two-pane layout (Human 2)
│   ├── layout.tsx
│   ├── invoice-splitter/page.tsx             # Receipt upload + split UI
│   └── api/
│       ├── ask/route.ts                      # Streaming chat endpoint (Claude)
│       ├── digest/route.ts                   # Digest endpoint, maxDuration=60 (Claude)
│       └── cache-stats/route.ts              # Cache-hit metric for sidebar
├── components/
│   ├── DigestCard.tsx                        # (Human 2)
│   ├── ChatPane.tsx                          # (Human 2)
│   ├── PersonaSelector.tsx                   # (Human 2)
│   └── CitationExpander.tsx                  # (Human 2)
├── lib/
│   ├── secretary/
│   │   ├── agent.ts                          # ask() — streaming + citations
│   │   ├── digest.ts                         # extended thinking + tool-use schema
│   │   ├── prompts.ts                        # System prompts per persona
│   │   ├── subagents/
│   │   │   ├── developer.ts
│   │   │   ├── manager.ts
│   │   │   └── finance.ts
│   │   └── sources/
│   │       ├── base.ts                       # EmailSource interface
│   │       ├── fixtures.ts                   # FixtureEmailSource
│   │       └── gmail-mcp.ts                  # GmailMCPEmailSource (local-only)
│   └── stub-data.ts                          # Layout-time stubs (Human 2)
├── mcp-servers/
│   └── secretary/
│       ├── index.ts                          # Custom MCP: mark_done, snooze, split_invoice
│       └── package.json
├── bin/
│   └── digest.ts                             # `npx tsx bin/digest.ts` for SessionStart hook
├── fixtures/
│   └── emails.json                           # ~45 seeded emails
├── .claude/
│   ├── settings.json                         # SessionStart hook → bin/digest.ts
│   ├── skills/
│   │   ├── invoice-splitter/SKILL.md         # Vision skill
│   │   └── digest-formatter/SKILL.md         # Formatting skill
│   └── commands/
│       └── digest.md                         # /digest slash command (stretch)
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                               # (only if needed for function config)
└── .env.example                              # ANTHROPIC_API_KEY, GMAIL_* creds (local)
```

---

## Seed Email Catalogue (target ~45 emails)

Spread across personas so each demo persona has 3+ "hits" the agent can find:

- **Finance/HR (15 emails)**: KrisFlyer monthly statement, credit card bill due, electricity bill, insurance claim status update, insurance premium expiring, tax filing reminder, Amazon receipt, restaurant receipt, salary slip, HR insurance enrollment deadline, gym membership renewal, Netflix subscription, two utility bills, one bank fraud alert.
- **Manager (15 emails)**: 4 user bug reports for "CheckExcel" project, 3 for "ActionReadyBot", a few unread teammate questions awaiting reply, two PR review requests, a 1:1 reschedule, sprint planning notes, an escalation from a customer, two recruiter pings.
- **Developer (15 emails)**: GitHub PR comments, CI failure notifications (3 different services), AWS cost alert, password expiry warnings (2 different systems — server, npm token), a security advisory, a stale issue assigned to user, Datadog alert, on-call rotation reminder.

Vary `Date:` headers so "recent vs old" matters for the digest.

---

## Tech Choices (non-negotiable to save time)

- **Next.js 15 App Router + TypeScript + Tailwind** — UI + API routes in one codebase, deploys to Vercel out of the box.
- **`@anthropic-ai/claude-agent-sdk`** (TypeScript) — agent loop, subagents, MCP integration. Reference the `claude-api` skill for caching/tool-use patterns.
- **Vercel AI SDK (`ai` package)** — streaming UI hooks (`useChat`) save 30+ minutes of plumbing.
- **`@modelcontextprotocol/sdk`** — Node MCP server, ~50 lines for our 3 tools.
- **Local JSON fixtures** as the dev-time email source so nobody is blocked on Gmail MCP, and the hosted demo works without OAuth.
- **Single Anthropic API key** in `.env.local` and Vercel env vars. Sonnet 4.6 for chat (fast + cheap, streaming + citations + caching). Opus 4.7 for the digest call (extended thinking shines).
- **Prompt caching** on the system prompt + serialized email index — show the cache-hit metric in the sidebar.
- **`tsx`** for running TS scripts in `bin/` (the digest CLI for the SessionStart hook).

---

## De-risking Rules

1. **Fixtures first, Gmail second.** Nobody waits on Gmail MCP. Person B ships the agent against `fixtures/emails.json` in hour 1. Swap to live MCP in hour 3.
2. **Subagents are just system prompts + tool-allowlists.** Don't over-engineer — three `.md` system-prompt files behind a router function.
3. **Digest is one LLM call.** "Daily" = a button labeled "Generate today's digest." The SessionStart hook is for the Claude Code persona; don't build cron.
4. **Custom MCP server is one file, three tools, no auth.** If it eats more than 75 min, drop the `snooze` and `mark_done` tools and keep only `split_invoice`.
5. **Skills must be valid `SKILL.md` files** (frontmatter with name + description). If we ship anything but the proper format, judges won't recognize it as a Skill.
6. **Hard checkpoint at 3hr mark**: if Gmail MCP isn't working, demo with fixtures and frame it as "production would use Gmail MCP — here's the swap-in adapter."
7. **Cut order if behind**: drop `/digest` slash command first → drop `mark_done`/`snooze` MCP tools → drop sidebar cache-metric widget → drop developer-persona subagent (collapse to 2 personas). Never cut: citations, subagents, custom MCP, Skills, hooks, extended thinking on digest.
8. **Hosting must be live by 90-min mark**, even if pointing at a blank page. Deploying late risks a build failure with no time to debug. Get a known-good `Hello world` Next.js page on Vercel early, then iterate.
9. **Never commit Gmail credentials.** `credentials.json` and `token.json` go in `.gitignore` from commit one. Streamlit Cloud secrets only carries `ANTHROPIC_API_KEY`.

---

## Verification (run before demo)

1. `npm run dev` (then visit `localhost:3000`) — UI loads, chat + digest panes visible, persona selector works.
2. Fixture source: ask "how many KrisFlyer points do I have?" → streamed answer with **citation** rendered (subject + quoted snippet).
3. Fixture source: click "Generate digest" → 5+ structured action items via tool-use schema; **extended-thinking trace** expandable.
4. Switch persona to Developer → router invokes the developer **subagent**; digest re-prioritizes around CI failures, password expiries, AWS alerts.
5. Sidebar shows **prompt cache hit rate** climbing across turns.
6. Gmail MCP source: same checks against dummy inbox (or fall back to fixtures with the framing in de-risking rule #6).
7. Open Claude Code in the repo → **SessionStart hook** fires, prints today's digest into the session.
8. From Claude Code, invoke the **invoice-splitter Skill** with a receipt → returns split table (uses **vision**).
9. From the chat agent, call the **custom MCP** `mark_done` on a digest item → item disappears from the list.
10. Full demo script runs under 4 min, hits every Claude feature in the showcase table.
11. **Hosted URL** (e.g. `pushtoprod.vercel.app`) loads in an incognito window with no auth, runs the chat + digest against fixtures, returns sensible answers. README links to it prominently.

---

## Time Budget Summary

| Hour | Focus | Synchronization point |
|------|-------|------------------------|
| 0-1  | Scaffolding everywhere. Human 1 starts Gmail OAuth; Human 2 stubs UI; Human 3 drafts emails; Claude builds agent core + fixtures | At 60min: fixture format frozen so all parties code against same shape |
| 1-2  | Agent + UI working end-to-end on fixtures. Gmail OAuth done. Subagents wired. Digest returns structured items with citations | At 120min: dry-run #1 with fixture data. Cut decisions if behind |
| 2-3  | Gmail MCP swap-in. Persona switcher live. Custom MCP server up. Skills + hook authored | At 180min: dry-run #2 with live Gmail. Lock the demo script |
| 3-4  | Polish, dress rehearsal, buffer for Gmail auth bugs. README + Claude features list finalized | Final dry-run by 30min before submit |
