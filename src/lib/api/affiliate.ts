import type {
  CommissionListResponse,
  CreatePayoutResponse,
  EarningsSummary,
  Payout,
  PayoutListResponse,
  AffiliateProductsResponse,
  EnrollmentResponse,
  ReferralLink,
  ReferralLinksListResponse,
  ValidateRefIDResponse
} from "@/lib/types/affiliate";
import { apiGet, apiPost } from "@/lib/api/client";

// Note: authToken parameters are kept for backwards compatibility but ignored
// Authentication is now handled automatically by the proxy via Better Auth cookies

export async function getEarnings(_authToken?: string): Promise<EarningsSummary> {
  return apiGet<EarningsSummary>("/earnings");
}

export async function getPayouts(_authToken?: string): Promise<Payout[]> {
  const res = await apiGet<PayoutListResponse>("/payouts");
  return res.payouts;
}

export async function requestPayout(
  amount: number,
  _authToken?: string
): Promise<CreatePayoutResponse> {
  return apiPost<{ amount: number }, CreatePayoutResponse>("/payouts", {
    amount
  });
}

export async function getCommissions(
  _authToken?: string
): Promise<CommissionListResponse> {
  return apiGet<CommissionListResponse>("/commissions");
}

export async function getAffiliateProducts(
  _authToken?: string
): Promise<AffiliateProductsResponse> {
  return apiGet<AffiliateProductsResponse>("/affiliate/products");
}

export async function enrollInProduct(
  productId: string,
  _authToken?: string
): Promise<EnrollmentResponse> {
  return apiPost<Record<string, never>, EnrollmentResponse>(
    `/products/${productId}/enroll`,
    {} as Record<string, never>
  );
}

export async function getReferralLinks(
  _authTokenOrParams?: string | { page?: number; limit?: number; product_id?: string },
  params?: { page?: number; limit?: number; product_id?: string }
): Promise<ReferralLinksListResponse> {
  // Handle both old signature (authToken, params) and new signature (params only)
  const actualParams = typeof _authTokenOrParams === "object" ? _authTokenOrParams : params;
  const search = new URLSearchParams();
  if (actualParams?.page) search.set("page", String(actualParams.page));
  if (actualParams?.limit) search.set("limit", String(actualParams.limit));
  if (actualParams?.product_id) search.set("product_id", actualParams.product_id);
  const qs = search.toString();
  const path = qs ? `/links?${qs}` : "/links";
  return apiGet<ReferralLinksListResponse>(path);
}

export async function createReferralLink(
  input: { product_id: string; campaign_name?: string },
  _authToken?: string
): Promise<ReferralLink> {
  return apiPost<typeof input, ReferralLink>("/links", input);
}

export async function validateRefID(
  refId: string
): Promise<ValidateRefIDResponse> {
  return apiGet<ValidateRefIDResponse>(
    `/links/${encodeURIComponent(refId)}/validate`
  );
}
