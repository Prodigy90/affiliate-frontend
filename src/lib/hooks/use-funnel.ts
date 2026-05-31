import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

import { getFunnel } from "@/lib/api/analytics";
import type { FunnelData } from "@/lib/types/analytics";

/**
 * Referral funnel for the logged-in affiliate: signups → converted → earning
 * → paid out, with the conversion and payout rates between stages. Called with
 * no date params, so the backend's default window (last 30 days) applies.
 * Auth is handled by the proxy via Better Auth cookies.
 */
export function useFunnel() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return useQuery<FunnelData, Error>({
    queryKey: ["funnel"],
    queryFn: () => getFunnel(),
    enabled: isAuthenticated,
    staleTime: 30_000
  });
}
