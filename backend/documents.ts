import type Anthropic from "@anthropic-ai/sdk";
import type { Email } from "@email/sources";

export type DocumentBlock = Anthropic.Messages.DocumentBlockParam;

// Convert emails to Claude document blocks for citations + caching.
export function emailsToDocuments(emails: Email[]): DocumentBlock[] {
  return emails.map((e) => ({
    type: "document" as const,
    source: {
      type: "text" as const,
      media_type: "text/plain" as const,
      data: `From: ${e.from}\nTo: ${e.to}\nDate: ${e.date}\nSubject: ${e.subject}\nLabels: ${e.labels.join(", ")}\nUnread: ${e.unread}\n\n${e.body}`,
    },
    title: `[${e.id}] ${e.subject}`,
    context: e.id,
    citations: { enabled: true },
  }));
}

// Apply ephemeral cache_control to the LAST document so the whole document
// prefix is cached across turns. Mutates and returns.
export function withCacheBreakpoint(docs: DocumentBlock[]): DocumentBlock[] {
  if (docs.length === 0) return docs;
  const last = docs[docs.length - 1] as DocumentBlock & {
    cache_control?: { type: "ephemeral" };
  };
  last.cache_control = { type: "ephemeral" };
  return docs;
}
