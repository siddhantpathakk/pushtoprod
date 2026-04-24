export type Persona = "developer" | "manager" | "finance";

export interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  date: string; // ISO 8601
  snippet: string;
  body: string;
  labels: string[];
  unread: boolean;
}

export interface EmailSource {
  list(opts?: { sinceDays?: number; limit?: number; query?: string }): Promise<Email[]>;
  get(id: string): Promise<Email | null>;
}
