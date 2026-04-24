import { NextResponse, type NextRequest } from "next/server";

// Edge-runtime-safe copy of the signature verification used by lib/auth.ts.
// Kept in-file so this proxy does not pull in `next/headers` or other
// Node-only imports transitively.

const SESSION_COOKIE = "pp_session";
const ONBOARDING_COMPLETE_COOKIE = "onboarding_complete";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function fromBase64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function verifySessionCookie(
  token: string | undefined,
): Promise<{ iat?: number } | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const payloadB64 = token.slice(0, idx);
  const sigB64 = token.slice(idx + 1);

  let sig: Uint8Array;
  try {
    sig = fromBase64Url(sigB64);
  } catch {
    return null;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    new TextEncoder().encode(payloadB64),
  );
  if (!ok) return null;

  try {
    const json = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = JSON.parse(json) as { iat?: number };
    if (
      !payload.iat ||
      Math.floor(Date.now() / 1000) - payload.iat > SESSION_MAX_AGE_SECONDS
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  // Common static asset extensions.
  if (
    /\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|json|webmanifest|woff|woff2|ttf|otf|map|css|js)$/i.test(
      pathname,
    )
  ) {
    return true;
  }
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionCookie(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    // Preserve where the user wanted to go for UX parity later.
    if (pathname !== "/") {
      url.searchParams.set("next", pathname + (search ?? ""));
    }
    return NextResponse.redirect(url);
  }

  const onboardingDone =
    req.cookies.get(ONBOARDING_COMPLETE_COOKIE)?.value === "1";

  if (!onboardingDone && !pathname.startsWith("/onboarding")) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except Next internals and common static files.
  // Public paths (/login, /api/auth/*) are allowed through by `isPublicPath`
  // so that login-page redirects happen even when already authenticated is
  // handled inside the page itself.
  matcher: [
    "/((?!_next/static|_next/image|_next/data|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|json|webmanifest|woff|woff2|ttf|otf|map|css|js)).*)",
  ],
};
