"use client";

interface Step {
  index: string;
  title: string;
  outcome: string;
}

const STEPS: Step[] = [
  {
    index: "1",
    title: "Sign up free",
    outcome: "Takes 60 seconds. Just your Google account — no card, no contract.",
  },
  {
    index: "2",
    title: "Grab your link",
    outcome: "Personal referral URL ready the moment you land in the dashboard.",
  },
  {
    index: "3",
    title: "Drop it where you already post",
    outcome: "Status, group chats, YouTube descriptions, blog posts — wherever your people are.",
  },
  {
    index: "4",
    title: "Get paid every renewal",
    outcome: "10% of every renewal for 12 months. Paid to your bank, no chasing required.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-slate-950 py-14 md:py-20"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-teal-400">
            Four steps, one afternoon
          </p>
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            From signup to first commission
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
            No application form, no waiting list. Sign up and your link is live the same day.
          </p>
        </div>

        <div className="relative">
          {/* Subtle connecting line - desktop */}
          <div
            className="pointer-events-none absolute left-[calc(12.5%)] right-[calc(12.5%)] top-7 hidden h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent md:block"
            aria-hidden="true"
          />

          <ol className="grid gap-8 md:grid-cols-4 md:gap-6">
            {STEPS.map((step) => (
              <li
                key={step.index}
                className="relative grid grid-cols-[3.5rem_1fr] gap-4 md:flex md:flex-col md:items-center md:text-center"
              >
                <div className="flex md:justify-center">
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-teal-500/30 bg-slate-950 font-mono text-xl font-bold text-teal-400 shadow-lg shadow-teal-500/10">
                    {step.index}
                  </div>
                </div>
                <div className="pt-2 md:pt-5 md:w-full">
                  <h3 className="mb-2 text-base font-bold leading-tight tracking-tight text-white md:text-lg">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">{step.outcome}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
