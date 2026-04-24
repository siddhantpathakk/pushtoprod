"use client";

import { useState } from "react";
import type { ActionItem } from "./types";

const URGENCY_BAR: Record<"high" | "medium" | "low", string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-stone-400 dark:bg-stone-600",
};

const URGENCY_LABEL: Record<"high" | "medium" | "low", string> = {
  high: "High urgency",
  medium: "Medium urgency",
  low: "Low urgency",
};

function formatDueDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d="M3.5 8.5l3 3 6-6" />
    </svg>
  );
}

export default function DigestList({
  items,
  onRefresh,
  isRefreshing = false,
}: {
  items: ActionItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}) {
  const [doneIds, setDoneIds] = useState<Set<string>>(() => new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());

  async function markDone(id: string) {
    // Already done or in-flight: ignore.
    if (doneIds.has(id) || pendingIds.has(id)) return;

    // Optimistic update.
    setDoneIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    try {
      const res = await fetch("/api/mark-done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: id }),
      });
      if (!res.ok) {
        // Roll back.
        setDoneIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch {
      setDoneIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const doneCount = items.reduce(
    (n, item) => (doneIds.has(item.id) ? n + 1 : n),
    0,
  );

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">Today</h2>
          <p className="text-sm text-stone-500 mt-1">
            {doneCount > 0 ? (
              <>
                {items.length} things to look at.{" "}
                <span className="text-stone-400 dark:text-stone-600">
                  ({doneCount} of {items.length} done)
                </span>
              </>
            ) : (
              <>{items.length} things to look at.</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing || !onRefresh}
          className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <ul className="divide-y divide-stone-200 dark:divide-stone-900 -mx-2">
        {items.map((item) => {
          const isDone = doneIds.has(item.id);
          return (
            <li
              key={item.id}
              className={`group relative px-2 py-4 first:pt-2 hover:bg-stone-100/60 dark:hover:bg-stone-900/40 rounded transition-all duration-200 ${
                isDone ? "opacity-50" : ""
              }`}
            >
              {/* Urgency accent bar on the far left of the row. */}
              <span
                aria-label={URGENCY_LABEL[item.urgency]}
                className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${URGENCY_BAR[item.urgency]}`}
              />

              <div className="flex items-start gap-3 pl-2">
                <button
                  type="button"
                  onClick={() => markDone(item.id)}
                  disabled={isDone}
                  aria-pressed={isDone}
                  aria-label={
                    isDone ? `${item.title} — done` : `Mark "${item.title}" as done`
                  }
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isDone
                      ? "bg-stone-900 dark:bg-stone-100 border border-stone-900 dark:border-stone-100 text-white dark:text-stone-900"
                      : "border border-stone-300 dark:border-stone-700 hover:border-stone-500 dark:hover:border-stone-400 text-transparent hover:text-stone-400 dark:hover:text-stone-500"
                  }`}
                >
                  <CheckIcon className="h-2.5 w-2.5" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <p
                      className={`font-medium truncate transition-all duration-200 ${
                        isDone ? "line-through decoration-stone-400 decoration-1" : ""
                      }`}
                    >
                      {item.title}
                    </p>
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
          );
        })}
      </ul>
    </>
  );
}
