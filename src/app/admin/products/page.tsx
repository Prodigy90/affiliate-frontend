"use client";

import { useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Copy, Key, Loader2, Package, Percent, Plus, X } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";

import { createProduct } from "@/lib/api/admin";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuthSession } from "@/components/auth-guard";
import { RetryButton } from "@/components/retry-button";
import { SearchInput } from "@/components/admin/SearchInput";
import {
	PaginationBar,
	type PageSize,
} from "@/components/admin/PaginationBar";
import { usePaginatedAdminProducts } from "@/lib/hooks/use-paginated-products";
import type { ProductSummary } from "@/lib/types/product";

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

/** Field chassis matched across the admin products surface. */
const FIELD_CLASS =
	"w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-teal-500/60 focus:outline-none focus:ring-1 focus:ring-teal-500/40";

/** Bento tile for a single product — mirrors the affiliate-facing products page. */
function ProductTile({ product }: { product: ProductSummary }) {
	const isActive = product.status === "active";
	// The enforced numbers live on the commission config; the product-row
	// fields only seeded it at create time. Fall back to them solely when no
	// config exists (a state the worker treats as "drop all commissions").
	const hasConfig = product.commission_rate !== undefined;
	const rate = hasConfig ? product.commission_rate : product.base_commission_rate;
	const maxPayments = hasConfig
		? (product.commission_max_payments ?? null)
		: product.max_commission_payments;
	const isUnlimited = maxPayments === null;

	return (
		<Link
			href={`/admin/products/${product.id}`}
			className="group relative block rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5 transition hover:-translate-y-0.5 hover:border-teal-500/40"
		>
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
				style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(45,212,191,0.14), transparent 60%)" }}
				aria-hidden="true"
			/>

			<div className="relative flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-start gap-3">
					<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
						<Package className="h-5 w-5" aria-hidden="true" />
					</span>
					<div className="min-w-0">
						<p className="truncate text-sm font-semibold text-slate-50">{product.name}</p>
						<p className="truncate font-mono text-[11px] text-slate-500">{product.product_id}</p>
					</div>
				</div>
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

			<div className="relative mt-4 flex flex-wrap items-center gap-2">
				<span className="inline-flex items-center gap-1 rounded-md bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-300">
					<Percent className="h-3 w-3" aria-hidden="true" />
					{rate}% per payment
				</span>
				<span className="inline-flex items-center gap-1 rounded-md bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-300">
					{isUnlimited ? "Unlimited per referral" : `Max ${maxPayments} / referral`}
				</span>
				{!hasConfig && (
					<span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-300 ring-1 ring-inset ring-rose-500/30">
						No commission config
					</span>
				)}
			</div>
		</Link>
	);
}

export default function AdminProductsPage() {
	const queryClient = useQueryClient();
	const { isAuthenticated, role, status } = useAuthSession();

	const [showCreateModal, setShowCreateModal] = useState(false);
	const [lastCreatedKey, setLastCreatedKey] = useState<
		{ productId: string; apiKey: string } | null
	>(null);
	const [copied, setCopied] = useState(false);

	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState<PageSize>(50);
	const [q, setQ] = useState("");

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
		items: products,
		total: productsTotal,
		totalUnfiltered,
		isLoading,
		isError,
		refetch,
	} = usePaginatedAdminProducts({
		page,
		pageSize,
		q,
		enabled: isAuthenticated,
	});

	const handleSearchChange = (next: string) => {
		setQ(next);
		setPage(1);
	};

	const handlePageSizeChange = (next: PageSize) => {
		setPageSize(next);
		setPage(1);
	};

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

	const openCreateModal = useCallback(() => {
		setShowCreateModal(true);
	}, []);

	const closeCreateModal = useCallback(() => {
		setShowCreateModal(false);
		setLastCreatedKey(null);
		reset();
	}, [reset]);

	// Escape-to-close + scroll lock while the create modal is open.
	useEffect(() => {
		if (!showCreateModal) return;
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeCreateModal();
		};
		document.addEventListener("keydown", handleEscape);
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.style.overflow = "";
		};
	}, [showCreateModal, closeCreateModal]);

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

	return (
		<div className="space-y-8">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-2">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400">
						Products
					</p>
					<h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
						What affiliates can sell.
					</h1>
					<p className="max-w-xl text-sm text-slate-400">
						Create products with base commission rates, then jump into
						per-product commission configs.
					</p>
				</div>
				<button
					type="button"
					onClick={openCreateModal}
					className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
				>
					<Plus className="h-4 w-4" aria-hidden="true" />
					New product
				</button>
			</div>

			<section className="space-y-4">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div className="w-full sm:max-w-sm">
						<SearchInput
							value={q}
							onChange={handleSearchChange}
							placeholder="Search by name, ID, or status…"
						/>
					</div>
					{isError && <RetryButton onClick={() => refetch()} />}
				</div>

				{isLoading ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<div
								key={i}
								className="h-32 animate-pulse rounded-2xl border border-slate-800/70 bg-slate-900/60"
							/>
						))}
					</div>
				) : products.length === 0 ? (
					q ? (
						<div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
							<p className="text-sm text-slate-300">
								No products match &ldquo;{q}&rdquo;.
							</p>
							<p className="text-xs text-slate-500">
								Try a different search or clear the filter.
							</p>
						</div>
					) : (
						<EmptyState
							icon={Package}
							accent="teal"
							title="No products yet"
							body="Create a product to start tracking referrals and paying out commissions."
							primaryCta={{ label: "New product", onClick: openCreateModal, icon: Plus }}
						/>
					)
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{products.map((p) => (
							<ProductTile key={p.id} product={p} />
						))}
					</div>
				)}

				{!isLoading && totalUnfiltered > 0 && (
					<PaginationBar
						page={page}
						pageSize={pageSize}
						total={productsTotal}
						rowsOnPage={products.length}
						entityLabel="product"
						entityLabelPlural="products"
						onPageChange={setPage}
						onPageSizeChange={handlePageSizeChange}
					/>
				)}
			</section>

			{showCreateModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
					onClick={closeCreateModal}
				>
					<div
						className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800/70 bg-slate-900 p-5 shadow-2xl shadow-black/40 sm:p-6"
						onClick={(e) => e.stopPropagation()}
					>
						{lastCreatedKey ? (
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
									<Key className="h-4 w-4" aria-hidden="true" />
									<span>Product created</span>
								</div>
								<p className="text-sm text-slate-300">
									Here is the API key for{" "}
									<span className="font-medium text-slate-100">{lastCreatedKey.productId}</span>.
									Store it now, it will not be shown again.
								</p>
								<div className="flex items-center gap-2 rounded-lg border border-teal-500/30 bg-teal-500/5 p-2.5">
									<code className="scrollbar-none flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-slate-200">
										{lastCreatedKey.apiKey}
									</code>
									<button
										type="button"
										onClick={handleCopyApiKey}
										aria-label="Copy API key"
										className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
											copied
												? "bg-teal-500/20 text-teal-400"
												: "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
										}`}
									>
										{copied ? (
											<Check className="h-3.5 w-3.5" aria-hidden="true" />
										) : (
											<Copy className="h-3.5 w-3.5" aria-hidden="true" />
										)}
									</button>
								</div>
								<p className="text-xs text-slate-500">
									Store this in the product&apos;s environment as{" "}
									<code className="rounded bg-slate-800 px-1 py-0.5 text-slate-300">
										AFFILIATE_API_KEY
									</code>
									.
								</p>
								<div className="flex justify-end">
									<button
										type="button"
										onClick={closeCreateModal}
										className="rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-teal-400"
									>
										Done
									</button>
								</div>
							</div>
						) : (
							<>
								<div className="flex items-center justify-between gap-3">
									<h2 className="text-base font-semibold text-slate-50">New product</h2>
									<button
										type="button"
										onClick={closeCreateModal}
										aria-label="Close"
										className="rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-200"
									>
										<X className="h-4 w-4" aria-hidden="true" />
									</button>
								</div>

								<form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
									<div>
										<label htmlFor="product_id" className="mb-1.5 block text-sm font-medium text-slate-300">
											Product ID
										</label>
										<input
											id="product_id"
											type="text"
											placeholder="e.g. whatsapp_bot"
											className={FIELD_CLASS}
											{...register("product_id")}
										/>
										{errors.product_id && (
											<p className="mt-1 text-xs text-red-400">{errors.product_id.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
											Name
										</label>
										<input
											id="name"
											type="text"
											placeholder="WASBOT - WhatsApp Automation"
											className={FIELD_CLASS}
											{...register("name")}
										/>
										{errors.name && (
											<p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
										)}
									</div>

									<div>
										<label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-300">
											Description
										</label>
										<textarea
											id="description"
											rows={3}
											placeholder="Short description for admins and internal docs."
											className={FIELD_CLASS}
											{...register("description")}
										/>
										{errors.description && (
											<p className="mt-1 text-xs text-red-400">{errors.description.message}</p>
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
												placeholder="https://wasbot.ng"
												className={FIELD_CLASS}
												{...register("base_url")}
											/>
											{errors.base_url && (
												<p className="mt-1 text-xs text-red-400">{errors.base_url.message}</p>
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
												{...register("signup_path")}
											/>
											{errors.signup_path && (
												<p className="mt-1 text-xs text-red-400">{errors.signup_path.message}</p>
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
												placeholder="20"
												className={`${FIELD_CLASS} font-mono tabular-nums`}
												{...register("base_commission_rate", { valueAsNumber: true })}
											/>
											{errors.base_commission_rate && (
												<p className="mt-1 text-xs text-red-400">{errors.base_commission_rate.message}</p>
											)}
										</div>

										<div>
											<label className="mb-1.5 block text-sm font-medium text-slate-300">
												Max payments per referral
											</label>
											<p className="text-xs text-slate-500">
												Limit commissions earned per referred user
											</p>
											<div className="mt-2 space-y-2">
												<label className="flex items-center gap-2 text-sm text-slate-300">
													<input
														type="checkbox"
														{...register("unlimited_commissions")}
														className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-500 focus:ring-teal-500"
													/>
													Unlimited per referral
												</label>
												{!watchUnlimited && (
													<input
														type="number"
														min={1}
														step={1}
														placeholder="2"
														className={`${FIELD_CLASS} font-mono tabular-nums`}
														{...register("max_commission_payments")}
													/>
												)}
											</div>
											{!watchUnlimited && errors.max_commission_payments && (
												<p className="mt-1 text-xs text-red-400">
													{errors.max_commission_payments.message}
												</p>
											)}
										</div>
									</div>

									<div className="flex justify-end">
										<button
											type="submit"
											disabled={isSubmitting || createMutation.isPending}
											className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
										>
											{(isSubmitting || createMutation.isPending) && (
												<Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
											)}
											{isSubmitting || createMutation.isPending ? "Creating..." : "Create product"}
										</button>
									</div>
								</form>
							</>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
