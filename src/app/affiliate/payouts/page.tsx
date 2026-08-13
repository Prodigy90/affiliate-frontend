"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Banknote } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";

import { getPayouts, requestPayout } from "@/lib/api/affiliate";
import type { Payout } from "@/lib/types/affiliate";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { TableSkeleton } from "@/components/table-skeleton";
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

export default function AffiliatePayoutsPage() {
  const queryClient = useQueryClient();
  const { isLoading: authLoading, isAuthenticated } = useAffiliate();

  const {
    data: earnings,
    isLoading: earningsLoading,
  } = useEarnings();

  const {
    data: payouts,
    isLoading: payoutsLoading,
  } = useQuery<Payout[], Error>({
    queryKey: ["payouts"],
    queryFn: () => getPayouts(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // Client-side pagination: the payouts list endpoint returns the full array
  // (no page/limit params on the backend), so we slice it here. Page state is
  // local to the history list and never re-fetches.
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);

  const allPayouts = payouts ?? [];
  const totalPages = Math.max(1, Math.ceil(allPayouts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visiblePayouts = allPayouts.slice(pageStart, pageStart + pageSize);

  const {
    register,
    handleSubmit,
    reset,
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
        `Payout requested for ${formatCurrency(
          res.amount ?? amountInKobo,
          currency,
        )}.`,
      );
      reset();
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
          Sign in with Google to manage your payouts.
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
          Payouts
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
          Request payouts and review your payout history.
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          You can request payouts up to your available balance. Refunds and
          chargebacks are automatically reflected in your available amount.
        </p>
      </section>
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)] items-start">
        <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <SectionHeader label="Balance" title="Available for payout" />
          <p className="text-xl font-semibold tabular-nums text-teal-300">
            {earningsLoading ? "Loading..." : formatCurrency(availableKobo, currency)}
          </p>
          <form
            className="space-y-3 pt-2"
            onSubmit={handleSubmit(onSubmit)}
          >
            <label className="space-y-1 text-xs text-slate-200">
              <span>Request amount (₦)</span>
              <input
                type="number"
                step="1"
                min={MIN_PAYOUT_NGN}
                placeholder={`Min ₦${MIN_PAYOUT_NGN.toLocaleString()}`}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="pt-1 text-[11px] text-red-400">
                  {errors.amount.message}
                </p>
              )}
            </label>
            <button
              type="submit"
              disabled={isSubmitting || availableNaira < MIN_PAYOUT_NGN}
              className="inline-flex h-9 items-center justify-center rounded-full bg-teal-500 px-4 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {isSubmitting ? "Requesting..." : "Request payout"}
            </button>
            {availableNaira < MIN_PAYOUT_NGN && !earningsLoading && (
              <p className="pt-1 text-[11px] text-slate-400">
                {availableNaira <= 0
                  ? "You currently have no available balance for payout."
                  : `Minimum payout is ₦${MIN_PAYOUT_NGN.toLocaleString()}. Your available balance is below this.`}
              </p>
            )}
          </form>
        </div>
        <div className="space-y-4">
          <SectionHeader label="History" title="Payout history" />
          {payoutsLoading ? (
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
              <TableSkeleton />
            </div>
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
                  <li
                    key={payout.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium tabular-nums text-slate-100">
                        {formatCurrency(payout.amount, payout.currency)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Requested on {formatDate(payout.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={payout.status} variant="payout" />
                  </li>
                ))}
              </ul>
              {allPayouts.length > pageSize && (
                <PaginationBar
                  page={safePage}
                  pageSize={pageSize}
                  total={allPayouts.length}
                  rowsOnPage={visiblePayouts.length}
                  entityLabel="payout"
                  entityLabelPlural="payouts"
                  onPageChange={(next) =>
                    setPage(Math.min(Math.max(1, next), totalPages))
                  }
                  onPageSizeChange={(next) => {
                    setPageSize(next);
                    setPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
