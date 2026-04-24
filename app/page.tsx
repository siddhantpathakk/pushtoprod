import { STUB_DIGEST } from "@/lib/stub-data";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Push to Prod — Email Secretary</h1>
        <select
          className="text-sm border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-900"
          defaultValue="finance"
        >
          <option value="developer">Developer</option>
          <option value="manager">Manager</option>
          <option value="finance">Finance / HR</option>
        </select>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-7xl mx-auto">
        <section aria-label="Today's digest" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today&apos;s digest</h2>
            <button
              type="button"
              className="text-sm rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5"
            >
              Refresh
            </button>
          </div>
          <ul className="space-y-2">
            {STUB_DIGEST.map((item) => (
              <li
                key={item.id}
                className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 bg-white dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {item.category}
                      {item.due_date ? ` · due ${item.due_date}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                      item.urgency === "high"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : item.urgency === "medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {item.urgency}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                  {item.reason}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Chat with mailbox" className="space-y-3">
          <h2 className="text-lg font-semibold">Chat with your mailbox</h2>
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 h-[60vh] flex flex-col">
            <div className="flex-1 p-4 text-sm text-zinc-500">
              Chat UI goes here. Wire to <code>/api/ask</code> with streaming.
            </div>
            <form className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex gap-2">
              <input
                type="text"
                placeholder="How many KrisFlyer points do I have?"
                className="flex-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2"
              />
              <button
                type="submit"
                disabled
                className="text-sm rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-2 disabled:opacity-50"
              >
                Ask
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-zinc-500 py-6">
        Push to Prod 2026 · Built with Claude Agent SDK + MCP
      </footer>
    </div>
  );
}
