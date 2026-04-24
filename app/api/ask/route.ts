import { NextRequest, NextResponse } from "next/server";
import { askStream } from "@backend/agent";
import type { EmailSource, Persona } from "@email/sources";
import type { SessionPayload } from "@/lib/auth";
import {
  attachRefreshedSession,
  emailSourceForRequest,
  errorResponse,
} from "@/lib/email-source";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { query, persona } = (await req.json()) as {
    query: string;
    persona: Persona;
  };

  if (!query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  let source: EmailSource;
  let updatedSession: SessionPayload | undefined;
  try {
    ({ source, updatedSession } = await emailSourceForRequest(req));
  } catch (e) {
    return errorResponse(e);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of askStream(query, persona, source)) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: msg })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  const res = new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
  return attachRefreshedSession(res, updatedSession);
}
