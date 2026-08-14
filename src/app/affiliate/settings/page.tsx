"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import Image from "next/image";
import {
	BadgeCheck,
	CalendarDays,
	Check,
	Copy,
	Landmark,
	Loader2,
	Mail,
	UserRound,
} from "lucide-react";

import { getProfile, updateProfile, updateBankDetails } from "@/lib/api/settings";
import type { AffiliateProfile, UpdateProfileInput, UpdateBankDetailsInput } from "@/lib/types/settings";
import { getBanks, resolveBankAccount, type Bank } from "@/lib/api/banks";
import { format } from "date-fns";
import { useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { useAuthSession } from "@/components/auth-guard";
import { BankSelect } from "@/components/bank-select";
import { PageSkeleton } from "@/components/page-skeleton";

const profileSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
});

const bankDetailsSchema = z.object({
	bank_code: z.string().min(1, "Select a bank"),
	account_number: z
		.string()
		.length(10, "Account number must be exactly 10 digits")
		.regex(/^\d{10}$/, "Account number must contain only digits"),
	account_name: z.string().min(3, "Account name must be at least 3 characters"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

const emptySubscribe = () => () => {};

/** Text-field chassis matched to BankSelect's trigger so mixed rows line up. */
const FIELD_CLASS =
	"w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 transition-all focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

/** Quiet read-only fact — replaces the old fake-disabled inputs. */
function FactBlock({
	icon: Icon,
	label,
	value,
	hint,
}: {
	icon: typeof Mail;
	label: string;
	value: string;
	hint?: string;
}) {
	return (
		<div className="flex items-start gap-2.5">
			<span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800/70 text-slate-400 ring-1 ring-slate-700/70">
				<Icon className="h-3.5 w-3.5" aria-hidden="true" />
			</span>
			<div className="min-w-0">
				<p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
					{label}
				</p>
				<p className="truncate text-sm text-slate-200">{value}</p>
				{hint && <p className="text-[11px] text-slate-500">{hint}</p>}
			</div>
		</div>
	);
}

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

export default function AffiliateSettingsPage() {
	const queryClient = useQueryClient();
	const { isAuthenticated, status } = useAuthSession();

	// Hydration gate — same trap as the analytics page: the prerendered shell
	// bakes a resolved branch while the client's first paint is still loading.
	// Both sides see the server snapshot (false) and agree on the skeleton.
	const mounted = useSyncExternalStore(
		emptySubscribe,
		() => true,
		() => false,
	);

	// State for bank account resolution
	const [isResolving, setIsResolving] = useState(false);
	const [resolveError, setResolveError] = useState<string | null>(null);
	const [isAccountNameResolved, setIsAccountNameResolved] = useState(false);
	const [refCopied, setRefCopied] = useState(false);

	const {
		data: profile,
		isLoading: profileLoading,
	} = useQuery<AffiliateProfile, Error>({
		queryKey: ["settings-profile"],
		queryFn: () => getProfile(),
		enabled: isAuthenticated,
		staleTime: 30_000,
	});

	const {
		data: banks,
		isLoading: banksLoading,
	} = useQuery<Bank[], Error>({
		queryKey: ["banks"],
		queryFn: getBanks,
		staleTime: 24 * 60 * 60 * 1000, // 24 hours
	});

	// Profile form
	const profileForm = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		values: {
			name: profile?.name || "",
		},
	});

	// Bank details form
	const bankDetailsForm = useForm<BankDetailsFormValues>({
		resolver: zodResolver(bankDetailsSchema),
		values: {
			bank_code: profile?.bank_code || "",
			account_number: profile?.account_number || "",
			account_name: profile?.account_name || "",
		},
	});

	// Watch bank details for auto-resolution
	const watchedBankCode = bankDetailsForm.watch("bank_code");
	const watchedAccountNumber = bankDetailsForm.watch("account_number");

	// Resolve bank account when account number and bank code are valid
	const resolveAccount = useCallback(async (accountNumber: string, bankCode: string) => {
		if (accountNumber.length !== 10 || !bankCode) return;
		if (!/^\d{10}$/.test(accountNumber)) return;

		setIsResolving(true);
		setResolveError(null);

		try {
			const result = await resolveBankAccount(accountNumber, bankCode);
			bankDetailsForm.setValue("account_name", result.account_name, { shouldDirty: true });
			setIsAccountNameResolved(true);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Could not verify account";
			setResolveError(message);
			setIsAccountNameResolved(false);
		} finally {
			setIsResolving(false);
		}
	}, [bankDetailsForm]);

	// Effect to trigger resolution when inputs change
	// Skip API call if the values match the already-saved profile values
	useEffect(() => {
		if (watchedAccountNumber?.length === 10 && watchedBankCode) {
			// If the bank details match the saved profile, mark as already verified
			// and skip the Paystack API call to avoid unnecessary requests
			const matchesSavedProfile =
				profile?.bank_code === watchedBankCode &&
				profile?.account_number === watchedAccountNumber &&
				profile?.account_name;

			if (matchesSavedProfile) {
				setIsAccountNameResolved(true);
				setResolveError(null);
				return;
			}

			const timer = setTimeout(() => {
				resolveAccount(watchedAccountNumber, watchedBankCode);
			}, 500); // Debounce 500ms
			return () => clearTimeout(timer);
		} else {
			setIsAccountNameResolved(false);
			setResolveError(null);
		}
	}, [watchedAccountNumber, watchedBankCode, resolveAccount, profile]);

	// Profile update mutation
	const profileMutation = useMutation({
		mutationFn: (input: UpdateProfileInput) => updateProfile(input),
		onSuccess: () => {
			toast.success("Profile updated successfully");
			queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
			queryClient.invalidateQueries({ queryKey: ["auth-me"] });
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to update profile");
		},
	});

	// Bank details update mutation
	const bankDetailsMutation = useMutation({
		mutationFn: (input: UpdateBankDetailsInput) => updateBankDetails(input),
		onSuccess: () => {
			toast.success("Bank details updated successfully");
			queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
		},
		onError: (err: Error) => {
			toast.error(err.message || "Failed to update bank details");
		},
	});

	async function onProfileSubmit(values: ProfileFormValues) {
		if (!isAuthenticated) {
			toast.error("Please sign in to update your profile.");
			return;
		}
		profileMutation.mutate(values);
	}

	async function onBankDetailsSubmit(values: BankDetailsFormValues) {
		if (!isAuthenticated) {
			toast.error("Please sign in to update bank details.");
			return;
		}
		bankDetailsMutation.mutate(values);
	}

	async function copyRefId() {
		if (!profile) return;
		try {
			await navigator.clipboard.writeText(profile.ref_id);
			setRefCopied(true);
			toast.success("Referral ID copied");
			setTimeout(() => setRefCopied(false), 2000);
		} catch {
			toast.error("Failed to copy referral ID");
		}
	}

	if (!mounted || status === "loading" || profileLoading) {
		return <PageSkeleton />;
	}

	if (!isAuthenticated) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
				<p className="text-sm text-slate-300">
					Sign in with Google to manage your settings.
				</p>
				<button
					onClick={() => signIn.social({ provider: "google", callbackURL: window.location.pathname })}
					className="rounded-full bg-teal-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-teal-400"
				>
					Sign in with Google
				</button>
			</div>
		);
	}

	if (!profile) {
		return (
			<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
				<p className="text-sm text-slate-300">Failed to load profile</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<section className="space-y-1.5">
				<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300/80">
					Settings
				</p>
				<h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">
					Your profile and payout account.
				</h1>
				<p className="max-w-xl text-sm text-slate-400">
					Who you are on the program, and where your money lands.
				</p>
			</section>

			{/* Profile — identity row + editable display name; read-only facts
			    render as quiet blocks, not fake-disabled inputs. */}
			<section className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
				<div
					className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl"
					aria-hidden="true"
				/>

				<div className="relative flex flex-wrap items-center justify-between gap-4">
					<div className="flex min-w-0 items-center gap-3.5">
						{profile.avatar_url ? (
							<Image
								src={profile.avatar_url}
								alt={profile.name}
								width={56}
								height={56}
								className="h-14 w-14 rounded-full ring-2 ring-teal-500/30"
							/>
						) : (
							<span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-400 ring-2 ring-teal-500/30">
								<UserRound className="h-6 w-6" aria-hidden="true" />
							</span>
						)}
						<div className="min-w-0">
							<p className="truncate text-base font-semibold text-slate-50">{profile.name}</p>
							<p className="truncate text-xs text-slate-400">{profile.email}</p>
						</div>
					</div>

					{/* Referral ID as a copyable chip — this is the thing affiliates
					    actually share, so it earns the copy affordance. */}
					<div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/60 px-2.5 py-2">
						<span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
							Ref ID
						</span>
						<span className="min-w-0 truncate font-mono text-xs text-teal-300" title={profile.ref_id}>
							{profile.ref_id}
						</span>
						<button
							type="button"
							onClick={copyRefId}
							aria-label="Copy referral ID"
							className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
								refCopied
									? "bg-teal-500/10 text-teal-300"
									: "text-slate-300 hover:bg-slate-800/70 hover:text-teal-300"
							}`}
						>
							{refCopied ? (
								<>
									<Check className="h-3.5 w-3.5" aria-hidden="true" />
									Copied
								</>
							) : (
								<>
									<Copy className="h-3.5 w-3.5" aria-hidden="true" />
									Copy
								</>
							)}
						</button>
					</div>
				</div>

				<div className="relative mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-800/50 pt-4">
					<FactBlock
						icon={Mail}
						label="Email"
						value={profile.email}
						hint="From your Google account"
					/>
					<FactBlock
						icon={CalendarDays}
						label="Member since"
						value={format(new Date(profile.created_at), "d MMM yyyy")}
					/>
				</div>

				<form
					onSubmit={profileForm.handleSubmit(onProfileSubmit)}
					className="relative mt-4 border-t border-slate-800/50 pt-4"
				>
					<div className="flex flex-wrap items-end justify-between gap-3">
						<div className="w-full sm:max-w-xs">
							<label htmlFor="name" className="mb-1.5 block text-xs font-medium text-slate-300">
								Display name
							</label>
							<input
								id="name"
								type="text"
								{...profileForm.register("name")}
								className={FIELD_CLASS}
							/>
							{profileForm.formState.errors.name && (
								<p className="mt-1 text-xs text-red-400">
									{profileForm.formState.errors.name.message}
								</p>
							)}
						</div>
						<SaveButton
							pending={profileMutation.isPending}
							disabled={profileMutation.isPending || !profileForm.formState.isDirty}
						>
							Save profile
						</SaveButton>
					</div>
				</form>
			</section>

			{/* Bank details — where payouts land. Verification state lives
			    inside the account-name field. */}
			<section className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-5">
				<div className="flex items-center gap-3">
					<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/30">
						<Landmark className="h-[18px] w-[18px]" aria-hidden="true" />
					</span>
					<div>
						<h2 className="text-base font-semibold text-slate-50">Bank details</h2>
						<p className="text-xs text-slate-400">Where your payouts land.</p>
					</div>
				</div>

				<form onSubmit={bankDetailsForm.handleSubmit(onBankDetailsSubmit)} className="mt-4 space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label className="mb-1.5 block text-xs font-medium text-slate-300">
								Bank name
							</label>
							<BankSelect
								banks={banks || []}
								value={watchedBankCode}
								onChange={(code) => bankDetailsForm.setValue("bank_code", code, { shouldDirty: true })}
								disabled={banksLoading}
								placeholder={banksLoading ? "Loading banks..." : "Search and select a bank"}
								error={bankDetailsForm.formState.errors.bank_code?.message}
							/>
						</div>

						<div>
							<label htmlFor="account_number" className="mb-1.5 block text-xs font-medium text-slate-300">
								Account number
							</label>
							<input
								id="account_number"
								type="text"
								inputMode="numeric"
								maxLength={10}
								{...bankDetailsForm.register("account_number")}
								className={`${FIELD_CLASS} font-mono tabular-nums`}
								placeholder="0123456789"
							/>
							{bankDetailsForm.formState.errors.account_number && (
								<p className="mt-1 text-xs text-red-400">
									{bankDetailsForm.formState.errors.account_number.message}
								</p>
							)}
						</div>

						<div className="md:col-span-2">
							<label htmlFor="account_name" className="mb-1.5 block text-xs font-medium text-slate-300">
								Account name
							</label>
							<div className="relative">
								<input
									id="account_name"
									type="text"
									{...bankDetailsForm.register("account_name")}
									disabled={isResolving}
									className={`${FIELD_CLASS} pr-28 ${
										isAccountNameResolved
											? "border-teal-600/60 bg-teal-950/30"
											: ""
									} ${isResolving ? "cursor-wait opacity-60" : ""}`}
									placeholder={isResolving ? "Verifying account..." : "Will be auto-filled after verification"}
								/>
								{/* Verification state rides inside the field. */}
								{isResolving && (
									<span className="pointer-events-none absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-[11px] font-medium text-slate-400">
										<Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
										Verifying...
									</span>
								)}
								{isAccountNameResolved && !isResolving && (
									<span className="pointer-events-none absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md bg-teal-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-teal-300">
										<BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
										Verified
									</span>
								)}
							</div>
							{resolveError && (
								<p className="mt-1 text-xs text-amber-400">
									{resolveError} — You can enter the account name manually.
								</p>
							)}
							{bankDetailsForm.formState.errors.account_name && (
								<p className="mt-1 text-xs text-red-400">
									{bankDetailsForm.formState.errors.account_name.message}
								</p>
							)}
							{!isResolving && !isAccountNameResolved && !resolveError && watchedAccountNumber?.length !== 10 && (
								<p className="mt-1 text-xs text-slate-500">
									Enter your 10-digit account number to auto-verify
								</p>
							)}
						</div>
					</div>

					<div className="flex justify-end">
						<SaveButton
							pending={bankDetailsMutation.isPending}
							disabled={bankDetailsMutation.isPending || !bankDetailsForm.formState.isDirty}
						>
							Save bank details
						</SaveButton>
					</div>
				</form>
			</section>
		</div>
	);
}
