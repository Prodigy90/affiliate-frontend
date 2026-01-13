"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending || !session?.user) return;

    // Check role from additionalFields
    const role = (session.user as { role?: string }).role;
    if (role === "admin") {
      router.replace("/admin/payouts");
    } else {
      router.replace("/affiliate/dashboard");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <p className="text-sm text-slate-300">Checking your session...</p>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <div className="max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg">
          <h1 className="text-xl font-semibold">Redirecting to your dashboard</h1>
          <p className="mt-2 text-sm text-slate-300">
            We detected an active session. Taking you to the appropriate dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
      <main className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">WasBot Affiliate</h1>
        <p className="mt-2 text-sm text-slate-300">
          Unified referral dashboard and admin console for WasBot. Sign in with Google to
          access your affiliate earnings or manage payouts and products.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              signIn.social({
                provider: "google",
                callbackURL: "/"
              })
            }
            className="inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950 shadow hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            Continue with Google
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Admins are routed to the admin console. Affiliates are routed to their earnings
          dashboard.
        </p>
      </main>
    </div>
  );
}
