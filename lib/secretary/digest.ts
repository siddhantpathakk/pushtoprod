import type { ActionItem } from "./types";
import type { Persona } from "./sources";

// Stub. Wired to Anthropic SDK with extended thinking + tool-use schema.
export async function digest(_persona: Persona): Promise<ActionItem[]> {
  return [];
}
