"use client";

import { useQuery } from "@tanstack/react-query";
import { signIn } from "@/lib/auth-client";

import { getCommissions } from "@/lib/api/affiliate";
import type { CommissionListResponse } from "@/lib/types/affiliate";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";
import { useAuthSession } from "@/components/auth-guard";
import { LOTTIE_EMPTY_STATE } from "@/lib/constants/lottie";

export default function AffiliateCommissionsPage() {
	  const { backendToken, status } = useAuthSession();

	  const { data, isLoading, isError, refetch } = useQuery<
	    CommissionListResponse,
	    Error
	  >({
	    queryKey: ["commissions", { page: 1, limit: 20 }],
	    queryFn: () => getCommissions(backendToken!),
	    enabled: !!backendToken,
	    staleTime: 30_000,
	    // As with earnings, don't keep retrying on hard failures; it just
	    // makes the page feel slow.
	    retry: 0
	  });

  const commissions = data?.commissions ?? [];
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
          Sign in with Google to view your detailed commissions.
        </p>
        <button
          onClick={() => signIn.social({ provider: "google", callbackURL: window.location.pathname })}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400"
        >
          <span>Sign in</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
          Commissions
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
          Detailed view of your commission history.
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          See every commission credited to your account across products,
          including amounts, plans, and status.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Commission history
          </p>
          {isError && <RetryButton onClick={() => refetch()} />}
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : commissions.length === 0 ? (
          <EmptyState
            lottieUrl={LOTTIE_EMPTY_STATE}
            message="You don't have any commissions yet. Once referrals convert, their commissions will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="border-b border-slate-800/80 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-2 py-2">Product</th>
                  <th className="px-2 py-2">Plan</th>
                  <th className="px-2 py-2">Payment</th>
                  <th className="px-2 py-2">Commission</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Paid at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {commissions.map((c) => (
                  <tr key={c.id} className="align-middle">
                    <td className="px-2 py-2">
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-100">
                          {c.product.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          #{c.transaction_id}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs text-slate-200">{c.plan_name}</p>
                      <p className="text-[11px] text-slate-400">
                        {c.subscription_interval}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs text-slate-200">
                        Payment {c.payment_number}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatCurrency(c.payment_amount, c.currency)}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs font-semibold text-emerald-300">
                        {formatCurrency(c.commission_amount, c.currency)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {c.commission_rate.toFixed(1)}% rate
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <StatusBadge status={c.status} variant="commission" />
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs text-slate-200">
                        {formatDate(c.paid_at)}
                      </p>
                      {c.credited_at && (
                        <p className="text-[11px] text-slate-400">
                          Credited {formatDate(c.credited_at)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && (
              <p className="pt-3 text-[11px] text-slate-400">
                Showing page {pagination.page} of {pagination.total_pages} ·
                {" "}
                {pagination.total} commissions
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
