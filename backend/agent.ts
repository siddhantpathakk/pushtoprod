import type Anthropic from "@anthropic-ai/sdk";
import type { Answer, Citation } from "./types";
import type { Persona } from "@email/sources";
import { getEmailSource } from "@email/sources";
import { systemPromptFor } from "./prompts";
import { CHAT_MODEL, getClient, recordUsage } from "./anthropic";
import { emailsToDocuments, withCacheBreakpoint } from "./documents";

export async function ask(query: string, persona: Persona): Promise<Answer> {
  const source = getEmailSource();
  const emails = await source.list({ sinceDays: 30, limit: 50 });
  const documents = withCacheBreakpoint(emailsToDocuments(emails));

  const system: Anthropic.Messages.TextBlockParam[] = [
    {
      type: "text",
      text: systemPromptFor(persona),
      cache_control: { type: "ephemeral" },
    },
  ];

  const client = getClient();
  const res = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 1024,
    system,
    messages: [
      {
        role: "user",
        content: [...documents, { type: "text", text: query }],
      },
    ],
  });

  recordUsage(res.usage);

  const text = res.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const citations: Citation[] = [];
  for (const block of res.content) {
    if (block.type !== "text") continue;
    for (const cite of block.citations ?? []) {
      const title = (cite as { document_title?: string }).document_title ?? "";
      const cited = (cite as { cited_text?: string }).cited_text ?? "";
      const emailId = title.match(/^\[([^\]]+)\]/)?.[1] ?? "unknown";
      const subject = title.replace(/^\[[^\]]+\]\s*/, "");
      citations.push({ email_id: emailId, subject, quote: cited });
    }
  }

  return { text, citations };
}
