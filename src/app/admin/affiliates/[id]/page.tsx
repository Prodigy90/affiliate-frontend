"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { signIn } from "@/lib/auth-client";

import { getAdminAffiliateEarnings } from "@/lib/api/admin";
import type { EarningsSummary } from "@/lib/types/affiliate";
import type { PageProps } from "@/lib/types/session";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { StackedCard, StackedCardList } from "@/components/shared/StackedCard";
import { useAuthSession } from "@/components/auth-guard";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";
import { PageSkeleton } from "@/components/page-skeleton";
import { SearchInput } from "@/components/admin/SearchInput";
import {
  PaginationBar,
  type PageSize,
} from "@/components/admin/PaginationBar";
import { usePaginatedAdminAffiliateCommissions } from "@/lib/hooks/use-paginated-affiliate-commissions";

export default function AdminAffiliateDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { isAuthenticated, role, status } = useAuthSession();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  // q drives the query. SearchInput debounces internally (~300ms) before it
  // calls onChange, so we just commit the debounced value here and reset to
  // page 1 — no second debounce layer.
  const [q, setQ] = useState("");

  const {
    data: earnings,
    isLoading: isLoadingEarnings,
    isError: isErrorEarnings,
    refetch: refetchEarnings
  } = useQuery<EarningsSummary, Error>({
    queryKey: ["admin-affiliate-earnings", id],
    queryFn: () => getAdminAffiliateEarnings(id),
    enabled: isAuthenticated,
    staleTime: 30_000
  });

  const {
    data: commissionsData,
    isLoading: isLoadingCommissions,
    isError: isErrorCommissions,
    refetch: refetchCommissions,
    isFetching: isFetchingCommissions,
  } = usePaginatedAdminAffiliateCommissions({
    affiliateId: id,
    page,
    pageSize,
    q,
    enabled: isAuthenticated,
  });

  const pagination = commissionsData?.pagination;

  // Backend now filters on q (ILIKE across transaction id / customer / product
  // name) and returns the correct total, so we render the server rows directly.
  const commissions = commissionsData?.commissions ?? [];

  const handleSearchChange = useCallback((next: string) => {
    setQ(next);
    setPage(1);
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
          Sign in with your admin Google account to view affiliate details.
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

  if (role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-red-300">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  if (isLoadingEarnings) {
    return <PageSkeleton showCards cardCount={3} />;
  }

  if (isErrorEarnings || !earnings) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-slate-300">
          We could not load this affiliate right now.
        </p>
        <div className="flex gap-3">
          <button
            className="rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm hover:bg-teal-400 transition-colors"
            onClick={() => refetchEarnings()}
          >
            Try again
          </button>
          <Link
            href="/admin/affiliates"
            className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800"
          >
            Back to affiliates
          </Link>
        </div>
      </div>
    );
  }

  const currency = earnings.currency;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-400/80">
          Admin · Affiliate detail
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
          {earnings.affiliate_name}
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          Overview of this affiliate&apos;s earnings and commission history.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total earned"
          value={formatCurrency(earnings.total_earnings, currency)}
        />
        <StatCard
          title="Pending balance"
          value={formatCurrency(earnings.pending_balance, currency)}
        />
        <StatCard
          title="Available for payout"
          value={formatCurrency(earnings.available_for_payout, currency)}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Commission history
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {isFetchingCommissions && !isLoadingCommissions && (
              <span>Refreshing…</span>
            )}
            {isErrorCommissions && (
              <RetryButton onClick={() => refetchCommissions()} />
            )}
          </div>
        </div>

        <div className="w-full sm:max-w-sm">
          <SearchInput
            value={q}
            onChange={handleSearchChange}
            placeholder="Search by transaction ID, customer, or product…"
          />
        </div>

        {isLoadingCommissions ? (
          <TableSkeleton rows={4} headerWidth="w-32" />
        ) : commissions.length === 0 ? (
          q ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm text-slate-300">
                No commissions match &ldquo;{q}&rdquo;.
              </p>
              <p className="text-xs text-slate-500">
                Try a different search or clear the filter.
              </p>
            </div>
          ) : (
            <EmptyState
              icon={Coins}
              accent="teal"
              title="No commissions yet"
              body="This affiliate hasn't earned any commissions so far."
            />
          )
        ) : (
          <>
            {/* Mobile: stacked cards (<sm). */}
            <StackedCardList>
              {commissions.map((c) => (
                <StackedCard
                  key={c.id}
                  title={c.product.name}
                  subtitle={c.plan_name}
                  fields={[
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
                          {formatCurrency(c.commission_amount, c.currency)}
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
                      <p className="text-xs font-medium text-slate-100">
                        {c.product.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{c.plan_name}</p>
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
                    </td>
                    <td className="px-2 py-2">
                      <StatusBadge status={c.status} variant="commission" />
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs text-slate-200">
                        {formatDate(c.paid_at)}
                      </p>
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
            rowsOnPage={commissions.length}
            entityLabel="commission"
            entityLabelPlural="commissions"
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </section>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
};

function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/60 px-4 py-4 shadow-sm">
      <div className="relative space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
          {title}
        </p>
        <p className="text-lg font-semibold text-slate-50">{value}</p>
      </div>
    </div>
  );
}
