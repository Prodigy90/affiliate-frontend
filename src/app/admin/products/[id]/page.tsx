"use client";

import { use, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Package, Percent } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";

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

/** Field chassis matched across the admin products surface. */
const FIELD_CLASS =
	"w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/40";

/** Save button: teal pill, Loader2 spinner while a mutation is pending. */
function SaveButton({ pending, disabled, children }: {
	pending: boolean;
	disabled: boolean;
	children: string;
}) {
	return (
		<button
			type="submit"
			disabled={disabled}
			className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
		>
			{pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
			{pending ? "Saving..." : children}
		</button>
	);
}

export default function AdminProductDetailPage({ params }: PageProps) {
	const { id } = use(params);
	const { isAuthenticated, role, status } = useAuthSession();
	const queryClient = useQueryClient();

	const {
		data: product,
		isLoading,
		isError,
		refetch,
	} = useQuery<ProductDetail, Error>({
		queryKey: ["admin-product", id],
		queryFn: () => getProductById(id),
		enabled: isAuthenticated,
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
			return updateProduct(id, payload);
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
		if (!isAuthenticated) {
			toast.error("Please sign in as admin to update product.");
			return;
		}
		await updateProductMutation.mutateAsync(values);
	}

	function onProductFormError(errors: typeof productErrors) {
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
		if (!isAuthenticated) {
			toast.error("Please sign in as admin to update commission config.");
			return;
		}

		try {
			await updateProductCommissionConfig(id, values);
			toast.success("Commission config updated.");
			await refetch();
		} catch (error) {
			const err = error as Error;
			toast.error(err.message || "Failed to update commission config.");
		}
	}

	if (status === "loading") {
		return <PageSkeleton />;
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<p className="text-sm text-slate-300">
					Sign in with your admin Google account to manage products.
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

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="space-y-3">
					<div className="h-3 w-24 animate-pulse rounded bg-slate-800/70" />
					<div className="h-9 w-64 animate-pulse rounded-lg bg-slate-800/70" />
					<div className="h-4 w-80 animate-pulse rounded bg-slate-800/60" />
				</div>
				<div className="grid gap-6 md:grid-cols-2">
					<div className="h-72 animate-pulse rounded-2xl border border-slate-800/70 bg-slate-900/60" />
					<div className="h-72 animate-pulse rounded-2xl border border-slate-800/70 bg-slate-900/60" />
				</div>
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

	const isActive = product.status === "active";

	return (
		<div className="space-y-8">
			<div className="space-y-4">
				<Link
					href="/admin/products"
					className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-teal-300"
				>
					<ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
					Back to products
				</Link>

				<div className="space-y-2">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
						Products
					</p>
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
							{product.name}
						</h1>
						<span
							className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset ${
								isActive
									? "bg-teal-500/10 text-teal-300 ring-teal-500/30"
									: "bg-slate-800/70 text-slate-400 ring-slate-700/70"
							}`}
						>
							<span
								className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-teal-400" : "bg-slate-500"}`}
								aria-hidden="true"
							/>
							{product.status}
						</span>
					</div>
					<p className="max-w-xl text-sm text-slate-400">{product.description}</p>
					<p className="text-xs text-slate-500">
						ID: <span className="font-mono text-slate-300">{product.product_id}</span>
					</p>
				</div>
			</div>

			<section className="grid gap-6 md:grid-cols-2 items-start">
				<div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
					<div className="flex items-center gap-3">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/30">
							<Package className="h-[18px] w-[18px]" aria-hidden="true" />
						</span>
						<div>
							<h2 className="text-base font-semibold text-slate-50">Product details</h2>
							<p className="text-xs text-slate-400">Name, URLs, and commission basics.</p>
						</div>
					</div>

					<form className="space-y-4" onSubmit={handleSubmitProduct(onSubmitProduct, onProductFormError)}>
						<div>
							<label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
								Name
							</label>
							<input
								id="name"
								type="text"
								className={FIELD_CLASS}
								{...registerProduct("name")}
							/>
							{productErrors.name && (
								<p className="mt-1 text-xs text-red-400">{productErrors.name.message}</p>
							)}
						</div>

						<div>
							<label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-300">
								Description
							</label>
							<textarea
								id="description"
								rows={2}
								className={FIELD_CLASS}
								{...registerProduct("description")}
							/>
							{productErrors.description && (
								<p className="mt-1 text-xs text-red-400">{productErrors.description.message}</p>
							)}
						</div>

						<div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
							<div>
								<label htmlFor="base_url" className="mb-1.5 block text-sm font-medium text-slate-300">
									Base URL
								</label>
								<input
									id="base_url"
									type="url"
									className={FIELD_CLASS}
									{...registerProduct("base_url")}
								/>
								{productErrors.base_url && (
									<p className="mt-1 text-xs text-red-400">{productErrors.base_url.message}</p>
								)}
							</div>

							<div>
								<label htmlFor="signup_path" className="mb-1.5 block text-sm font-medium text-slate-300">
									Signup path
								</label>
								<input
									id="signup_path"
									type="text"
									placeholder="/signup"
									className={FIELD_CLASS}
									{...registerProduct("signup_path")}
								/>
								{productErrors.signup_path && (
									<p className="mt-1 text-xs text-red-400">{productErrors.signup_path.message}</p>
								)}
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label htmlFor="base_commission_rate" className="mb-1.5 block text-sm font-medium text-slate-300">
									Base commission rate (%)
								</label>
								<input
									id="base_commission_rate"
									type="number"
									step="0.1"
									min={0}
									className={`${FIELD_CLASS} font-mono tabular-nums`}
									{...registerProduct("base_commission_rate", { valueAsNumber: true })}
								/>
								{productErrors.base_commission_rate && (
									<p className="mt-1 text-xs text-red-400">{productErrors.base_commission_rate.message}</p>
								)}
							</div>

							<div>
								<label className="mb-1.5 block text-sm font-medium text-slate-300">
									Max per referral
								</label>
								<div className="mt-2 space-y-2">
									<label className="flex items-center gap-2 text-sm text-slate-300">
										<input
											type="checkbox"
											{...registerProduct("unlimited_commissions")}
											className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500"
										/>
										Unlimited
									</label>
									{!watchUnlimited && (
										<input
											type="number"
											min={1}
											step={1}
											className={`${FIELD_CLASS} font-mono tabular-nums`}
											{...registerProduct("max_commission_payments", { valueAsNumber: true })}
										/>
									)}
								</div>
								{!watchUnlimited && productErrors.max_commission_payments && (
									<p className="mt-1 text-xs text-red-400">{productErrors.max_commission_payments.message}</p>
								)}
							</div>
						</div>

						<div>
							<label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-300">
								Status
							</label>
							<select
								id="status"
								className={FIELD_CLASS}
								{...registerProduct("status")}
							>
								<option value="active">Active</option>
								<option value="inactive">Inactive</option>
							</select>
						</div>

						{Object.keys(productErrors).length > 0 && (
							<div className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5">
								<p className="text-xs text-red-400">
									Please fix the errors above before saving.
								</p>
							</div>
						)}

						<SaveButton
							pending={isSubmittingProduct || updateProductMutation.isPending}
							disabled={isSubmittingProduct || updateProductMutation.isPending}
						>
							Save product details
						</SaveButton>
					</form>
				</div>

				<div className="space-y-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
					<div className="flex items-center gap-3">
						<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/30">
							<Percent className="h-[18px] w-[18px]" aria-hidden="true" />
						</span>
						<div>
							<h2 className="text-base font-semibold text-slate-50">Commission config</h2>
							<p className="text-xs text-slate-400">Rates and caps applied per commission.</p>
						</div>
					</div>

					<form className="space-y-4" onSubmit={handleSubmitCommission(onSubmitCommission)}>
						<div className="grid gap-4 sm:grid-cols-2">
							<div>
								<label htmlFor="default_rate" className="mb-1.5 block text-sm font-medium text-slate-300">
									Default rate (%)
								</label>
								<input
									id="default_rate"
									type="number"
									step="0.1"
									min={0}
									className={`${FIELD_CLASS} font-mono tabular-nums`}
									{...registerCommission("default_rate", { valueAsNumber: true })}
								/>
								{commissionErrors.default_rate && (
									<p className="mt-1 text-xs text-red-400">
										{commissionErrors.default_rate.message}
									</p>
								)}
							</div>
							<div>
								<label htmlFor="max_payments" className="mb-1.5 block text-sm font-medium text-slate-300">
									Max payments
								</label>
								<input
									id="max_payments"
									type="number"
									min={1}
									step={1}
									className={`${FIELD_CLASS} font-mono tabular-nums`}
									{...registerCommission("max_payments", { valueAsNumber: true })}
								/>
								{commissionErrors.max_payments && (
									<p className="mt-1 text-xs text-red-400">
										{commissionErrors.max_payments.message}
									</p>
								)}
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-3">
							<div>
								<label htmlFor="recurring_rate" className="mb-1.5 block text-sm font-medium text-slate-300">
									Recurring rate (%)
								</label>
								<input
									id="recurring_rate"
									type="number"
									step="0.1"
									min={0}
									className={`${FIELD_CLASS} font-mono tabular-nums`}
									{...registerCommission("recurring_rate", { valueAsNumber: true })}
								/>
								{commissionErrors.recurring_rate && (
									<p className="mt-1 text-xs text-red-400">
										{commissionErrors.recurring_rate.message}
									</p>
								)}
							</div>
							<div>
								<label htmlFor="one_time_rate" className="mb-1.5 block text-sm font-medium text-slate-300">
									One-time rate (%)
								</label>
								<input
									id="one_time_rate"
									type="number"
									step="0.1"
									min={0}
									className={`${FIELD_CLASS} font-mono tabular-nums`}
									{...registerCommission("one_time_rate", { valueAsNumber: true })}
								/>
								{commissionErrors.one_time_rate && (
									<p className="mt-1 text-xs text-red-400">
										{commissionErrors.one_time_rate.message}
									</p>
								)}
							</div>
							<div>
								<label htmlFor="min_payout_amount" className="mb-1.5 block text-sm font-medium text-slate-300">
									Min payout amount
								</label>
								<input
									id="min_payout_amount"
									type="number"
									step="0.01"
									min={0}
									className={`${FIELD_CLASS} font-mono tabular-nums`}
									{...registerCommission("min_payout_amount", { valueAsNumber: true })}
								/>
								{commissionErrors.min_payout_amount && (
									<p className="mt-1 text-xs text-red-400">
										{commissionErrors.min_payout_amount.message}
									</p>
								)}
							</div>
						</div>

						<label className="inline-flex items-center gap-2 text-sm text-slate-300">
							<input
								type="checkbox"
								className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500"
								{...registerCommission("lifetime_commission_enabled")}
							/>
							Enable lifetime commissions for this product
						</label>

						<SaveButton
							pending={isSubmittingCommission}
							disabled={isSubmittingCommission}
						>
							Save commission config
						</SaveButton>
					</form>
				</div>
			</section>
		</div>
	);
}
