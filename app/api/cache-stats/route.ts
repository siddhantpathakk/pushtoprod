import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Read by the sidebar widget. Real implementation reads from a module-level
// counter updated each Anthropic call (cache_creation_input_tokens vs
// cache_read_input_tokens).
export async function GET() {
  return NextResponse.json({
    cache_read_tokens: 0,
    cache_creation_tokens: 0,
    hit_rate: 0,
  });
}
