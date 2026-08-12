"use client";

const TwitterIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
  </svg>
);

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-800/70 bg-slate-950 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/wasbot-icon.svg"
                alt=""
                width={28}
                height={28}
                className="rounded-lg"
              />
              <span className="text-base font-bold tracking-tight text-white">
                WASBOT Affiliate
              </span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Share what you already love about WASBOT. Get paid 10% on every renewal for the
              first twelve months.
            </p>
          </div>

          {/* Program */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Program
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#commission"
                  className="text-slate-400 transition-colors hover:text-teal-400"
                >
                  Commission math
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-slate-400 transition-colors hover:text-teal-400"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-slate-400 transition-colors hover:text-teal-400"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Account
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/login"
                  className="text-slate-400 transition-colors hover:text-teal-400"
                >
                  Sign in
                </a>
              </li>
              <li>
                <a
                  href="https://wasbot.app"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 transition-colors hover:text-teal-400"
                >
                  WASBOT main site
                </a>
              </li>
              <li>
                <a
                  href="https://wasbot.app/privacy-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 transition-colors hover:text-teal-400"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="https://wasbot.app/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 transition-colors hover:text-teal-400"
                >
                  Terms
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Follow
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="https://twitter.com/wasbot"
                target="_blank"
                rel="noreferrer"
                aria-label="WASBOT on X"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800/70 text-slate-400 transition-colors hover:border-teal-500/40 hover:text-teal-400"
              >
                <TwitterIcon />
              </a>
              <a
                href="https://instagram.com/wasbot.app"
                target="_blank"
                rel="noreferrer"
                aria-label="WASBOT on Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800/70 text-slate-400 transition-colors hover:border-teal-500/40 hover:text-teal-400"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800/70 pt-6 text-center text-xs text-slate-500">
          &copy; {year} WASBOT. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
