# Dummy Gmail Seed Emails — Office Use Cases

Total: 47 emails across 8 categories.

---

## 1. Vendor Invoices & Payables (8 emails)

| # | From | Subject | Key Data |
|---|------|---------|----------|
| 1 | AWS | Monthly usage invoice – April 2026 | $2,340.50, due 10 May |
| 2 | WeWork | Co-working space rental – May | $4,800.00, due 1 May |
| 3 | Grab for Business | Corporate rides invoice – April | $1,127.40, due 15 May |
| 4 | Canva Enterprise | Annual subscription renewal invoice | $960.00, due 5 May |
| 5 | Office Pantry Supplies (PantryMagic) | Monthly pantry restocking invoice | $385.00, due 8 May |
| 6 | Zoom | Zoom Business plan – payment failed | $249.90, retry in 3 days |
| 7 | Printing vendor (FujiXerox) | Bulk printing job invoice | $178.00, due 12 May |
| 8 | Corporate insurance broker (Marsh) | Company D&O insurance premium due | $3,200.00, due 31 May |

## 2. Expiring Licenses, Certs & Contracts (7 emails)

| # | From | Subject | Key Data |
|---|------|---------|----------|
| 9 | AWS | SSL certificate expiring for prod domain | Expires 5 May |
| 10 | JetBrains | IntelliJ team license expiring | 5 seats, expires 30 Apr |
| 11 | Figma | Team plan renewal reminder | Expires 15 May |
| 12 | GoDaddy | Domain renewal: yourcompany.io | Expires 1 Jun |
| 13 | DocuSign | Enterprise contract expiring | Renewal due 20 May |
| 14 | NDA reminder (Legal) | Vendor NDA with Acme Corp expiring | Expires 31 May |
| 15 | Microsoft 365 | Admin: 3 user licenses unused – review | Audit by 10 May |

## 3. Unreplied Emails / Pending Threads (8 emails)

| # | From | Subject | Key Data |
|---|------|---------|----------|
| 16 | Manager (Wei Liang) | Q2 headcount proposal – need your input | Sent 3 days ago |
| 17 | Colleague (Priya) | RE: Offsite venue options – vote needed | Sent 2 days ago |
| 18 | HR (Amanda) | Action required: Confirm updated job title | Sent 4 days ago |
| 19 | Client (James @ Acme) | Follow-up: API integration timeline? | Sent 1 day ago |
| 20 | Colleague (Darren) | RE: Code review for PR #247 | Requested 2 days ago |
| 21 | Vendor (Sarah @ DataDog) | Onboarding call — proposed slots | Sent 1 day ago, awaiting reply |
| 22 | Finance (Rachel) | RE: Missing receipt for Apr expense claim | Waiting for your attachment |
| 23 | Intern (Jun Wei) | Mentorship check-in — can we meet this week? | Sent yesterday |

## 4. Deadlines & Time-Sensitive Requests (7 emails)

| # | From | Subject | Key Data |
|---|------|---------|----------|
| 24 | Manager (Wei Liang) | Reminder: Board deck due Friday | Deadline 25 Apr |
| 25 | HR (Amanda) | Open enrollment for benefits closes tomorrow | Deadline 25 Apr |
| 26 | Finance (Rachel) | Q1 expense claims — submit by end of week | Deadline 27 Apr |
| 27 | IT Admin | Mandatory: Reset your SSO password by Friday | Deadline 25 Apr |
| 28 | Compliance | Annual data protection training overdue | Was due 20 Apr |
| 29 | Colleague (Priya) | Sprint retro action items – update by EOD | Due today |
| 30 | Conference (GovTech STACK) | Early-bird speaker registration closing | Price increase 28 Apr |

## 5. Internal Announcements & FYIs (5 emails)

| # | From | Subject | Key Data |
|---|------|---------|----------|
| 31 | CEO (Susan) | All-hands: Company Q1 results | Meeting 28 Apr, 3 PM |
| 32 | HR (Amanda) | New: Updated WFH policy effective May 1 | Policy change |
| 33 | IT Admin | Scheduled maintenance: VPN downtime Sat 2am–6am | Upcoming downtime |
| 34 | Office Admin (Lisa) | Pantry renovation — temp pantry at Level 3 | Logistics |
| 35 | Team Lead (Darren) | Welcome our new hire: Kai starts Monday | Introduction |

## 6. Newsletters / Low-Priority Noise (5 emails)

| # | From | Subject | Key Data |
|---|------|---------|----------|
| 36 | LinkedIn | "5 AI trends reshaping enterprise in 2026" | Newsletter |
| 37 | TechCrunch | Daily Digest | Newsletter |
| 38 | Confluence | Spaces you follow have been updated | Notification |
| 39 | Jira | Weekly summary: 12 issues updated | Notification |
| 40 | GitHub | Dependabot: 3 security advisories | Low-sev alerts |

## 7. Receipt / Bill Splitter Demos (3 emails)

| # | From | Subject | Key Data |
|---|------|---------|----------|
| 41 | Self-forwarded | Team dinner receipt — Burnt Ends | Image, $426 for 6 people |
| 42 | Colleague (Darren) | Client lunch receipt to split | Image, $187.50 for 4 people |
| 43 | Colleague (Priya) | Grab to client site — split fare | $38.00 for 2 people |

## 8. Miscellaneous Office Edge Cases (4 emails)

| # | From | Subject | Key Data |
|---|------|---------|----------|
| 44 | Corporate card (DBS Biz) | Your corporate card statement is ready | Statement, min payment $850 |
| 45 | Travel agent (FCM) | E-ticket confirmation: SIN→NRT team offsite | Flight 15 Jun, 4 pax, booking ref XYZ789 |
| 46 | Building management | Office access card renewal – expiring 30 Apr | Action needed |
| 47 | Recruiter (ext) | Candidate pipeline update for Eng role | 3 candidates shortlisted, interviews pending |

---

## Demo Query Mapping

- **"What invoices are due this week?"** → emails 1–8
- **"Any licenses expiring soon?"** → emails 9–15
- **"What haven't I replied to?"** → emails 16–23
- **"What deadlines do I have?"** → emails 24–30
- **Daily digest** → pulls across all categories, filters out noise (36–40)
- **Bill splitter** → emails 41–43
