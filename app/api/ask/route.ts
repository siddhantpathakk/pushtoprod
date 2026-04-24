import { NextRequest, NextResponse } from "next/server";
import { ask } from "@backend/agent";
import type { Persona } from "@email/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { query, persona } = (await req.json()) as {
      query: string;
      persona: Persona;
    };
    if (!query?.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }
    const answer = await ask(query, persona);
    return NextResponse.json(answer);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
