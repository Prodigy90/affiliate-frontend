"use client";

import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Banknote, Check, X } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";

import { approvePayout, rejectPayout } from "@/lib/api/admin";
import { formatNaira, formatDate } from "@/lib/utils/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { StackedCard, StackedCardList } from "@/components/shared/StackedCard";
import { useAuthSession } from "@/components/auth-guard";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";
import { SearchInput } from "@/components/admin/SearchInput";
import {
  PaginationBar,
  type PageSize,
} from "@/components/admin/PaginationBar";
import { usePaginatedAdminPayouts } from "@/lib/hooks/use-paginated-payouts";

// Status pill palette for payouts — dot + tinted border, matched to the
// house status-pill pattern. Kept local to this page rather than folded
// into the shared StatusBadge, which other (non-dotted) surfaces rely on.
const STATUS_STYLES: Record<string, { pill: string; dot: string }> = {
  completed: {
    pill: "border-teal-500/30 bg-teal-500/10 text-teal-300",
    dot: "bg-teal-400",
  },
  pending: {
    pill: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    dot: "bg-amber-400",
  },
  processing: {
    pill: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    dot: "bg-sky-400",
  },
  failed: {
    pill: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
  },
  rejected: {
    pill: "border-rose-500/30 bg-rose-500/10 text-rose-300",
    dot: "bg-rose-400",
  },
};

const DEFAULT_STATUS_STYLE = {
  pill: "border-slate-700 bg-slate-800/60 text-slate-300",
  dot: "bg-slate-400",
};

function PayoutStatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STATUS_STYLE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style.pill}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, role, status } = useAuthSession();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  // q drives the query. SearchInput debounces internally (~300ms) before it
  // calls onChange, so we just commit the debounced value here and reset to
  // page 1 — no second debounce layer.
  const [q, setQ] = useState("");

  const { data, isLoading, isError, refetch, isFetching } =
    usePaginatedAdminPayouts({
      page,
      pageSize,
      q,
      enabled: isAuthenticated,
    });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approvePayout(id),
    onSuccess: () => {
      toast.success("Payout marked as completed.");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve payout.");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectPayout(id),
    onSuccess: () => {
      toast.success("Payout rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject payout.");
    }
  });

  const pagination = data?.pagination;

  // Backend now filters on q (ILIKE across payout id / affiliate name / email)
  // and returns the correct total, so we render the server rows directly.
  const payouts = data?.payouts ?? [];

  // Status counts for the summary strip — derived from the current page's
  // response only (no extra API calls), so this reflects this page, not the
  // full filtered result set.
  const statusCounts = Object.entries(
    payouts.reduce<Record<string, number>>((acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1;
      return acc;
    }, {}),
  );

  const handleSearchChange = useCallback((next: string) => {
    setQ(next);
    setPage(1);
  }, []);

  const handlePageSizeChange = (next: PageSize) => {
    setPageSize(next);
    setPage(1);
  };

  if (status === "loading") {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-slate-300">
          Sign in with your admin Google account to review payouts.
        </p>
        <button
          onClick={() => signIn.social({ provider: "google", callbackURL: "/admin/payouts" })}
          className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400"
        >
          <span>Sign in</span>
        </button>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-red-300">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
          Payouts
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Money going out.
        </h1>
        <p className="max-w-xl text-sm text-slate-400">
          Review payout requests across all affiliates and mark them completed
          or rejected once a manual transfer is done.
        </p>
      </section>

      {/* Summary strip — status counts for the current page, a quiet at-a-glance
          read before scanning the table below. */}
      {!isLoading && !isError && payouts.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            This page
          </p>
          {statusCounts.map(([statusKey, count]) => {
            const style = STATUS_STYLES[statusKey] ?? DEFAULT_STATUS_STYLE;
            return (
              <div key={statusKey} className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
                <span className="text-xs capitalize text-slate-400">{statusKey}</span>
                <span className="font-mono text-xs font-semibold tabular-nums text-slate-100">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <section className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Payout requests
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {isFetching && !isLoading && <span>Refreshing…</span>}
            {isError && <RetryButton onClick={() => refetch()} />}
          </div>
        </div>

        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={q}
            onChange={handleSearchChange}
            placeholder="Search by affiliate name, email, or payout ID…"
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : payouts.length === 0 ? (
          q ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm text-slate-300">
                No payout requests match &ldquo;{q}&rdquo;.
              </p>
              <p className="text-xs text-slate-500">
                Try a different search or clear the filter.
              </p>
            </div>
          ) : (
            <EmptyState
              icon={Banknote}
              accent="teal"
              title="No payout requests"
              body="When affiliates request payouts, they'll appear here for review."
            />
          )
        ) : (
          <>
            {/* Mobile: stacked cards (<sm). */}
            <StackedCardList>
              {payouts.map((payout) => (
                <StackedCard
                  key={payout.id}
                  title={payout.affiliate_name || shortenId(payout.affiliate_id)}
                  subtitle={
                    payout.affiliate_name
                      ? shortenId(payout.affiliate_id)
                      : payout.affiliate_id
                  }
                  fields={[
                    {
                      label: "Amount",
                      value: (
                        <span className="font-mono font-semibold tabular-nums text-teal-300">
                          {formatNaira(payout.amount, payout.currency)}
                        </span>
                      ),
                    },
                    {
                      label: "Status",
                      value: <PayoutStatusPill status={payout.status} />,
                    },
                    { label: "Requested", value: formatDate(payout.created_at) },
                  ]}
                  footer={
                    payout.status === "pending" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => approveMutation.mutate(payout.id)}
                          className="inline-flex items-center gap-1 rounded-full bg-teal-500 px-3 py-1 text-[11px] font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-teal-500/40"
                        >
                          <Check className="h-3 w-3" aria-hidden="true" />
                          Mark completed
                        </button>
                        <button
                          type="button"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(payout.id)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:border-slate-700/60 disabled:bg-slate-800/40 disabled:text-slate-500"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                          Reject
                        </button>
                      </div>
                    ) : null
                  }
                />
              ))}
            </StackedCardList>

            {/* Desktop: table (>=sm). */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Affiliate
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Amount
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Requested
                    </th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="border-b border-slate-800/50 align-middle transition-colors hover:bg-slate-800/30"
                    >
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-slate-100">
                          {payout.affiliate_name || shortenId(payout.affiliate_id)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {payout.affiliate_name ? shortenId(payout.affiliate_id) : payout.affiliate_id}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-sm font-semibold tabular-nums text-teal-300">
                          {formatNaira(payout.amount, payout.currency)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <PayoutStatusPill status={payout.status} />
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm text-slate-300">
                          {formatDate(payout.created_at)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            disabled={
                              payout.status !== "pending" ||
                              approveMutation.isPending ||
                              rejectMutation.isPending
                            }
                            onClick={() => approveMutation.mutate(payout.id)}
                            className="inline-flex items-center gap-1 rounded-full bg-teal-500 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            Mark completed
                          </button>
                          <button
                            type="button"
                            disabled={
                              payout.status !== "pending" ||
                              approveMutation.isPending ||
                              rejectMutation.isPending
                            }
                            onClick={() => rejectMutation.mutate(payout.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:border-slate-700/60 disabled:bg-slate-800/40 disabled:text-slate-500"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {pagination && (
          <PaginationBar
            page={page}
            pageSize={pageSize}
            // Backend filters on q and returns the correct filtered total.
            total={pagination.total}
            rowsOnPage={payouts.length}
            entityLabel="payout request"
            entityLabelPlural="payout requests"
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </section>
    </div>
  );
}

function shortenId(id: string) {
  if (id.length <= 8) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
