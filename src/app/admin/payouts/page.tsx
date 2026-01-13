"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

import {
  approvePayout,
  getAdminPayouts,
  rejectPayout
} from "@/lib/api/admin";
import type { AdminPayoutListResponse } from "@/lib/types/admin";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { LOTTIE_EMPTY_STATE } from "@/lib/constants/lottie";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { useAuthSession } from "@/components/auth-guard";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";

export default function AdminPayoutsPage() {
	  const queryClient = useQueryClient();
	  const { backendToken, role, status } = useAuthSession();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<
    AdminPayoutListResponse,
    Error
  >({
    queryKey: ["admin-payouts"],
    queryFn: () => getAdminPayouts({ page: 1, limit: 20 }, backendToken!),
    enabled: !!backendToken,
    staleTime: 30_000
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approvePayout(id, backendToken!),
    onSuccess: () => {
      toast.success("Payout marked as completed.");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to approve payout.");
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectPayout(id, backendToken!),
    onSuccess: () => {
      toast.success("Payout rejected.");
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reject payout.");
    }
  });

  const payouts = data?.payouts ?? [];
  const pagination = data?.pagination;

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-slate-300">Checking your session...</p>
      </div>
    );
  }

  if (!backendToken) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-slate-300">
          Sign in with your admin Google account to review payouts.
        </p>
        <button
          onClick={() => signIn.social({ provider: "google", callbackURL: "/admin/payouts" })}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400"
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
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
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Payout requests
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {isFetching && <span>Refreshing…</span>}
            {isError && <RetryButton onClick={() => refetch()} />}
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={2} />
        ) : payouts.length === 0 ? (
          <EmptyState lottieUrl={LOTTIE_EMPTY_STATE} message="There are no payout requests yet. As affiliates request payouts, they will appear here for review." />
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
                        {shortenId(payout.affiliate_id)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {payout.affiliate_id}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs font-semibold text-emerald-300">
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
                          className="rounded-full bg-emerald-500 px-3 py-1 text-[11px] font-medium text-emerald-950 disabled:cursor-not-allowed disabled:bg-emerald-500/40"
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

            {pagination && (
              <p className="pt-3 text-[11px] text-slate-400">
                Showing page {pagination.page} of {pagination.total_pages} ·{" "}
                {pagination.total} payout requests
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function shortenId(id: string) {
  if (id.length <= 8) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
