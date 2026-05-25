"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";

import type { AdminAffiliate } from "@/lib/types/admin";
import { formatDate } from "@/lib/utils/format";
import { LOTTIE_EMPTY_STATE } from "@/lib/constants/lottie";
import { EmptyState } from "@/components/empty-state";
import { useAuthSession } from "@/components/auth-guard";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";
import { SearchInput } from "@/components/admin/SearchInput";
import {
  PaginationBar,
  type PageSize,
} from "@/components/admin/PaginationBar";
import { usePaginatedAdminAffiliates } from "@/lib/hooks/use-paginated-affiliates";

export default function AdminAffiliatesPage() {
  const { isAuthenticated, role, status } = useAuthSession();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  const [q, setQ] = useState("");

  const { data, isLoading, isError, refetch, isFetching } =
    usePaginatedAdminAffiliates({
      page,
      pageSize,
      q,
      enabled: isAuthenticated,
    });

  const pagination = data?.pagination;

  // Client-side narrow on top of the server page. Backend doesn't filter on q
  // yet, so without this typing wouldn't visibly do anything until that ships.
  const visibleAffiliates = useMemo(
    () => filterAffiliatesByQuery(data?.affiliates ?? [], q),
    [data?.affiliates, q],
  );

  const handleSearchChange = (next: string) => {
    setQ(next);
    setPage(1);
  };

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
          Sign in with your admin Google account to view affiliates.
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

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-400/80">
          Admin · Affiliates
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
          Inspect affiliates and their performance.
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          See who is in the program, when they joined, and jump into per-affiliate
          earnings and commissions.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            All affiliates
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
            placeholder="Search by name, email, or ref ID…"
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} headerWidth="w-40" />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <p className="text-xs text-slate-300">
              We couldn&apos;t load affiliates right now. Please try again.
            </p>
          </div>
        ) : visibleAffiliates.length === 0 ? (
          q ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm text-slate-300">
                No affiliates match &ldquo;{q}&rdquo;.
              </p>
              <p className="text-xs text-slate-500">
                Try a different search or clear the filter.
              </p>
            </div>
          ) : (
            <EmptyState
              lottieUrl={LOTTIE_EMPTY_STATE}
              message="There are no affiliates yet. Once people sign up, they'll appear here."
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="border-b border-slate-800/80 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="px-2 py-2">Affiliate</th>
                  <th className="px-2 py-2">Role &amp; status</th>
                  <th className="px-2 py-2">Joined / last login</th>
                  <th className="px-2 py-2 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {visibleAffiliates.map((a) => (
                  <tr key={a.id} className="align-middle">
                    <td className="px-2 py-2">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-100">
                          {a.name || a.email}
                        </p>
                        <p className="text-[11px] text-slate-400">{a.email}</p>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs capitalize text-slate-200">{a.role}</p>
                      <p className="text-[11px] capitalize text-slate-400">
                        {a.status}
                      </p>
                    </td>
                    <td className="px-2 py-2">
                      <p className="text-xs text-slate-200">
                        Joined {formatDate(a.created_at)}
                      </p>
                      {a.last_login_at && (
                        <p className="text-[11px] text-slate-400">
                          Last login {formatDate(a.last_login_at)}
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/affiliates/${a.id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                        >
                          <span>View details</span>
                        </Link>
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
            total={pagination.total}
            rowsOnPage={visibleAffiliates.length}
            entityLabel="affiliate"
            entityLabelPlural="affiliates"
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </section>
    </div>
  );
}

function filterAffiliatesByQuery(rows: AdminAffiliate[], q: string) {
  if (!q) return rows;
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((a) => {
    return (
      (a.name ?? "").toLowerCase().includes(needle) ||
      (a.email ?? "").toLowerCase().includes(needle) ||
      (a.ref_id ?? "").toLowerCase().includes(needle) ||
      (a.role ?? "").toLowerCase().includes(needle) ||
      (a.status ?? "").toLowerCase().includes(needle)
    );
  });
}
