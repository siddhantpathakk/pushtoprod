import { FixtureEmailSource } from "./fixtures";
import { GmailMCPEmailSource } from "./gmail-mcp";
import type { EmailSource } from "./base";

export function getEmailSource(): EmailSource {
  const kind = process.env.EMAIL_SOURCE ?? "fixtures";
  if (kind === "gmail-mcp") return new GmailMCPEmailSource();
  return new FixtureEmailSource();
}

export type { Email, EmailSource, Persona } from "./base";
