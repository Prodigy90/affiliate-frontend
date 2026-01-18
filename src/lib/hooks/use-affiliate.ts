import { useSession } from "@/lib/auth-client";

export function useAffiliate() {
  const { data: session, isPending } = useSession();
  const isAuthenticated = !!session?.user;

  return {
    affiliate: session?.user,
    // backendToken kept for backward compatibility - proxy handles auth via cookies
    backendToken: isAuthenticated ? "proxy-handles-auth" : undefined,
    isLoading: isPending,
    isAuthenticated
  };
}
