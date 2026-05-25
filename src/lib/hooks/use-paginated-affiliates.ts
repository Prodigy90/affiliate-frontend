"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminAffiliates } from "@/lib/api/admin";
import type { AdminAffiliateListResponse } from "@/lib/types/admin";
import { STALE_TIME_DEFAULT } from "@/lib/constants/query";
import type { PageSize } from "@/components/admin/PaginationBar";

export type UsePaginatedAdminAffiliatesParams = {
  page: number;
  pageSize: PageSize;
  /** Debounced search query. Pass empty string to disable. */
  q?: string;
  /** Optional filters forwarded to backend. */
  role?: string;
  status?: string;
  enabled?: boolean;
};

/**
 * Fetches a single page of admin affiliates. Cache key includes every input
 * so pagination + search are correctly memoised.
 *
 * Backend pagination: SUPPORTED (page + limit).
 * Backend search (`q`): NOT YET SUPPORTED — forwarded but ignored. The page
 * combines this with client-side filtering so typing already narrows the
 * visible rows.
 */
export function usePaginatedAdminAffiliates({
  page,
  pageSize,
  q,
  role,
  status,
  enabled = true,
}: UsePaginatedAdminAffiliatesParams) {
  return useQuery<AdminAffiliateListResponse, Error>({
    queryKey: ["admin-affiliates", { page, pageSize, q: q ?? "", role, status }],
    queryFn: () =>
      getAdminAffiliates({
        page,
        limit: pageSize,
        ...(q ? { q } : {}),
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      }),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
    placeholderData: (prev) => prev,
  });
}
