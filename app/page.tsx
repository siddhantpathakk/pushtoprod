"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Brand from "./_components/Brand";
import DigestList from "./_components/DigestList";
import StatusBar from "./_components/StatusBar";
import type { ActionItem } from "./_components/types";

const MARKDOWN_COMPONENTS = {
  p: (props: React.ComponentProps<"p">) => (
    <p {...props} className="mb-3 last:mb-0 leading-relaxed" />
  ),
  strong: (props: React.ComponentProps<"strong">) => (
    <strong {...props} className="font-semibold text-stone-900 dark:text-stone-100" />
  ),
  em: (props: React.ComponentProps<"em">) => <em {...props} className="italic" />,
  ul: (props: React.ComponentProps<"ul">) => (
    <ul {...props} className="mb-3 last:mb-0 ml-5 list-disc space-y-1 marker:text-stone-400" />
  ),
  ol: (props: React.ComponentProps<"ol">) => (
    <ol {...props} className="mb-3 last:mb-0 ml-5 list-decimal space-y-1 marker:text-stone-400" />
  ),
  li: (props: React.ComponentProps<"li">) => (
    <li {...props} className="leading-relaxed" />
  ),
  h1: (props: React.ComponentProps<"h1">) => (
    <h1 {...props} className="mt-4 mb-2 text-base font-semibold tracking-tight" />
  ),
  h2: (props: React.ComponentProps<"h2">) => (
    <h2 {...props} className="mt-4 mb-2 text-base font-semibold tracking-tight" />
  ),
  h3: (props: React.ComponentProps<"h3">) => (
    <h3 {...props} className="mt-3 mb-1.5 text-sm font-semibold tracking-tight" />
  ),
  a: (props: React.ComponentProps<"a">) => (
    <a
      {...props}
      target="_blank"
      rel="noreferrer"
      className="text-stone-900 dark:text-stone-100 underline underline-offset-2 decoration-stone-300 dark:decoration-stone-700 hover:decoration-stone-600 dark:hover:decoration-stone-400"
    />
  ),
  code: (props: React.ComponentProps<"code">) => (
    <code
      {...props}
      className="rounded bg-stone-100 dark:bg-stone-900 px-1 py-0.5 text-[0.85em] font-mono text-stone-800 dark:text-stone-200"
    />
  ),
  pre: (props: React.ComponentProps<"pre">) => (
    <pre
      {...props}
      className="mb-3 last:mb-0 overflow-x-auto rounded-lg bg-stone-100 dark:bg-stone-900 p-3 text-xs font-mono"
    />
  ),
  blockquote: (props: React.ComponentProps<"blockquote">) => (
    <blockquote
      {...props}
      className="mb-3 last:mb-0 border-l-2 border-stone-300 dark:border-stone-700 pl-3 text-stone-600 dark:text-stone-400 italic"
    />
  ),
  hr: (props: React.ComponentProps<"hr">) => (
    <hr {...props} className="my-4 border-stone-200 dark:border-stone-800" />
  ),
  table: (props: React.ComponentProps<"table">) => (
    <div className="mb-3 last:mb-0 overflow-x-auto">
      <table {...props} className="w-full border-collapse text-xs" />
    </div>
  ),
  th: (props: React.ComponentProps<"th">) => (
    <th
      {...props}
      className="border-b border-stone-300 dark:border-stone-700 px-2 py-1.5 text-left font-medium"
    />
  ),
  td: (props: React.ComponentProps<"td">) => (
    <td
      {...props}
      className="border-b border-stone-200 dark:border-stone-800 px-2 py-1.5"
    />
  ),
};

type Persona = "developer" | "manager" | "finance";
type Citation = { email_id: string; subject: string; quote: string };
type Message = {
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
};

export default function Home() {
  const [persona, setPersona] = useState<Persona>("finance");
  const [items, setItems] = useState<ActionItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const loadDigest = useCallback(async (p: Persona) => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: p }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { items: ActionItem[] };
      setItems(data.items ?? []);
    } catch (err) {
      console.error("Failed to load digest:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDigest(persona);
  }, [persona, loadDigest]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const q = input.trim();
    if (!q || streaming) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", text: q },
      { role: "assistant", text: "" },
    ]);
    setStreaming(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, persona }),
      });
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.type === "text") {
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  text: next[next.length - 1].text + evt.text,
                };
                return next;
              });
            } else if (evt.type === "citations") {
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  citations: evt.citations as Citation[],
                };
                return next;
              });
            } else if (evt.type === "error") {
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  text:
                    next[next.length - 1].text + `\n\n[error: ${evt.error}]`,
                };
                return next;
              });
            }
          } catch {
            // Ignore malformed SSE payloads.
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          ...next[next.length - 1],
          text: next[next.length - 1].text + `\n\n[error: ${msg}]`,
        };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between max-w-5xl w-full mx-auto">
        <Brand tagline />

        <select
          value={persona}
          onChange={(e) => setPersona(e.target.value as Persona)}
          className="text-sm bg-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 focus:outline-none cursor-pointer transition-colors"
          aria-label="Persona"
        >
          <option value="developer">Developer</option>
          <option value="manager">Manager</option>
          <option value="finance">Finance / HR</option>
        </select>
      </header>

      <StatusBar />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-16 px-8 pb-16 pt-4 max-w-5xl w-full mx-auto">
        <section aria-label="Today's digest" className="space-y-6">
          <DigestList
            items={items}
            onRefresh={() => loadDigest(persona)}
            isRefreshing={isRefreshing}
          />
        </section>

        <section
          aria-label="Chat with mailbox"
          className="flex flex-col min-h-[60vh]"
        >
          <h2 className="text-2xl font-medium tracking-tight">Ask</h2>
          <p className="text-sm text-stone-500 mt-1">
            Anything in your mailbox.
          </p>

          <div className="flex-1 overflow-y-auto py-8 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-stone-400 dark:text-stone-600 max-w-xs text-center leading-relaxed">
                  &ldquo;How many KrisFlyer points do I have?&rdquo;
                  <br />
                  &ldquo;What did Sarah ask me last week?&rdquo;
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "flex justify-end"
                      : "flex flex-col items-start gap-2"
                  }
                >
                  {m.role === "user" ? (
                    <p className="text-sm bg-stone-100 dark:bg-stone-900 rounded-2xl px-4 py-2 max-w-[85%] whitespace-pre-wrap">
                      {m.text}
                    </p>
                  ) : (
                    <>
                      <div className="text-sm leading-relaxed max-w-full">
                        {m.text ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={MARKDOWN_COMPONENTS}
                          >
                            {m.text}
                          </ReactMarkdown>
                        ) : (
                          <span className="inline-block h-3 w-1.5 bg-stone-400 dark:bg-stone-600 animate-pulse" />
                        )}
                      </div>
                      {m.citations && m.citations.length > 0 && (
                        <details className="text-xs text-stone-500 max-w-full">
                          <summary className="cursor-pointer hover:text-stone-700 dark:hover:text-stone-300 select-none">
                            {m.citations.length} source
                            {m.citations.length === 1 ? "" : "s"}
                          </summary>
                          <ul className="mt-2 space-y-2 pl-3 border-l border-stone-200 dark:border-stone-800">
                            {m.citations.map((c, j) => (
                              <li key={j} className="space-y-0.5">
                                <p className="text-stone-600 dark:text-stone-400 font-medium">
                                  {c.subject}
                                </p>
                                <blockquote className="text-stone-500 line-clamp-2">
                                  {c.quote}
                                </blockquote>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </>
                  )}
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="border-t border-stone-200 dark:border-stone-900 pt-4 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your mailbox…"
              disabled={streaming}
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="text-sm text-stone-500 disabled:opacity-40 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              {streaming ? "Asking…" : "Ask →"}
            </button>
          </form>
        </section>
      </main>

      <footer className="px-8 py-6 max-w-5xl w-full mx-auto flex items-center justify-between text-xs text-stone-400 dark:text-stone-600">
        <span>Clarion · Clarity from the chaos</span>
        <span>Claude Agent SDK · MCP</span>
      </footer>
    </div>
  );
}
