"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminAffiliateCommissions } from "@/lib/api/admin";
import type { CommissionListResponse } from "@/lib/types/affiliate";
import { STALE_TIME_DEFAULT } from "@/lib/constants/query";
import type { PageSize } from "@/components/admin/PaginationBar";

export type UsePaginatedAdminAffiliateCommissionsParams = {
  affiliateId: string;
  page: number;
  pageSize: PageSize;
  q?: string;
  status?: string;
  productId?: string;
  enabled?: boolean;
};

/**
 * Per-affiliate commission history (admin view).
 *
 * Backend pagination: SUPPORTED.
 * Backend search (`q`): NOT YET SUPPORTED — currently the page does not
 * surface a search input here, but the hook is wired up for when it does.
 */
export function usePaginatedAdminAffiliateCommissions({
  affiliateId,
  page,
  pageSize,
  q,
  status,
  productId,
  enabled = true,
}: UsePaginatedAdminAffiliateCommissionsParams) {
  return useQuery<CommissionListResponse, Error>({
    queryKey: [
      "admin-affiliate-commissions",
      affiliateId,
      { page, pageSize, q: q ?? "", status, productId },
    ],
    queryFn: () =>
      getAdminAffiliateCommissions(affiliateId, {
        page,
        limit: pageSize,
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
        ...(productId ? { productId } : {}),
      }),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
    placeholderData: (prev) => prev,
  });
}
