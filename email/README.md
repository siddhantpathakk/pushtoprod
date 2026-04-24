# email/

**Owner:** Human 1 (Gmail + Data) and Human 3 (fixture content)

Everything email-related: the `EmailSource` interface, the fixture inbox, the
Gmail OAuth helpers, and the Gmail MCP adapter.

## Layout

| Path | Purpose | Owner |
|---|---|---|
| `sources/base.ts` | `Email` type + `EmailSource` interface | Human 1 |
| `sources/fixtures.ts` | `FixtureEmailSource` (reads `email/fixtures/emails.json`) | Human 1 |
| `sources/gmail-mcp.ts` | `GmailMCPEmailSource` (live Gmail via MCP) | Human 1 |
| `sources/index.ts` | `getEmailSource()` factory — picks based on `EMAIL_SOURCE` env | Human 1 |
| `fixtures/emails.json` | Seeded inbox (~45 emails target, currently 6) | Human 3 |
| `fixtures/README.md` | Fixture content guidance | Human 3 |
| `auth/` | Gmail OAuth client setup | Human 1 |

## Environment

- `EMAIL_SOURCE=fixtures` (default, hosted-safe) or `gmail-mcp` (local only)
- `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_OAUTH_REFRESH_TOKEN` (for `gmail-mcp` mode)

## Imports

- `import { getEmailSource } from "@email/sources"` — used by backend
