"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

export type SearchInputProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** Debounce delay in ms. Defaults to 300ms. */
  debounceMs?: number;
  className?: string;
  /** Optional aria label override. */
  ariaLabel?: string;
};

/**
 * SearchInput renders a small debounced search box with a clear button.
 *
 * `value` is the committed (debounced) value. Local typing is buffered for
 * `debounceMs` and only then forwarded to `onChange`. Pressing the clear
 * button or hitting Escape resets immediately.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  debounceMs = 300,
  className,
  ariaLabel,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);

  // Sync down when parent resets externally (e.g. clearing filters elsewhere).
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // Debounce upward.
  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(t);
  }, [local, value, debounceMs, onChange]);

  const showClear = local.length > 0;

  return (
    <div
      className={
        "relative flex w-full items-center " + (className ?? "")
      }
    >
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-slate-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && local) {
            setLocal("");
            onChange("");
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/40"
      />
      {showClear && (
        <button
          type="button"
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          aria-label="Clear search"
          className="absolute right-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
