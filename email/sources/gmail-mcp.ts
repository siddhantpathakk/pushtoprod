import type { Email, EmailSource } from "./base";

// Local-only adapter. Will be wired to the Gmail MCP server once Human 1's
// OAuth flow is finished. Hosted Vercel deploy must NEVER instantiate this.
export class GmailMCPEmailSource implements EmailSource {
  async list(_opts?: { sinceDays?: number; limit?: number; query?: string }): Promise<Email[]> {
    throw new Error("GmailMCPEmailSource not yet implemented — pending Gmail MCP setup.");
  }

  async get(_id: string): Promise<Email | null> {
    throw new Error("GmailMCPEmailSource not yet implemented — pending Gmail MCP setup.");
  }
}
