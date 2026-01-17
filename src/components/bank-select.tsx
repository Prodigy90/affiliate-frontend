"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, Building2 } from "lucide-react";
import type { Bank } from "@/lib/api/banks";

interface BankSelectProps {
  banks: Bank[];
  value: string;
  onChange: (bankCode: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  id?: string;
}

export function BankSelect({
  banks,
  value,
  onChange,
  disabled = false,
  placeholder = "Select a bank",
  error,
  id,
}: BankSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedBank = banks.find((b) => b.code === value);

  const filteredBanks = banks.filter((bank) =>
    bank.name.toLowerCase().includes(search.toLowerCase())
  );

  // Reset highlighted index when filtered banks change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Handle keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearch("");
      setHighlightedIndex(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredBanks.length - 1 ? prev + 1 : prev
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && isOpen && highlightedIndex >= 0) {
      e.preventDefault();
      const bank = filteredBanks[highlightedIndex];
      if (bank) {
        onChange(bank.code);
        setIsOpen(false);
        setSearch("");
        setHighlightedIndex(-1);
      }
    }
  }

  const listboxId = id ? `${id}-listbox` : "bank-select-listbox";

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-invalid={!!error}
        className={`
          w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-slate-600"}
          ${isOpen ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-700"}
          ${error ? "border-red-500" : ""}
          bg-slate-800/80
        `}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
          <span className={`truncate ${selectedBank ? "text-slate-100" : "text-slate-400"}`}>
            {selectedBank?.name || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 shadow-xl shadow-black/20 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search banks..."
                className="w-full rounded-md border border-slate-700 bg-slate-800 pl-8 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Bank List */}
          <div
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Banks"
            className="max-h-64 overflow-y-auto overscroll-contain"
          >
            {filteredBanks.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-slate-400">
                No banks found for &quot;{search}&quot;
              </div>
            ) : (
              <div className="p-1">
                {filteredBanks.map((bank, index) => {
                  const isSelected = bank.code === value;
                  const isHighlighted = index === highlightedIndex;
                  return (
                    <button
                      key={`${bank.code}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      data-index={index}
                      onClick={() => {
                        onChange(bank.code);
                        setIsOpen(false);
                        setSearch("");
                        setHighlightedIndex(-1);
                      }}
                      className={`
                        w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors
                        ${isSelected
                          ? "bg-emerald-500/10 text-emerald-400"
                          : isHighlighted
                          ? "bg-slate-800 text-slate-100"
                          : "text-slate-200 hover:bg-slate-800"
                        }
                      `}
                    >
                      <span className="truncate">{bank.name}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t border-slate-700/50 px-3 py-2 text-xs text-slate-500">
            {filteredBanks.length} bank{filteredBanks.length !== 1 ? "s" : ""} available
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
