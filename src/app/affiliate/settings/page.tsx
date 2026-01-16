"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import Image from "next/image";

import { getProfile, updateProfile, updateBankDetails } from "@/lib/api/settings";
import type { AffiliateProfile, UpdateProfileInput, UpdateBankDetailsInput } from "@/lib/types/settings";
import { getBanks, resolveBankAccount, type Bank } from "@/lib/api/banks";
import { format } from "date-fns";
import { useEffect, useState, useCallback } from "react";
import { useAuthSession } from "@/components/auth-guard";
import { BankSelect } from "@/components/bank-select";

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

export default function AffiliateSettingsPage() {
  const queryClient = useQueryClient();
  const { backendToken, status } = useAuthSession();

  // State for bank account resolution
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isAccountNameResolved, setIsAccountNameResolved] = useState(false);

  const {
    data: profile,
    isLoading: profileLoading,
  } = useQuery<AffiliateProfile, Error>({
    queryKey: ["settings-profile"],
    queryFn: () => getProfile(backendToken!),
    enabled: !!backendToken,
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
    mutationFn: (input: UpdateProfileInput) => updateProfile(input, backendToken!),
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
    mutationFn: (input: UpdateBankDetailsInput) => updateBankDetails(input, backendToken!),
    onSuccess: () => {
      toast.success("Bank details updated successfully");
      queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update bank details");
    },
  });

  async function onProfileSubmit(values: ProfileFormValues) {
    if (!backendToken) {
      toast.error("Please sign in to update your profile.");
      return;
    }
    profileMutation.mutate(values);
  }

  async function onBankDetailsSubmit(values: BankDetailsFormValues) {
    if (!backendToken) {
      toast.error("Please sign in to update bank details.");
      return;
    }
    bankDetailsMutation.mutate(values);
  }

  if (status === "loading" || profileLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-slate-300">Loading settings...</p>
      </div>
    );
  }

  if (!backendToken) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-slate-300">
          Sign in with Google to manage your settings.
        </p>
        <button
          onClick={() => signIn.social({ provider: "google", callbackURL: window.location.pathname })}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 transition-colors"
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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your profile and bank details
        </p>
      </div>

      {/* Profile Section */}
      <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-50">Profile Information</h2>

        <div className="mb-6 flex items-center gap-4">
          {profile.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt={profile.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full border border-slate-700"
            />
          )}
          <div>
            <p className="text-sm font-medium text-slate-200">{profile.name}</p>
            <p className="text-xs text-slate-400">{profile.email}</p>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                disabled
                value={profile.email}
                className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-slate-500">From your Google account</p>
            </div>

            <div>
              <label htmlFor="ref_id" className="mb-1 block text-sm font-medium text-slate-300">
                Referral ID
              </label>
              <input
                id="ref_id"
                type="text"
                disabled
                value={profile.ref_id}
                className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-400 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-300">
                Display Name
              </label>
              <input
                id="name"
                type="text"
                {...profileForm.register("name")}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {profileForm.formState.errors.name && (
                <p className="mt-1 text-xs text-red-400">
                  {profileForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="created_at" className="mb-1 block text-sm font-medium text-slate-300">
                Member Since
              </label>
              <input
                id="created_at"
                type="text"
                disabled
                value={format(new Date(profile.created_at), "MMMM d, yyyy")}
                className="w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profileMutation.isPending || !profileForm.formState.isDirty}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {profileMutation.isPending ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* Bank Details Section */}
      <div className="rounded-lg border border-slate-800/80 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-50">Bank Details</h2>
        <p className="mb-4 text-sm text-slate-400">
          Update your bank account information for receiving payouts
        </p>

        <form onSubmit={bankDetailsForm.handleSubmit(onBankDetailsSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">
                Bank Name
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
              <label htmlFor="account_number" className="mb-1 block text-sm font-medium text-slate-300">
                Account Number
              </label>
              <input
                id="account_number"
                type="text"
                maxLength={10}
                {...bankDetailsForm.register("account_number")}
                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="0123456789"
              />
              {bankDetailsForm.formState.errors.account_number && (
                <p className="mt-1 text-xs text-red-400">
                  {bankDetailsForm.formState.errors.account_number.message}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="account_name" className="mb-1 block text-sm font-medium text-slate-300">
                Account Name
                {isResolving && (
                  <span className="ml-2 inline-flex items-center text-xs text-slate-400">
                    <svg className="mr-1 h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                )}
                {isAccountNameResolved && !isResolving && (
                  <span className="ml-2 inline-flex items-center text-xs text-emerald-400">
                    <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  id="account_name"
                  type="text"
                  {...bankDetailsForm.register("account_name")}
                  disabled={isResolving}
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors ${
                    isAccountNameResolved
                      ? "border-emerald-600 bg-emerald-950/30 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500"
                      : "border-slate-700 bg-slate-800 text-slate-100 focus:border-emerald-500 focus:ring-emerald-500"
                  } ${isResolving ? "cursor-wait opacity-60" : ""}`}
                  placeholder={isResolving ? "Verifying account..." : "Will be auto-filled after verification"}
                />
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
            <button
              type="submit"
              disabled={bankDetailsMutation.isPending || !bankDetailsForm.formState.isDirty}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {bankDetailsMutation.isPending ? "Saving..." : "Save Bank Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
