"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";

import { Modal } from "@/components/modal";
import { RetryButton } from "@/components/retry-button";
import { getProducts, updateAffiliateCustomRate, deleteAffiliateCustomRate } from "@/lib/api/admin";
import type { ProductListResponse } from "@/lib/types/product";
import type { AdminAffiliate, AffiliateCustomRate, UpdateAffiliateCustomRateRequest } from "@/lib/types/admin";
import { STALE_TIME_DEFAULT } from "@/lib/constants/query";
import { useAffiliateCustomRates } from "@/lib/hooks/use-affiliate-custom-rates";
import { formatDate } from "@/lib/utils/format";

// Empty-string-safe optional percentage (0-100). Mirrors the preprocess
// pattern used for max_commission_payments in the products admin forms.
function optionalPercent(label: string) {
  return z.preprocess(
    (val) =>
      val === "" || val === undefined || val === null || (typeof val === "number" && Number.isNaN(val))
        ? undefined
        : Number(val),
    z
      .number({ message: `Enter a valid ${label}` })
      .min(0, "Must be at least 0")
      .max(100, "Must be at most 100")
      .optional()
  );
}

const customRateSchema = z
  .object({
    custom_rate: optionalPercent("base rate"),
    custom_max_payments: z.preprocess(
      (val) =>
        val === "" || val === undefined || val === null || (typeof val === "number" && Number.isNaN(val))
          ? undefined
          : Number(val),
      z.number().int("Must be a whole number").min(0, "Must be at least 0").optional()
    ),
    custom_recurring_rate: optionalPercent("recurring rate"),
    custom_one_time_rate: optionalPercent("one-time rate"),
    custom_lifetime_enabled: z.boolean().optional(),
    custom_lifetime_rate: optionalPercent("lifetime rate"),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasRate =
      data.custom_rate !== undefined ||
      data.custom_recurring_rate !== undefined ||
      data.custom_one_time_rate !== undefined ||
      (data.custom_lifetime_enabled === true && data.custom_lifetime_rate !== undefined);

    if (!hasRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set at least one rate before saving.",
        path: ["custom_rate"],
      });
    }
  });

type CustomRateFormInput = z.input<typeof customRateSchema>;
type CustomRateFormValues = z.infer<typeof customRateSchema>;

type CustomCommissionModalProps = {
  affiliate: AdminAffiliate;
  onClose: () => void;
};

const inputClass =
  "mt-1 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 outline-none ring-0 focus:border-teal-500 focus:ring-1 focus:ring-teal-500";

export function CustomCommissionModal({ affiliate, onClose }: CustomCommissionModalProps) {
  const queryClient = useQueryClient();

  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isError: isErrorProducts,
    refetch: refetchProducts,
  } = useQuery<ProductListResponse, Error>({
    queryKey: ["admin-products"],
    queryFn: () => getProducts(),
    staleTime: STALE_TIME_DEFAULT,
  });

  const {
    data: ratesData,
    isLoading: isLoadingRates,
    isError: isErrorRates,
    refetch: refetchRates,
  } = useAffiliateCustomRates({ affiliateId: affiliate.id });

  const products = useMemo(() => productsData?.products ?? [], [productsData?.products]);
  const rates = useMemo(() => ratesData?.data ?? [], [ratesData?.data]);

  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  // Default to the first product once the list loads. If the affiliate
  // already has an override, prefer that product so admins land on
  // something interesting.
  useEffect(() => {
    if (selectedProductId || products.length === 0) return;
    const withOverride = rates.find((r) => r.custom_rate !== null || r.custom_recurring_rate !== null || r.custom_one_time_rate !== null || r.custom_lifetime_rate !== null);
    setSelectedProductId(withOverride?.product_id ?? products[0].id);
  }, [products, rates, selectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const existingRate: AffiliateCustomRate | undefined = rates.find(
    (r) => r.product_id === selectedProductId
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomRateFormInput, unknown, CustomRateFormValues>({
    resolver: zodResolver(customRateSchema),
  });

  // Re-hydrate the form whenever the selected product (or its data) changes.
  useEffect(() => {
    reset({
      custom_rate: existingRate?.custom_rate ?? undefined,
      custom_max_payments: existingRate?.custom_max_payments ?? undefined,
      custom_recurring_rate: existingRate?.custom_recurring_rate ?? undefined,
      custom_one_time_rate: existingRate?.custom_one_time_rate ?? undefined,
      custom_lifetime_enabled: existingRate?.custom_lifetime_enabled ?? false,
      custom_lifetime_rate: existingRate?.custom_lifetime_rate ?? undefined,
      notes: existingRate?.notes ?? "",
    });
    setConfirmingRemove(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId, existingRate?.updated_at]);

  const watchLifetimeEnabled = watch("custom_lifetime_enabled");

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-affiliate-custom-rates", affiliate.id] });

  const saveMutation = useMutation({
    mutationFn: (values: CustomRateFormValues) => {
      if (!selectedProductId) throw new Error("Select a product first.");
      // The form is a full replace for this (affiliate, product) row: fields
      // left blank are sent as null so the row always mirrors what's shown.
      const payload: UpdateAffiliateCustomRateRequest = {
        custom_rate: values.custom_rate ?? null,
        custom_max_payments: values.custom_max_payments ?? null,
        custom_recurring_rate: values.custom_recurring_rate ?? null,
        custom_one_time_rate: values.custom_one_time_rate ?? null,
        custom_lifetime_enabled: values.custom_lifetime_enabled ?? false,
        custom_lifetime_rate: values.custom_lifetime_enabled
          ? values.custom_lifetime_rate ?? null
          : null,
        notes: values.notes?.trim() ? values.notes.trim() : null,
      };
      return updateAffiliateCustomRate(affiliate.id, selectedProductId, payload);
    },
    onSuccess: async () => {
      toast.success("Custom commission saved.");
      await invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save custom commission.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => {
      if (!selectedProductId) throw new Error("Select a product first.");
      return deleteAffiliateCustomRate(affiliate.id, selectedProductId);
    },
    onSuccess: async () => {
      toast.success("Custom commission removed.");
      setConfirmingRemove(false);
      await invalidate();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove custom commission.");
    },
  });

  async function onSubmit(values: CustomRateFormValues) {
    await saveMutation.mutateAsync(values);
  }

  function onFormError(formErrors: typeof errors) {
    if (formErrors.custom_rate?.type === "custom") {
      toast.error(formErrors.custom_rate.message);
    } else {
      toast.error("Please fix the errors in the form.");
    }
  }

  const isLoading = isLoadingProducts || isLoadingRates;
  const isError = isErrorProducts || isErrorRates;

  return (
    <Modal isOpen title={`Custom commission — ${affiliate.name || affiliate.email}`} onClose={onClose}>
      {isLoading ? (
        <div className="space-y-2 py-2">
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-800/70" />
          <div className="h-24 w-full animate-pulse rounded bg-slate-800/60" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-xs text-slate-300">Couldn&apos;t load commission data.</p>
          <RetryButton
            onClick={() => {
              refetchProducts();
              refetchRates();
            }}
          />
        </div>
      ) : products.length === 0 ? (
        <p className="py-4 text-xs text-slate-300">No products configured yet.</p>
      ) : (
        <div className="space-y-4">
          {products.length > 1 ? (
            <div className="space-y-1 text-xs text-slate-200">
              <label className="block">Product</label>
              <select
                className={inputClass}
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {products.map((p) => {
                  const hasOverride = rates.some(
                    (r) =>
                      r.product_id === p.id &&
                      (r.custom_rate !== null ||
                        r.custom_recurring_rate !== null ||
                        r.custom_one_time_rate !== null ||
                        r.custom_lifetime_rate !== null)
                  );
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {hasOverride ? " (custom)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Product: <span className="text-slate-200">{selectedProduct?.name}</span>
            </p>
          )}

          {selectedProduct && (
            <p className="text-[11px] text-slate-500">
              Product default: {selectedProduct.base_commission_rate}% ·{" "}
              {selectedProduct.max_commission_payments === null
                ? "unlimited payments"
                : `max ${selectedProduct.max_commission_payments} payments`}
            </p>
          )}

          <form className="space-y-3" onSubmit={handleSubmit(onSubmit, onFormError)}>
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Base rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  placeholder="Product default"
                  className={inputClass}
                  {...register("custom_rate")}
                />
                {errors.custom_rate && (
                  <p className="pt-1 text-[11px] text-red-400">{errors.custom_rate.message}</p>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Max payments</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Product default"
                  className={inputClass}
                  {...register("custom_max_payments")}
                />
                {errors.custom_max_payments && (
                  <p className="pt-1 text-[11px] text-red-400">{errors.custom_max_payments.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">Recurring rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  placeholder="Optional"
                  className={inputClass}
                  {...register("custom_recurring_rate")}
                />
                {errors.custom_recurring_rate && (
                  <p className="pt-1 text-[11px] text-red-400">{errors.custom_recurring_rate.message}</p>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-200">
                <label className="block">One-time rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  placeholder="Optional"
                  className={inputClass}
                  {...register("custom_one_time_rate")}
                />
                {errors.custom_one_time_rate && (
                  <p className="pt-1 text-[11px] text-red-400">{errors.custom_one_time_rate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-slate-800 bg-slate-950/40 p-3">
              <label className="flex items-center gap-2 text-xs text-slate-200">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-teal-500 focus:ring-0"
                  {...register("custom_lifetime_enabled")}
                />
                <span>Enable lifetime commissions for this affiliate</span>
              </label>
              {watchLifetimeEnabled && (
                <div className="space-y-1 text-xs text-slate-200">
                  <label className="block">Lifetime rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    placeholder="Optional"
                    className={inputClass}
                    {...register("custom_lifetime_rate")}
                  />
                  {errors.custom_lifetime_rate && (
                    <p className="pt-1 text-[11px] text-red-400">{errors.custom_lifetime_rate.message}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1 text-xs text-slate-200">
              <label className="block">Notes</label>
              <textarea
                rows={2}
                placeholder="Why this affiliate gets a custom rate…"
                className={inputClass}
                {...register("notes")}
              />
            </div>

            {existingRate?.updated_at && (
              <p className="text-[10px] text-slate-500">
                Last updated {formatDate(existingRate.updated_at)}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <div>
                {existingRate ? (
                  confirmingRemove ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-300">Remove override?</span>
                      <button
                        type="button"
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate()}
                        className="rounded-full bg-red-500/20 px-3 py-1 text-[11px] font-medium text-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removeMutation.isPending ? "Removing…" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingRemove(false)}
                        className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingRemove(true)}
                      className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                    >
                      Remove override
                    </button>
                  )
                ) : (
                  <span />
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || saveMutation.isPending}
                className="inline-flex h-9 items-center justify-center rounded-full bg-teal-500 px-4 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {isSubmitting || saveMutation.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  );
}
