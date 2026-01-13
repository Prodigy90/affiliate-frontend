"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

type ReferralLinkCardProps = {
  linkUrl: string;
  campaignName?: string | null;
  conversions: number;
  createdAt: string;
};

export function ReferralLinkCard({
  linkUrl,
  campaignName,
  conversions,
  createdAt,
}: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="group rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 transition-colors hover:border-slate-700/80 hover:bg-slate-900/60">
      <div className="flex items-start justify-between gap-3">
        {/* Link and metadata */}
        <div className="min-w-0 flex-1 space-y-2">
          {/* Campaign badge */}
          {campaignName && (
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {campaignName}
            </span>
          )}

          {/* Link URL - truncated with hover to show full */}
          <div className="group/link relative">
            <p className="truncate font-mono text-xs text-emerald-400">
              {linkUrl}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              {conversions} conversion{conversions !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {format(new Date(createdAt), "d MMM yyyy")}
            </span>
          </div>
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            copied
              ? "border-emerald-600 bg-emerald-500/10 text-emerald-400"
              : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-400"
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Copied
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
