import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "pp_session";
export const OAUTH_STATE_COOKIE = "pp_oauth_state";
export const ONBOARDING_COMPLETE_COOKIE = "onboarding_complete";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10; // 10 minutes

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  picture: string;
  iat: number;
};

// ---------- base64url helpers ----------

function toBase64Url(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  const b64 = typeof btoa === "function" ? btoa(str) : Buffer.from(str).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const binary = typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeJsonB64Url(value: unknown): string {
  const json = JSON.stringify(value);
  return toBase64Url(new TextEncoder().encode(json));
}

function decodeJsonB64Url<T>(s: string): T {
  const bytes = fromBase64Url(s);
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as T;
}

// ---------- HMAC-SHA256 via Web Crypto ----------

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET is not set or is too short (need 16+ chars).");
  }
  return secret;
}

// Constant-time comparison on two equal-length Uint8Arrays.
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function signString(value: string): Promise<string> {
  const key = await getHmacKey(getSecret());
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  );
  return `${value}.${toBase64Url(sig)}`;
}

async function verifySignedString(signed: string): Promise<string | null> {
  const idx = signed.lastIndexOf(".");
  if (idx <= 0) return null;
  const payload = signed.slice(0, idx);
  const sigB64 = signed.slice(idx + 1);
  let sig: Uint8Array;
  try {
    sig = fromBase64Url(sigB64);
  } catch {
    return null;
  }
  const key = await getHmacKey(getSecret());
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    new TextEncoder().encode(payload),
  );
  if (!ok) return null;
  return payload;
}

// ---------- Session cookie ----------

export async function signSession(payload: SessionPayload): Promise<string> {
  return signString(encodeJsonB64Url(payload));
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const payloadB64 = await verifySignedString(token);
  if (!payloadB64) return null;
  try {
    const payload = decodeJsonB64Url<SessionPayload>(payloadB64);
    // Expiry check.
    const now = Math.floor(Date.now() / 1000);
    if (!payload.iat || now - payload.iat > SESSION_MAX_AGE_SECONDS) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------- Signed short-lived state (for CSRF) ----------

export async function signState(state: string): Promise<string> {
  return signString(state);
}

export async function verifyState(signed: string | undefined | null): Promise<string | null> {
  if (!signed) return null;
  return verifySignedString(signed);
}

// ---------- getSession (server-component / route-handler helper) ----------

/**
 * Read the signed session cookie.
 * - When called with no argument, uses `cookies()` from `next/headers`
 *   (usable in server components and route handlers).
 * - When passed a `NextRequest`, reads the cookie off the incoming request
 *   (usable in middleware).
 */
export async function getSession(req?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;
  if (req) {
    token = req.cookies.get(SESSION_COOKIE)?.value;
  } else {
    const store = await cookies();
    token = store.get(SESSION_COOKIE)?.value;
  }
  return verifySession(token);
}

// ---------- Random helpers ----------

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

// Timing-safe string comparison (base64url strings).
export function safeEqualStrings(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  return timingSafeEqual(ea, eb);
}
