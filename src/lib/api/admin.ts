import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import type {
  AdminAffiliateListResponse,
  AdminPayoutListResponse,
  AdminPayoutStatusResponse
} from "@/lib/types/admin";
import type {
  CommissionListResponse,
  EarningsSummary
} from "@/lib/types/affiliate";
import type {
  CreateProductRequest,
  CreateProductResponse,
  ProductDetail,
  ProductListResponse,
  UpdateCommissionConfigRequest,
  UpdateCommissionConfigResponse,
  UpdateProductRequest
} from "@/lib/types/product";

// Note: authToken parameters are kept for backwards compatibility but ignored
// Authentication is now handled automatically by the proxy via Better Auth cookies

export type GetAdminPayoutsParams = {
  affiliateId?: string;
  status?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
  page?: number;
  limit?: number;
};

export async function getAdminPayouts(
  params: GetAdminPayoutsParams = {},
  _authToken?: string
): Promise<AdminPayoutListResponse> {
  const search = new URLSearchParams();

  if (params.affiliateId) {
    search.set("affiliate_id", params.affiliateId);
  }
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.fromDate) {
    search.set("from_date", params.fromDate);
  }
  if (params.toDate) {
    search.set("to_date", params.toDate);
  }
  if (params.page && params.page > 0) {
    search.set("page", String(params.page));
  }
  if (params.limit && params.limit > 0) {
    search.set("limit", String(params.limit));
  }

  const query = search.toString();
  const path = query ? `/admin/payouts?${query}` : "/admin/payouts";

  return apiGet<AdminPayoutListResponse>(path);
}

export async function approvePayout(
  id: string,
  _authToken?: string
): Promise<AdminPayoutStatusResponse> {
  return apiPost<Record<string, never>, AdminPayoutStatusResponse>(
    `/admin/payouts/${id}/approve`,
    {}
  );
}

export async function rejectPayout(
  id: string,
  _authToken?: string,
  reason?: string
): Promise<AdminPayoutStatusResponse> {
  return apiPost<{ reason?: string }, AdminPayoutStatusResponse>(
    `/admin/payouts/${id}/reject`,
    { reason }
  );
}

export type GetAdminAffiliatesParams = {
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export async function getAdminAffiliates(
  params: GetAdminAffiliatesParams = {},
  _authToken?: string
): Promise<AdminAffiliateListResponse> {
  const search = new URLSearchParams();

  if (params.role) {
    search.set("role", params.role);
  }
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.page && params.page > 0) {
    search.set("page", String(params.page));
  }
  if (params.limit && params.limit > 0) {
    search.set("limit", String(params.limit));
  }

  const query = search.toString();
  const path = query ? `/admin/affiliates?${query}` : "/admin/affiliates";

  return apiGet<AdminAffiliateListResponse>(path);
}

export async function getAdminAffiliateEarnings(
  id: string,
  _authToken?: string
): Promise<EarningsSummary> {
  return apiGet<EarningsSummary>(`/admin/affiliates/${id}/earnings`);
}

export type GetAdminAffiliateCommissionsParams = {
  page?: number;
  limit?: number;
  productId?: string;
  status?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string; // YYYY-MM-DD
};

export async function getAdminAffiliateCommissions(
  id: string,
  params: GetAdminAffiliateCommissionsParams = {},
  _authToken?: string
): Promise<CommissionListResponse> {
  const search = new URLSearchParams();

  if (params.page && params.page > 0) {
    search.set("page", String(params.page));
  }
  if (params.limit && params.limit > 0) {
    search.set("limit", String(params.limit));
  }
  if (params.productId) {
    search.set("product_id", params.productId);
  }
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.fromDate) {
    search.set("from_date", params.fromDate);
  }
  if (params.toDate) {
    search.set("to_date", params.toDate);
  }

  const query = search.toString();
  const path = query
    ? `/admin/affiliates/${id}/commissions?${query}`
    : `/admin/affiliates/${id}/commissions`;

  return apiGet<CommissionListResponse>(path);
}

export async function getProducts(
  _authToken?: string
): Promise<ProductListResponse> {
  return apiGet<ProductListResponse>("/products");
}

export async function getProductById(
  id: string,
  _authToken?: string
): Promise<ProductDetail> {
  return apiGet<ProductDetail>(`/products/${id}`);
}

export async function createProduct(
  payload: CreateProductRequest,
  _authToken?: string
): Promise<CreateProductResponse> {
  return apiPost<CreateProductRequest, CreateProductResponse>(
    "/admin/products",
    payload
  );
}

export async function updateProduct(
  id: string,
  payload: UpdateProductRequest,
  _authToken?: string
): Promise<ProductDetail> {
  return apiPut<UpdateProductRequest, ProductDetail>(
    `/admin/products/${id}`,
    payload
  );
}

export async function updateProductCommissionConfig(
  id: string,
  payload: UpdateCommissionConfigRequest,
  _authToken?: string
): Promise<UpdateCommissionConfigResponse> {
  return apiPut<UpdateCommissionConfigRequest, UpdateCommissionConfigResponse>(
    `/admin/products/${id}/commission-config`,
    payload
  );
}
