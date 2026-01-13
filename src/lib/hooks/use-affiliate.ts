import { useSession } from "@/lib/auth-client";

export function useAffiliate() {
  const { data: session, isPending } = useSession();

  return {
    affiliate: session?.user,
    // backendToken no longer needed - proxy handles auth via cookies
    backendToken: undefined,
    isLoading: isPending,
    isAuthenticated: !!session?.user
  };
}
