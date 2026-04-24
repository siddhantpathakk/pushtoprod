import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  GmailAuthError,
  ensureFreshAccessToken,
  getSession,
  signSession,
  type SessionPayload,
} from "./auth";
import { GmailEmailSource, GmailFetchError } from "@email/sources";

export type RequestEmailSource = {
  source: GmailEmailSource;
  updatedSession?: SessionPayload;
};

/**
 * Load the signed session cookie and return a GmailEmailSource bound to a
 * fresh access token. If the token was refreshed, `updatedSession` is
 * populated and the caller must re-sign it onto the response via
 * `attachRefreshedSession`.
 *
 * Throws `GmailAuthError` when the session is missing or lacks Gmail tokens —
 * callers should convert that into a 401 response.
 */
export async function emailSourceForRequest(
  req: NextRequest,
): Promise<RequestEmailSource> {
  const session = await getSession(req);
  if (!session) {
    throw new GmailAuthError(
      "No session",
      "You're not signed in. Please sign in with Google to read your inbox.",
    );
  }

  const { accessToken, updatedSession } = await ensureFreshAccessToken(session);
  return {
    source: new GmailEmailSource(accessToken),
    updatedSession,
  };
}

export async function attachRefreshedSession(
  res: NextResponse,
  updatedSession: SessionPayload | undefined,
): Promise<NextResponse> {
  if (!updatedSession) return res;
  const token = await signSession(updatedSession);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}

/**
 * Map a thrown error from the email-source pipeline onto a JSON response with
 * a friendly user-visible message.
 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof GmailAuthError) {
    return NextResponse.json(
      { error: err.userMessage, code: "auth_required" },
      { status: 401 },
    );
  }
  if (err instanceof GmailFetchError) {
    return NextResponse.json(
      { error: err.userMessage, code: "gmail_error" },
      { status: err.status },
    );
  }
  const msg = err instanceof Error ? err.message : String(err);
  return NextResponse.json(
    { error: "Something went wrong. Please try again.", detail: msg },
    { status: 500 },
  );
}
