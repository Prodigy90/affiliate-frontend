"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Coins, HandCoins, UserPlus, Wallet } from "lucide-react";
import { signIn } from "@/lib/auth-client";

import { getAdminAffiliateEarnings } from "@/lib/api/admin";
import type { EarningsSummary } from "@/lib/types/affiliate";
import type { PageProps } from "@/lib/types/session";
import {
  formatDate,
  formatInteger,
  formatNaira,
  shortenId,
} from "@/lib/utils/format";
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
import { usePaginatedAdminAffiliateSignups } from "@/lib/hooks/use-paginated-affiliate-signups";

/** "Ada Lovelace" -> "AL", falls back to "?" for an empty name. */
function getInitials(name: string): string {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || "?";
}

/** ID chip — a quiet mono badge, reused for trace IDs in the signups table. */
function IdChip({ id }: { id: string }) {
  return (
    <span className="rounded-md bg-slate-800/70 px-1.5 py-0.5 font-mono text-[11px] text-slate-400">
      {id}
    </span>
  );
}

export default function AdminAffiliateDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { isAuthenticated, role, status } = useAuthSession();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  // q drives the query. SearchInput debounces internally (~300ms) before it
  // calls onChange, so we just commit the debounced value here and reset to
  // page 1 — no second debounce layer.
  const [q, setQ] = useState("");

  // Referred-signups pagination is independent of the commission history above.
  const [signupsPage, setSignupsPage] = useState(1);
  const [signupsPageSize, setSignupsPageSize] = useState<PageSize>(50);

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

  const {
    data: signupsData,
    isLoading: isLoadingSignups,
    isError: isErrorSignups,
    refetch: refetchSignups,
    isFetching: isFetchingSignups,
  } = usePaginatedAdminAffiliateSignups({
    affiliateId: id,
    page: signupsPage,
    pageSize: signupsPageSize,
    enabled: isAuthenticated,
  });

  const signupsPagination = signupsData?.pagination;
  const signups = signupsData?.signups ?? [];
  const signupsTotal = signupsPagination?.total ?? 0;

  const handleSearchChange = useCallback((next: string) => {
    setQ(next);
    setPage(1);
  }, []);

  const handlePageSizeChange = (next: PageSize) => {
    setPageSize(next);
    setPage(1);
  };

  const handleSignupsPageSizeChange = (next: PageSize) => {
    setSignupsPageSize(next);
    setSignupsPage(1);
  };

  if (status === "loading") {
    return <PageSkeleton />;
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
        <Link
          href="/admin/affiliates"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-teal-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to affiliates
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
          Affiliate
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {earnings.affiliate_name}
        </h1>
        <p className="max-w-xl text-sm text-slate-400">
          Overview of this affiliate&apos;s earnings and commission history.
        </p>
      </section>

      {/* Identity + earnings hero — the admin-facing sibling of the affiliate
          settings identity row. The admin earnings endpoint only returns the
          name and totals (no email/role/status/avatar), so the hero sticks to
          what's actually fetched here. */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex min-w-0 items-center gap-3.5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-lg font-semibold text-teal-400 ring-2 ring-teal-500/30">
            {getInitials(earnings.affiliate_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-50">
              {earnings.affiliate_name}
            </p>
            <p className="truncate text-xs text-slate-500">
              Affiliate <IdChip id={shortenId(earnings.affiliate_id)} />
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-800/50 pt-4">
          <StatBlock
            icon={Coins}
            label="Total earned"
            value={formatNaira(earnings.total_earnings, currency)}
          />
          <StatBlock
            icon={HandCoins}
            label="Pending balance"
            value={formatNaira(earnings.pending_balance, currency)}
          />
          <StatBlock
            icon={Wallet}
            label="Available for payout"
            value={formatNaira(earnings.available_for_payout, currency)}
          />
          <StatBlock
            icon={UserPlus}
            label="Referred signups"
            value={
              isLoadingSignups ? "…" : isErrorSignups ? "—" : formatInteger(signupsTotal)
            }
          />
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
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
                        <span className="font-mono tabular-nums">
                          #{c.payment_number} ·{" "}
                          {formatNaira(c.payment_amount, c.currency)}
                        </span>
                      ),
                    },
                    {
                      label: "Commission",
                      value: (
                        <span className="font-mono font-semibold tabular-nums text-teal-300">
                          {formatNaira(c.commission_amount, c.currency)}
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
                <thead className="border-b border-slate-800/70">
                  <tr>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Product
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Payment
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Commission
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Paid at
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-800/50 align-middle transition-colors last:border-0 hover:bg-slate-800/30"
                    >
                      <td className="px-3 py-3">
                        <p className="text-xs font-medium text-slate-100">
                          {c.product.name}
                        </p>
                        <p className="text-[11px] text-slate-400">{c.plan_name}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs text-slate-200">
                          Payment {c.payment_number}
                        </p>
                        <p className="font-mono text-[11px] tabular-nums text-slate-400">
                          {formatNaira(c.payment_amount, c.currency)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-xs font-semibold tabular-nums text-teal-300">
                          {formatNaira(c.commission_amount, c.currency)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={c.status} variant="commission" />
                      </td>
                      <td className="px-3 py-3">
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

      <section className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Referred signups
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {isFetchingSignups && !isLoadingSignups && <span>Refreshing…</span>}
            {isErrorSignups && (
              <RetryButton onClick={() => refetchSignups()} />
            )}
          </div>
        </div>

        {isLoadingSignups ? (
          <TableSkeleton rows={4} headerWidth="w-32" />
        ) : isErrorSignups ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <p className="text-sm text-slate-300">
              Couldn&apos;t load referred signups.
            </p>
            <p className="text-xs text-slate-500">
              Use Retry above to try again.
            </p>
          </div>
        ) : signupsTotal === 0 ? (
          <EmptyState
            icon={UserPlus}
            accent="violet"
            title="No referred signups yet"
            body="Nobody has signed up through this affiliate's link so far."
          />
        ) : (
          <>
            {/* Mobile: stacked cards (<sm). */}
            <StackedCardList>
              {signups.map((s) => (
                <StackedCard
                  key={s.id}
                  title={<IdChip id={s.trace_id ? shortenId(s.trace_id) : shortenId(s.id)} />}
                  fields={[
                    { label: "Occurred", value: formatDate(s.occurred_at) },
                    { label: "Tracked", value: formatDate(s.created_at) },
                  ]}
                />
              ))}
            </StackedCardList>

            {/* Desktop: table (>=sm). */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-left text-xs text-slate-200">
                <thead className="border-b border-slate-800/70">
                  <tr>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Trace ID
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Occurred
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Tracked
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {signups.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-slate-800/50 align-middle transition-colors last:border-0 hover:bg-slate-800/30"
                    >
                      <td className="px-3 py-3">
                        <IdChip id={s.trace_id ? shortenId(s.trace_id) : shortenId(s.id)} />
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs text-slate-200">
                          {formatDate(s.occurred_at)}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs text-slate-200">
                          {formatDate(s.created_at)}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {signupsPagination && signupsTotal > 0 && (
          <PaginationBar
            page={signupsPage}
            pageSize={signupsPageSize}
            total={signupsPagination.total}
            rowsOnPage={signups.length}
            entityLabel="signup"
            entityLabelPlural="signups"
            onPageChange={setSignupsPage}
            onPageSizeChange={handleSignupsPageSizeChange}
          />
        )}
      </section>
    </div>
  );
}

type StatBlockProps = {
  icon: typeof Coins;
  label: string;
  value: string;
};

/** Icon-chip stat block — the settings page's FactBlock pattern, sized for money. */
function StatBlock({ icon: Icon, label, value }: StatBlockProps) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-800/70 text-teal-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {label}
        </p>
        <p className="font-mono text-base font-semibold tabular-nums text-slate-50">
          {value}
        </p>
      </div>
    </div>
  );
}
