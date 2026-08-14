"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Package, Percent } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { PageSkeleton } from "@/components/page-skeleton";
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
		// Optimistic: flip the card to "Enrolled" immediately, roll back on error.
		onMutate: async (productId: string) => {
			await queryClient.cancelQueries({ queryKey: ["affiliate-products"] });
			const previous = queryClient.getQueryData<AffiliateProductsResponse>([
				"affiliate-products",
			]);
			if (previous) {
				queryClient.setQueryData<AffiliateProductsResponse>(
					["affiliate-products"],
					{
						...previous,
						products: previous.products.map((p) =>
							p.id === productId && !p.enrollment
								? {
										...p,
										enrollment: {
											...(p.enrollment ?? {}),
											enrolled_at: new Date().toISOString(),
										} as NonNullable<typeof p.enrollment>,
									}
								: p,
						),
					},
				);
			}
			return { previous };
		},
		onError: (err: unknown, _productId, context) => {
			if (context?.previous) {
				queryClient.setQueryData(["affiliate-products"], context.previous);
			}
			const message =
				(err instanceof Error && err.message) ||
				"Unable to enroll in this product. Please try again.";
			toast.error(message);
		},
		onSuccess: () => {
			toast.success("You're in. Your referral link is on its way.");
		},
		onSettled: async () => {
			await queryClient.invalidateQueries({ queryKey: ["affiliate-products"] });
			await queryClient.invalidateQueries({ queryKey: ["referral-links"] });
		},
	});

	if (status === "loading") {
		return <PageSkeleton />;
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<p className="text-sm text-slate-300">
					Sign in with Google to manage your affiliate products and links.
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

	const products = productsData?.products ?? [];
	const links = linksData?.links ?? [];

	const hasError = productsError || linksError;

	return (
		<div className="space-y-8">
			<section className="space-y-3">
				<p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300/80">
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
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{products.map((product) => {
							const productLinks = links.filter(
								(link) => link.product.id === product.id,
							);
							const enrolled = !!product.enrollment;

							return (
								<div
									key={product.id}
									className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-500/40 sm:p-5"
								>
									<div
										className="pointer-events-none absolute -inset-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
										style={{ background: "radial-gradient(ellipse at 30% 0%, rgba(45,212,191,0.14), transparent 60%)" }}
										aria-hidden="true"
									/>
									<div className="relative min-w-0 space-y-2">
										<div className="flex items-start justify-between gap-2">
											<div className="flex min-w-0 items-start gap-3">
												<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/30">
													<Package className="h-[18px] w-[18px]" aria-hidden="true" />
												</span>
												<div className="min-w-0 space-y-1">
													<p className="text-sm font-semibold text-slate-50">
														{product.name}
													</p>
													<p className="text-[11px] text-slate-400">
														{product.description}
													</p>
												</div>
											</div>
											<span
												className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
													enrolled
														? "bg-teal-500/10 text-teal-300 ring-teal-500/30"
														: "bg-slate-800/70 text-slate-400 ring-slate-700/70"
												}`}
											>
												<span
													className={`h-1.5 w-1.5 rounded-full ${enrolled ? "bg-teal-400" : "bg-slate-500"}`}
													aria-hidden="true"
												/>
												{enrolled ? "Enrolled" : "Not enrolled"}
											</span>
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<span className="inline-flex items-center gap-1 rounded-md bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium tabular-nums text-slate-300">
												<Percent className="h-3 w-3" aria-hidden="true" />
												{(product.commission_rate ?? product.base_commission_rate).toFixed(1)}% per payment
											</span>
										</div>
										{product.enrollment && (
											<p className="text-[11px] text-slate-500">
												Enrolled on {format(new Date(product.enrollment.enrolled_at), "d MMM yyyy")}
											</p>
										)}
									</div>
									<div className="relative mt-3 space-y-3">
										{!enrolled && (
											<button
												className="inline-flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-[0_0_18px_rgba(45,212,191,0.25)] transition-all hover:bg-teal-400 hover:shadow-[0_0_24px_rgba(45,212,191,0.35)] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
												disabled={enrollMutation.isPending}
												onClick={() => enrollMutation.mutate(product.id)}
											>
												{enrollMutation.isPending ? "Joining..." : "Join program"}
												<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
											</button>
										)}

										{/* Referral Links */}
										{linksLoading ? (
											<p className="text-[11px] text-slate-400">
												Loading links...
											</p>
										) : productLinks.length === 0 ? (
											<div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-3 text-center">
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
