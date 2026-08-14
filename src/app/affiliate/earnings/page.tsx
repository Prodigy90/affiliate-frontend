"use client";

import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Banknote, Coins } from "lucide-react";

import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";
import { getCommissions, getPayouts, requestPayout } from "@/lib/api/affiliate";
import type {
	Commission,
	CommissionListResponse,
	Payout,
} from "@/lib/types/affiliate";
import { formatDate, formatNaira } from "@/lib/utils/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";
import { useEarnings } from "@/lib/hooks/use-earnings";
import { useAffiliate } from "@/lib/hooks/use-affiliate";
import { MIN_PAYOUT_NGN } from "@/lib/constants/payouts";
import { PaginationBar, type PageSize } from "@/components/admin/PaginationBar";

const payoutSchema = z.object({
	amount: z.coerce
		.number({ message: "Enter a payout amount" })
		.min(MIN_PAYOUT_NGN, `Minimum payout is ₦${MIN_PAYOUT_NGN.toLocaleString()}`),
});

type PayoutFormInput = z.input<typeof payoutSchema>;
type PayoutFormValues = z.infer<typeof payoutSchema>;

type HistoryTab = "commissions" | "payouts";

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
					<p className="font-mono text-xs font-semibold tabular-nums text-teal-300">
						+{formatNaira(c.commission_amount, c.currency)}
					</p>
					<p className="text-[11px] text-slate-500">
						{c.commission_rate.toFixed(1)}% rate
					</p>
				</div>
			</div>
			<div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
				<p className="min-w-0 truncate text-[11px] text-slate-500">
					Payment {c.payment_number} ·{" "}
					<span className="font-mono tabular-nums">
						{formatNaira(c.payment_amount, c.currency)}
					</span>
					<span className="hidden sm:inline"> · {formatDate(c.paid_at)}</span>
				</p>
				<StatusBadge status={c.status} variant="commission" />
			</div>
		</li>
	);
}

function PayoutRow({ payout }: { payout: Payout }) {
	return (
		<li className="flex items-center justify-between gap-3 px-4 py-2.5">
			<div className="min-w-0 flex-1">
				<p className="truncate font-mono text-sm font-medium tabular-nums text-slate-100">
					{formatNaira(payout.amount, payout.currency)}
				</p>
				<p className="text-[11px] text-slate-500">
					Requested on {formatDate(payout.created_at)}
				</p>
			</div>
			<StatusBadge status={payout.status} variant="payout" />
		</li>
	);
}

export default function AffiliateEarningsPage() {
	const queryClient = useQueryClient();
	const { isLoading: authLoading, isAuthenticated } = useAffiliate();

	const { data: earnings, isLoading: earningsLoading } = useEarnings();

	const [tab, setTab] = useState<HistoryTab>("commissions");

	// Commission history — server-side pagination.
	const [commissionPage, setCommissionPage] = useState(1);
	const [commissionLimit, setCommissionLimit] = useState<PageSize>(20);
	const {
		data: commissionData,
		isLoading: commissionsLoading,
		isError: commissionsError,
		refetch: refetchCommissions,
	} = useQuery<CommissionListResponse, Error>({
		queryKey: ["commissions", { page: commissionPage, limit: commissionLimit }],
		queryFn: () => getCommissions(commissionPage, commissionLimit),
		enabled: isAuthenticated,
		staleTime: 30_000,
		// Keep the previous page visible while the next one loads so the list
		// doesn't flash empty between page changes.
		placeholderData: keepPreviousData,
		retry: 0,
	});
	const commissions = commissionData?.commissions ?? [];
	const commissionPagination = commissionData?.pagination;

	// Payout history — the endpoint returns the full array, so we slice
	// client-side. Page state is local to the list and never re-fetches.
	const { data: payouts, isLoading: payoutsLoading } = useQuery<Payout[], Error>({
		queryKey: ["payouts"],
		queryFn: () => getPayouts(),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});
	const [payoutPage, setPayoutPage] = useState(1);
	const [payoutPageSize, setPayoutPageSize] = useState<PageSize>(20);
	const allPayouts = payouts ?? [];
	const payoutTotalPages = Math.max(1, Math.ceil(allPayouts.length / payoutPageSize));
	const safePayoutPage = Math.min(payoutPage, payoutTotalPages);
	const payoutStart = (safePayoutPage - 1) * payoutPageSize;
	const visiblePayouts = allPayouts.slice(payoutStart, payoutStart + payoutPageSize);

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<PayoutFormInput, unknown, PayoutFormValues>({
		resolver: zodResolver(payoutSchema),
	});

	// API returns amounts in kobo (smallest unit), convert to naira for display
	const availableKobo = earnings?.available_for_payout ?? 0;
	const availableNaira = availableKobo / 100;
	const currency = earnings?.currency ?? "NGN";

	async function onSubmit(values: PayoutFormValues) {
		if (!isAuthenticated) {
			toast.error("Please sign in to request a payout.");
			return;
		}

		if (!earnings) {
			toast.error("Earnings not loaded yet. Please try again.");
			return;
		}

		// User enters naira, compare with available naira
		if (values.amount > availableNaira) {
			toast.error("Requested amount exceeds your available balance.");
			return;
		}

		try {
			// Convert naira to kobo for API (backend stores amounts in kobo)
			const amountInKobo = values.amount * 100;
			const res = await requestPayout(amountInKobo);
			toast.success(
				`Payout requested for ${formatNaira(res.amount ?? amountInKobo, currency)}.`,
			);
			reset();
			setTab("payouts");
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["earnings"] }),
				queryClient.invalidateQueries({ queryKey: ["payouts"] }),
			]);
		} catch (err) {
			const message =
				(err instanceof Error && err.message) ||
				"Unable to request payout. Please try again.";
			toast.error(message);
		}
	}

	if (authLoading) {
		return <PageSkeleton />;
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<p className="text-sm text-slate-300">
					Sign in with Google to see your earnings.
				</p>
				<button
					onClick={() =>
						signIn.social({ provider: "google", callbackURL: window.location.pathname })
					}
					className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400"
				>
					<span>Sign in</span>
				</button>
			</div>
		);
	}

	const historyLoading = tab === "commissions" ? commissionsLoading : payoutsLoading;

	return (
		<div className="space-y-6">
			<section className="space-y-1.5">
				<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300/80">
					Earnings
				</p>
				<h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
					Your commissions and payouts.
				</h1>
				<p className="max-w-xl text-sm text-slate-400">
					Every commission you&apos;ve earned, what&apos;s ready to withdraw,
					and where your payouts stand.
				</p>
			</section>

			{/* Balance strip — available funds + inline withdraw */}
			<section className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-slate-900/60 p-5">
				<div
					className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl"
					aria-hidden="true"
				/>
				<div className="relative flex flex-wrap items-end justify-between gap-4">
					<div className="min-w-0">
						<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
							Available to withdraw
						</p>
						<p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-teal-300 sm:text-4xl">
							{earningsLoading ? "—" : formatNaira(availableKobo, currency)}
						</p>
					</div>
					<form
						className="flex flex-wrap items-start gap-2"
						onSubmit={handleSubmit(onSubmit)}
					>
						<div>
							<label className="sr-only" htmlFor="payout-amount">
								Payout amount in naira
							</label>
							<div className="flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-950/70 p-1 transition-colors focus-within:border-teal-500/60 focus-within:ring-1 focus-within:ring-teal-500/40">
								<span className="pl-2.5 text-sm text-slate-500">₦</span>
								<input
									id="payout-amount"
									type="number"
									step="1"
									min={MIN_PAYOUT_NGN}
									placeholder={`Min ${MIN_PAYOUT_NGN.toLocaleString()}`}
									className="h-9 w-28 bg-transparent text-sm text-slate-50 outline-none placeholder:text-slate-600 [appearance:textfield] sm:w-32 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
									{...register("amount", { valueAsNumber: true })}
								/>
								{availableNaira >= MIN_PAYOUT_NGN && (
									<button
										type="button"
										onClick={() =>
											setValue("amount", Math.floor(availableNaira), {
												shouldValidate: true,
											})
										}
										className="rounded-lg px-2 py-1 text-[11px] font-semibold text-teal-300/90 transition-colors hover:bg-teal-500/10"
									>
										Max
									</button>
								)}
								<button
									type="submit"
									disabled={isSubmitting || availableNaira < MIN_PAYOUT_NGN}
									className="h-9 rounded-lg bg-teal-500 px-4 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
								>
									{isSubmitting ? "Requesting..." : "Withdraw"}
								</button>
							</div>
							{errors.amount && (
								<p className="pt-1 text-[11px] text-red-400">
									{errors.amount.message}
								</p>
							)}
						</div>
					</form>
				</div>
				<div className="relative mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-800/50 pt-3">
					<div>
						<p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
							Pending
						</p>
						<p className="font-mono text-sm tabular-nums text-slate-200">
							{formatNaira(earnings?.pending_balance ?? 0, currency)}
						</p>
					</div>
					<div>
						<p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
							Earned to date
						</p>
						<p className="font-mono text-sm tabular-nums text-slate-200">
							{formatNaira(earnings?.total_earnings ?? 0, currency)}
						</p>
					</div>
					<div>
						<p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
							Paid out
						</p>
						<p className="font-mono text-sm tabular-nums text-slate-200">
							{formatNaira(earnings?.paid_balance ?? 0, currency)}
						</p>
					</div>
				</div>
				{availableNaira < MIN_PAYOUT_NGN && !earningsLoading && (
					<p className="relative pt-2 text-[11px] text-slate-400">
						{availableNaira <= 0
							? "You currently have no available balance for payout."
							: `Minimum payout is ₦${MIN_PAYOUT_NGN.toLocaleString()}. Your available balance is below this.`}
					</p>
				)}
			</section>

			{/* History — commissions / payouts */}
			<section className="space-y-3">
				<div className="flex items-center justify-between gap-3">
					<div
						className="flex w-fit rounded-lg border border-slate-800/70 bg-slate-950/60 p-0.5"
						role="tablist"
						aria-label="History"
					>
						{(["commissions", "payouts"] as const).map((t) => {
							const active = tab === t;
							const count =
								t === "commissions"
									? commissionPagination?.total
									: payouts
										? allPayouts.length
										: undefined;
							return (
								<button
									key={t}
									role="tab"
									aria-selected={active}
									onClick={() => setTab(t)}
									className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
										active
											? "bg-teal-500/15 text-teal-300"
											: "text-slate-400 hover:text-slate-200"
									}`}
								>
									{t}
									{count !== undefined && (
										<span className="ml-1.5 tabular-nums opacity-60">
											{count}
										</span>
									)}
								</button>
							);
						})}
					</div>
					{tab === "commissions" && commissionsError && (
						<RetryButton onClick={() => refetchCommissions()} />
					)}
				</div>

				{historyLoading ? (
					<div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
						<TableSkeleton />
					</div>
				) : tab === "commissions" ? (
					commissions.length === 0 ? (
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
							{commissionPagination && (
								<PaginationBar
									page={commissionPagination.page}
									pageSize={commissionLimit}
									total={commissionPagination.total}
									rowsOnPage={commissions.length}
									entityLabel="commission"
									entityLabelPlural="commissions"
									onPageChange={(next) => {
										const max = Math.max(1, commissionPagination.total_pages);
										setCommissionPage(Math.min(Math.max(1, next), max));
									}}
									onPageSizeChange={(next) => {
										setCommissionLimit(next);
										// Reset to the first page so we don't land past the new last page.
										setCommissionPage(1);
									}}
								/>
							)}
						</>
					)
				) : allPayouts.length === 0 ? (
					<EmptyState
						icon={Banknote}
						accent="teal"
						title="No payouts yet"
						body="You haven't requested a payout yet. Once you have an available balance, you can cash out here."
					/>
				) : (
					<>
						<ul className="divide-y divide-slate-800/50 rounded-xl border border-slate-800/70 bg-slate-900/60">
							{visiblePayouts.map((payout) => (
								<PayoutRow key={payout.id} payout={payout} />
							))}
						</ul>
						{allPayouts.length > payoutPageSize && (
							<PaginationBar
								page={safePayoutPage}
								pageSize={payoutPageSize}
								total={allPayouts.length}
								rowsOnPage={visiblePayouts.length}
								entityLabel="payout"
								entityLabelPlural="payouts"
								onPageChange={(next) =>
									setPayoutPage(Math.min(Math.max(1, next), payoutTotalPages))
								}
								onPageSizeChange={(next) => {
									setPayoutPageSize(next);
									setPayoutPage(1);
								}}
							/>
						)}
					</>
				)}
			</section>
		</div>
	);
}
