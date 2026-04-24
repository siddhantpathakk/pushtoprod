import type { Answer } from "./types";
import type { Persona } from "./sources";

// Stub. Wired to Anthropic SDK + streaming + citations after deps install.
// See app/api/ask/route.ts for the streaming endpoint.
export async function ask(_query: string, _persona: Persona): Promise<Answer> {
  return {
    text: "Agent not yet wired. Install deps and implement against Anthropic SDK.",
    citations: [],
  };
}
