"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";

import { getCommissions } from "@/lib/api/affiliate";
import type { CommissionListResponse } from "@/lib/types/affiliate";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StackedCard, StackedCardList } from "@/components/shared/StackedCard";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";
import { useAuthSession } from "@/components/auth-guard";
import { PaginationBar, type PageSize } from "@/components/admin/PaginationBar";

export default function AffiliateCommissionsPage() {
	  const { isAuthenticated, status } = useAuthSession();

	  const [page, setPage] = useState(1);
	  const [limit, setLimit] = useState<PageSize>(20);

	  const { data, isLoading, isError, refetch } = useQuery<
	    CommissionListResponse,
	    Error
	  >({
	    queryKey: ["commissions", { page, limit }],
	    queryFn: () => getCommissions(page, limit),
	    enabled: isAuthenticated,
	    staleTime: 30_000,
	    // Keep the previous page visible while the next one loads so the table
	    // doesn't flash empty between page changes.
	    placeholderData: keepPreviousData,
	    // As with earnings, don't keep retrying on hard failures; it just
	    // makes the page feel slow.
	    retry: 0
	  });

  const commissions = data?.commissions ?? [];
  const pagination = data?.pagination;

  if (status === "loading") {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-slate-300">
          Sign in with Google to view your detailed commissions.
        </p>
        <button
          onClick={() => signIn.social({ provider: "google", callbackURL: window.location.pathname })}
          className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400"
        >
          <span>Sign in</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300/80">
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
            icon={Coins}
            accent="teal"
            title="No commissions yet"
            body="When your referrals convert to paying customers, your commissions show up here."
          />
        ) : (
          <>
            {/* Mobile: stacked cards (<sm). */}
            <StackedCardList>
              {commissions.map((c) => (
                <StackedCard
                  key={c.id}
                  title={c.product.name}
                  subtitle={`#${c.transaction_id}`}
                  fields={[
                    {
                      label: "Plan",
                      value: (
                        <span>
                          {c.plan_name} · {c.subscription_interval}
                        </span>
                      ),
                    },
                    {
                      label: "Payment",
                      value: (
                        <span>
                          #{c.payment_number} ·{" "}
                          {formatCurrency(c.payment_amount, c.currency)}
                        </span>
                      ),
                    },
                    {
                      label: "Commission",
                      value: (
                        <span className="font-semibold text-teal-300">
                          {formatCurrency(c.commission_amount, c.currency)} ·{" "}
                          {c.commission_rate.toFixed(1)}%
                        </span>
                      ),
                    },
                    {
                      label: "Status",
                      value: <StatusBadge status={c.status} variant="commission" />,
                    },
                    { label: "Paid at", value: formatDate(c.paid_at) },
                  ]}
                />
              ))}
            </StackedCardList>

            {/* Desktop: table (>=sm). */}
            <div className="hidden overflow-x-auto sm:block">
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
                      <p className="text-xs font-semibold text-teal-300">
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
            </div>

            {pagination && (
              <PaginationBar
                page={pagination.page}
                pageSize={limit}
                total={pagination.total}
                rowsOnPage={commissions.length}
                entityLabel="commission"
                entityLabelPlural="commissions"
                onPageChange={(next) => {
                  const max = Math.max(1, pagination.total_pages);
                  setPage(Math.min(Math.max(1, next), max));
                }}
                onPageSizeChange={(next) => {
                  setLimit(next);
                  // Reset to the first page so we don't land past the new last page.
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </section>
    </div>
  );
}
