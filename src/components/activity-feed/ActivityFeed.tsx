"use client";

import { formatDistanceToNow } from "date-fns";
import { Banknote, UserPlus, Zap, type LucideIcon } from "lucide-react";

import { useReferralEvents } from "@/hooks/useReferralEvents";

import type { ReferralEvent, ReferralEventType } from "./types";

type TypeStyle = {
  Icon: LucideIcon;
  iconBg: string;
  iconText: string;
  ring: string;
};

const TYPE_STYLES: Record<ReferralEventType, TypeStyle> = {
  signup: {
    Icon: UserPlus,
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-300",
    ring: "ring-teal-500/30"
  },
  activation: {
    Icon: Zap,
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-300",
    ring: "ring-violet-500/30"
  },
  commission: {
    Icon: Banknote,
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-300",
    ring: "ring-amber-500/30"
  }
};

function formatAmountNaira(amountKobo: number): string {
  const naira = amountKobo / 100;
  return `₦${naira.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function eventTitle(event: ReferralEvent): string {
  switch (event.type) {
    case "signup":
      return "New signup via your link";
    case "activation":
      return event.product_name
        ? `Referral activated ${event.product_name}`
        : "Referral activated";
    case "commission": {
      const amount =
        event.amount_kobo != null ? formatAmountNaira(event.amount_kobo) : null;
      const product = event.product_name;
      if (amount && product) return `${amount} commission from ${product}`;
      if (amount) return `${amount} commission earned`;
      return "Commission earned";
    }
  }
}

function relativeTime(iso: string): string {
  try {
    return `${formatDistanceToNow(new Date(iso))} ago`;
  } catch {
    return "";
  }
}

function FeedShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-5">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight text-slate-50">
          Recent referral activity
        </h2>
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          Live
        </span>
      </header>
      {children}
    </section>
  );
}

function LoadingRows() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 3 }).map((_, idx) => (
        <li
          key={idx}
          className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/40 p-3"
        >
          <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-800/70" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-800/70" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-slate-800/60" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-800/70 bg-slate-900/40 px-4 py-8 text-center">
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${TYPE_STYLES.signup.iconBg} ${TYPE_STYLES.signup.iconText} ${TYPE_STYLES.signup.ring}`}
      >
        <UserPlus className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="max-w-sm text-xs text-slate-300">
        No referral activity yet. Once someone signs up via your link, you&apos;ll
        see it here.
      </p>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-center text-xs text-rose-200">
      Couldn&apos;t load activity. Refresh to try again.
    </div>
  );
}

function EventRow({ event }: { event: ReferralEvent }) {
  const style = TYPE_STYLES[event.type];
  const { Icon } = style;
  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 transition-colors hover:border-slate-700/70">
      <div
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${style.iconBg} ${style.iconText} ${style.ring}`}
      >
        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-100">{eventTitle(event)}</p>
        <p className="text-[11px] text-slate-500">
          {relativeTime(event.occurred_at)}
        </p>
      </div>
    </li>
  );
}

export function ActivityFeed() {
  const { data, isLoading, isError } = useReferralEvents();

  if (isLoading) {
    return (
      <FeedShell>
        <LoadingRows />
      </FeedShell>
    );
  }

  if (isError) {
    return (
      <FeedShell>
        <ErrorState />
      </FeedShell>
    );
  }

  const events = data?.events ?? [];
  if (events.length === 0) {
    return (
      <FeedShell>
        <EmptyState />
      </FeedShell>
    );
  }

  return (
    <FeedShell>
      <ul className="space-y-2">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </ul>
    </FeedShell>
  );
}
