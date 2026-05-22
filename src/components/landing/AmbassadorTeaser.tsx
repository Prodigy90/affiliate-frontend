"use client";

export function AmbassadorTeaser() {
  return (
    <section className="bg-slate-950 py-14 md:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900/80 to-slate-950 p-8 md:p-12">
          {/* Soft accent glow */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-500/5 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative text-center">
            <span className="mb-5 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-violet-300">
              Ambassador tier &middot; coming up
            </span>

            <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Hit ₦100K in payouts. The math changes again.
            </h2>

            <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              Once you cross ₦100,000 in commissions, you unlock the ambassador tier — bigger
              cuts, longer payout windows, and a direct line to the founder for support
              requests, custom collateral, and early access to features.
            </p>

            <p className="text-sm text-slate-500">
              Details land when you get close. No application — your dashboard tells you when
              you&apos;ve crossed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
