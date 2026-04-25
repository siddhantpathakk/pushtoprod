"use client";

import { useEffect, useState } from "react";
import type { SyncStatus } from "./types";

const DOT_CLASS: Record<SyncStatus, string> = {
  live: "bg-green-500 animate-pulse",
  syncing: "bg-amber-500 animate-pulse",
  idle: "bg-stone-400 dark:bg-stone-600",
};

function formatRelative(elapsedMs: number): string {
  if (elapsedMs < 30_000) return "just now";
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes < 1) return "less than a minute ago";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Props = {
  refreshedAt: number | null;
  scannedCount: number | null;
  isRefreshing: boolean;
};

export default function StatusBar({
  refreshedAt,
  scannedCount,
  isRefreshing,
}: Props) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const status: SyncStatus = isRefreshing
    ? "syncing"
    : refreshedAt === null
      ? "idle"
      : "live";

  let label: string;
  if (status === "syncing") {
    label = "Syncing mailbox…";
  } else if (status === "idle" || refreshedAt === null) {
    label = "Idle";
  } else {
    const relative = formatRelative(Date.now() - refreshedAt);
    const count = scannedCount ?? 0;
    label = `Synced ${relative} · ${count} emails in last refresh`;
  }

  return (
    <div className="border-b border-stone-200/60 dark:border-stone-900/60">
      <div className="max-w-5xl w-full mx-auto px-8 py-2 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${DOT_CLASS[status]}`}
          />
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}
