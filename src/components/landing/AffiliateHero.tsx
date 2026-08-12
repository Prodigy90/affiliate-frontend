"use client";

interface AffiliateHeroProps {
  onPrimaryCta?: () => void;
}

export function AffiliateHero({ onPrimaryCta }: AffiliateHeroProps) {
  return (
    <section className="relative overflow-hidden bg-slate-950 pt-24 pb-14 md:pt-32 md:pb-20 lg:pt-36">
      {/* Subtle radial backdrop */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[480px] translate-y-1/3 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Pre-headline tagline */}
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-teal-400">
            WASBOT Affiliate Program
          </p>

          <h1 className="mb-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Share what you already love about WASBOT.{" "}
            <span className="text-teal-400">Get paid twelve months running.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-pretty text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl">
            Drop your link where your people already are — status, groups, your YouTube
            description. Every sign-up earns you 10% of every renewal for their first
            12 months. No cap on how many you bring.
          </p>

          <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={onPrimaryCta}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-950 shadow-lg shadow-white/10 transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-xl hover:shadow-white/20 sm:w-auto sm:text-base"
            >
              <svg
                className="h-4 w-4 transition-transform group-hover:rotate-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Start earning
            </button>

            <a
              href="#how-it-works"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-700/60 px-7 py-3.5 text-sm font-medium text-slate-300 transition-all hover:border-white hover:bg-white hover:text-slate-950 sm:w-auto sm:text-base"
            >
              <span>See how it works</span>
              <svg
                className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
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
            </a>
          </div>

          <p className="text-xs text-slate-500 sm:text-sm">
            Free to join &middot; 10% on every renewal &middot; Twelve months per referral
          </p>
        </div>
      </div>
    </section>
  );
}
