"use client";

import { useSession, signIn, signOut } from "@/lib/auth-client";
import { Loader2, LogIn, LogOut } from "lucide-react";

export function UserMenu() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Checking session...</span>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <button
        onClick={() =>
          signIn.social({
            provider: "google",
            callbackURL: window.location.pathname
          })
        }
        className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20"
      >
        <LogIn className="h-3 w-3" />
        <span>Sign in</span>
      </button>
    );
  }

  const user = session.user;
  const name = user.name ?? user.email ?? "Signed in";
  const avatarUrl = user.image ?? undefined;

  return (
    <div className="flex items-center gap-3">
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={name}
          className="h-7 w-7 rounded-full object-cover border border-slate-700"
        />
      )}
      <p className="max-w-[140px] truncate text-xs text-slate-200">{name}</p>
      <button
        onClick={() => signOut()}
        className="inline-flex items-center gap-1 rounded-full border border-slate-600/60 bg-slate-800/80 px-3 py-1 text-[11px] font-medium text-slate-200 transition-colors hover:bg-slate-700"
      >
        <LogOut className="h-3 w-3" />
        <span>Logout</span>
      </button>
    </div>
  );
}

