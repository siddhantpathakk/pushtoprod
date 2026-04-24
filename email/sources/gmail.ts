import type { Email, EmailSource } from "./base";

// User-facing error from the Gmail source. Route handlers should surface the
// `userMessage` and map the `status` onto an HTTP response.
export class GmailFetchError extends Error {
  constructor(
    message: string,
    public readonly userMessage: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GmailFetchError";
  }
}

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

// Gmail's per-user quota is 250 units/sec; messages.get costs 5 units each,
// so 50 parallel requests can burst over the ceiling (especially when Ask
// fires right after Digest). Cap concurrency to stay under the limit.
const GMAIL_GET_CONCURRENCY = 10;

// Short-lived in-memory cache for list() results. Ask and Digest often run
// back-to-back against the same inbox; caching lets the second request skip
// the Gmail round trip entirely.
const LIST_CACHE_TTL_MS = 60_000;
type ListCacheEntry = { expiresAt: number; data: Email[] };
const listCache = new Map<string, ListCacheEntry>();

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.min(limit, items.length);
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return results;
}

type GmailListResponse = {
  messages?: { id: string; threadId: string }[];
  nextPageToken?: string;
};

type GmailHeader = { name: string; value: string };

type GmailPayloadPart = {
  mimeType?: string;
  headers?: GmailHeader[];
  body?: { data?: string; size?: number };
  parts?: GmailPayloadPart[];
};

type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailPayloadPart;
};

function decodeBase64Url(data: string): string {
  const pad = data.length % 4 === 0 ? 0 : 4 - (data.length % 4);
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  return Buffer.from(b64, "base64").toString("utf-8");
}

function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  if (!headers) return "";
  const h = headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
  return h?.value ?? "";
}

// Walk the MIME tree and return the first text/plain body we find. Falls back
// to text/html stripped of tags, then to an empty string.
function extractBody(payload: GmailPayloadPart | undefined): string {
  if (!payload) return "";

  const plain = findPart(payload, "text/plain");
  if (plain?.body?.data) return decodeBase64Url(plain.body.data);

  const html = findPart(payload, "text/html");
  if (html?.body?.data) {
    const raw = decodeBase64Url(html.body.data);
    return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  if (payload.body?.data) return decodeBase64Url(payload.body.data);
  return "";
}

function findPart(
  part: GmailPayloadPart,
  mimeType: string,
): GmailPayloadPart | null {
  if (part.mimeType === mimeType && part.body?.data) return part;
  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType);
    if (found) return found;
  }
  return null;
}

async function gmailFetch<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${GMAIL_API}${path}`);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (res.status === 401) {
    throw new GmailFetchError(
      "Gmail 401",
      "Your Gmail session expired. Please sign out and sign in again.",
      401,
    );
  }
  if (res.status === 403) {
    throw new GmailFetchError(
      "Gmail 403",
      "Gmail access is not granted on this account. Please sign out and sign in again to grant inbox read access.",
      403,
    );
  }
  if (res.status === 429) {
    throw new GmailFetchError(
      "Gmail 429",
      "Currently experiencing rate limit issues with Google. Please try again in a moment.",
      429,
    );
  }
  if (!res.ok) {
    throw new GmailFetchError(
      `Gmail ${res.status}`,
      "Couldn't reach Gmail right now. Please try again in a moment.",
      502,
    );
  }
  return (await res.json()) as T;
}

export class GmailEmailSource implements EmailSource {
  constructor(private readonly accessToken: string) {}

  async list(opts?: {
    sinceDays?: number;
    limit?: number;
    query?: string;
  }): Promise<Email[]> {
    const limit = opts?.limit ?? 50;
    const qParts: string[] = [];
    if (opts?.sinceDays) qParts.push(`newer_than:${opts.sinceDays}d`);
    if (opts?.query) qParts.push(opts.query);
    const q = qParts.join(" ").trim();

    const cacheKey = `${this.accessToken}|${limit}|${q}`;
    const cached = listCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const ids: string[] = [];
    let pageToken: string | undefined;

    while (ids.length < limit) {
      const remaining = limit - ids.length;
      const page = await gmailFetch<GmailListResponse>(
        "/messages",
        this.accessToken,
        {
          maxResults: String(Math.min(remaining, 100)),
          ...(q ? { q } : {}),
          ...(pageToken ? { pageToken } : {}),
        },
      );
      for (const m of page.messages ?? []) ids.push(m.id);
      if (!page.nextPageToken || (page.messages ?? []).length === 0) break;
      pageToken = page.nextPageToken;
    }

    const messages = await mapWithConcurrency(
      ids,
      GMAIL_GET_CONCURRENCY,
      (id) => this.get(id),
    );
    const data = messages.filter((m): m is Email => m !== null);
    listCache.set(cacheKey, { data, expiresAt: Date.now() + LIST_CACHE_TTL_MS });
    return data;
  }

  async get(id: string): Promise<Email | null> {
    const msg = await gmailFetch<GmailMessage>(
      `/messages/${id}`,
      this.accessToken,
      { format: "full" },
    );

    const headers = msg.payload?.headers;
    const dateMs = msg.internalDate ? Number(msg.internalDate) : Date.now();

    return {
      id: msg.id,
      threadId: msg.threadId,
      from: headerValue(headers, "From"),
      to: headerValue(headers, "To"),
      subject: headerValue(headers, "Subject"),
      date: new Date(dateMs).toISOString(),
      snippet: msg.snippet ?? "",
      body: extractBody(msg.payload),
      labels: msg.labelIds ?? [],
      unread: (msg.labelIds ?? []).includes("UNREAD"),
    };
  }
}
