# Clarion — Clarity from the Chaos

> The average knowledge worker juggles email, Slack, Teams, and a dozen notification channels. We built **Clarion** — an AI secretary that reads *all* of it and tells you what actually needs your attention.

---

## The Problem

Communication tools were supposed to make work easier. Instead, they multiplied the cognitive load. The modern employee doesn't have one inbox — they have five: email, Slack, Teams, project trackers, calendar notifications. Buried across all of them are unpaid invoices, expiring contracts, forgotten threads, missed deadlines, and action items that nobody wrote down.

The result: **professionals spend 28% of their workweek** (McKinsey) just managing messages. Not doing work — *deciding what work to do*. That's 11 hours a week of scanning, triaging, remembering, and following up — repetitive, error-prone, and entirely automatable.

No one needs another notification tool. They need an AI that reads *everything* for them, reasons about what's urgent, and delivers a single prioritized briefing every morning.

---

## Our Solution

**Clarion** is a unified AI chief-of-staff that ingests messages from across your communication channels — email, Teams, Slack — and converts them into structured, prioritized action items. One secretary. Every channel. Every to-do surfaced.

### 1. Chat With Your Messages
Ask questions in plain English across all your communication. Get answers with citations.

- *"What invoices are due this week?"* — pulls from email, returns the five pending bills with amounts, due dates, and links to the source.
- *"What haven't I replied to?"* — surfaces threads waiting on you across email *and* Teams, ranked by how long they've been waiting.
- *"Did anyone mention the Q2 budget in Slack this week?"* — searches across channels, not just your inbox.

Every answer cites the exact source message so you can verify in one click.

### 2. Daily Action-Item Digest
A proactive, structured briefing generated each morning — not a summary of *everything*, but a prioritized list of *what requires action*, pulled from every channel:

- **Bills & payments due** — amounts, deadlines, payment status (from email)
- **Expiring items** — SSL certs, software licenses, insurance policies, loyalty points (from email + alerts)
- **Unreplied threads** — people waiting on you across email, Teams, and Slack
- **Hard deadlines** — compliance training overdue, enrollment closing, board deck due Friday (from calendar + email + Teams)
- **Team action items** — to-dos derived from Teams/Slack messages that would otherwise be lost in the scroll

Items are color-coded by urgency (high / medium / low) and grouped by category. One glance replaces thirty minutes of inbox-and-channel scanning.

### 3. Universal Message Ingestion — Push Anything to the Secretary
Not every channel has an API connector yet. So we built a **universal intake interface**: a Claude Code skill and web interface where you can push the contents of *any* message — a Teams chat, a WhatsApp group, a voice memo transcript — and an LLM automatically derives the action items and adds them to the secretary's to-do database.

This means Clarion is **never limited by connector availability**. Even before we build a native Slack or Teams integration, users can feed it anything. The LLM does the hard work: parsing unstructured messages into structured `ActionItem` objects with due dates, urgency, and category.

**The architecture is channel-agnostic by design.** Email is our launch connector. Teams and Slack are next. But the to-do derivation engine works on *any text*, from any source, right now.

### 4. Bill Splitter (Stretch Skill)
Forward a restaurant receipt or invoice to the secretary. It uses **vision** to read line items off the image, computes the split, and returns a clean per-person breakdown — no manual data entry, no calculator app.

---

## Why This Matters for Organizations

| Pain Point | How We Solve It |
|---|---|
| **Repetitive internal work** | The digest automates daily message triage — the single most universal repetitive task in any company. No employee, from intern to CFO, escapes it. And it works across *every* channel, not just email. |
| **Team coordination** | Unreplied-thread detection across email *and* Teams ensures nothing falls through the cracks. Action items from Slack conversations — which are notoriously lost — get captured and tracked. |
| **Decision-making** | Structured, prioritized action items replace the cognitive load of scanning 5+ communication tools. The AI decides what needs attention *first*, not the overwhelmed human. |
| **Operational overhead** | Expiring license and contract detection prevents the silent failures that cost companies thousands — an SSL cert that lapsed, an insurance policy that auto-cancelled, an NDA that expired unnoticed. |
| **New ways of working with AI** | This isn't a chatbot bolted onto a workflow. It's an AI that *proactively* reads your data across channels, reasons about urgency, and delivers structured intelligence — a fundamentally new interaction pattern. The "push any message" interface means AI-powered triage is available for *every* communication tool from day one, even without a native connector. |

---

## Technical Architecture

```
[Gmail Inbox]  ──→  [Gmail MCP]  ──┐
[Teams / Slack] ──→  [Connector]  ──┤──→  [Claude Agent + Persona Subagents]  ──→  [Next.js Web UI]
[Manual Push]  ──→  [LLM Derive]  ──┘              ↑
                                          [Custom MCP Server]
                                          [Skills: Invoice Splitter, Digest Formatter]
                                          [SessionStart Hook: Auto-digest in Claude Code]
                                                    ↓
                                          [Action Item Database]
```

**Key insight:** All channels funnel into a single `ActionItem` database. The digest and chat features query the database, not the individual channels. This means adding a new channel is an adapter — not a rewrite.

The "manual push" path is the critical fallback: any message content pushed via the web interface or Claude Code skill gets processed by an LLM that extracts structured to-dos (title, due date, urgency, category) and writes them to the same database. **No connector needed.**

### Claude Feature Stack (13 features in one project)

We didn't just use Claude — we used *every major Claude capability* in a single, cohesive product:

| # | Feature | How It's Used |
|---|---------|---------------|
| 1 | **Claude Agent SDK** | Core agent loop — orchestrates email tools, MCP, subagents |
| 2 | **MCP (Gmail)** | Live email ingestion via the official Gmail MCP server |
| 3 | **MCP (Custom)** | Our own Node MCP server with `mark_done`, `snooze`, `split_invoice` tools |
| 4 | **Subagents** | Three persona subagents (Developer / Manager / Finance) behind a router — same data, different priorities |
| 5 | **Skills** | `invoice-splitter` (vision + math) and `digest-formatter` (structured rendering) as proper SKILL.md modules |
| 6 | **Hooks** | SessionStart hook auto-runs today's digest when you open Claude Code |
| 7 | **Prompt Caching** | System prompt + message index cached across turns — visible cache-hit metric in the UI |
| 8 | **Extended Thinking** | Digest generation uses extended thinking for deeper reasoning about urgency and deadlines |
| 9 | **Tool Use + Structured Output** | Digest returns a strict `ActionItem[]` schema via Zod-validated tool calls |
| 10 | **Citations** | Every chat answer cites the source message — subject line + quoted snippet |
| 11 | **Vision** | Invoice splitter reads line items directly from receipt images |
| 12 | **Streaming** | Chat responses stream via SSE for real-time feel |
| 13 | **Slash Commands** | `/digest` command for quick access inside Claude Code |

### Stack

- **Next.js 15** (App Router + TypeScript + Tailwind) — deployed to **Vercel**
- **Anthropic SDK + Claude Agent SDK** — agent core with streaming, caching, and structured output
- **MCP Protocol** — Gmail MCP + custom secretary MCP server
- **Vercel AI SDK** — streaming UI hooks for real-time chat
- **LLM-powered to-do derivation** — converts unstructured message text from any source into structured action items

---

## Hitting the Judging Criteria

### Technicality
This is not a prompt wrapper. It's a fully functional multi-channel agent system with:
- A real MCP integration reading live email from a Gmail inbox
- A custom MCP server implementing domain-specific tools (`mark_done`, `snooze`, `split_invoice`)
- Three persona subagents with distinct system prompts and tool allowlists
- An LLM-powered message-to-todo pipeline that works on arbitrary text input
- Structured output via tool-use schemas, not string parsing
- Prompt caching with measurable hit rates
- Extended thinking for complex urgency reasoning

We use **13 distinct Claude platform features** — more than most production applications, built in a single hackathon sprint.

### Originality
Most email AI demos do one thing: summarize a single inbox. We do three things differently:

1. **Multi-channel by design.** Email is the starting connector, but the architecture treats all communication channels as equal sources feeding one action-item database. The "push any message" interface means the secretary works across Teams, Slack, WhatsApp, or anything else — *today* — without waiting for native connectors.

2. **"Skills as Personas."** The same agent, loaded with different skill configurations, serves entirely different roles:
   - A **Finance persona** that prioritizes bills, insurance, and expense deadlines
   - A **Manager persona** that surfaces unreplied threads, team blockers, and escalations
   - A **Developer persona** that flags CI failures, expiring tokens, and security advisories

   This isn't three separate bots — it's one secretary that adapts its priorities based on who you are.

3. **LLM-derived to-dos from raw messages.** Paste a Teams thread into the secretary and it doesn't just store it — it *reads* it, identifies the action items, assigns urgency and due dates, and adds them to your structured briefing. This is the bridge between unstructured workplace chat and structured task management.

### Practicality
**This solves the most universal productivity problem in every company on earth.** Every employee has an inbox. Every employee has Teams or Slack. Every employee wastes hours triaging across these channels. Clarion eliminates that overhead entirely.

- Deployed as a **web app** accessible from any browser — no install, no setup
- Works with **any Gmail inbox** via OAuth — connect once, done
- The digest runs **proactively** — you don't even have to ask
- The manual push interface means **zero dependency on connector readiness** — any team can start using this immediately by pasting their messages in
- Bill splitting handles a real, recurring annoyance (team dinners, shared expenses) that people currently solve with calculators and spreadsheets
- The fixture-based fallback means the demo works reliably even without live Gmail — judges can interact with it immediately

**The ROI is immediate and obvious.** If the secretary saves 30 minutes of message triage per day, that's **130 hours per employee per year** — returned to actual work. For a 100-person company, that's **13,000 hours recovered annually**.

### Aesthetics
- Custom-styled Next.js UI with Tailwind — not default Streamlit, not a terminal dump
- Two-pane layout: digest cards on the left, chat on the right
- Urgency color-coding (red / orange / green) for instant visual parsing
- Citation expanders show the source message inline
- Persona selector with distinct visual identity per role
- Loading states, streaming indicators, and polished error handling
- Extended thinking trace is expandable for the curious, hidden for the casual user

### Wow Factor
**Four moments designed to make judges sit up:**

1. **Multi-channel secretary** — this isn't "yet another email summarizer." It's a secretary that works across *all* your communication tools. Push a Teams message in, watch the LLM derive the to-do, see it appear in your next digest alongside your email action items. One unified briefing from every channel.

2. **"Skills as Personas"** — switch from Finance to Developer mid-demo and watch the entire digest reprioritize around a completely different set of concerns. Same data, same agent, radically different output. This is what extensible AI looks like.

3. **Live message pickup** — send a new email to the inbox *during the demo*, refresh the digest, and watch the agent pick it up and categorize it in real time. Not canned. Not cached. Live.

4. **Receipt vision** — take a photo of a dinner receipt, upload it, and get an itemized per-person split in seconds. It's visual, it's tangible, and it makes the audience go *"I want that."*

---

## The Bigger Picture

Clarion is a proof of concept for something we believe every organization will have within two years: **AI staff that operate across your entire communication layer.**

Email today. Teams and Slack via the push interface today, native connectors tomorrow. Calendar, project trackers, and CRM after that. The MCP-based, channel-agnostic architecture means each new source is an adapter change, not a rewrite. The LLM-powered to-do derivation engine means users don't have to wait for engineering to build connectors — they can push anything to the secretary right now.

We're not building a better inbox UI. We're building the first employee that reads every message across every channel, never forgets a deadline, and briefs you every morning on exactly what needs your attention.

**That's not incremental improvement. That's a new way of working.**

---

## Future Work — GenSpark Workflow for Slack Integration

Our next milestone is **native Slack ingestion via GenSpark Claw**, turning the "push any message" manual path into a fully automated pipeline:

```
[Slack Workspace] ──→ [GenSpark Claw Workflow] ──→ [Clarion /api/push endpoint]
                         (scheduled / event-triggered)          ↓
                                                     [LLM To-Do Derivation]
                                                          ↓
                                                   [ActionItem Database]
```

**How it works:**

1. **GenSpark Claw connects to the team's Slack workspace** — using its native Slack integration, no custom OAuth or bot setup required.
2. **A GenSpark workflow triggers on a schedule** (e.g., every morning before the digest runs) or on new-message events in designated channels.
3. **The workflow forwards message content** to Clarion's universal intake API endpoint (`/api/push`), which already accepts raw text from any source.
4. **Clarion's LLM derivation engine** parses the Slack messages into structured `ActionItem` objects — the same pipeline that handles manually pushed messages today.
5. **Action items appear in the next digest** alongside email items, unified in one briefing.

**Why GenSpark instead of a direct Slack API integration:**

- **Zero connector code** — GenSpark handles Slack auth, pagination, rate limits, and message formatting. We write no Slack API code.
- **Multi-channel extensibility** — the same GenSpark workflow pattern extends to Teams, WhatsApp, and Notion without building separate adapters for each.
- **Scheduled + event-driven** — GenSpark supports both cron-style triggers and real-time event hooks, so the digest can be both proactive (morning briefing) and reactive (urgent message alert).
- **Fits our architecture** — Clarion is deliberately channel-agnostic. GenSpark acts as the "adapter layer" our architecture diagram already anticipates, feeding into the same `ActionItem` database via the same LLM derivation path.

**Planned timeline:** Slack via GenSpark is the first post-hackathon integration, followed by Microsoft Teams and calendar sources using the same workflow pattern.

---

## Team

Built by a team of 3 in a single hackathon sprint at **Push to Prod — Singapore**.

| Role | Focus |
|------|-------|
| **Person 1** — The Brain | Agent SDK, Gmail MCP integration, skill development |
| **Person 2** — The Face | Next.js UI, streaming chat, digest cards, visual polish |
| **Person 3** — The Story | Seed data, demo script, workflow, submission deliverables |

---

## Try It

**Live demo:** [pushtoprod.vercel.app](https://pushtoprod.vercel.app)
**GitHub:** [github.com/siddhantpathakk/pushtoprod](https://github.com/siddhantpathakk/pushtoprod)
