import type Anthropic from "@anthropic-ai/sdk";
import { ActionItemSchema, type ActionItem } from "./types";
import type { Persona } from "@email/sources";
import { isVisible } from "./state";
import { getEmailSource } from "@email/sources";
import { systemPromptFor } from "./prompts";
import { DIGEST_MODEL, getClient, recordUsage } from "./anthropic";
import { emailsToDocuments, withCacheBreakpoint } from "./documents";
import { z } from "zod";

const RecordItemsInput = z.object({
  items: z.array(ActionItemSchema),
});

const TOOL: Anthropic.Messages.Tool = {
  name: "record_action_items",
  description:
    "Record the prioritized list of action items extracted from the user's recent emails. Call this exactly once with the full list.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Stable id, e.g. 'item-001'" },
            title: { type: "string", description: "Short imperative title" },
            category: {
              type: "string",
              enum: ["bill", "expiring", "unreplied", "deadline", "alert", "task", "other"],
            },
            due_date: {
              type: ["string", "null"],
              description: "ISO date YYYY-MM-DD if known, else null",
            },
            source_email_id: {
              type: "string",
              description: "id of the email this came from",
            },
            urgency: { type: "string", enum: ["low", "medium", "high"] },
            reason: { type: "string", description: "Why this matters now" },
          },
          required: [
            "id",
            "title",
            "category",
            "due_date",
            "source_email_id",
            "urgency",
            "reason",
          ],
        },
      },
    },
    required: ["items"],
  },
};

export type DigestResult = {
  items: ActionItem[];
  thinking: string;
};

export async function digest(persona: Persona): Promise<DigestResult> {
  const source = getEmailSource();
  const emails = await source.list({ sinceDays: 14, limit: 50 });
  const documents = withCacheBreakpoint(emailsToDocuments(emails));

  const system: Anthropic.Messages.TextBlockParam[] = [
    {
      type: "text",
      text: `${systemPromptFor(persona)}\n\nGenerate a prioritized action-item digest from the user's recent emails. Call record_action_items exactly once. Return up to 15 items (aim for at least 3 when the inbox has real signal), the most important first.`,
      cache_control: { type: "ephemeral" },
    },
  ];

  // Extended thinking only on Opus (adaptive) and Sonnet (enabled). Skip on
  // Haiku and other lighter models.
  const isOpus = DIGEST_MODEL.includes("opus");
  const isSonnet = DIGEST_MODEL.includes("sonnet");
  const thinkingParams = isOpus
    ? {
        thinking: { type: "adaptive" as const },
        output_config: { effort: "medium" as const },
      }
    : isSonnet
      ? { thinking: { type: "enabled" as const, budget_tokens: 2000 } }
      : {};

  const client = getClient();
  const res = await client.messages.create({
    model: DIGEST_MODEL,
    max_tokens: 8000,
    ...thinkingParams,
    system,
    tools: [TOOL],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: [
          ...documents,
          {
            type: "text",
            text: "Generate today's digest. Use record_action_items.",
          },
        ],
      },
    ],
  });

  recordUsage(res.usage);

  let items: ActionItem[] = [];
  let thinking = "";
  for (const block of res.content) {
    if (block.type === "thinking") thinking += block.thinking;
    if (block.type === "tool_use" && block.name === "record_action_items") {
      const parsed = RecordItemsInput.safeParse(block.input);
      if (parsed.success) items = parsed.data.items.filter((i) => isVisible(i.id));
    }
  }

  return { items, thinking };
}
