export type AdminPayout = {
  id: string;
  affiliate_id: string;
  affiliate_name: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export type AdminPayoutListResponse = {
  payouts: AdminPayout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type AdminPayoutStatusResponse = {
  status: string;
};

export type AdminAffiliate = {
  id: string;
  email: string;
  name: string;
  ref_id: string;
  role: string;
  status: string;
  avatar_url?: string | null;
  created_at: string;
  last_login_at?: string | null;
};

export type AdminAffiliateListResponse = {
  affiliates: AdminAffiliate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

/**
 * Per-(affiliate, product) commission override. All rate/config fields are
 * nullable — null means "no override for this field, fall back to the
 * product's default commission config."
 */
export type AffiliateCustomRate = {
  product_id: string;
  product_name: string;
  custom_rate: number | null;
  custom_max_payments: number | null;
  custom_recurring_rate: number | null;
  custom_one_time_rate: number | null;
  custom_lifetime_enabled: boolean | null;
  custom_lifetime_rate: number | null;
  notes: string | null;
  updated_at: string;
};

export type AffiliateCustomRateListResponse = {
  data: AffiliateCustomRate[];
};

/** Body for PUT /admin/affiliates/:id/custom-rates/:productId. */
export type UpdateAffiliateCustomRateRequest = {
  custom_rate?: number | null;
  custom_max_payments?: number | null;
  custom_recurring_rate?: number | null;
  custom_one_time_rate?: number | null;
  custom_lifetime_enabled?: boolean | null;
  custom_lifetime_rate?: number | null;
  notes?: string | null;
};
