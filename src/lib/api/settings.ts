import type {
  AffiliateProfile,
  UpdateProfileInput,
  UpdateBankDetailsInput,
  ApiResponse,
} from "@/lib/types/settings";
import { apiGet, apiPut } from "@/lib/api/client";

// Note: authToken parameters are kept for backwards compatibility but ignored
// Authentication is now handled automatically by the proxy via Better Auth cookies

export async function getProfile(
  _authToken?: string
): Promise<AffiliateProfile> {
  return apiGet<AffiliateProfile>("/settings/profile");
}

export async function updateProfile(
  input: UpdateProfileInput,
  _authToken?: string
): Promise<ApiResponse> {
  return apiPut<UpdateProfileInput, ApiResponse>(
    "/settings/profile",
    input
  );
}

export async function updateBankDetails(
  input: UpdateBankDetailsInput,
  _authToken?: string
): Promise<ApiResponse> {
  return apiPut<UpdateBankDetailsInput, ApiResponse>(
    "/settings/bank-details",
    input
  );
}
