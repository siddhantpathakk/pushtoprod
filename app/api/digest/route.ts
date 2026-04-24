import { NextRequest, NextResponse } from "next/server";
import { digest } from "@backend/digest";
import type { Persona } from "@email/sources";
import {
  attachRefreshedSession,
  emailSourceForRequest,
  errorResponse,
} from "@/lib/email-source";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { persona } = (await req.json()) as { persona: Persona };
    const { source, updatedSession } = await emailSourceForRequest(req);
    const result = await digest(persona, source);
    return attachRefreshedSession(NextResponse.json(result), updatedSession);
  } catch (e) {
    return errorResponse(e);
  }
}
