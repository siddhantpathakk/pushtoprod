import { readFileSync } from "node:fs";
import path from "node:path";
import type { Email, EmailSource } from "./base";

let cache: Email[] | null = null;

function load(): Email[] {
  if (cache) return cache;
  const p = path.join(process.cwd(), "fixtures", "emails.json");
  cache = JSON.parse(readFileSync(p, "utf-8")) as Email[];
  return cache;
}

export class FixtureEmailSource implements EmailSource {
  async list(opts?: { sinceDays?: number; limit?: number; query?: string }): Promise<Email[]> {
    let rows = load();
    if (opts?.sinceDays) {
      const cutoff = Date.now() - opts.sinceDays * 86_400_000;
      rows = rows.filter((e) => new Date(e.date).getTime() >= cutoff);
    }
    if (opts?.query) {
      const q = opts.query.toLowerCase();
      rows = rows.filter(
        (e) =>
          e.subject.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q) ||
          e.from.toLowerCase().includes(q),
      );
    }
    if (opts?.limit) rows = rows.slice(0, opts.limit);
    return rows;
  }

  async get(id: string): Promise<Email | null> {
    return load().find((e) => e.id === id) ?? null;
  }
}
