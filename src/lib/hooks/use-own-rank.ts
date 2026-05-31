import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";

import { getOwnRank } from "@/lib/api/affiliate";
import type { OwnRank } from "@/lib/types/affiliate";

/**
 * The logged-in affiliate's own standing on the leaderboard.
 * Privacy decision: we never expose a list of other earners — only the
 * caller's own rank. Auth is handled by the proxy via Better Auth cookies.
 */
export function useOwnRank() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return useQuery<OwnRank, Error>({
    queryKey: ["own-rank"],
    queryFn: () => getOwnRank(),
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: 0
  });
}
