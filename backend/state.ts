// Shared in-memory state for the demo. Replaces the MCP server's
// state store for the hosted Vercel surface. Resets on redeploy — fine
// for a hackathon demo.

type ItemState = { done: boolean; snoozed_until?: string };
const items = new Map<string, ItemState>();

export function markDone(itemId: string): void {
  items.set(itemId, { ...(items.get(itemId) ?? { done: false }), done: true });
}

export function snooze(itemId: string, until: string): void {
  items.set(itemId, { ...(items.get(itemId) ?? { done: false }), snoozed_until: until });
}

export function isVisible(itemId: string): boolean {
  const s = items.get(itemId);
  if (!s) return true;
  if (s.done) return false;
  if (s.snoozed_until && new Date(s.snoozed_until) > new Date()) return false;
  return true;
}

export function getState(): Record<string, ItemState> {
  return Object.fromEntries(items);
}
