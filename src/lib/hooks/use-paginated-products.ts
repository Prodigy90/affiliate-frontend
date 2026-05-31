"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getProducts } from "@/lib/api/admin";
import type { ProductListResponse, ProductSummary } from "@/lib/types/product";
import { STALE_TIME_DEFAULT } from "@/lib/constants/query";
import type { PageSize } from "@/components/admin/PaginationBar";

export type UsePaginatedAdminProductsParams = {
  page: number;
  pageSize: PageSize;
  q?: string;
  enabled?: boolean;
};

export type UsePaginatedAdminProductsResult = {
  /** The slice of products visible for the current page (post-search). */
  items: ProductSummary[];
  /** Total products after search filter (used by the paginator). */
  total: number;
  /** Total products without any filter — for the "all products" badge. */
  totalUnfiltered: number;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

/**
 * Fetches admin products with pagination + search applied client-side.
 *
 * Backend pagination: NOT SUPPORTED — `GET /products` returns the full list
 * with no `page` / `limit` / `q` params. The product list is short (one row
 * per integrated product) so client-side slicing is a deliberate choice.
 * When the backend grows pagination, replace this with a server-paginated
 * hook mirroring `use-paginated-affiliates`.
 */
export function usePaginatedAdminProducts({
  page,
  pageSize,
  q,
  enabled = true,
}: UsePaginatedAdminProductsParams): UsePaginatedAdminProductsResult {
  const { data, isLoading, isError, refetch } = useQuery<ProductListResponse, Error>({
    queryKey: ["admin-products"],
    queryFn: () => getProducts(),
    enabled,
    staleTime: STALE_TIME_DEFAULT,
  });

  const allProducts = useMemo(() => data?.products ?? [], [data?.products]);

  const filtered = useMemo(() => {
    if (!q) return allProducts;
    const needle = q.trim().toLowerCase();
    if (!needle) return allProducts;
    return allProducts.filter((p) => {
      return (
        p.name.toLowerCase().includes(needle) ||
        p.product_id.toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle) ||
        (p.status ?? "").toLowerCase().includes(needle)
      );
    });
  }, [allProducts, q]);

  const items = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return {
    items,
    total: filtered.length,
    totalUnfiltered: allProducts.length,
    isLoading,
    isError,
    refetch: () => {
      refetch();
    },
  };
}
