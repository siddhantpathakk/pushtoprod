import { STUB_DIGEST } from "@frontend/stub-data";

const URGENCY_DOT: Record<"high" | "medium" | "low", string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-stone-400 dark:bg-stone-600",
};

function formatDueDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-8 py-6 flex items-center justify-between max-w-5xl w-full mx-auto">
        <div className="flex items-baseline gap-2">
          <span className="font-medium tracking-tight">push to prod</span>
          <span className="text-stone-400 dark:text-stone-600 text-sm">
            / secretary
          </span>
        </div>
        <select
          className="text-sm bg-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 focus:outline-none cursor-pointer transition-colors"
          defaultValue="finance"
          aria-label="Persona"
        >
          <option value="developer">Developer</option>
          <option value="manager">Manager</option>
          <option value="finance">Finance / HR</option>
        </select>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-16 px-8 pb-16 pt-4 max-w-5xl w-full mx-auto">
        <section aria-label="Today's digest" className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-medium tracking-tight">Today</h2>
              <p className="text-sm text-stone-500 mt-1">
                {STUB_DIGEST.length} things to look at.
              </p>
            </div>
            <button
              type="button"
              className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Refresh
            </button>
          </div>

          <ul className="divide-y divide-stone-200 dark:divide-stone-900 -mx-2">
            {STUB_DIGEST.map((item) => (
              <li
                key={item.id}
                className="group px-2 py-4 first:pt-2 hover:bg-stone-100/60 dark:hover:bg-stone-900/40 rounded transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span
                    aria-label={`${item.urgency} urgency`}
                    className={`mt-2 h-1.5 w-1.5 rounded-full shrink-0 ${URGENCY_DOT[item.urgency]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-medium truncate">{item.title}</p>
                      {item.due_date && (
                        <span className="text-xs text-stone-500 shrink-0 tabular-nums">
                          {formatDueDate(item.due_date)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 mt-1 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-label="Chat with mailbox"
          className="flex flex-col min-h-[60vh]"
        >
          <h2 className="text-2xl font-medium tracking-tight">Ask</h2>
          <p className="text-sm text-stone-500 mt-1">
            Anything in your mailbox.
          </p>

          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-sm text-stone-400 dark:text-stone-600 max-w-xs text-center leading-relaxed">
              &ldquo;How many KrisFlyer points do I have?&rdquo;
              <br />
              &ldquo;What did Sarah ask me last week?&rdquo;
            </p>
          </div>

          <form className="border-t border-stone-200 dark:border-stone-900 pt-4 flex items-center gap-3">
            <input
              type="text"
              placeholder="Ask your mailbox…"
              className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
            />
            <button
              type="submit"
              disabled
              className="text-sm text-stone-500 disabled:opacity-40 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              Ask →
            </button>
          </form>
        </section>
      </main>

      <footer className="px-8 py-6 max-w-5xl w-full mx-auto text-xs text-stone-400 dark:text-stone-600">
        Claude Agent SDK · MCP
      </footer>
    </div>
  );
}
