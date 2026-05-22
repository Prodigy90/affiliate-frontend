"use client";

import { useState } from "react";

export type AffiliatePersonaId = "marketers" | "tvs";

interface PersonaCopy {
  id: AffiliatePersonaId;
  tabLabel: string;
  headlineLead: string;
  headlineAccent: string;
  subheadline: string;
}

const PERSONAS: PersonaCopy[] = [
  {
    id: "marketers",
    tabLabel: "Course creators & marketers",
    headlineLead: "Send your students to WASBOT once.",
    headlineAccent: "Get paid three months running.",
    subheadline:
      "You already tell your community to auto-save contacts and post to their whole list. We pay you 10% on every renewal for the first three months — every single person who signs up through your link.",
  },
  {
    id: "tvs",
    tabLabel: "WhatsApp TV operators",
    headlineLead: "Your TV is already the proof.",
    headlineAccent: "Now get paid when others follow.",
    subheadline:
      "Other operators see your phone stay cool while theirs overheats. Drop your link, they sign up, you earn 10% on their first three months. No extra work — just the same WASBOT you already run.",
  },
];

interface AffiliateHeroProps {
  onPrimaryCta?: () => void;
}

export function AffiliateHero({ onPrimaryCta }: AffiliateHeroProps) {
  const [active, setActive] = useState<AffiliatePersonaId>("marketers");
  const persona = PERSONAS.find((p) => p.id === active) ?? PERSONAS[0];

  return (
    <section className="relative overflow-hidden bg-slate-950 pt-20 pb-14 md:pt-28 md:pb-20 lg:pt-32">
      {/* Subtle radial backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-0 h-[480px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[480px] translate-y-1/3 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Persona tabs */}
          <div className="mb-8 flex justify-center">
            <div
              role="tablist"
              aria-label="Choose your fit"
              className="inline-flex rounded-full bg-slate-800/60 p-1"
            >
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={active === p.id}
                  onClick={() => setActive(p.id)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 sm:px-5 sm:text-sm ${
                    active === p.id
                      ? "bg-teal-500/20 text-teal-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p.tabLabel}
                </button>
              ))}
            </div>
          </div>

          {/* Pre-headline tagline */}
          <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-teal-400">
            WASBOT Affiliate Program
          </p>

          <h1 className="mb-6 text-balance text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {persona.headlineLead}{" "}
            <span className="text-teal-400">{persona.headlineAccent}</span>
          </h1>

          <p className="mx-auto mb-10 max-w-3xl text-pretty text-base leading-relaxed text-slate-400 sm:text-lg md:text-xl">
            {persona.subheadline}
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
            Free to join &middot; 10% on every renewal &middot; Three months per referral
          </p>
        </div>
      </div>
    </section>
  );
}
