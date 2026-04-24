import { NextRequest, NextResponse } from "next/server";
import { digest } from "@backend/digest";
import type { Persona } from "@email/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { persona } = (await req.json()) as { persona: Persona };
    const result = await digest(persona);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
