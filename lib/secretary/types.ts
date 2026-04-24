import { z } from "zod";

export const ActionItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum([
    "bill",
    "expiring",
    "unreplied",
    "deadline",
    "alert",
    "task",
    "other",
  ]),
  due_date: z.string().nullable(),
  source_email_id: z.string(),
  urgency: z.enum(["low", "medium", "high"]),
  reason: z.string(),
});
export type ActionItem = z.infer<typeof ActionItemSchema>;

export const CitationSchema = z.object({
  email_id: z.string(),
  subject: z.string(),
  quote: z.string(),
});
export type Citation = z.infer<typeof CitationSchema>;

export const AnswerSchema = z.object({
  text: z.string(),
  citations: z.array(CitationSchema),
});
export type Answer = z.infer<typeof AnswerSchema>;
