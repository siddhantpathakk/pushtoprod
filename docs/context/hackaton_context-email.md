You are working on the `email/` folder of the pushtoprod hackathon repo
(https://github.com/siddhantpathakk/pushtoprod). Read these files first
to ground yourself: README.md, email/README.md, docs/EXECUTION.md,
email/sources/base.ts, email/sources/fixtures.ts, email/sources/gmail-mcp.ts.

Your goal: replace the stub `GmailMCPEmailSource` so the app can read
real emails from a dummy Gmail inbox via the Gmail MCP server.

Steps in order:

1. Create a dummy Gmail account (or use one I provide). Enable the Gmail
   API in Google Cloud Console for that account. Generate OAuth 2.0
   credentials (Desktop app type) and download credentials.json. Place
   it in email/auth/credentials.json (already in .gitignore — never
   commit it).

2. Install a Gmail MCP server. Recommended:
   `npx @gongrzhe/server-gmail-autoauth-mcp` or
   `uvx mcp-server-gmail`. Verify it can list and fetch messages from
   the dummy inbox via stdio.

3. Implement `email/sources/gmail-mcp.ts`. The interface is in
   `email/sources/base.ts` — you must implement `list(opts)` and
   `get(id)` returning `Email[]` / `Email | null`. Connect to the Gmail
   MCP server using `@modelcontextprotocol/sdk` (already a dep). Spawn
   it as a child process over stdio. Map MCP tool responses to the
   `Email` type. Strip HTML, prefer plaintext bodies.

4. Update `email/sources/index.ts` if needed so
   `EMAIL_SOURCE=gmail-mcp` selects your new implementation.

5. Add ~5-10 realistic seed emails to the dummy inbox covering the
   personas in docs/EXECUTION.md (bills, KrisFlyer, password expiry,
   PR review, CI failure, customer bug report).

6. Smoke test: set EMAIL_SOURCE=gmail-mcp in .env.local, run
   `npm run dev`, hit POST http://localhost:3000/api/digest with body
   {"persona":"finance"} and confirm you get items derived from the
   real inbox (not fixtures).

Constraints:
- Only edit files inside email/. Don't touch backend/, frontend/,
  app/, or .claude/ — those are owned by other teammates.
- Never commit credentials.json or token.json.
- Hosted Vercel deploy will continue using fixtures (FixtureEmailSource)
  because OAuth is interactive — your work is for the live local demo.
- Keep imports portable: use `@email/...` aliases inside this folder.

Report back when /api/digest returns real-inbox results. Commit and
push with a message starting `feat(email):`.
 