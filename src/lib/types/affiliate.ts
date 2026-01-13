export type EarningsSummary = {
  affiliate_id: string;
  affiliate_name: string;
  total_earnings: number;
  pending_balance: number;
  paid_balance: number;
  debit_balance: number;
  available_for_payout: number;
  total_referrals: number;
  successful_referrals: number;
  currency: string;
};

export type Payout = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  currency?: string;
};

export type PayoutListResponse = {
  payouts: Payout[];
};

export type CreatePayoutResponse = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
};

export type CommissionProduct = {
  id: string;
  name: string;
};

export type Commission = {
  id: string;
  product: CommissionProduct;
  transaction_id: string;
  payment_number: number;
  payment_amount: number;
  commission_rate: number;
  commission_amount: number;
  currency: string;
  plan_name: string;
  subscription_interval: string;
  status: string;
  paid_at: string;
  credited_at?: string | null;
};

export type CommissionListResponse = {
  commissions: Commission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type AffiliateProductEnrollment = {
  id: string;
  enrolled_at: string;
  status: string;
};

export type AffiliateProduct = {
  id: string;
  product_id: string;
  name: string;
  description: string;
  base_commission_rate: number;
  max_commission_payments?: number | null;
  status: string;
  enrollment?: AffiliateProductEnrollment | null;
};

export type AffiliateProductsResponse = {
  products: AffiliateProduct[];
};

export type ReferralLink = {
  id: string;
  link_url: string;
  ref_id: string;
  campaign_name?: string | null;
  conversions: number;
  created_at: string;
};

export type EnrollmentResponse = {
  enrollment_id: string;
  product_id: string;
  enrolled_at: string;
  referral_link: ReferralLink;
};

export type ReferralLinksListItem = {
  id: string;
  product: {
    id: string;
    name: string;
  };
  link_url: string;
  campaign_name?: string | null;
  conversions: number;
  created_at: string;
};

export type ReferralLinksListResponse = {
  links: ReferralLinksListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export type ValidateRefIDResponse = {
  valid: boolean;
  ref_id: string;
  affiliate?: {
    name: string;
  };
};
