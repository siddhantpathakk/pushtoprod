import { NextRequest } from "next/server";
import { askStream } from "@backend/agent";
import type { Persona } from "@email/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { query, persona } = (await req.json()) as { query: string; persona: Persona };

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: "query is required" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of askStream(query, persona)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
