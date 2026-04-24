import { NextResponse, type NextRequest } from "next/server";
import {
  ONBOARDING_COMPLETE_COOKIE,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  safeEqualStrings,
  signSession,
  verifyState,
  type SessionPayload,
} from "@/lib/auth";

export const runtime = "nodejs";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

function errorRedirect(req: NextRequest, reason: string): NextResponse {
  const url = new URL("/login", req.url);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url, { status: 302 });
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse("Google OAuth is not configured.", { status: 500 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) return errorRedirect(req, oauthError);
  if (!code || !state) return errorRedirect(req, "missing_code_or_state");

  // Verify CSRF state.
  const signedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const verifiedState = await verifyState(signedState);
  if (!verifiedState || !safeEqualStrings(verifiedState, state)) {
    return errorRedirect(req, "invalid_state");
  }

  // Exchange code for tokens.
  let tokenJson: GoogleTokenResponse;
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      cache: "no-store",
    });
    tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenRes.ok || !tokenJson.access_token) {
      return errorRedirect(req, "token_exchange_failed");
    }
  } catch {
    return errorRedirect(req, "token_exchange_error");
  }

  // Fetch userinfo.
  let user: GoogleUserInfo;
  try {
    const userRes = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      cache: "no-store",
    });
    if (!userRes.ok) return errorRedirect(req, "userinfo_failed");
    user = (await userRes.json()) as GoogleUserInfo;
  } catch {
    return errorRedirect(req, "userinfo_error");
  }

  if (!user.sub || !user.email) {
    return errorRedirect(req, "incomplete_profile");
  }

  if (!tokenJson.refresh_token) {
    return errorRedirect(req, "missing_refresh_token");
  }

  const payload: SessionPayload = {
    sub: user.sub,
    email: user.email,
    name: user.name ?? "",
    picture: user.picture ?? "",
    iat: Math.floor(Date.now() / 1000),
    at: tokenJson.access_token,
    rt: tokenJson.refresh_token,
    exp: Date.now() + (tokenJson.expires_in ?? 3600) * 1000,
  };
  const token = await signSession(payload);

  // Decide destination.
  const onboardingDone =
    req.cookies.get(ONBOARDING_COMPLETE_COOKIE)?.value === "1";
  const dest = new URL(onboardingDone ? "/" : "/onboarding", req.url);

  const res = NextResponse.redirect(dest, { status: 302 });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  // Clear the one-shot state cookie.
  res.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
