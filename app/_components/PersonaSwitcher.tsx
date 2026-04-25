"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomPersona, Persona, PresetPersona } from "./types";

const PRESET_PERSONAS: { value: PresetPersona; label: string; hint: string }[] =
  [
    { value: "developer", label: "Developer", hint: "Build alerts, PRs, incidents." },
    { value: "manager", label: "Manager", hint: "People, meetings, decisions." },
    { value: "finance", label: "Finance / HR", hint: "Bills, points, renewals." },
  ];

const STORAGE_KEY = "clarion:custom-personas";
const ACTIVE_KEY = "clarion:active-persona";

const PRESET_LABELS: Record<PresetPersona, string> = {
  developer: "Developer",
  manager: "Manager",
  finance: "Finance / HR",
};

export function isPresetPersona(p: Persona): p is PresetPersona {
  return typeof p === "string";
}

export function personaLabel(p: Persona): string {
  return isPresetPersona(p) ? PRESET_LABELS[p] : p.name || "Custom";
}

export function personaKey(p: Persona): string {
  return isPresetPersona(p) ? `preset:${p}` : `custom:${p.name}`;
}

export function loadCustomPersonas(): CustomPersona[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (p): p is CustomPersona =>
        p &&
        typeof p === "object" &&
        typeof p.name === "string" &&
        typeof p.focus === "string",
    );
  } catch {
    return [];
  }
}

export function loadActivePersona(): Persona | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") {
      if (parsed === "developer" || parsed === "manager" || parsed === "finance") {
        return parsed;
      }
      return null;
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.name === "string" &&
      typeof parsed.focus === "string"
    ) {
      return parsed as CustomPersona;
    }
    return null;
  } catch {
    return null;
  }
}

function saveCustomPersonas(personas: CustomPersona[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
}

function saveActivePersona(p: Persona) {
  window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(p));
}

interface Props {
  persona: Persona;
  onChange: (p: Persona) => void;
}

export default function PersonaSwitcher({ persona, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [customs, setCustoms] = useState<CustomPersona[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [focus, setFocus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage on mount
    setCustoms(loadCustomPersonas());
  }, []);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setError(null);
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setCreating(false);
        setError(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  function selectPersona(p: Persona) {
    onChange(p);
    saveActivePersona(p);
    setOpen(false);
    setCreating(false);
  }

  function saveCustom() {
    setError(null);
    const trimmedName = name.trim();
    const trimmedFocus = focus.trim();
    if (!trimmedName) {
      setError("Give it a name.");
      return;
    }
    if (trimmedFocus.length < 8) {
      setError("Add a sentence or two of focus.");
      return;
    }
    if (
      customs.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())
    ) {
      setError("A persona with this name already exists.");
      return;
    }
    const next: CustomPersona = { name: trimmedName, focus: trimmedFocus };
    const updated = [...customs, next];
    setCustoms(updated);
    saveCustomPersonas(updated);
    setName("");
    setFocus("");
    setCreating(false);
    selectPersona(next);
  }

  function deleteCustom(p: CustomPersona) {
    const updated = customs.filter((c) => c.name !== p.name);
    setCustoms(updated);
    saveCustomPersonas(updated);
    if (!isPresetPersona(persona) && persona.name === p.name) {
      selectPersona("finance");
    }
  }

  const activeKey = personaKey(persona);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="text-sm bg-transparent text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 focus:outline-none cursor-pointer transition-colors flex items-center gap-1"
      >
        <span>{personaLabel(persona)}</span>
        <span aria-hidden className="text-xs">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 z-20 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 shadow-lg p-1 text-sm"
        >
          <div className="px-2 pt-1.5 pb-1 text-[11px] uppercase tracking-wider text-stone-400">
            Presets
          </div>
          {PRESET_PERSONAS.map((p) => {
            const isActive = activeKey === `preset:${p.value}`;
            return (
              <button
                key={p.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => selectPersona(p.value)}
                className={`w-full text-left px-2 py-1.5 rounded-sm flex items-start justify-between gap-2 hover:bg-stone-100 dark:hover:bg-stone-900 ${
                  isActive ? "bg-stone-100 dark:bg-stone-900" : ""
                }`}
              >
                <span>
                  <span className="block text-stone-900 dark:text-stone-100">
                    {p.label}
                  </span>
                  <span className="block text-xs text-stone-500">{p.hint}</span>
                </span>
                {isActive && (
                  <span aria-hidden className="text-stone-500 mt-0.5">
                    ✓
                  </span>
                )}
              </button>
            );
          })}

          {customs.length > 0 && (
            <>
              <div className="px-2 pt-2 pb-1 text-[11px] uppercase tracking-wider text-stone-400">
                Yours
              </div>
              {customs.map((p) => {
                const isActive = activeKey === `custom:${p.name}`;
                return (
                  <div
                    key={p.name}
                    className={`group rounded-sm flex items-start justify-between gap-2 hover:bg-stone-100 dark:hover:bg-stone-900 ${
                      isActive ? "bg-stone-100 dark:bg-stone-900" : ""
                    }`}
                  >
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={isActive}
                      onClick={() => selectPersona(p)}
                      className="flex-1 text-left px-2 py-1.5"
                    >
                      <span className="block text-stone-900 dark:text-stone-100">
                        {p.name}
                      </span>
                      <span className="block text-xs text-stone-500 line-clamp-1">
                        {p.focus}
                      </span>
                    </button>
                    <div className="flex items-center pr-2 pt-1.5 gap-1.5">
                      {isActive && (
                        <span aria-hidden className="text-stone-500">
                          ✓
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteCustom(p)}
                        aria-label={`Delete ${p.name} persona`}
                        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <div className="my-1 border-t border-stone-200 dark:border-stone-800" />

          {!creating ? (
            <button
              type="button"
              onClick={() => {
                setCreating(true);
                setError(null);
              }}
              className="w-full text-left px-2 py-1.5 rounded-sm hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-600 dark:text-stone-400"
            >
              + New persona
            </button>
          ) : (
            <div className="p-2 space-y-2">
              <div>
                <label className="block text-xs text-stone-500 mb-1">
                  Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Researcher"
                  maxLength={40}
                  className="w-full text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded px-2 py-1 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-500 mb-1">
                  What should we focus on?
                </label>
                <textarea
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  placeholder="Conference deadlines, paper reviews, replies from co-authors, grant updates."
                  rows={3}
                  maxLength={500}
                  className="w-full text-sm bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded px-2 py-1 focus:outline-none focus:border-stone-400 dark:focus:border-stone-600 resize-none"
                />
              </div>
              {error && (
                <p className="text-xs text-red-500" role="alert">
                  {error}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setName("");
                    setFocus("");
                    setError(null);
                  }}
                  className="text-xs text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveCustom}
                  className="text-xs bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 rounded px-2.5 py-1 hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
