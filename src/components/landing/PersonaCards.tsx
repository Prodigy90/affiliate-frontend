"use client";

interface PersonaCard {
  id: string;
  label: string;
  title: string;
  bullets: string[];
}

const PERSONAS: PersonaCard[] = [
  {
    id: "ada",
    label: "Course creators & marketers",
    title: "You already teach the WASBOT workflow.",
    bullets: [
      "You tell your students to auto-save every lead the moment they DM.",
      "You explain how to post status to your whole list without your phone dying.",
      "You drop the link once in your course, your community, your email list — and earn for years.",
    ],
  },
  {
    id: "tunde",
    label: "WhatsApp TV operators",
    title: "Other operators already ask what you're running.",
    bullets: [
      "You post HD status to 35K contacts in under 10 seconds while their phones overheat.",
      "Your status delivery analytics is the proof — they want what you have.",
      "Drop your link in your WhatsApp group of operators, get paid when they switch.",
    ],
  },
];

export function PersonaCards() {
  return (
    <section className="bg-slate-950 py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-teal-400">
            Who this works for
          </p>
          <h2 className="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl">
            You don&apos;t need an audience. You need the right one.
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
            If you already talk to Nigerian marketers or operators about WhatsApp, you&apos;re
            sitting on commissions.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {PERSONAS.map((p, i) => (
            <article
              key={p.id}
              className="group relative rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 md:p-8"
            >
              <div className="mb-5 flex items-center justify-between border-b border-slate-800/60 pb-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-600">
                  {String(i + 1).padStart(2, "0")} / 02
                </span>
                <span className="rounded-full bg-teal-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-teal-400">
                  {p.label}
                </span>
              </div>

              <h3 className="mb-5 text-xl font-bold leading-tight text-white md:text-2xl">
                {p.title}
              </h3>

              <ul className="space-y-3">
                {p.bullets.map((bullet, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm leading-relaxed text-slate-300"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-teal-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
