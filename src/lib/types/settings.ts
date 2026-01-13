export interface AffiliateProfile {
  id: string;
  email: string;
  name: string;
  ref_id: string;
  role: string;
  status: string;
  avatar_url: string;
  phone: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  name: string;
}

export interface UpdateBankDetailsInput {
  bank_code: string;
  account_number: string;
  account_name: string;
}

export interface ApiResponse<T = unknown> {
  message?: string;
  error?: string;
  data?: T;
}
