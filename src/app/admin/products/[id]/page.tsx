"use client";

import { use, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

import { getProductById, updateProductCommissionConfig } from "@/lib/api/admin";
import type { ProductDetail } from "@/lib/types/product";
import type { PageProps } from "@/lib/types/session";
import { useAuthSession } from "@/components/auth-guard";
import { RetryButton } from "@/components/retry-button";

const commissionSchema = z.object({
	default_rate: z.coerce
		.number({ message: "Enter a default rate" })
		.min(0, "Must be at least 0"),
	recurring_rate: z.coerce
		.number({ message: "Enter a recurring rate" })
		.min(0, "Must be at least 0"),
	one_time_rate: z.coerce
		.number({ message: "Enter a one-time rate" })
		.min(0, "Must be at least 0"),
	max_payments: z.coerce
		.number({ message: "Enter max payments" })
		.int("Must be a whole number")
		.min(1, "Must be at least 1"),
	lifetime_commission_enabled: z.coerce.boolean().optional(),
	min_payout_amount: z.coerce
		.number({ message: "Enter a minimum payout amount" })
		.min(0, "Must be at least 0")
		.optional(),
});

type CommissionFormInput = z.input<typeof commissionSchema>;
type CommissionFormValues = z.infer<typeof commissionSchema>;

export default function AdminProductDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { backendToken, role, status } = useAuthSession();

  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery<ProductDetail, Error>({
    queryKey: ["admin-product", id],
    queryFn: () => getProductById(id, backendToken!),
    enabled: !!backendToken,
    staleTime: 30_000,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
	} = useForm<CommissionFormInput, unknown, CommissionFormValues>({
		resolver: zodResolver(commissionSchema),
	});

  useEffect(() => {
    if (product?.commission_config) {
      const cfg = product.commission_config;
      reset({
        default_rate: cfg.default_rate,
        recurring_rate: cfg.recurring_rate,
        one_time_rate: cfg.one_time_rate,
        max_payments: cfg.max_payments,
        lifetime_commission_enabled: cfg.lifetime_commission_enabled ?? false,
        min_payout_amount: cfg.min_payout_amount ?? 0,
      });
    }
  }, [product, reset]);

  async function onSubmit(values: CommissionFormValues) {
    if (!backendToken) {
      toast.error("Please sign in as admin to update commission config.");
      return;
    }

    try {
      await updateProductCommissionConfig(id, values, backendToken);
      toast.success("Commission config updated.");
      await refetch();
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "Failed to update commission config.");
    }
  }

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
          Sign in with your admin Google account to manage products.
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

  if (role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-red-300">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-52 animate-pulse rounded bg-slate-800/70" />
        <div className="h-32 w-full animate-pulse rounded bg-slate-800/60" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-red-300">
          Failed to load product. It may have been deleted.
        </p>
        <RetryButton onClick={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
          Admin · Product
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
          {product.name}
        </h1>
        <p className="max-w-xl text-sm text-slate-300">{product.description}</p>
        <p className="text-xs text-slate-400">
          ID: <span className="font-mono text-slate-200">{product.product_id}</span>
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)] items-start">
        <div className="space-y-3 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 text-xs text-slate-200">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Product details
          </p>
          <p>
            <span className="text-slate-400">Base URL:</span> {product.base_url}
          </p>
          <p>
            <span className="text-slate-400">Base commission rate:</span>{" "}
            {product.base_commission_rate}%
          </p>
          <p>
            <span className="text-slate-400">Max commission payments:</span>{" "}
            {product.max_commission_payments}
          </p>
          <p>
            <span className="text-slate-400">Status:</span>{" "}
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium capitalize">
              {product.status}
            </span>
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Commission config
          </p>
          <form className="space-y-3 pt-1" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Default rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...register("default_rate", { valueAsNumber: true })}
                />
                {errors.default_rate && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {errors.default_rate.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Max payments</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...register("max_payments", { valueAsNumber: true })}
                />
                {errors.max_payments && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {errors.max_payments.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Recurring rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...register("recurring_rate", { valueAsNumber: true })}
                />
                {errors.recurring_rate && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {errors.recurring_rate.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">One-time rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...register("one_time_rate", { valueAsNumber: true })}
                />
                {errors.one_time_rate && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {errors.one_time_rate.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Min payout amount</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...register("min_payout_amount", { valueAsNumber: true })}
                />
                {errors.min_payout_amount && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {errors.min_payout_amount.message}
                  </p>
                )}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-0"
                {...register("lifetime_commission_enabled")}
              />
              <span>Enable lifetime commissions for this product</span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-500 px-4 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {isSubmitting ? "Saving changes..." : "Save commission config"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
