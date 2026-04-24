# Fixtures

`emails.json` is a seeded inbox used by `FixtureEmailSource` so the hosted demo
works without Gmail OAuth. Target ~45 emails total.

## Schema

See `lib/secretary/sources/base.ts` for the `Email` type. Required fields:
`id`, `threadId`, `from`, `to`, `subject`, `date` (ISO 8601), `snippet`, `body`,
`labels` (string[]), `unread` (boolean).

## Coverage targets (Human 3 to fill)

- **Finance/HR (~15)**: bills, KrisFlyer, insurance, tax, salary, subscriptions.
- **Manager (~15)**: bug reports (CheckExcel, ActionReadyBot), unreplied teammates,
  PR review requests, escalations, recruiter pings.
- **Developer (~15)**: GitHub PR comments, CI failures, AWS cost alerts, password
  expiry, security advisories, on-call.

Vary `date` headers across the last 14 days so urgency reasoning has signal.
