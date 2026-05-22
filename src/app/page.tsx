"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "@/lib/auth-client";
import { AffiliateHero } from "@/components/landing/AffiliateHero";
import { CommissionMath } from "@/components/landing/CommissionMath";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PersonaCards } from "@/components/landing/PersonaCards";
import { AmbassadorTeaser } from "@/components/landing/AmbassadorTeaser";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  // Already signed in? Send them through to their dashboard.
  useEffect(() => {
    if (isPending || !session?.user) return;
    const role = (session.user as { role?: string }).role;
    if (role === "admin") {
      router.replace("/admin/payouts");
    } else {
      router.replace("/affiliate/dashboard");
    }
  }, [isPending, session, router]);

  const handleStartEarning = () => {
    // Kick straight into the Google flow; Better Auth will land them on the
    // affiliate dashboard once they're authenticated.
    signIn.social({
      provider: "google",
      callbackURL: "/affiliate/dashboard",
    });
  };

  // While Better Auth is checking the session, render the landing anyway —
  // a crawler hitting this page should always see marketing content, not a
  // spinner. The redirect effect handles authenticated users.
  return (
    <main id="main-content" className="min-h-screen overflow-x-hidden bg-slate-950">
      <AffiliateHero onPrimaryCta={handleStartEarning} />
      <CommissionMath />
      <HowItWorks />
      <PersonaCards />
      <AmbassadorTeaser />
      <Faq />
      <Footer />

      {/* Floating bottom CTA bar — single, clear next step */}
      <div className="sticky bottom-0 z-10 hidden border-t border-slate-800/70 bg-slate-950/90 backdrop-blur md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <p className="text-sm text-slate-300">
            Ready to share what you already love?{" "}
            <span className="text-slate-500">No card, signup takes 60 seconds.</span>
          </p>
          <button
            type="button"
            onClick={handleStartEarning}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
          >
            Start earning
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </main>
  );
}
