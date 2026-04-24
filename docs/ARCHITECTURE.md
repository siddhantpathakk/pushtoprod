# Clarion — Architecture

> An AI chief-of-staff that reads your messages across channels and turns them
> into a single prioritized action-item briefing. Built for **Push to Prod —
> Singapore**.

---

## 1. What We Built

**Two user-facing features, one engine underneath:**

1. **Chat with your mailbox** — natural-language Q&A over inbox content, every
   answer cited back to the source email.
2. **Daily action-item digest** — bills, expiring items, unreplied threads,
   deadlines — surfaced proactively, prioritized per persona
   (Developer / Manager / Finance).

Plus a **bill-splitter** stretch skill: upload a receipt photo, get a
per-person split via Claude vision.

---

## 2. High-Level Architecture

```mermaid
flowchart LR
    subgraph Sources["Message Sources"]
        GMAIL[Gmail Inbox]
        FIX[Fixture JSON<br/>demo fallback]
        PUSH[Manual Push<br/>any text]
    end

    subgraph Ingest["Ingestion Layer"]
        GMCP[Gmail MCP<br/>official server]
        FSRC[FixtureEmailSource]
        DERIVE[LLM To-Do Derivation]
    end

    subgraph Core["Agent Core — Next.js API routes"]
        ROUTER[Persona Router]
        AGENT[Claude Agent SDK<br/>streaming + caching]
        SUB[Subagents<br/>Dev / Manager / Finance]
        CMCP[Custom MCP Server<br/>mark_done / snooze / split_invoice]
        SKILLS[Skills<br/>invoice-splitter<br/>digest-formatter]
    end

    subgraph Store["State"]
        ADB[(Action Item DB)]
        CACHE[(Prompt Cache)]
    end

    subgraph UI["Next.js 15 Web UI"]
        CHAT[Chat Pane<br/>SSE streaming]
        DIGEST[Digest Cards<br/>urgency color-coded]
        SPLIT[Receipt Uploader]
    end

    GMAIL --> GMCP
    FIX --> FSRC
    PUSH --> DERIVE

    GMCP --> AGENT
    FSRC --> AGENT
    DERIVE --> ADB

    ROUTER --> SUB
    SUB --> AGENT
    AGENT <--> CMCP
    AGENT <--> SKILLS
    AGENT <--> CACHE
    AGENT --> ADB

    ADB --> DIGEST
    AGENT --> CHAT
    SKILLS --> SPLIT

    CHAT --> ROUTER
    DIGEST --> ROUTER
    SPLIT --> ROUTER
```

**Key insight — channel-agnostic by design.** All sources funnel into one
`ActionItem` database. Email is the launch connector; Teams / Slack land via
the manual-push path today and native connectors tomorrow. Adding a channel is
an adapter, not a rewrite.

---

## 3. Request Flow — Chat

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Next.js UI
    participant API as /api/ask (SSE)
    participant R as Persona Router
    participant A as Claude Agent SDK
    participant M as Gmail MCP
    participant C as Claude API

    U->>UI: "What invoices are due this week?"
    UI->>API: POST (stream)
    API->>R: route(persona, query)
    R->>A: run with Finance subagent
    A->>C: messages.create (cached system prompt)
    C-->>A: tool_use: search_emails
    A->>M: search_emails(query)
    M-->>A: matching messages
    A->>C: messages.create (tool_result)
    C-->>A: answer + citations
    A-->>API: stream tokens
    API-->>UI: SSE chunks
    UI-->>U: rendered answer + citation expanders
```

---

## 4. Request Flow — Daily Digest

```mermaid
sequenceDiagram
    participant H as SessionStart Hook
    participant D as digest.ts
    participant A as Claude Agent SDK
    participant C as Claude API (extended thinking)
    participant Z as Zod Validator
    participant DB as Action Item DB
    participant UI as Digest Cards

    H->>D: trigger on session open
    D->>A: generate digest (persona)
    A->>C: messages.create + thinking + tool_use schema
    C-->>A: ActionItem[] (structured tool call)
    A->>Z: validate schema
    Z-->>A: typed ActionItem[]
    A->>DB: upsert items
    DB->>UI: render grouped by urgency
```

---

## 5. Tech Stack

### Frontend
| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router) |
| Language | **TypeScript** |
| Styling | **Tailwind v4** |
| Streaming UI | **Vercel AI SDK** (`ai`, `@ai-sdk/anthropic`) |
| Markdown | `react-markdown` + `remark-gfm` |
| Deploy | **Vercel** |

### Agent / Backend
| Layer | Choice |
|---|---|
| Agent loop | **Claude Agent SDK** |
| Model SDK | **Anthropic SDK** (`@anthropic-ai/sdk`) |
| Models | **Claude Opus 4.7** (reasoning) / **Sonnet 4.6** (chat) / **Haiku 4.5** (fast paths) |
| Protocol | **MCP** (`@modelcontextprotocol/sdk`) |
| Schema validation | **Zod v4** |
| Runtime | **Node.js** on Vercel edge/serverless |

### Integrations
| Source | Method |
|---|---|
| Gmail | Official **Gmail MCP server** via OAuth |
| Custom tools | **Custom Node MCP server** (`mark_done`, `snooze`, `split_invoice`) |
| Fixtures | `FixtureEmailSource` (JSON, demo fallback) |
| Auth | `google-auth` + `google-auth-oauthlib` (Python-side setup) |

---

## 6. Claude Feature Map — 13 in One Project

```mermaid
mindmap
  root((Clarion))
    Agent
      Agent SDK
      Subagents<br/>Dev / Mgr / Finance
      Persona Router
    Protocol
      Gmail MCP
      Custom MCP Server
    Skills
      invoice-splitter
      digest-formatter
    Hooks
      SessionStart auto-digest
      /digest slash command
    Model
      Prompt Caching
      Extended Thinking
      Streaming SSE
      Vision (receipts)
    Output
      Tool Use<br/>structured ActionItem
      Citations<br/>subject + snippet
```

| # | Feature | Where |
|---|---|---|
| 1 | Claude Agent SDK | `backend/agent.ts` |
| 2 | MCP — Gmail | `email/sources/gmail-mcp.ts` |
| 3 | MCP — Custom | `mcp-servers/secretary/` |
| 4 | Subagents | `backend/subagents/` |
| 5 | Skills | `.claude/skills/{invoice-splitter,digest-formatter}/` |
| 6 | Hooks | `.claude/settings.json` (SessionStart) |
| 7 | Prompt Caching | system prompt + email index |
| 8 | Extended Thinking | `backend/digest.ts` |
| 9 | Tool Use + Structured Output | `ActionItem` Zod schema |
| 10 | Citations | every chat answer |
| 11 | Vision | invoice splitter |
| 12 | Streaming | `/api/ask` SSE |
| 13 | Slash Commands | `.claude/commands/digest.md` |

---

## 7. Repo Layout

```
backend/        Agent core, digest, prompts, subagents
email/          EmailSource interface, Gmail MCP, fixtures
frontend/       React components, hooks, stub data
app/            Next.js pages + API routes (thin delegators)
mcp-servers/    Custom secretary MCP server
lib/            Shared utilities
.claude/        Skills, hooks, slash commands
docs/           Plan, execution, this diagram
```

Cross-folder imports go through TS path aliases — `@backend/*`,
`@email/*`, `@frontend/*` — so owners can work without stepping on each other.

---

## 8. Why This Architecture Wins

- **Channel-agnostic.** One `ActionItem` schema, many adapters. Email ships
  today; Teams / Slack drop in as adapters.
- **Persona as skill composition.** Same agent, different subagent + skill
  loadout = radically different output. One secretary, many roles.
- **Graceful fallback.** Fixture source means the demo works offline and
  Gmail OAuth is not on the critical path for judges.
- **Every Claude capability, composed.** 13 platform features wired into a
  single coherent product — not a feature checklist, a working system.
