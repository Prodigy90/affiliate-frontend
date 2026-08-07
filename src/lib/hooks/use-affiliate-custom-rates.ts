"use client";

import { useQuery } from "@tanstack/react-query";

import { getAffiliateCustomRates } from "@/lib/api/admin";
import type { AffiliateCustomRateListResponse } from "@/lib/types/admin";
import { STALE_TIME_DEFAULT } from "@/lib/constants/query";

export type UseAffiliateCustomRatesParams = {
  affiliateId: string;
  enabled?: boolean;
};

/**
 * Fetches an affiliate's per-product commission overrides.
 * Backend: GET /admin/affiliates/:id/custom-rates — no pagination, the row
 * count is bounded by the number of products.
 */
export function useAffiliateCustomRates({
  affiliateId,
  enabled = true,
}: UseAffiliateCustomRatesParams) {
  return useQuery<AffiliateCustomRateListResponse, Error>({
    queryKey: ["admin-affiliate-custom-rates", affiliateId],
    queryFn: () => getAffiliateCustomRates(affiliateId),
    enabled: enabled && !!affiliateId,
    staleTime: STALE_TIME_DEFAULT,
  });
}
