#!/usr/bin/env tsx
/**
 * `npx tsx bin/digest.ts --persona=finance`
 *
 * Used by the .claude/settings.json SessionStart hook so opening Claude Code
 * in this repo greets the user with their current digest.
 *
 * Falls back to a friendly message if ANTHROPIC_API_KEY is unset (so the hook
 * never crashes Claude Code startup).
 */
import { digest } from "../backend/digest";
import { FixtureEmailSource, type Persona } from "../email/sources";

function parsePersona(): Persona {
  const arg = process.argv.find((a) => a.startsWith("--persona="));
  const v = arg?.split("=")[1] ?? process.env.PERSONA ?? "finance";
  if (v === "developer" || v === "manager" || v === "finance") return v;
  return "finance";
}

const URGENCY_EMOJI = { high: "🔴", medium: "🟠", low: "🟢" } as const;

function pad(s: string, n: number) {
  if (s.length >= n) return s;
  return s + " ".repeat(n - s.length);
}

async function main() {
  const persona = parsePersona();

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`📬  Email Secretary (${persona}) — set ANTHROPIC_API_KEY to enable`);
    return;
  }

  try {
    const { items } = await digest(persona, new FixtureEmailSource());
    if (items.length === 0) {
      console.log(`📬  No urgent items in your inbox today (${persona}).`);
      return;
    }
    console.log(`\n📬  Today's digest — ${persona}\n`);
    const groups: Record<"high" | "medium" | "low", typeof items> = {
      high: [],
      medium: [],
      low: [],
    };
    for (const i of items) groups[i.urgency].push(i);
    for (const u of ["high", "medium", "low"] as const) {
      if (groups[u].length === 0) continue;
      console.log(`${URGENCY_EMOJI[u]} ${u.toUpperCase()}`);
      for (const i of groups[u]) {
        const due = i.due_date ? `due ${i.due_date}` : "";
        console.log(`  • ${pad(i.title, 32)} ${pad(due, 14)} (${i.reason})`);
      }
      console.log();
    }
  } catch (err) {
    console.log(`📬  Email Secretary unavailable: ${err instanceof Error ? err.message : err}`);
  }
}

main();
