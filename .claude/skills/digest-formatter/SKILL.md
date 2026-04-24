---
name: digest-formatter
description: Use when rendering a list of ActionItem objects (from the secretary's digest) as human-readable markdown for the terminal, a chat surface, or the SessionStart hook output. Groups by urgency, surfaces dates clearly, and keeps things scannable in <10 lines per persona.
---

# Digest Formatter

Format `ActionItem[]` (from `backend/digest.ts`) as terminal-friendly markdown.

## When to use

- Whenever the digest CLI emits items (e.g. via the SessionStart hook or
  `/digest` slash command).
- When a user asks "show me today's digest" inside Claude Code.

## ActionItem shape

```ts
type ActionItem = {
  id: string;
  title: string;
  category: "bill" | "expiring" | "unreplied" | "deadline" | "alert" | "task" | "other";
  due_date: string | null;        // ISO date YYYY-MM-DD
  source_email_id: string;
  urgency: "low" | "medium" | "high";
  reason: string;
};
```

## Output format

Group by urgency (high → medium → low). One line per item:

```
## Today's digest — Finance

🔴 HIGH
  • Pay credit card bill           due Apr 28   (S$842.30 — DBS statement)
  • Renew insurance policy         due Apr 30   (lapses if missed)

🟠 MEDIUM
  • 412 KrisFlyer miles expiring   May 18       (cannot be recovered)

🟢 LOW
  • Reply to Sarah re: PR review                (asked 2 days ago)
```

Rules:

- Use the emoji bullet (🔴/🟠/🟢) only on the urgency header line.
- Right-align due dates and reasons in a visually consistent column.
- If `due_date` is null, leave the column blank — don't write "no date".
- Keep total output under ~12 lines so it fits in a Claude Code session
  greeting without dominating the screen.

## When NOT to use

- Inside the web UI — `frontend/components/DigestCard.tsx` renders the cards
  directly from the JSON.
- For sending email/Slack — those want plain text without emoji.
