"use client";

import { useState } from "react";
import type { SyncStatus } from "./types";

const DOT_CLASS: Record<SyncStatus, string> = {
  live: "bg-green-500 animate-pulse",
  syncing: "bg-amber-500 animate-pulse",
  idle: "bg-stone-400 dark:bg-stone-600",
};

const LABEL: Record<SyncStatus, string> = {
  live: "Synced 4 minutes ago · 127 emails scanned today",
  syncing: "Syncing mailbox…",
  idle: "Idle",
};

export default function StatusBar() {
  // Hardcoded "live" for now; useState keeps this ready to demo other states.
  const [status] = useState<SyncStatus>("live");

  return (
    <div className="border-b border-stone-200/60 dark:border-stone-900/60">
      <div className="max-w-5xl w-full mx-auto px-8 py-2 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${DOT_CLASS[status]}`}
          />
          <span>{LABEL[status]}</span>
        </div>
      </div>
    </div>
  );
}
