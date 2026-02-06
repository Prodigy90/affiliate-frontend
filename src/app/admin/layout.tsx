import type { ReactNode } from "react";
import Link from "next/link";

import { UserMenu } from "@/components/user-menu";

type AdminLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/affiliates", label: "Affiliates" },
  { href: "/admin/products", label: "Products" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/admin/payouts" className="group flex items-center gap-2">
            <img src="/wasbot-icon.svg" alt="WASBOT" className="h-7 w-7 rounded-md transition-shadow duration-300 group-hover:shadow-[0_0_12px_rgba(45,212,191,0.5)]" />
            <span className="text-sm font-semibold text-slate-100">Admin</span>
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 text-sm text-slate-300">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
