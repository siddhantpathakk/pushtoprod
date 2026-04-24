# Person 1 — Agent + Skills (the "brain")
Set up Claude Agent SDK project, wire up Gmail MCP to dummy inbox
Build three skills as folders with SKILL.md:
email-query — answers natural-language questions over inbox
digest-generator — scans N days of email, extracts action items (bills, expiring items, unreplied threads, deadlines)
bill-splitter — takes a receipt image, splits among named people, outputs a summary
Test each skill via Claude Code locally before wiring to UI

# Person 2 — Frontend + UX (the "face")
Streamlit chat UI with two tabs: Chat and Today's Digest
Digest tab renders the JSON output from the digest skill as cards (due dates, action items, unreplied emails)
Simple, clean styling — aesthetics is a scoring criterion, don't ship default Streamlit
Deploy to Streamlit Cloud or Vercel early (day 1, even with stub data) so deployment isn't a last-minute blocker

# Person 3 — Workflow + Demo Assets (the "story")
- Seed the dummy Gmail account with ~30–50 realistic sample emails: bill reminders, KF points statement, expiring password alert, insurance renewal, unreplied work threads, a receipt photo for splitting
Build the GenSpark Workflow: daily cron → calls agent's digest endpoint → posts result to the UI backend / storage
Own all submission deliverables: GitHub README, architecture diagram, screenshots, 2-min demo video script + recording
Write the pitch narrative around three personas (dev / manager / finance) even if you only demo one deeply