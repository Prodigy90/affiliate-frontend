"use client";

import { useState } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "payout-speed",
    question: "How fast do I get paid?",
    answer:
      "Payouts run monthly. Commissions earned in one month are paid out in the first week of the next, straight to your Nigerian bank account. USD accounts supported too.",
  },
  {
    id: "cancels",
    question: "What happens if my referral cancels?",
    answer:
      "You keep every commission paid up to the cancellation. No clawbacks. If they re-subscribe later, you don't get credit for that one — but anyone new you send still counts.",
  },
  {
    id: "status",
    question: "Can I drop the link in my WhatsApp status?",
    answer:
      "Yes, that's where most affiliates earn the most. Post a screenshot of your WASBOT dashboard, drop the link, repeat. Your status audience is already the right audience.",
  },
  {
    id: "minimum",
    question: "Is there a minimum payout?",
    answer:
      "₦5,000. Anything below rolls over to the next month. Most affiliates clear the minimum on their first or second referral.",
  },
  {
    id: "tracking",
    question: "How do I track signups?",
    answer:
      "Your dashboard shows every click, signup, and paid conversion in real time. You'll see when someone signed up via your link, when they upgraded from trial, and when each commission is due.",
  },
  {
    id: "analytics",
    question: "Where do I see analytics?",
    answer:
      "All inside your affiliate dashboard — clicks, signups, paying customers, commissions earned, commissions pending, and historical payouts. One screen, no spreadsheets.",
  },
];

export function Faq() {
  const [openId, setOpenId] = useState<string | null>(FAQS[0]?.id ?? null);

  return (
    <section id="faq" className="scroll-mt-20 bg-slate-950 py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-teal-400">
            Honest answers
          </p>
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            The questions everyone asks
          </h2>
        </div>

        <ul className="space-y-3">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <li
                key={faq.id}
                className={`overflow-hidden rounded-xl border transition-colors ${
                  isOpen
                    ? "border-teal-500/30 bg-slate-900/80"
                    : "border-slate-800/70 bg-slate-900/40 hover:border-slate-700/70"
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span
                    className={`text-sm font-medium md:text-base ${
                      isOpen ? "text-white" : "text-slate-200"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                      isOpen ? "rotate-180 text-teal-400" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    className="px-5 pb-5 text-sm leading-relaxed text-slate-400 md:text-base"
                  >
                    {faq.answer}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
