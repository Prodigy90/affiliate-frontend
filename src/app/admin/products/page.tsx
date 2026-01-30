"use client";

import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Copy, Check, Key } from "lucide-react";
import { signIn } from "@/lib/auth-client";

import { createProduct, getProducts } from "@/lib/api/admin";
import type { ProductListResponse } from "@/lib/types/product";
import { LOTTIE_EMPTY_STATE } from "@/lib/constants/lottie";
import { EmptyState } from "@/components/empty-state";
import { useAuthSession } from "@/components/auth-guard";
import { TableSkeleton } from "@/components/table-skeleton";
import { RetryButton } from "@/components/retry-button";

const productSchema = z.object({
	product_id: z.string().min(1, "Product ID is required"),
	name: z.string().min(1, "Name is required"),
	description: z.string().min(1, "Description is required"),
	base_url: z
		.string()
		.min(1, "Base URL is required")
		.url("Enter a valid URL, e.g. https://product.com"),
	signup_path: z
		.string()
		.regex(/^\/.*$/, "Must start with / (e.g. /signup)")
		.optional()
		.or(z.literal("")),
	base_commission_rate: z.coerce
		.number({ message: "Enter a base commission rate" })
		.min(0, "Rate must be at least 0"),
	max_commission_payments: z.preprocess(
		(val) => (val === "" || val === undefined || val === null || (typeof val === "number" && Number.isNaN(val)) ? undefined : Number(val)),
		z.number().int("Must be a whole number").min(1, "Must be at least 1").optional().nullable()
	),
	unlimited_commissions: z.boolean().optional(),
});

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormValues = z.infer<typeof productSchema>;

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, role, status } = useAuthSession();

  const [lastCreatedKey, setLastCreatedKey] = useState<
    { productId: string; apiKey: string } | null
  >(null);
  const [copied, setCopied] = useState(false);

  const handleCopyApiKey = useCallback(async () => {
    if (!lastCreatedKey?.apiKey) return;

    try {
      await navigator.clipboard.writeText(lastCreatedKey.apiKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = lastCreatedKey.apiKey;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [lastCreatedKey?.apiKey]);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<ProductListResponse, Error>({
    queryKey: ["admin-products"],
    queryFn: () => getProducts(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
	} = useForm<ProductFormInput, unknown, ProductFormValues>({
		resolver: zodResolver(productSchema),
		defaultValues: {
			unlimited_commissions: false,
		},
	});

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) => createProduct(values),
    onSuccess: async (created) => {
      toast.success(`Product ${created.name} created.`);
      setLastCreatedKey({ productId: created.product_id, apiKey: created.api_key });
      reset();
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create product.");
    },
  });

  const products = data?.products ?? [];

  async function onSubmit(values: ProductFormValues) {
    if (!isAuthenticated) {
      toast.error("Please sign in as admin to create products.");
      return;
    }

    // If unlimited is checked, don't send max_commission_payments
    const payload = {
      ...values,
      max_commission_payments: values.unlimited_commissions ? undefined : values.max_commission_payments,
    };
    // Remove the unlimited_commissions field as it's not part of the API
    delete (payload as Record<string, unknown>).unlimited_commissions;

    await createMutation.mutateAsync(payload);
  }

  const watchUnlimited = watch("unlimited_commissions");

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

  return (
    <div className="space-y-8">
	      <section className="space-y-3">
	        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
	          Admin · Products
	        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
          Manage products and their commission settings.
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          Create products with base commission rates and jump into per-product
          commission configs.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)] items-start">
        <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
            Create product
          </p>
          <form className="space-y-3 pt-2" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1 text-xs text-slate-200">
              <label className="block">Product ID</label>
              <input
                type="text"
                placeholder="e.g. whatsapp_bot"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                {...register("product_id")}
              />
              {errors.product_id && (
                <p className="pt-1 text-[11px] text-red-400">
                  {errors.product_id.message}
                </p>
              )}
            </div>

            <div className="space-y-1 text-xs text-slate-200">
              <label className="block">Name</label>
              <input
                type="text"
                placeholder="WASBOT - WhatsApp Automation"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                {...register("name")}
              />
              {errors.name && (
                <p className="pt-1 text-[11px] text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1 text-xs text-slate-200">
              <label className="block">Description</label>
              <textarea
                rows={3}
                placeholder="Short description for admins and internal docs."
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                {...register("description")}
              />
              {errors.description && (
                <p className="pt-1 text-[11px] text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Base URL</label>
                <input
                  type="url"
                  placeholder="https://wasbot.ng"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...register("base_url")}
                />
                {errors.base_url && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {errors.base_url.message}
                  </p>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Signup path</label>
                <input
                  type="text"
                  placeholder="/signup"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...register("signup_path")}
                />
                {errors.signup_path && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {errors.signup_path.message}
                  </p>
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
                  placeholder="20"
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  {...register("base_commission_rate", { valueAsNumber: true })}
                />
                {errors.base_commission_rate && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {errors.base_commission_rate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Max payments per referral</label>
                <p className="text-[10px] text-slate-500">
                  Limit commissions earned per referred user
                </p>
                <div className="mt-1 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("unlimited_commissions")}
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-300">Unlimited per referral</span>
                  </label>
                  {!watchUnlimited && (
                    <input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="2"
                      className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      {...register("max_commission_payments")}
                    />
                  )}
                </div>
                {!watchUnlimited && errors.max_commission_payments && (
                  <p className="pt-1 text-[11px] text-red-400">
                    {errors.max_commission_payments.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending}
              className="inline-flex h-9 items-center justify-center rounded-full bg-emerald-500 px-4 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
            >
              {isSubmitting || createMutation.isPending
                ? "Creating product..."
                : "Create product"}
            </button>

            {lastCreatedKey && (
              <div className="mt-4 space-y-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-400">
                  <Key className="h-3.5 w-3.5" />
                  <span>API Key for {lastCreatedKey.productId}</span>
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/80 p-2.5">
                    <code className="flex-1 overflow-x-auto font-mono text-xs text-slate-200 scrollbar-none">
                      {lastCreatedKey.apiKey}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyApiKey}
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-colors ${
                        copied
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                      }`}
                      aria-label="Copy API key"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  Store this in the product&apos;s environment as{" "}
                  <code className="rounded bg-slate-800 px-1 py-0.5 text-slate-300">
                    AFFILIATE_API_KEY
                  </code>
                  . This key is shown only once.
                </p>
              </div>
            )}
          </form>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              Products
            </p>
            {isError && (
              <RetryButton onClick={() => refetch()} />
            )}
          </div>

          {isLoading ? (
            <TableSkeleton rows={2} headerWidth="w-40" />
          ) : products.length === 0 ? (
            <EmptyState lottieUrl={LOTTIE_EMPTY_STATE} message="There are no products yet. Once you create a product, it will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-200">
                <thead className="border-b border-slate-800/80 text-[11px] uppercase tracking-[0.16em] text-slate-400">
                  <tr>
                    <th className="px-2 py-2">Product</th>
                    <th className="px-2 py-2">Base rate</th>
                    <th className="px-2 py-2">Max / referral</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {products.map((p) => (
                    <tr key={p.id} className="align-middle">
                      <td className="px-2 py-2">
                        <p className="text-xs font-medium text-slate-100">{p.name}</p>
                        <p className="text-[11px] text-slate-400">{p.product_id}</p>
                      </td>
                      <td className="px-2 py-2">
                        <p className="text-xs text-slate-200">
                          {p.base_commission_rate}%
                        </p>
                      </td>
                      <td className="px-2 py-2">
                        <p className="text-xs text-slate-200">
                          {p.max_commission_payments === null ? (
                            <span className="text-emerald-400">Unlimited</span>
                          ) : (
                            p.max_commission_payments
                          )}
                        </p>
                      </td>
                      <td className="px-2 py-2">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize bg-slate-800 text-slate-200">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex justify-end">
                          <Link
                            href={`/admin/products/${p.id}`}
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
        </div>
      </section>
    </div>
  );
}
