"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

import { approvePayout, rejectPayout } from "@/lib/api/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { LOTTIE_EMPTY_STATE } from "@/lib/constants/lottie";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useAuthSession } from "@/components/auth-guard";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";
import { SearchInput } from "@/components/admin/SearchInput";
import {
  PaginationBar,
  type PageSize,
} from "@/components/admin/PaginationBar";
import { usePaginatedAdminPayouts } from "@/lib/hooks/use-paginated-payouts";

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, role, status } = useAuthSession();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  // qInput is the raw, controlled input value; q is the debounced value that
  // actually drives the query so we don't refetch on every keystroke.
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");

  // Debounce the search input into q (~300ms) and reset to page 1 whenever the
  // debounced term changes.
  useEffect(() => {
    const handle = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handle);
  }, [qInput]);

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

  const handleSearchChange = useCallback((next: string) => {
    setQInput(next);
  }, []);

  const handlePageSizeChange = (next: PageSize) => {
    setPageSize(next);
    setPage(1);
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-slate-300">Checking your session...</p>
      </div>
    );
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-400/80">
          Admin · Payouts
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
          Review and process payout requests.
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          See payout requests across all affiliates and mark them as completed or
          rejected when manual transfers are done.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
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
            value={qInput}
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
              lottieUrl={LOTTIE_EMPTY_STATE}
              message="There are no payout requests yet. As affiliates request payouts, they will appear here for review."
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="border-b border-slate-800/80 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-2 py-2">Affiliate</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Requested</th>
                  <th className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="align-middle">
                    <td className="px-2 py-2">
                      <p className="text-xs font-medium text-slate-100">
                        {payout.affiliate_name || shortenId(payout.affiliate_id)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {payout.affiliate_name ? shortenId(payout.affiliate_id) : payout.affiliate_id}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs font-semibold text-teal-300">
                        {formatCurrency(payout.amount, payout.currency)}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <StatusBadge status={payout.status} variant="payout" />
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs text-slate-200">
                        {formatDate(payout.created_at)}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={
                            payout.status !== "pending" ||
                            approveMutation.isPending ||
                            rejectMutation.isPending
                          }
                          onClick={() => approveMutation.mutate(payout.id)}
                          className="rounded-full bg-teal-500 px-3 py-1 text-[11px] font-medium text-teal-950 disabled:cursor-not-allowed disabled:bg-teal-500/40"
                        >
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
                          className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 disabled:cursor-not-allowed disabled:border-slate-700/60 disabled:bg-slate-800/60"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
