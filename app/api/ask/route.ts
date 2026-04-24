import { NextRequest, NextResponse } from "next/server";
import { ask } from "@/lib/secretary/agent";
import type { Persona } from "@/lib/secretary/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { query, persona } = (await req.json()) as { query: string; persona: Persona };
  const answer = await ask(query, persona);
  return NextResponse.json(answer);
}
