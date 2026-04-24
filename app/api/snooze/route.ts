import { NextRequest, NextResponse } from "next/server";
import { snooze } from "@backend/state";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { item_id, until } = (await req.json()) as { item_id: string; until: string };
  if (!item_id || !until) return NextResponse.json({ error: "item_id and until required" }, { status: 400 });
  snooze(item_id, until);
  return NextResponse.json({ ok: true, item_id, until });
}
