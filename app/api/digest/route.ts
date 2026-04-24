import { NextRequest, NextResponse } from "next/server";
import { digest } from "@/lib/secretary/digest";
import type { Persona } from "@/lib/secretary/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { persona } = (await req.json()) as { persona: Persona };
  const items = await digest(persona);
  return NextResponse.json({ items });
}
