import { NextRequest, NextResponse } from "next/server";
import { markDone } from "@backend/state";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { item_id } = (await req.json()) as { item_id: string };
  if (!item_id) return NextResponse.json({ error: "item_id required" }, { status: 400 });
  markDone(item_id);
  return NextResponse.json({ ok: true, item_id });
}
