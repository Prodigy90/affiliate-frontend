export type AdminPayout = {
  id: string;
  affiliate_id: string;
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
