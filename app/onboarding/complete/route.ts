import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const BodySchema = z.object({
  persona: z.enum(["developer", "manager", "finance"]),
});

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 },
    );
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_persona" },
      { status: 400 },
    );
  }

  const { persona } = parsed.data;

  const cookieStore = await cookies();
  const common = {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  cookieStore.set("onboarding_complete", "1", common);
  cookieStore.set("persona", persona, common);

  return NextResponse.json({ ok: true });
}
