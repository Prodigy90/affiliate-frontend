import { useQuery } from "@tanstack/react-query";

import type { ReferralEventsResponse } from "@/components/activity-feed/types";

export function useReferralEvents(limit = 20) {
  return useQuery<ReferralEventsResponse>({
    queryKey: ["referralEvents", limit],
    queryFn: async () => {
      const res = await fetch(`/proxy/affiliate/events?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load events");
      return res.json();
    },
    staleTime: 60_000
  });
}
