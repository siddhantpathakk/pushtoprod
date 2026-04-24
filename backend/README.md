# backend/

**Owner:** Claude (agent core) — humans please coordinate before editing.

The agentic part of the system. Pure TypeScript modules called by Next.js API
routes in `app/api/`.

## Layout

| File | Purpose |
|---|---|
| `agent.ts` | `ask(query, persona)` — chat with citations + caching |
| `digest.ts` | `digest(persona)` — extended thinking + tool-use schema |
| `prompts.ts` | Persona system prompts |
| `types.ts` | `Answer`, `Citation`, `ActionItem` zod schemas |
| `anthropic.ts` | SDK client + cache-stats counter |
| `documents.ts` | Convert `Email[]` → Claude document blocks for citations |
| `subagents/` | Persona subagent definitions |

## Imports

- `import ... from "@backend/agent"` — from anywhere
- `import ... from "@email/sources"` — for the EmailSource interface

## Environment

- `ANTHROPIC_API_KEY` (required)
