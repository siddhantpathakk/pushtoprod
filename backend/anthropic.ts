import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

// Override in .env.local for the live demo:
//   CHAT_MODEL=claude-sonnet-4-6
//   DIGEST_MODEL=claude-opus-4-7
// Defaults below use Haiku for cheap iteration during dev.
export const CHAT_MODEL = process.env.CHAT_MODEL ?? "claude-haiku-4-5-20251001";
export const DIGEST_MODEL = process.env.DIGEST_MODEL ?? "claude-haiku-4-5-20251001";

// Module-level counter feeding /api/cache-stats
export const cacheStats = {
  cache_read_tokens: 0,
  cache_creation_tokens: 0,
  input_tokens: 0,
  output_tokens: 0,
};

export function recordUsage(usage: {
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  input_tokens?: number;
  output_tokens?: number;
}) {
  cacheStats.cache_read_tokens += usage.cache_read_input_tokens ?? 0;
  cacheStats.cache_creation_tokens += usage.cache_creation_input_tokens ?? 0;
  cacheStats.input_tokens += usage.input_tokens ?? 0;
  cacheStats.output_tokens += usage.output_tokens ?? 0;
}

export function hitRate(): number {
  const total = cacheStats.cache_read_tokens + cacheStats.cache_creation_tokens;
  if (total === 0) return 0;
  return cacheStats.cache_read_tokens / total;
}
