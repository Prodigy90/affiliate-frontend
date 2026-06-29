"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminAffiliateSignups } from "@/lib/api/admin";
import type { AdminSignupListResponse } from "@/lib/types/affiliate";
import { STALE_TIME_DEFAULT } from "@/lib/constants/query";
import type { PageSize } from "@/components/admin/PaginationBar";

export type UsePaginatedAdminAffiliateSignupsParams = {
  affiliateId: string;
  page: number;
  pageSize: PageSize;
  enabled?: boolean;
};

/**
 * Per-affiliate referred-signup history (admin view).
 *
 * Surfaces WHO an affiliate referred (top-of-funnel conversions), not just
 * their commissions. Backend pagination: SUPPORTED (page/limit).
 */
export function usePaginatedAdminAffiliateSignups({
  affiliateId,
  page,
  pageSize,
  enabled = true,
}: UsePaginatedAdminAffiliateSignupsParams) {
  return useQuery<AdminSignupListResponse, Error>({
    queryKey: ["admin-affiliate-signups", affiliateId, { page, pageSize }],
    queryFn: () =>
      getAdminAffiliateSignups(affiliateId, {
        page,
        limit: pageSize,
      }),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
    placeholderData: (prev) => prev,
  });
}
