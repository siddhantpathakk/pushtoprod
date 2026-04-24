"use client";
// THROWAWAY mock UI for local testing. Human 2 will replace this entirely.
import { useEffect, useRef, useState } from "react";
import type { ActionItem, Answer } from "@backend/types";

type Persona = "developer" | "manager" | "finance";
type Msg = { role: "user" | "assistant"; text: string; citations?: Answer["citations"] };

export default function Home() {
  const [persona, setPersona] = useState<Persona>("finance");
  const [digest, setDigest] = useState<ActionItem[]>([]);
  const [digestLoading, setDigestLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [query, setQuery] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadDigest(p: Persona) {
    setDigestLoading(true);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: p }),
      });
      const data = await res.json();
      setDigest(data.items ?? []);
    } finally {
      setDigestLoading(false);
    }
  }

  async function markDone(id: string) {
    await fetch("/api/mark-done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: id }),
    });
    setDigest((d) => d.filter((i) => i.id !== id));
  }

  async function sendMessage() {
    if (!query.trim() || streaming) return;
    const q = query.trim();
    setQuery("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setStreaming(true);

    let buffer = "";
    let citations: Answer["citations"] = [];
    setMsgs((m) => [...m, { role: "assistant", text: "" }]);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, persona }),
      });
      const reader = res.body!.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          const evt = JSON.parse(payload);
          if (evt.type === "text") {
            setMsgs((m) => {
              const copy = [...m];
              copy[copy.length - 1] = {
                ...copy[copy.length - 1],
                text: copy[copy.length - 1].text + evt.text,
              };
              return copy;
            });
          } else if (evt.type === "citations") {
            citations = evt.citations;
            setMsgs((m) => {
              const copy = [...m];
              copy[copy.length - 1] = { ...copy[copy.length - 1], citations };
              return copy;
            });
          }
        }
      }
    } finally {
      setStreaming(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  useEffect(() => { loadDigest(persona); }, [persona]);

  const urgencyColor = { high: "text-red-600", medium: "text-amber-500", low: "text-zinc-400" };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4">
        <span className="font-semibold text-sm">📬 Email Secretary</span>
        <select
          value={persona}
          onChange={(e) => setPersona(e.target.value as Persona)}
          className="ml-auto text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1"
        >
          <option value="finance">Finance / HR</option>
          <option value="manager">Manager</option>
          <option value="developer">Developer</option>
        </select>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Digest pane */}
        <aside className="w-80 border-r border-zinc-800 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">Digest</span>
            <button
              onClick={() => loadDigest(persona)}
              disabled={digestLoading}
              className="text-xs bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-700 disabled:opacity-40"
            >
              {digestLoading ? "…" : "Refresh"}
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto divide-y divide-zinc-800">
            {digest.length === 0 && !digestLoading && (
              <li className="p-4 text-xs text-zinc-500">No items.</li>
            )}
            {digest.map((item) => (
              <li key={item.id} className="p-3 text-xs space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium leading-snug">{item.title}</span>
                  <button
                    onClick={() => markDone(item.id)}
                    className="shrink-0 text-zinc-500 hover:text-zinc-200"
                    title="Mark done"
                  >✓</button>
                </div>
                <div className="flex gap-2 text-zinc-500">
                  <span className={urgencyColor[item.urgency]}>{item.urgency}</span>
                  <span>{item.category}</span>
                  {item.due_date && <span>due {item.due_date}</span>}
                </div>
                <p className="text-zinc-400">{item.reason}</p>
              </li>
            ))}
          </ul>
        </aside>

        {/* Chat pane */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
            {msgs.length === 0 && (
              <p className="text-zinc-500 text-xs">Ask anything about your inbox.</p>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : ""}>
                <span
                  className={`inline-block px-3 py-2 rounded-lg max-w-[80%] text-left whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-zinc-700 text-zinc-100"
                      : "bg-zinc-800 text-zinc-100"
                  }`}
                >
                  {m.text || (streaming && i === msgs.length - 1 ? "▋" : "")}
                </span>
                {m.citations && m.citations.length > 0 && (
                  <details className="mt-1 text-xs text-zinc-500 text-left">
                    <summary className="cursor-pointer hover:text-zinc-300">
                      {m.citations.length} source{m.citations.length > 1 ? "s" : ""}
                    </summary>
                    <ul className="mt-1 space-y-1 pl-2 border-l border-zinc-700">
                      {m.citations.map((c, j) => (
                        <li key={j}>
                          <span className="text-zinc-400">{c.subject}</span>
                          <blockquote className="text-zinc-500 mt-0.5 line-clamp-2">
                            {c.quote}
                          </blockquote>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="border-t border-zinc-800 p-3 flex gap-2"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="How many KrisFlyer points do I have?"
              className="flex-1 text-sm bg-zinc-800 border border-zinc-700 rounded px-3 py-2 focus:outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={streaming || !query.trim()}
              className="text-sm bg-zinc-100 text-zinc-900 px-4 py-2 rounded disabled:opacity-40 hover:bg-white"
            >
              {streaming ? "…" : "Ask"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
