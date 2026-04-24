import type Anthropic from "@anthropic-ai/sdk";
import type { Answer, Citation } from "./types";
import type { Persona } from "@email/sources";
import { getEmailSource } from "@email/sources";
import { systemPromptFor } from "./prompts";
import { CHAT_MODEL, getClient, recordUsage } from "./anthropic";
import { emailsToDocuments, withCacheBreakpoint } from "./documents";

function buildRequest(query: string, persona: Persona, documents: ReturnType<typeof emailsToDocuments>) {
  return {
    model: CHAT_MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text" as const,
        text: systemPromptFor(persona),
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [
      {
        role: "user" as const,
        content: [...documents, { type: "text" as const, text: query }],
      },
    ],
  };
}

function extractCitations(content: Anthropic.Messages.ContentBlock[]): Citation[] {
  const citations: Citation[] = [];
  for (const block of content) {
    if (block.type !== "text") continue;
    for (const cite of block.citations ?? []) {
      const title = (cite as { document_title?: string }).document_title ?? "";
      const cited = (cite as { cited_text?: string }).cited_text ?? "";
      const emailId = title.match(/^\[([^\]]+)\]/)?.[1] ?? "unknown";
      const subject = title.replace(/^\[[^\]]+\]\s*/, "");
      citations.push({ email_id: emailId, subject, quote: cited });
    }
  }
  return citations;
}

// Non-streaming — used by bin/digest.ts and tests.
export async function ask(query: string, persona: Persona): Promise<Answer> {
  const source = getEmailSource();
  const emails = await source.list({ sinceDays: 30, limit: 50 });
  const documents = withCacheBreakpoint(emailsToDocuments(emails));
  const client = getClient();

  const res = await client.messages.create(buildRequest(query, persona, documents));
  recordUsage(res.usage);

  const text = res.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return { text, citations: extractCitations(res.content) };
}

// Streaming — used by /api/ask route.
// Yields SSE lines; caller wraps in a ReadableStream + Response.
export async function* askStream(
  query: string,
  persona: Persona,
): AsyncGenerator<string> {
  const source = getEmailSource();
  const emails = await source.list({ sinceDays: 30, limit: 50 });
  const documents = withCacheBreakpoint(emailsToDocuments(emails));
  const client = getClient();

  const stream = client.messages.stream(buildRequest(query, persona, documents));

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`;
    }
  }

  // After stream ends, grab the final message for usage + citations.
  const final = await stream.finalMessage();
  recordUsage(final.usage);

  const citations = extractCitations(final.content);
  yield `data: ${JSON.stringify({ type: "citations", citations })}\n\n`;
  yield "data: [DONE]\n\n";
}
