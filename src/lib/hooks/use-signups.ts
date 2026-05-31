import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

import { getSignups } from "@/lib/api/affiliate";
import type { SignupListResponse } from "@/lib/types/affiliate";

/**
 * Referred-signup conversions for the logged-in affiliate.
 * `limit` bounds the recent-list size; the response `total` is the full count
 * regardless of limit, so the dashboard can show "N signups" while listing a
 * handful. Auth is handled by the proxy via Better Auth cookies.
 */
export function useSignups(limit = 5) {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return useQuery<SignupListResponse, Error>({
    queryKey: ["signups", limit],
    queryFn: () => getSignups(limit),
    enabled: isAuthenticated,
    staleTime: 30_000
  });
}
