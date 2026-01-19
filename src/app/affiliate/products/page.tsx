"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

import {
  enrollInProduct,
  getAffiliateProducts,
  getReferralLinks
} from "@/lib/api/affiliate";
import type {
  AffiliateProductsResponse,
  ReferralLinksListResponse
} from "@/lib/types/affiliate";
import { ReferralLinkCard } from "@/components/referral-link-card";
import { useAuthSession } from "@/components/auth-guard";

export default function AffiliateProductsPage() {
  const queryClient = useQueryClient();
  const { isAuthenticated, status } = useAuthSession();

	const {
		data: productsData,
		isLoading: productsLoading,
		isError: productsError,
	} = useQuery<AffiliateProductsResponse, Error>({
		queryKey: ["affiliate-products"],
		queryFn: () => getAffiliateProducts(),
		enabled: isAuthenticated,
		staleTime: 30_000,
		retry: 0,
	});

	const {
		data: linksData,
		isLoading: linksLoading,
		isError: linksError,
	} = useQuery<ReferralLinksListResponse, Error>({
		queryKey: ["referral-links", { page: 1, limit: 50 }],
		queryFn: () => getReferralLinks({ page: 1, limit: 50 }),
		enabled: isAuthenticated,
		staleTime: 30_000,
		retry: 0,
	});

	const enrollMutation = useMutation({
		mutationFn: (productId: string) => enrollInProduct(productId),
		onSuccess: async () => {
			toast.success("You are now enrolled in this product.");
			await queryClient.invalidateQueries({ queryKey: ["affiliate-products"] });
			await queryClient.invalidateQueries({ queryKey: ["referral-links"] });
		},
		onError: (err: unknown) => {
			const message =
				(err instanceof Error && err.message) ||
				"Unable to enroll in this product. Please try again.";
			toast.error(message);
		},
	});

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
					Sign in with Google to manage your affiliate products and links.
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

	const products = productsData?.products ?? [];
	const links = linksData?.links ?? [];

	const hasError = productsError || linksError;

	return (
		<div className="space-y-8">
			<section className="space-y-3">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/80">
					Products &amp; referral links
				</p>
				<h1 className="text-2xl font-semibold tracking-tight text-slate-50 md:text-3xl">
					Join affiliate programs
				</h1>
				<p className="max-w-xl text-sm text-slate-300">
					Enroll in available products to get your referral link. Conversions
					from your links will appear in your commissions and earnings.
				</p>
			</section>

			<section className="space-y-4">
				{hasError && (
					<p className="text-[11px] text-red-400">
						We couldn&apos;t load your products or links. Please refresh the page
						and try again.
					</p>
				)}

				{productsLoading ? (
					<div className="grid gap-4 md:grid-cols-2">
						{Array.from({ length: 3 }).map((_, idx) => (
							<div
								key={idx}
								className="h-40 animate-pulse rounded-xl border border-slate-800/70 bg-slate-900/60"
							/>
						))}
					</div>
				) : products.length === 0 ? (
					<p className="text-xs text-slate-300">
						No affiliate products are available yet. Check back later.
					</p>
				) : (
					<div className="grid gap-4 md:grid-cols-2">
						{products.map((product) => {
							const productLinks = links.filter(
								(link) => link.product.id === product.id,
							);
							const enrolled = !!product.enrollment;

							return (
								<div
									key={product.id}
									className="flex flex-col justify-between rounded-xl border border-slate-800/70 bg-slate-900/60 p-4"
								>
									<div className="space-y-2">
										<div className="flex items-start justify-between gap-2">
											<div className="space-y-1">
												<p className="text-sm font-semibold text-slate-50">
													{product.name}
												</p>
												<p className="text-[11px] text-slate-400">
													{product.description}
												</p>
											</div>
											<span
												className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
													enrolled
														? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/40"
														: "bg-slate-800/80 text-slate-300 ring-1 ring-slate-700/80"
												}`}
											>
												{enrolled ? "Enrolled" : "Not enrolled"}
											</span>
										</div>
										<p className="text-[11px] text-slate-400">
											Base commission: {product.base_commission_rate.toFixed(1)}%
										</p>
										{product.enrollment && (
											<p className="text-[11px] text-slate-500">
												Enrolled on {format(new Date(product.enrollment.enrolled_at), "d MMM yyyy")}
											</p>
										)}
									</div>
									<div className="mt-3 space-y-3">
										{!enrolled && (
											<button
												className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
												disabled={enrollMutation.isPending}
												onClick={() => enrollMutation.mutate(product.id)}
											>
												Join program
											</button>
										)}

										{/* Referral Links */}
										{linksLoading ? (
											<p className="text-[11px] text-slate-400">
												Loading links...
											</p>
										) : productLinks.length === 0 ? (
											<div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/30 p-3 text-center">
												<p className="text-xs text-slate-500">
													{enrolled
														? "Your referral link will appear here after enrollment is processed."
														: "Enroll to get your referral link."}
												</p>
											</div>
										) : (
											<div className="space-y-2">
												{productLinks.map((link) => (
													<ReferralLinkCard
														key={link.id}
														linkUrl={link.link_url}
														campaignName={link.campaign_name}
														conversions={link.conversions}
														createdAt={link.created_at}
													/>
												))}
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				)}
			</section>
		</div>
	);
}
