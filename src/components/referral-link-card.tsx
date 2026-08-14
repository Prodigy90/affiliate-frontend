"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Check, Copy, Link2, TrendingUp } from "lucide-react";
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
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3 space-y-2">
      {/* Campaign badge */}
      {campaignName && (
        <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
          {campaignName}
        </span>
      )}

      {/* Link URL field row */}
      <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/60 px-2.5 py-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
        <p className="min-w-0 truncate font-mono text-xs text-teal-300" title={linkUrl}>
          {linkUrl}
        </p>
        <button
          onClick={handleCopy}
          aria-label="Copy referral link"
          className={`shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
            copied
              ? "bg-teal-500/10 text-teal-300"
              : "text-slate-300 hover:bg-slate-800/70 hover:text-teal-300"
          }`}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" aria-hidden="true" />
          {conversions} conversion{conversions !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" aria-hidden="true" />
          {format(new Date(createdAt), "d MMM yyyy")}
        </span>
      </div>
    </div>
  );
}
