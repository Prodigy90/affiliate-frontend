"use client";

interface Tier {
  name: string;
  monthly: number;
  perReferral: number;
  blurb: string;
  popular?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Basic",
    monthly: 8000,
    perReferral: 9600,
    blurb: "Solo operators picking up the trial.",
  },
  {
    name: "Premium",
    monthly: 20000,
    perReferral: 24000,
    blurb: "The plan most of your audience lands on.",
    popular: true,
  },
  {
    name: "Pro",
    monthly: 50000,
    perReferral: 60000,
    blurb: "Multi-account power users and agencies.",
  },
];

const formatNaira = (n: number) => `₦${n.toLocaleString()}`;

export function CommissionMath() {
  return (
    <section
      id="commission"
      className="scroll-mt-20 bg-slate-950 py-14 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-teal-400">
            What you actually take home
          </p>
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            One referral on Premium. Twenty-four grand over their first year.
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
            10% of every paid month, for the first twelve months they stay. No clawbacks, no
            cap on how many people you send. Send 10, send 100 — every renewal pays you again.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex h-full flex-col rounded-2xl border p-6 md:p-7 ${
                tier.popular
                  ? "border-teal-500/40 bg-gradient-to-b from-slate-800/80 to-slate-900/80 shadow-xl shadow-teal-500/10"
                  : "border-slate-800/70 bg-slate-900/60"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-teal-500 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-950">
                    Most referrals land here
                  </span>
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {tier.name} plan
                </p>
                <p className="mt-1 text-sm text-slate-400">{tier.blurb}</p>
              </div>

              {/* The math equation */}
              <div className="mb-5 rounded-xl border border-slate-800/70 bg-slate-950/60 p-4 font-mono text-xs text-slate-400">
                <div className="flex items-baseline justify-between">
                  <span>10%</span>
                  <span className="text-slate-600">x</span>
                  <span>{formatNaira(tier.monthly)}</span>
                  <span className="text-slate-600">x</span>
                  <span>12 mo</span>
                </div>
                <div className="mt-3 border-t border-slate-800/70 pt-3 text-right">
                  <span className="text-base font-bold text-teal-300 md:text-lg">
                    = {formatNaira(tier.perReferral)}
                  </span>
                </div>
              </div>

              <div className="mt-auto">
                <p className="text-xs text-slate-500">Per referral, no cap on referrals.</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footnote */}
        <p className="mt-8 text-center text-xs text-slate-500 md:text-sm">
          Paid out monthly to your Nigerian bank or dollar account. Plan pricing stays NGN — the
          payout currency is your choice.
        </p>
      </div>
    </section>
  );
}
