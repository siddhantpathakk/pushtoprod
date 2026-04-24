"""
Send seed emails to a dummy Gmail inbox for the AI Personal Secretary demo.

Setup:
  1. Go to https://console.cloud.google.com
  2. Enable the Gmail API
  3. Create OAuth 2.0 credentials (Desktop app)
  4. Download the JSON and save as `credentials.json` in this directory
  5. pip install google-auth google-auth-oauthlib google-api-python-client
  6. Run: python gmail_client.py --to your-dummy@gmail.com

On first run it opens a browser for OAuth consent. A token.json is saved for
subsequent runs.
"""

import argparse
import base64
import json
import os
import time
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]
TOKEN_PATH = Path(__file__).parent / "token.json"
CREDS_PATH = Path(__file__).resolve().parent.parent / "email" / "fixtures" / "credentials.json"


def get_gmail_service():
    creds = None
    if TOKEN_PATH.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CREDS_PATH), SCOPES)
            creds = flow.run_local_server(port=50221)
        TOKEN_PATH.write_text(creds.to_json())
    return build("gmail", "v1", credentials=creds)


def send_email(service, to_addr: str, from_name: str, subject: str, body: str):
    """Send a single email via the Gmail API."""
    msg = MIMEText(body)
    msg["to"] = to_addr
    msg["from"] = f"{from_name} <{to_addr}>"
    msg["subject"] = subject
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    service.users().messages().send(userId="me", body={"raw": raw}).execute()


# ---------------------------------------------------------------------------
# Seed emails — all office / work context
# ---------------------------------------------------------------------------

def _d(days_ago: int) -> str:
    """ISO date string for N days ago."""
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime(
        "%a, %d %b %Y %H:%M:%S +0000"
    )


EMAILS = [
    # ── 1. Vendor Invoices & Payables ────────────────────────────────────
    {
        "from_name": "AWS Billing",
        "subject": "AWS Invoice — April 2026 (Account: 1234-5678-9012)",
        "body": (
            "Hello,\n\n"
            "Your AWS invoice for April 2026 is now available.\n\n"
            "Total amount due: USD 2,340.50\n"
            "Payment due date: 10 May 2026\n"
            "Account ID: 1234-5678-9012\n\n"
            "You can view and pay your bill in the AWS Billing Console:\n"
            "https://console.aws.amazon.com/billing\n\n"
            "Thank you,\nAmazon Web Services"
        ),
    },
    {
        "from_name": "WeWork",
        "subject": "Invoice #WW-88214 — May 2026 Office Rental",
        "body": (
            "Hi,\n\n"
            "Please find your invoice for May 2026:\n\n"
            "Location: WeWork Beach Centre, Level 8\n"
            "Dedicated desks × 6: S$4,800.00\n"
            "Due date: 1 May 2026\n\n"
            "Pay via bank transfer to the account listed in the attached PDF.\n\n"
            "Regards,\nWeWork Billing"
        ),
    },
    {
        "from_name": "Grab for Business",
        "subject": "Corporate rides invoice — April 2026",
        "body": (
            "Hi Admin,\n\n"
            "Your Grab for Business corporate rides summary for April 2026:\n\n"
            "Total trips: 47\n"
            "Total amount: S$1,127.40\n"
            "Payment due: 15 May 2026\n\n"
            "Download the detailed breakdown from your Grab for Business dashboard.\n\n"
            "Thanks,\nGrab for Business"
        ),
    },
    {
        "from_name": "Canva Enterprise",
        "subject": "Your Canva Enterprise renewal invoice — S$960.00",
        "body": (
            "Hi,\n\n"
            "Your annual Canva Enterprise subscription is up for renewal.\n\n"
            "Plan: Canva Enterprise (10 seats)\n"
            "Amount: S$960.00\n"
            "Due date: 5 May 2026\n\n"
            "Renew now to avoid interruption to your team's access.\n\n"
            "Best,\nCanva Team"
        ),
    },
    {
        "from_name": "PantryMagic",
        "subject": "Invoice #PM-4421 — April pantry restocking",
        "body": (
            "Hello,\n\n"
            "Your monthly office pantry restocking invoice:\n\n"
            "Coffee beans (2kg × 3): $90.00\n"
            "Assorted snacks: $145.00\n"
            "Beverages: $95.00\n"
            "Delivery: $15.00\n"
            "Cleaning supplies: $40.00\n"
            "Total: S$385.00\n"
            "Due: 8 May 2026\n\n"
            "Thanks for your business!\nPantryMagic"
        ),
    },
    {
        "from_name": "Zoom Billing",
        "subject": "Payment failed — Zoom Business plan",
        "body": (
            "Hi,\n\n"
            "We were unable to process your payment for Zoom Business.\n\n"
            "Plan: Zoom Business (15 hosts)\n"
            "Amount: S$249.90/month\n"
            "Card ending in: 4829\n\n"
            "We'll retry the charge in 3 days. Please update your payment method "
            "to avoid service interruption.\n\n"
            "— Zoom Billing"
        ),
    },
    {
        "from_name": "FujiXerox",
        "subject": "Invoice #FX-92101 — Bulk printing job",
        "body": (
            "Dear Customer,\n\n"
            "Invoice for your recent bulk printing order:\n\n"
            "Job: Q1 2026 investor report (200 copies, colour, bound)\n"
            "Total: S$178.00\n"
            "Due: 12 May 2026\n\n"
            "Payment terms: NET 30.\n\n"
            "Regards,\nFuji Xerox Singapore"
        ),
    },
    {
        "from_name": "Marsh Insurance Brokers",
        "subject": "D&O Insurance premium due — renewal notice",
        "body": (
            "Dear Finance Team,\n\n"
            "Your Directors & Officers (D&O) liability insurance policy is due for renewal.\n\n"
            "Policy: D&O-SG-2024-0891\n"
            "Premium: S$3,200.00\n"
            "Renewal deadline: 31 May 2026\n\n"
            "Please ensure payment is made before the deadline to maintain coverage.\n\n"
            "Kind regards,\nMarsh Singapore"
        ),
    },
    # ── 2. Expiring Licenses, Certs & Contracts ──────────────────────────
    {
        "from_name": "AWS Certificate Manager",
        "subject": "[Action Required] SSL certificate expiring in 11 days",
        "body": (
            "Hello,\n\n"
            "The following ACM certificate is expiring soon:\n\n"
            "Domain: api.yourcompany.io\n"
            "Certificate ARN: arn:aws:acm:ap-southeast-1:123456:certificate/abc-123\n"
            "Expiry: 5 May 2026\n\n"
            "If auto-renewal failed, you may need to re-validate domain ownership.\n\n"
            "— AWS Certificate Manager"
        ),
    },
    {
        "from_name": "JetBrains Sales",
        "subject": "IntelliJ IDEA team license expiring — 30 April",
        "body": (
            "Hi,\n\n"
            "Your JetBrains All Products Pack subscription for 5 users expires on "
            "30 April 2026.\n\n"
            "Renewal quote: USD 649.00/year (5 seats)\n"
            "Renew before expiry to keep your settings and license continuity.\n\n"
            "Renew here: https://account.jetbrains.com\n\n"
            "— JetBrains"
        ),
    },
    {
        "from_name": "Figma",
        "subject": "Your Figma Organization plan renews on 15 May",
        "body": (
            "Hi Admin,\n\n"
            "Your Figma Organization plan (8 editor seats) renews on 15 May 2026.\n\n"
            "Annual total: USD 576.00\n"
            "Payment method: Visa ending 4829\n\n"
            "Review seats and billing at https://figma.com/billing\n\n"
            "— Figma"
        ),
    },
    {
        "from_name": "GoDaddy",
        "subject": "Domain renewal reminder: yourcompany.io expires 1 Jun",
        "body": (
            "Hi,\n\n"
            "Your domain yourcompany.io is set to expire on 1 June 2026.\n\n"
            "Renewal price: S$28.99/year\n"
            "Auto-renew: OFF\n\n"
            "Renew now to avoid losing your domain.\n\n"
            "— GoDaddy"
        ),
    },
    {
        "from_name": "DocuSign",
        "subject": "Enterprise contract expiring — action needed by 20 May",
        "body": (
            "Dear Admin,\n\n"
            "Your DocuSign Enterprise agreement expires on 20 May 2026.\n\n"
            "Current plan: Enterprise (50 envelopes/month)\n"
            "Users: 12\n\n"
            "Contact your account manager Li Wei (liwei@docusign.com) to discuss "
            "renewal options.\n\n"
            "— DocuSign"
        ),
    },
    {
        "from_name": "Legal (Hui Ling)",
        "subject": "Vendor NDA with Acme Corp expiring 31 May — renewal needed",
        "body": (
            "Hi team,\n\n"
            "The mutual NDA with Acme Corp (signed 31 May 2024) expires on 31 May 2026.\n\n"
            "Since we have an active integration project with them, we should renew.\n"
            "I've prepared the renewal draft — please review and approve by 15 May so "
            "I can send it to their legal team.\n\n"
            "Thanks,\nHui Ling\nLegal"
        ),
    },
    {
        "from_name": "Microsoft 365 Admin",
        "subject": "License review: 3 unused Microsoft 365 seats",
        "body": (
            "Hi Admin,\n\n"
            "Your organization has 3 Microsoft 365 Business Premium licenses that "
            "have not been used in the past 90 days:\n\n"
            "- exintern1@yourcompany.io (last active: Jan 2026)\n"
            "- exintern2@yourcompany.io (last active: Feb 2026)\n"
            "- testuser@yourcompany.io (never signed in)\n\n"
            "Consider removing these licenses before the next billing cycle (10 May) "
            "to save S$66/month.\n\n"
            "— Microsoft 365 Admin Center"
        ),
    },
    # ── 3. Unreplied Emails / Pending Threads ────────────────────────────
    {
        "from_name": "Wei Liang (Manager)",
        "subject": "Q2 headcount proposal — need your input by Wed",
        "body": (
            "Hey,\n\n"
            "I'm putting together the Q2 headcount proposal for leadership review "
            "on Thursday.\n\n"
            "Can you send me:\n"
            "1. Your team's hiring priorities (roles + seniority)\n"
            "2. Justification for each (1-2 lines is fine)\n"
            "3. Preferred start dates\n\n"
            "Need this by end of day Wednesday.\n\n"
            "Thanks,\nWei Liang"
        ),
    },
    {
        "from_name": "Priya (Colleague)",
        "subject": "RE: Team offsite venue — need your vote",
        "body": (
            "Hi all,\n\n"
            "We've narrowed it down to two venues for the June offsite:\n\n"
            "Option A: Tanjong Beach Club — casual, outdoor, $65/pax\n"
            "Option B: Andaz Singapore — conference room + lunch, $85/pax\n\n"
            "Please reply with your preference by tomorrow so I can book.\n\n"
            "Thanks,\nPriya"
        ),
    },
    {
        "from_name": "HR (Amanda)",
        "subject": "Action required: Confirm your updated job title",
        "body": (
            "Hi,\n\n"
            "Following the recent team restructure, your job title has been updated to:\n\n"
            "New title: Senior Software Engineer\n"
            "Effective: 1 May 2026\n\n"
            "Please log in to Workday and confirm this change by 28 April.\n"
            "If the title is incorrect, reply to this email.\n\n"
            "Thanks,\nAmanda\nHR Operations"
        ),
    },
    {
        "from_name": "James (Acme Corp)",
        "subject": "Follow-up: API integration timeline?",
        "body": (
            "Hi,\n\n"
            "Just following up on our call last week re: the API integration.\n\n"
            "Our engineering team is ready to start on their end. Could you confirm:\n"
            "1. Expected API v2 endpoint availability date\n"
            "2. Whether we'll need a new API key or the existing one carries over\n"
            "3. Any breaking changes from v1 we should plan for\n\n"
            "We'd like to lock in our sprint planning by Friday.\n\n"
            "Thanks,\nJames\nHead of Engineering, Acme Corp"
        ),
    },
    {
        "from_name": "Darren (Colleague)",
        "subject": "RE: Code review for PR #247 — still waiting",
        "body": (
            "Hey,\n\n"
            "Gentle nudge — PR #247 (refactor auth middleware) has been open for 2 days.\n"
            "It's blocking the sprint goal for this week.\n\n"
            "Link: https://github.com/yourcompany/api/pull/247\n\n"
            "Let me know if you need me to walk you through the changes.\n\n"
            "Cheers,\nDarren"
        ),
    },
    {
        "from_name": "Sarah (DataDog)",
        "subject": "Onboarding call — proposed time slots",
        "body": (
            "Hi,\n\n"
            "Thanks for signing up for DataDog APM! I'd love to schedule an onboarding "
            "call to help your team get set up.\n\n"
            "Here are some available slots:\n"
            "- Tue 29 Apr, 2:00 PM SGT\n"
            "- Wed 30 Apr, 10:00 AM SGT\n"
            "- Thu 1 May, 3:00 PM SGT\n\n"
            "Let me know which works best, or suggest an alternative.\n\n"
            "Best,\nSarah\nCustomer Success, DataDog"
        ),
    },
    {
        "from_name": "Finance (Rachel)",
        "subject": "RE: Missing receipt for April expense claim",
        "body": (
            "Hi,\n\n"
            "I'm processing April expense claims and noticed your submission is "
            "missing a receipt for the following item:\n\n"
            "- 15 Apr: Client lunch at Burnt Ends — S$214.00\n\n"
            "Could you forward the receipt or snap a photo? I need it before I can "
            "approve the claim.\n\n"
            "Thanks,\nRachel\nFinance"
        ),
    },
    {
        "from_name": "Jun Wei (Intern)",
        "subject": "Mentorship check-in — can we meet this week?",
        "body": (
            "Hi,\n\n"
            "Hope you're doing well! I wanted to check if we could schedule our "
            "monthly mentorship catch-up this week.\n\n"
            "I have a few things I'd love to discuss:\n"
            "- Career direction after internship\n"
            "- Feedback on my recent PR contributions\n"
            "- Any reading recommendations\n\n"
            "I'm free most afternoons. Let me know what works!\n\n"
            "Thanks,\nJun Wei"
        ),
    },
    # ── 4. Deadlines & Time-Sensitive Requests ───────────────────────────
    {
        "from_name": "Wei Liang (Manager)",
        "subject": "Reminder: Board slide deck due Friday",
        "body": (
            "Hi team,\n\n"
            "Quick reminder — the engineering section of the board deck is due this "
            "Friday (25 Apr).\n\n"
            "What I need from you:\n"
            "- 3 slides on Q1 delivery highlights\n"
            "- 1 slide on Q2 roadmap priorities\n"
            "- Key risk / ask slide\n\n"
            "Use the template in the shared Google Drive folder. No more than 8 slides.\n\n"
            "Thanks,\nWei Liang"
        ),
    },
    {
        "from_name": "HR (Amanda)",
        "subject": "Benefits open enrollment closes TOMORROW — 25 Apr",
        "body": (
            "Hi all,\n\n"
            "This is the final reminder that benefits open enrollment closes "
            "tomorrow, 25 April 2026.\n\n"
            "If you haven't made your selections for:\n"
            "- Medical plan\n"
            "- Dental coverage\n"
            "- Flexible spending account\n\n"
            "…please do so in Workday by end of day tomorrow. After that, you'll be "
            "locked into your current plan for the rest of the year.\n\n"
            "Thanks,\nAmanda\nHR"
        ),
    },
    {
        "from_name": "Finance (Rachel)",
        "subject": "Q1 expense claims — submit by end of this week",
        "body": (
            "Hi everyone,\n\n"
            "Friendly reminder: all Q1 2026 expense claims must be submitted by "
            "27 April (Sunday).\n\n"
            "Late claims will be processed in the next cycle (June payout).\n\n"
            "Submit via Workday > Expenses > Create Expense Report.\n"
            "Attach receipts for anything over S$20.\n\n"
            "Thanks,\nRachel\nFinance"
        ),
    },
    {
        "from_name": "IT Admin (Kevin)",
        "subject": "Mandatory: Reset your SSO password by Friday 25 Apr",
        "body": (
            "Hi,\n\n"
            "As part of our quarterly security rotation, all employees must reset "
            "their SSO password by Friday 25 April.\n\n"
            "Steps:\n"
            "1. Go to https://sso.yourcompany.io/reset\n"
            "2. Enter your current password\n"
            "3. Set a new password (min 12 chars, 1 uppercase, 1 number, 1 symbol)\n\n"
            "Accounts not reset by Friday will be locked on Monday morning.\n\n"
            "— Kevin, IT Admin"
        ),
    },
    {
        "from_name": "Compliance (Mei Ling)",
        "subject": "OVERDUE: Annual data protection training",
        "body": (
            "Hi,\n\n"
            "Our records show you have not completed the mandatory annual data "
            "protection training. This was due on 20 April 2026.\n\n"
            "Course: PDPA Compliance for Tech Teams (45 min)\n"
            "Link: https://learn.yourcompany.io/pdpa-2026\n\n"
            "Please complete this ASAP. Overdue training is flagged to your manager.\n\n"
            "Thanks,\nMei Ling\nCompliance"
        ),
    },
    {
        "from_name": "Priya (Colleague)",
        "subject": "Sprint retro action items — update by EOD please",
        "body": (
            "Hi team,\n\n"
            "Following yesterday's retro, here are the action items assigned to you:\n\n"
            "1. Document the deployment runbook for the new CI pipeline\n"
            "2. Set up a shared Slack channel for cross-team incidents\n\n"
            "Can you update the Confluence page with progress by end of day?\n\n"
            "Thanks,\nPriya"
        ),
    },
    {
        "from_name": "GovTech STACK Conference",
        "subject": "Early-bird speaker registration closing 28 Apr",
        "body": (
            "Hi,\n\n"
            "Thank you for your interest in speaking at GovTech STACK 2026!\n\n"
            "Early-bird speaker registration closes on 28 April 2026. Submitting "
            "early gives your talk a higher chance of being selected for the main stage.\n\n"
            "Submit your proposal: https://stack.gov.sg/cfp\n\n"
            "Topics of interest: AI in government, cloud-native, developer experience.\n\n"
            "— GovTech STACK Organising Committee"
        ),
    },
    # ── 5. Internal Announcements & FYIs ─────────────────────────────────
    {
        "from_name": "CEO (Susan Tan)",
        "subject": "All-hands: Q1 results & H2 direction — 28 Apr, 3 PM",
        "body": (
            "Hi everyone,\n\n"
            "Please join the company all-hands this Monday:\n\n"
            "Date: 28 April 2026, 3:00 PM SGT\n"
            "Where: Town Hall (L12) + Zoom (link in calendar invite)\n\n"
            "Agenda:\n"
            "- Q1 financial results\n"
            "- Product roadmap update\n"
            "- H2 hiring & org changes\n"
            "- Q&A\n\n"
            "See you there!\nSusan"
        ),
    },
    {
        "from_name": "HR (Amanda)",
        "subject": "New WFH policy effective 1 May 2026",
        "body": (
            "Hi all,\n\n"
            "We're updating our Work-From-Home policy effective 1 May 2026.\n\n"
            "Key changes:\n"
            "- WFH days: 3 per week (up from 2)\n"
            "- Core in-office days: Tuesday and Thursday\n"
            "- WFH requests no longer need manager pre-approval\n\n"
            "Full policy: https://wiki.yourcompany.io/wfh-policy-v3\n\n"
            "Questions? Reach out to your HR business partner.\n\n"
            "Thanks,\nAmanda"
        ),
    },
    {
        "from_name": "IT Admin (Kevin)",
        "subject": "Scheduled maintenance: VPN downtime Sat 2am–6am",
        "body": (
            "Hi all,\n\n"
            "We'll be performing VPN infrastructure maintenance this Saturday:\n\n"
            "When: Saturday 26 April, 2:00 AM – 6:00 AM SGT\n"
            "Impact: VPN access will be unavailable. Office WiFi unaffected.\n\n"
            "If you need remote access during this window, please connect before 2 AM.\n\n"
            "— Kevin, IT"
        ),
    },
    {
        "from_name": "Office Admin (Lisa)",
        "subject": "Pantry renovation — temp pantry at Level 3 starting Mon",
        "body": (
            "Hi all,\n\n"
            "The Level 8 pantry will be closed for renovation from 28 April to 9 May.\n\n"
            "During this period:\n"
            "- Temporary pantry available at Level 3 (near the fire escape)\n"
            "- Coffee machine relocated to Level 3\n"
            "- Fridge contents must be cleared by Friday 25 Apr EOD\n\n"
            "Sorry for the inconvenience!\nLisa\nOffice Admin"
        ),
    },
    {
        "from_name": "Darren (Team Lead)",
        "subject": "Welcome our new hire — Kai starts Monday!",
        "body": (
            "Hi team,\n\n"
            "Excited to share that Kai Chen will be joining us as a Software Engineer "
            "starting Monday 28 April!\n\n"
            "Kai is coming from Shopee's payments team and will be working on the "
            "API platform squad.\n\n"
            "A few asks:\n"
            "- Please say hi on Slack (#general)\n"
            "- Buddy: Jun Wei (already looped in)\n"
            "- First-week onboarding doc: https://wiki.yourcompany.io/onboarding\n\n"
            "Let's make Kai feel welcome!\nDarren"
        ),
    },
    # ── 6. Newsletters / Low-Priority Noise ──────────────────────────────
    {
        "from_name": "LinkedIn News",
        "subject": "5 AI trends reshaping enterprise in 2026",
        "body": (
            "Top stories for you:\n\n"
            "1. AI agents move from chatbots to workflow automation\n"
            "2. Singapore leads ASEAN in enterprise AI adoption\n"
            "3. The rise of 'AI-native' startups\n"
            "4. Why RAG is replacing fine-tuning\n"
            "5. New MAS guidelines on AI in financial services\n\n"
            "Read more on LinkedIn."
        ),
    },
    {
        "from_name": "TechCrunch Daily",
        "subject": "TechCrunch Daily — 23 Apr 2026",
        "body": (
            "Today's top stories:\n\n"
            "- Anthropic raises Series D at $60B valuation\n"
            "- Grab launches AI-powered route optimization\n"
            "- Stripe expands to 5 new ASEAN markets\n"
            "- EU AI Act enforcement begins July 2026\n\n"
            "Read the full digest at techcrunch.com"
        ),
    },
    {
        "from_name": "Confluence",
        "subject": "Spaces you follow have been updated",
        "body": (
            "Recent changes in spaces you follow:\n\n"
            "- Engineering Wiki: 'Deployment Runbook v3' updated by Darren\n"
            "- Product: 'Q2 Roadmap' updated by Priya\n"
            "- Design: 'Component Library v2 Spec' created by Mei\n\n"
            "View changes in Confluence."
        ),
    },
    {
        "from_name": "Jira",
        "subject": "Weekly summary: 12 issues updated in your projects",
        "body": (
            "Here's your weekly Jira summary:\n\n"
            "Project: API Platform\n"
            "- 4 issues moved to Done\n"
            "- 3 issues moved to In Progress\n"
            "- 2 new issues created\n"
            "- 3 issues updated with comments\n\n"
            "Top priority: API-421 'Rate limiting for v2 endpoints' (due 28 Apr)\n\n"
            "View in Jira."
        ),
    },
    {
        "from_name": "GitHub (Dependabot)",
        "subject": "[yourcompany/api] 3 Dependabot security alerts",
        "body": (
            "Dependabot found 3 vulnerabilities in yourcompany/api:\n\n"
            "1. express (4.18.2) — moderate severity — prototype pollution\n"
            "   Fix: upgrade to 4.19.0\n\n"
            "2. jsonwebtoken (9.0.0) — low severity — timing attack\n"
            "   Fix: upgrade to 9.0.2\n\n"
            "3. axios (1.6.0) — low severity — SSRF in proxy config\n"
            "   Fix: upgrade to 1.6.5\n\n"
            "View alerts: https://github.com/yourcompany/api/security/dependabot"
        ),
    },
    # ── 7. Receipt / Bill Splitter ───────────────────────────────────────
    {
        "from_name": "You (self-forwarded)",
        "subject": "Team dinner receipt — Burnt Ends (to split)",
        "body": (
            "Forwarding the receipt from last night's team dinner.\n\n"
            "Restaurant: Burnt Ends\n"
            "Date: 22 April 2026\n\n"
            "Items:\n"
            "- Sanger (pork jowl) × 2: $56.00\n"
            "- Dry-aged beef rib: $98.00\n"
            "- Smoked quail: $42.00\n"
            "- Marron: $68.00\n"
            "- Sides × 3: $48.00\n"
            "- Drinks (wine, beer): $78.00\n"
            "- Service charge (10%): $39.00\n"
            "- GST (9%): $38.61\n"
            "Total: S$467.61\n\n"
            "Split 6 ways: Wei Liang, Priya, Darren, Jun Wei, Kai, me.\n"
            "Please split evenly."
        ),
    },
    {
        "from_name": "Darren (Colleague)",
        "subject": "Client lunch receipt — please help split",
        "body": (
            "Hey,\n\n"
            "Here's the receipt from the client lunch with Acme Corp yesterday.\n\n"
            "Restaurant: Odette\n"
            "Date: 21 April 2026\n\n"
            "Set lunch × 4: S$480.00\n"
            "Wine pairing × 2: S$120.00\n"
            "Service charge (10%): S$60.00\n"
            "GST (9%): S$59.40\n"
            "Total: S$719.40\n\n"
            "Split: 50% our company, 50% Acme Corp.\n"
            "Our share: Wei Liang, Darren, me (3 people from us).\n\n"
            "Cheers,\nDarren"
        ),
    },
    {
        "from_name": "Priya (Colleague)",
        "subject": "Grab to client site — split fare",
        "body": (
            "Hi,\n\n"
            "Took a Grab to the Acme Corp office for the integration meeting today.\n\n"
            "Grab fare: S$38.00 (GrabCar Premium, Tanjong Pagar → Changi Biz Park)\n"
            "Split between: Priya and me (2 people)\n\n"
            "Can claim under project expenses.\n\n"
            "— Priya"
        ),
    },
    # ── 8. Miscellaneous Office ──────────────────────────────────────────
    {
        "from_name": "DBS Business Banking",
        "subject": "Corporate card statement ready — April 2026",
        "body": (
            "Dear Cardholder,\n\n"
            "Your DBS Business Visa corporate card statement for April 2026 is ready.\n\n"
            "Statement balance: S$4,217.80\n"
            "Minimum payment: S$850.00\n"
            "Payment due: 5 May 2026\n\n"
            "View your statement at https://ideal.dbs.com\n\n"
            "DBS Business Banking"
        ),
    },
    {
        "from_name": "FCM Travel",
        "subject": "E-ticket confirmation: SIN → NRT — Team offsite",
        "body": (
            "Booking confirmed!\n\n"
            "Booking reference: XYZ789\n"
            "Route: Singapore (SIN) → Tokyo Narita (NRT)\n"
            "Date: 15 June 2026\n"
            "Flight: SQ638, Depart 08:45, Arrive 16:30\n"
            "Passengers: 4 (Wei Liang, Priya, Darren, You)\n"
            "Class: Economy\n\n"
            "Return:\n"
            "Date: 20 June 2026\n"
            "Flight: SQ637, Depart 17:45, Arrive 23:55\n\n"
            "E-tickets attached. Baggage: 30kg checked + 7kg cabin.\n\n"
            "— FCM Travel Solutions"
        ),
    },
    {
        "from_name": "Building Management (MBC)",
        "subject": "Office access card renewal — expiring 30 April",
        "body": (
            "Dear Tenant,\n\n"
            "The following office access cards are expiring on 30 April 2026:\n\n"
            "- Card #A1042 (You)\n"
            "- Card #A1043 (Jun Wei)\n\n"
            "Please visit the Building Management Office at Level 1 with your "
            "company ID to collect replacement cards.\n\n"
            "Office hours: Mon–Fri, 9 AM – 5 PM.\n\n"
            "Regards,\nMapletree Business City Management"
        ),
    },
    {
        "from_name": "Recruiter (Daniel)",
        "subject": "Candidate pipeline update — Senior Eng role",
        "body": (
            "Hi,\n\n"
            "Quick update on the Senior Software Engineer hiring pipeline:\n\n"
            "- 3 candidates shortlisted after phone screen\n"
            "- Candidate A: ex-Grab, strong systems design, available June\n"
            "- Candidate B: ex-GovTech, good culture fit, wants hybrid\n"
            "- Candidate C: internal referral from Darren, strong on backend\n\n"
            "Can we schedule technical interviews for next week? "
            "I'll need 2 interviewers per candidate (45 min each).\n\n"
            "Let me know your availability.\n\n"
            "Thanks,\nDaniel\nTalent Acquisition"
        ),
    },
]


def main():
    parser = argparse.ArgumentParser(description="Send seed emails to dummy Gmail.")
    parser.add_argument("--to", required=True, help="Target Gmail address")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print emails instead of sending",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.0,
        help="Seconds between sends to avoid rate limits (default: 1)",
    )
    args = parser.parse_args()

    if not args.dry_run:
        service = get_gmail_service()

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Sending {len(EMAILS)} emails to {args.to}\n")

    for i, email in enumerate(EMAILS, 1):
        print(f"[{i:02d}/{len(EMAILS)}] {email['from_name']}: {email['subject']}")
        if args.dry_run:
            print(f"         Body preview: {email['body'][:80]}...")
        else:
            send_email(service, args.to, email["from_name"], email["subject"], email["body"])
            time.sleep(args.delay)

    print(f"\nDone! {len(EMAILS)} emails {'would be sent' if args.dry_run else 'sent'}.")


if __name__ == "__main__":
    main()
