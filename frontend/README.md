# frontend/

**Owner:** Human 2 (UI / UX)

React components, hooks, and stub data used by the Next.js `app/` directory.

## Layout

| File | Purpose |
|---|---|
| `stub-data.ts` | Hardcoded `Answer` and `ActionItem[]` for layout work |
| `components/` | Cards, chat pane, persona selector, citation expander (TBD) |

## Where do pages live?

Pages and API routes are in `app/` at the root (Next.js requires this). Those
files are **thin** — they import functionality from `@frontend/*` (UI) and
`@backend/*` (logic). When you add components, drop them in this folder and
import from `@frontend/components/...`.

## Imports

- `import ... from "@frontend/stub-data"` — UI stubs
- `import { ActionItem, Answer, Citation } from "@backend/types"` — shared types

## Environment

None directly. Hits `/api/ask`, `/api/digest`, `/api/cache-stats` server-side.
