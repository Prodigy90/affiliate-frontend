import { useSession } from "@/lib/auth-client";

export function useAffiliate() {
  const { data: session, isPending } = useSession();
  const isAuthenticated = !!session?.user;

  return {
    affiliate: session?.user,
    isLoading: isPending,
    isAuthenticated
  };
}
