"use client";

import { use, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";

import { getProductById, updateProduct, updateProductCommissionConfig } from "@/lib/api/admin";
import type { ProductDetail } from "@/lib/types/product";
import type { PageProps } from "@/lib/types/session";
import { useAuthSession } from "@/components/auth-guard";
import { RetryButton } from "@/components/retry-button";

const productSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().min(1, "Description is required"),
	base_url: z
		.string()
		.min(1, "Base URL is required")
		.url("Enter a valid URL"),
	signup_path: z
		.string()
		.refine(
			(val) => val === "" || val.startsWith("/"),
			{ message: "Must start with /" }
		)
		.optional(),
	base_commission_rate: z.coerce
		.number({ message: "Enter a base commission rate" })
		.min(0, "Rate must be at least 0"),
	max_commission_payments: z.preprocess(
		(val) => (val === "" || val === undefined || val === null || (typeof val === "number" && Number.isNaN(val)) ? undefined : Number(val)),
		z.number().int("Must be a whole number").min(1, "Must be at least 1").optional().nullable()
	),
	unlimited_commissions: z.boolean().optional(),
	status: z.string().optional(),
});

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormValues = z.infer<typeof productSchema>;

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
  const queryClient = useQueryClient();

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

  // Product details form
  const {
    register: registerProduct,
    handleSubmit: handleSubmitProduct,
    reset: resetProduct,
    watch: watchProduct,
    setValue: setProductValue,
    formState: { errors: productErrors, isSubmitting: isSubmittingProduct },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
  });

  const watchUnlimited = watchProduct("unlimited_commissions");

  // Clear max_commission_payments when "Unlimited" is checked
  useEffect(() => {
    if (watchUnlimited) {
      setProductValue("max_commission_payments", undefined, { shouldValidate: true });
    }
  }, [watchUnlimited, setProductValue]);

  // Commission config form
  const {
    register: registerCommission,
    handleSubmit: handleSubmitCommission,
    reset: resetCommission,
    formState: { errors: commissionErrors, isSubmitting: isSubmittingCommission },
  } = useForm<CommissionFormInput, unknown, CommissionFormValues>({
    resolver: zodResolver(commissionSchema),
  });

  // Reset product form when product data loads
  useEffect(() => {
    if (product) {
      const isUnlimited = product.max_commission_payments === null || product.max_commission_payments === 0;
      resetProduct({
        name: product.name,
        description: product.description,
        base_url: product.base_url,
        signup_path: product.signup_path || "",
        base_commission_rate: product.base_commission_rate,
        max_commission_payments: isUnlimited ? undefined : product.max_commission_payments,
        unlimited_commissions: isUnlimited,
        status: product.status as "active" | "inactive",
      });
    }
  }, [product, resetProduct]);

  // Reset commission form when product data loads
  useEffect(() => {
    if (product?.commission_config) {
      const cfg = product.commission_config;
      resetCommission({
        default_rate: cfg.default_rate,
        recurring_rate: cfg.recurring_rate,
        one_time_rate: cfg.one_time_rate,
        max_payments: cfg.max_payments,
        lifetime_commission_enabled: cfg.lifetime_commission_enabled ?? false,
        min_payout_amount: cfg.min_payout_amount ?? 0,
      });
    }
  }, [product, resetCommission]);

  const updateProductMutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const payload = {
        name: values.name,
        description: values.description,
        base_url: values.base_url,
        signup_path: values.signup_path || "",
        base_commission_rate: values.base_commission_rate,
        max_commission_payments: values.unlimited_commissions ? null : values.max_commission_payments,
        status: values.status,
      };
      return updateProduct(id, payload, backendToken!);
    },
    onSuccess: async () => {
      toast.success("Product updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update product.");
    },
  });

  async function onSubmitProduct(values: ProductFormValues) {
    console.log("onSubmitProduct called with values:", values);
    if (!backendToken) {
      toast.error("Please sign in as admin to update product.");
      return;
    }
    await updateProductMutation.mutateAsync(values);
  }

  function onProductFormError(errors: typeof productErrors) {
    console.log("Form validation errors:", errors);
    const fieldNames: Record<string, string> = {
      name: "Name",
      description: "Description",
      base_url: "Base URL",
      signup_path: "Signup path",
      base_commission_rate: "Base commission rate",
      max_commission_payments: "Max per referral",
      status: "Status",
    };
    const errorFields = Object.keys(errors)
      .map((key) => fieldNames[key] || key)
      .join(", ");
    toast.error(`Please fix errors in: ${errorFields}`);
  }

  async function onSubmitCommission(values: CommissionFormValues) {
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
        <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Product details
          </p>
          <form className="space-y-3 pt-1" onSubmit={handleSubmitProduct(onSubmitProduct, onProductFormError)}>
            <div className="space-y-1 text-xs text-slate-200">
              <label className="block">Name</label>
              <input
                type="text"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                {...registerProduct("name")}
              />
              {productErrors.name && (
                <p className="pt-1 text-[11px] text-red-400">{productErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-1 text-xs text-slate-200">
              <label className="block">Description</label>
              <textarea
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                {...registerProduct("description")}
              />
              {productErrors.description && (
                <p className="pt-1 text-[11px] text-red-400">{productErrors.description.message}</p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Base URL</label>
                <input
                  type="url"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...registerProduct("base_url")}
                />
                {productErrors.base_url && (
                  <p className="pt-1 text-[11px] text-red-400">{productErrors.base_url.message}</p>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Signup path</label>
                <input
                  type="text"
                  placeholder="/signup"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...registerProduct("signup_path")}
                />
                {productErrors.signup_path && (
                  <p className="pt-1 text-[11px] text-red-400">{productErrors.signup_path.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Base commission rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...registerProduct("base_commission_rate", { valueAsNumber: true })}
                />
                {productErrors.base_commission_rate && (
                  <p className="pt-1 text-[11px] text-red-400">{productErrors.base_commission_rate.message}</p>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Max per referral</label>
                <div className="mt-1 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...registerProduct("unlimited_commissions")}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-300">Unlimited</span>
                  </label>
                  {!watchUnlimited && (
                    <input
                      type="number"
                      min={1}
                      step={1}
                      className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      {...registerProduct("max_commission_payments", { valueAsNumber: true })}
                    />
                  )}
                </div>
                {!watchUnlimited && productErrors.max_commission_payments && (
                  <p className="pt-1 text-[11px] text-red-400">{productErrors.max_commission_payments.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-200">
              <label className="block">Status</label>
              <select
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                {...registerProduct("status")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {Object.keys(productErrors).length > 0 && (
              <div className="rounded-md bg-red-500/10 border border-red-500/30 p-2">
                <p className="text-[11px] text-red-400">
                  Please fix the errors above before saving.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmittingProduct || updateProductMutation.isPending}
              className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-500 px-4 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {isSubmittingProduct || updateProductMutation.isPending ? "Saving..." : "Save product details"}
            </button>
          </form>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Commission config
          </p>
          <form className="space-y-3 pt-1" onSubmit={handleSubmitCommission(onSubmitCommission)}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Default rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...registerCommission("default_rate", { valueAsNumber: true })}
                />
                {commissionErrors.default_rate && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {commissionErrors.default_rate.message}
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
                  {...registerCommission("max_payments", { valueAsNumber: true })}
                />
                {commissionErrors.max_payments && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {commissionErrors.max_payments.message}
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
                  {...registerCommission("recurring_rate", { valueAsNumber: true })}
                />
                {commissionErrors.recurring_rate && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {commissionErrors.recurring_rate.message}
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
                  {...registerCommission("one_time_rate", { valueAsNumber: true })}
                />
                {commissionErrors.one_time_rate && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {commissionErrors.one_time_rate.message}
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
                  {...registerCommission("min_payout_amount", { valueAsNumber: true })}
                />
                {commissionErrors.min_payout_amount && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {commissionErrors.min_payout_amount.message}
                  </p>
                )}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-0"
                {...registerCommission("lifetime_commission_enabled")}
              />
              <span>Enable lifetime commissions for this product</span>
            </label>

            <button
              type="submit"
              disabled={isSubmittingCommission}
              className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-500 px-4 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {isSubmittingCommission ? "Saving changes..." : "Save commission config"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
