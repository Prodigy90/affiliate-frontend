"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";

import { formatDate } from "@/lib/utils/format";
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
import { usePaginatedAdminAffiliates } from "@/lib/hooks/use-paginated-affiliates";
import { CustomCommissionModal } from "@/components/admin/CustomCommissionModal";
import type { AdminAffiliate } from "@/lib/types/admin";

/** "Ada Lovelace" -> "AL", falls back to the first two chars of an email. */
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

/** Avatar chip for a table/card row — photo when we have one, initials otherwise. */
function AffiliateAvatar({ affiliate }: { affiliate: AdminAffiliate }) {
  const label = affiliate.name || affiliate.email;
  if (affiliate.avatar_url) {
    return (
      <Image
        src={affiliate.avatar_url}
        alt={label}
        width={36}
        height={36}
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-slate-700/70"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-semibold text-teal-400 ring-1 ring-teal-500/20">
      {getInitials(label)}
    </span>
  );
}

/** Role pill — admin gets the amber highlight, everyone else stays quiet. */
function RolePill({ role }: { role: string }) {
  const isAdmin = role.toLowerCase() === "admin";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
        isAdmin
          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
          : "border-slate-700/70 bg-slate-800/60 text-slate-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-amber-400" : "bg-slate-500"}`}
        aria-hidden="true"
      />
      {role}
    </span>
  );
}

/** Status pill — active/suspended/inactive per the affiliate schema's chk_status. */
function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const style =
    s === "active"
      ? "border-teal-500/30 bg-teal-500/10 text-teal-300"
      : s === "suspended"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
        : "border-slate-700/70 bg-slate-800/60 text-slate-400";
  const dot =
    s === "active" ? "bg-teal-400" : s === "suspended" ? "bg-rose-400" : "bg-slate-500";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}

/** Ref ID as a quiet mono chip — matches the settings page's referral chip. */
function RefIdChip({ refId }: { refId: string }) {
  return (
    <span
      className="rounded-md bg-slate-800/70 px-1.5 py-0.5 font-mono text-[11px] text-slate-400"
      title={refId}
    >
      {refId}
    </span>
  );
}

type FilterOption = { value: string; label: string };

const ROLE_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All roles" },
  { value: "affiliate", label: "Affiliate" },
  { value: "admin", label: "Admin" },
];

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" },
];

/** Segmented filter chip group — role/status filters forwarded to the backend. */
function SegmentedFilter({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: FilterOption[];
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="inline-flex rounded-lg border border-slate-800/70 bg-slate-950/60 p-0.5"
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value || "all"}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={
              active
                ? "rounded-md bg-teal-500/15 px-3 py-1.5 text-xs font-semibold text-teal-300"
                : "rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminAffiliatesPage() {
  const { isAuthenticated, role, status } = useAuthSession();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(50);
  // q drives the query. SearchInput debounces internally (~300ms) before it
  // calls onChange, so we just commit the debounced value here and reset to
  // page 1 — no second debounce layer.
  const [q, setQ] = useState("");

  // Role/status filters — forwarded to the backend, which already supports
  // both (see usePaginatedAdminAffiliates), just wiring them into the UI.
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Affiliate currently open in the "Custom commission" modal, if any.
  const [customRateAffiliate, setCustomRateAffiliate] = useState<AdminAffiliate | null>(null);

  const { data, isLoading, isError, refetch, isFetching } =
    usePaginatedAdminAffiliates({
      page,
      pageSize,
      q,
      role: roleFilter || undefined,
      status: statusFilter || undefined,
      enabled: isAuthenticated,
    });

  const pagination = data?.pagination;

  // Backend now filters on q (ILIKE across name/email/ref_id) and returns the
  // correct total, so we render the server rows directly.
  const affiliates = data?.affiliates ?? [];

  const handleSearchChange = useCallback((next: string) => {
    setQ(next);
    setPage(1);
  }, []);

  const handlePageSizeChange = (next: PageSize) => {
    setPageSize(next);
    setPage(1);
  };

  const handleRoleFilterChange = (next: string) => {
    setRoleFilter(next);
    setPage(1);
  };

  const handleStatusFilterChange = (next: string) => {
    setStatusFilter(next);
    setPage(1);
  };

  if (status === "loading") {
    return <PageSkeleton />;
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
          Affiliates
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          The people selling WASBOT.
        </h1>
        <p className="max-w-xl text-sm text-slate-400">
          See who is in the program, when they joined, and jump into per-affiliate
          earnings and commissions.
        </p>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            All affiliates
          </p>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            {isFetching && !isLoading && <span>Refreshing…</span>}
            {isError && <RetryButton onClick={() => refetch()} />}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-sm">
            <SearchInput
              value={q}
              onChange={handleSearchChange}
              placeholder="Search by name, email, or ref ID…"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SegmentedFilter
              ariaLabel="Filter by role"
              options={ROLE_FILTER_OPTIONS}
              value={roleFilter}
              onChange={handleRoleFilterChange}
            />
            <SegmentedFilter
              ariaLabel="Filter by status"
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={handleStatusFilterChange}
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} headerWidth="w-40" />
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
            <p className="text-xs text-slate-300">
              We couldn&apos;t load affiliates right now. Please try again.
            </p>
          </div>
        ) : affiliates.length === 0 ? (
          q || roleFilter || statusFilter ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm text-slate-300">
                {q ? (
                  <>No affiliates match &ldquo;{q}&rdquo;.</>
                ) : (
                  "No affiliates match this filter."
                )}
              </p>
              <p className="text-xs text-slate-500">
                Try a different search or clear the filter.
              </p>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              accent="teal"
              title="No affiliates yet"
              body="Once people sign up through a referral link, they'll show up here."
            />
          )
        ) : (
          <>
            {/* Mobile: stacked cards (<sm). */}
            <StackedCardList>
              {affiliates.map((a) => (
                <StackedCard
                  key={a.id}
                  title={a.name || a.email}
                  subtitle={a.email}
                  action={
                    <Link
                      href={`/admin/affiliates/${a.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                    >
                      <span>View</span>
                    </Link>
                  }
                  fields={[
                    {
                      label: "Role / status",
                      value: (
                        <span className="flex flex-wrap items-center gap-1.5">
                          <RolePill role={a.role} />
                          <StatusPill status={a.status} />
                        </span>
                      ),
                    },
                    { label: "Ref ID", value: <RefIdChip refId={a.ref_id} /> },
                    { label: "Joined", value: formatDate(a.created_at) },
                  ]}
                  footer={
                    <button
                      type="button"
                      onClick={() => setCustomRateAffiliate(a)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:border-teal-500/40 hover:bg-slate-700"
                    >
                      <span>Custom commission</span>
                    </button>
                  }
                />
              ))}
            </StackedCardList>

            {/* Desktop: table (>=sm). */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="min-w-full text-left text-xs text-slate-200">
                <thead className="border-b border-slate-800/70">
                  <tr>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Affiliate
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Role &amp; status
                    </th>
                    <th className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Joined / last login
                    </th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-slate-800/50 align-middle transition-colors last:border-0 hover:bg-slate-800/30"
                    >
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <AffiliateAvatar affiliate={a} />
                          <div className="min-w-0 space-y-0.5">
                            <p className="truncate text-xs font-medium text-slate-100">
                              {a.name || a.email}
                            </p>
                            <p className="truncate text-[11px] text-slate-400">{a.email}</p>
                            <RefIdChip refId={a.ref_id} />
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <RolePill role={a.role} />
                          <StatusPill status={a.status} />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-xs text-slate-200">
                          Joined {formatDate(a.created_at)}
                        </p>
                        {a.last_login_at && (
                          <p className="text-[11px] text-slate-400">
                            Last login {formatDate(a.last_login_at)}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setCustomRateAffiliate(a)}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:border-teal-500/40 hover:bg-slate-700"
                          >
                            <span>Custom commission</span>
                          </button>
                          <Link
                            href={`/admin/affiliates/${a.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                          >
                            <span>View details</span>
                            <ArrowRight className="h-3 w-3" aria-hidden="true" />
                          </Link>
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
            rowsOnPage={affiliates.length}
            entityLabel="affiliate"
            entityLabelPlural="affiliates"
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </section>

      {customRateAffiliate && (
        <CustomCommissionModal
          affiliate={customRateAffiliate}
          onClose={() => setCustomRateAffiliate(null)}
        />
      )}
    </div>
  );
}
