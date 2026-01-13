import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

import { getEarnings } from "@/lib/api/affiliate";
import type { EarningsSummary } from "@/lib/types/affiliate";

export function useEarnings() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return useQuery<EarningsSummary, Error>({
    queryKey: ["earnings"],
    // No token needed - proxy handles auth via cookies
    queryFn: () => getEarnings(),
    enabled: isAuthenticated,
    staleTime: 30_000
  });
}
