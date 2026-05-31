"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminPayouts } from "@/lib/api/admin";
import type { AdminPayoutListResponse } from "@/lib/types/admin";
import { STALE_TIME_DEFAULT } from "@/lib/constants/query";
import type { PageSize } from "@/components/admin/PaginationBar";

export type UsePaginatedAdminPayoutsParams = {
  page: number;
  pageSize: PageSize;
  q?: string;
  status?: string;
  affiliateId?: string;
  enabled?: boolean;
};

/**
 * Fetches a single page of admin payout requests.
 *
 * Backend pagination: SUPPORTED.
 * Backend search (`q`): SUPPORTED — ILIKE across payout id / affiliate name /
 * email, returning the correct filtered total (no client-side filtering).
 */
export function usePaginatedAdminPayouts({
  page,
  pageSize,
  q,
  status,
  affiliateId,
  enabled = true,
}: UsePaginatedAdminPayoutsParams) {
  return useQuery<AdminPayoutListResponse, Error>({
    queryKey: [
      "admin-payouts",
      { page, pageSize, q: q ?? "", status, affiliateId },
    ],
    queryFn: () =>
      getAdminPayouts({
        page,
        limit: pageSize,
        ...(q ? { q } : {}),
        ...(status ? { status } : {}),
        ...(affiliateId ? { affiliateId } : {}),
      }),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
    placeholderData: (prev) => prev,
  });
}
