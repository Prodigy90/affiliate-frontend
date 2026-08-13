"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";

import { getCommissions } from "@/lib/api/affiliate";
import type { Commission, CommissionListResponse } from "@/lib/types/affiliate";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";
import { useAuthSession } from "@/components/auth-guard";
import { PaginationBar, type PageSize } from "@/components/admin/PaginationBar";

function CommissionRow({ c }: { c: Commission }) {
	return (
		<li className="px-4 py-2.5">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium text-slate-100">
						{c.product.name}
					</p>
					<p className="mt-0.5 truncate text-[11px] text-slate-500">
						{c.plan_name} · {c.subscription_interval} · #{c.transaction_id}
					</p>
				</div>
				<div className="shrink-0 text-right">
					<p className="text-xs font-semibold tabular-nums text-teal-300">
						{formatCurrency(c.commission_amount, c.currency)}
					</p>
					<p className="text-[11px] text-slate-500">
						{c.commission_rate.toFixed(1)}% rate
					</p>
				</div>
			</div>
			<div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
				<p className="min-w-0 truncate text-[11px] text-slate-500">
					Payment {c.payment_number} ·{" "}
					{formatCurrency(c.payment_amount, c.currency)}
					<span className="hidden sm:inline"> · {formatDate(c.paid_at)}</span>
				</p>
				<StatusBadge status={c.status} variant="commission" />
			</div>
		</li>
	);
}

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
		retry: 0,
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

			<section className="space-y-3">
				<SectionHeader
					label="History"
					title="Commission history"
					action={isError && <RetryButton onClick={() => refetch()} />}
				/>

				{isLoading ? (
					<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
						<TableSkeleton />
					</div>
				) : commissions.length === 0 ? (
					<EmptyState
						icon={Coins}
						accent="teal"
						title="No commissions yet"
						body="When your referrals convert to paying customers, your commissions show up here."
					/>
				) : (
					<>
						<ul className="divide-y divide-slate-800/50 rounded-xl border border-slate-800/70 bg-slate-900/60">
							{commissions.map((c) => (
								<CommissionRow key={c.id} c={c} />
							))}
						</ul>

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
