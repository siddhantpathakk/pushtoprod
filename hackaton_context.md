# Hackathon Project Context & Plan — AI Personal Secretary

## Event Context

**Hackathon:** Push to Prod — Singapore, in-person sprint
**Focus:** Solving real internal workflow problems with AI

**What the event is looking for:**
- Automating repetitive internal work
- Improving team coordination and decision-making
- Reducing operational overhead
- Unlocking new ways of working with AI inside organizations

**Judging criteria:**
- **Technicality** — Is the project functional? Does it justify the hackathon duration?
- **Originality** — How innovative? Does it bring a fresh perspective?
- **Practicality** — Is it useful and accessible (Mobile/Web/Desktop)?
- **Aesthetics** — How is the UI/UX? Intuitive and user-friendly?
- **Wow Factor** — Does it have a unique standout aspect?

**Submission requirements:**
- Project description
- Problem statement and challenges faced
- Public GitHub repo
- At least one snapshot/display image
- 2-minute demo video (highly recommended)
- **Compulsory:** Link to deployed demo

**Team size:** 3 people

---

## Project Concept — "AI Personal Secretary"

A personal AI secretary that monitors your inbox and surfaces what matters — a "Jarvis for your email." It handles the tedious cognitive overhead of inbox triage so users can focus on actual work.

### Core Features (MVP)

1. **Chat with your mailbox** — Natural language Q&A over email content.
   - Example: "How many KrisFlyer points do I have?" → agent reads relevant emails and answers
   - Example: "What bills are due this week?" → extracts and summarizes
2. **Daily action-item digest** — Proactively surfaces:
   - Unpaid bills and due dates
   - Expiring items (passwords, subscriptions, insurance, loyalty points)
   - Unreplied emails and pending threads
   - Deadlines and time-sensitive requests

### Stretch Skill (shows extensibility)

3. **Bill splitter** — Upload a receipt image, split costs among named people, output itemized summary. Visually demo-friendly, uses vision capability.

### Explicitly Out of Scope

- Real Outlook/Teams integration (mention as future work)
- Slack connector (mention as future work)
- Debug/log analysis persona
- File organizer (mention, don't build)
- Agent evaluation framework (abandoned — too developer-niche)

### Pitch Angle

**"Skills as personas"** — the same agent loaded with different skills serves different roles (developer / manager / finance). This is the differentiation story that most hackathon email-assistant projects won't have.

---

## Architecture

```
[Dummy Gmail] → [Gmail MCP] → [Claude Agent + Skills] → [Web UI]
                                       ↑
                           [GenSpark Workflow: daily cron]
```

**Stack:**
- **Claude Agent SDK** (or Claude Code in headless mode) — secretary runtime
- **Claude Skills** — each capability as a SKILL.md folder, swappable and demo-able
- **Gmail MCP** — read access to a dummy Gmail seeded with sample emails
- **GenSpark Workflow** — scheduled trigger for the daily digest (solves the "hook" / incoming webhook problem)
- **Frontend** — Streamlit or Next.js chat UI (team's choice by familiarity)
- **Deployment** — Vercel / Streamlit Cloud / Railway for UI; agent runs server-side

---

## Team Split (3 parallel tracks)

### Person 1 — Agent + Skills ("the brain")
- Set up Claude Agent SDK project, wire Gmail MCP to dummy inbox
- Build three skills as SKILL.md folders:
  - `email-query` — natural-language Q&A over inbox
  - `digest-generator` — scans N days of email, extracts action items
  - `bill-splitter` — receipt image → split summary
- Validate each skill via Claude Code locally before UI integration

### Person 2 — Frontend + UX ("the face")
- Streamlit (or Next.js) chat UI with two tabs: **Chat** and **Today's Digest**
- Digest tab renders structured JSON from the digest skill as cards
- Clean, intentional styling — **aesthetics is a scoring criterion, don't ship defaults**
- **Deploy on Day 1** (even with stub data) so deployment isn't a last-minute blocker

### Person 3 — Workflow + Demo Assets ("the story")
- Seed dummy Gmail with 30–50 realistic emails: bill reminders, KF points statement, expiring password alert, insurance renewal, unreplied work threads, a receipt photo
- Build GenSpark Workflow: daily cron → agent's digest endpoint → UI backend/storage
- Own all submission deliverables: README, architecture diagram, screenshots, 2-min demo video (script + recording)
- Write pitch narrative around three personas (dev / manager / finance), demo one deeply

---

## Timeline

| Phase | Hours | Focus |
|-------|-------|-------|
| Align & scaffold | 0–2 | Scope lock, seed Gmail, repos up, empty UI deployed |
| Parallel build | 2–10 | P1: email-query + digest via CLI. P2: UI with mocked responses. P3: GenSpark workflow with fake payload |
| Integration | 10–16 | Wire real agent to real UI. P3 builds bill-splitter (self-contained). P1 tunes digest quality |
| Polish | 16–20 | UI aesthetics, prompt tuning, edge cases, demo video recording |
| Buffer & submit | 20–end | README, screenshots, submission form. **No new features.** |

---

## Hitting the Scoring Criteria

- **Technicality** — Real agent + MCP + skills + scheduled workflow. Not a prompt wrapper.
- **Originality** — "Skills as personas" framing; different role contexts swap skill sets.
- **Practicality** — Deployed web app, browser-accessible, solves universal pain (inbox overwhelm).
- **Aesthetics** — Dedicated UI polish time from Person 2.
- **Wow factor** — **Live demo:** receive a new email during the pitch, agent picks it up in the next digest refresh. Rehearse this.

---

## Critical Gotchas

- **Gmail MCP auth can eat hours.** Person 1 validates MCP against dummy account in the first 90 minutes. Fallback: Gmail API with service account.
- **Deploy early, deploy often.** The compulsory deployed demo link has killed submissions before.
- **Don't connect real inboxes.** Stay disciplined if anyone suggests it mid-sprint.
- **Skills must be genuinely modular.** If digest only works via hardcoded agent logic, the extensibility story collapses.
- **Scope discipline.** No features after hour 20. Period.

---

## Open Questions / Next Artifacts to Produce

- SKILL.md drafts for `email-query`, `digest-generator`, `bill-splitter`
- GenSpark Workflow specification
- Dummy Gmail seed data (email content templates)
- Demo video script
- README / architecture diagram