"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

import { getPayouts, requestPayout } from "@/lib/api/affiliate";
import type { Payout } from "@/lib/types/affiliate";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/table-skeleton";
import { useEarnings } from "@/lib/hooks/use-earnings";
import { useAffiliate } from "@/lib/hooks/use-affiliate";
import { LOTTIE_EMPTY_STATE } from "@/lib/constants/lottie";

const payoutSchema = z.object({
	amount: z.coerce
		.number({ message: "Enter a payout amount" })
		.min(1, "Amount must be at least 1"),
});

type PayoutFormInput = z.input<typeof payoutSchema>;
type PayoutFormValues = z.infer<typeof payoutSchema>;

export default function AffiliatePayoutsPage() {
  const queryClient = useQueryClient();
  const { backendToken, isLoading: authLoading, isAuthenticated } = useAffiliate();

  const {
    data: earnings,
    isLoading: earningsLoading,
  } = useEarnings();

  const {
    data: payouts,
    isLoading: payoutsLoading,
  } = useQuery<Payout[], Error>({
    queryKey: ["payouts"],
    queryFn: () => getPayouts(backendToken!),
    enabled: !!backendToken,
    staleTime: 30_000,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
	} = useForm<PayoutFormInput, unknown, PayoutFormValues>({
		resolver: zodResolver(payoutSchema),
	});

  const available = earnings?.available_for_payout ?? 0;
  const currency = earnings?.currency ?? "NGN";

  async function onSubmit(values: PayoutFormValues) {
    if (!backendToken) {
      toast.error("Please sign in to request a payout.");
      return;
    }

    if (!earnings) {
      toast.error("Earnings not loaded yet. Please try again.");
      return;
    }

    if (values.amount > available) {
      toast.error("Requested amount exceeds your available balance.");
      return;
    }

    try {
      const res = await requestPayout(values.amount, backendToken);
      toast.success(
        `Payout requested for ${formatCurrency(
          res.amount ?? values.amount,
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
          Sign in with Google to manage your payouts.
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
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Available for payout
          </p>
          <p className="text-xl font-semibold text-slate-50">
            {earningsLoading ? "Loading..." : formatCurrency(available, currency)}
          </p>
          <form
            className="space-y-3 pt-2"
            onSubmit={handleSubmit(onSubmit)}
          >
            <label className="space-y-1 text-xs text-slate-200">
              <span>Request amount</span>
              <input
                type="number"
                step="1"
                min={1}
                placeholder="Enter amount"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
              disabled={isSubmitting || available <= 0}
              className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-500 px-4 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {isSubmitting ? "Requesting..." : "Request payout"}
            </button>
            {available <= 0 && !earningsLoading && (
              <p className="pt-1 text-[11px] text-slate-400">
                You currently have no available balance for payout.
              </p>
            )}
          </form>
        </div>
        <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Payout history
            </p>
          </div>
          {payoutsLoading ? (
            <TableSkeleton />
          ) : !payouts || payouts.length === 0 ? (
            <EmptyState
              lottieUrl={LOTTIE_EMPTY_STATE}
              message="You haven't requested any payouts yet."
            />
          ) : (
            <ul className="divide-y divide-slate-800/80 text-xs">
              {payouts.map((payout) => (
                <li
                  key={payout.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-slate-100">
                      {formatCurrency(payout.amount, payout.currency)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Requested on {formatDate(payout.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={payout.status} variant="payout" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
