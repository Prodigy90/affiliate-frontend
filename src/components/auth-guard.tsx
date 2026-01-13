"use client";

import { useSession, signIn } from "@/lib/auth-client";

type AuthGuardProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  // Role is stored as additionalField in Better Auth
  const role = (user as { role?: string } | undefined)?.role;

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-slate-300">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-slate-300">
          Sign in with your Google account to continue.
        </p>
        <button
          onClick={() =>
            signIn.social({
              provider: "google",
              callbackURL: window.location.pathname
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm transition-colors hover:bg-emerald-400"
        >
          <span>Sign in</span>
        </button>
      </div>
    );
  }

  if (requireAdmin && role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-red-300">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function useAuthSession() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const role = (user as { role?: string } | undefined)?.role;
  const isAuthenticated = !!user;

  return {
    session,
    user,
    role,
    isLoading: isPending,
    isAuthenticated,
    isAdmin: role === "admin",
    // Backward-compatible fields (backendToken no longer needed - proxy handles auth)
    backendToken: isAuthenticated ? "proxy-handles-auth" : undefined,
    status: isPending ? "loading" : isAuthenticated ? "authenticated" : "unauthenticated"
  };
}
