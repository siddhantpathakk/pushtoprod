// Stubs so Human 2 can build the UI without waiting on the agent.
import type { ActionItem, Answer } from "./secretary/types";

export const STUB_ANSWER: Answer = {
  text: "You have 3,247 KrisFlyer points. 412 of them expire on May 18, 2026.",
  citations: [
    {
      email_id: "email-001",
      subject: "KrisFlyer monthly statement — April 2026",
      quote: "Total balance: 3,247 miles. Expiring May 18: 412 miles.",
    },
  ],
};

export const STUB_DIGEST: ActionItem[] = [
  {
    id: "item-001",
    title: "Pay credit card bill",
    category: "bill",
    due_date: "2026-04-28",
    source_email_id: "email-007",
    urgency: "high",
    reason: "S$842.30 due Apr 28; current date Apr 24",
  },
  {
    id: "item-002",
    title: "412 KrisFlyer miles expiring",
    category: "expiring",
    due_date: "2026-05-18",
    source_email_id: "email-001",
    urgency: "medium",
    reason: "Expiring miles cannot be recovered",
  },
  {
    id: "item-003",
    title: "Reply to Sarah re: PR review",
    category: "unreplied",
    due_date: null,
    source_email_id: "email-014",
    urgency: "medium",
    reason: "Sarah asked 2 days ago, no reply yet",
  },
];
