import { NextResponse } from "next/server";
import { cacheStats, hitRate } from "@backend/anthropic";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ...cacheStats,
    hit_rate: hitRate(),
  });
}
