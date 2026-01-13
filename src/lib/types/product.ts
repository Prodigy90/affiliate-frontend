export type ProductSummary = {
  id: string;
  product_id: string;
  name: string;
  description: string;
  base_commission_rate: number;
  max_commission_payments: number | null;
  status: string;
};

export type ProductListResponse = {
  products: ProductSummary[];
};

export type ProductCommissionConfig = {
  default_rate: number;
  max_payments: number;
  recurring_rate: number;
  one_time_rate: number;
  lifetime_commission_enabled?: boolean;
  min_payout_amount?: number;
};

export type ProductDetail = {
  id: string;
  product_id: string;
  name: string;
  description: string;
  base_url: string;
  signup_path: string;
  base_commission_rate: number;
  max_commission_payments: number | null;
  status: string;
  commission_config?: ProductCommissionConfig | null;
};

export type CreateProductRequest = {
  product_id: string;
  name: string;
  description: string;
  base_url: string;
  base_commission_rate: number;
  max_commission_payments?: number | null;
};

export type CreateProductResponse = ProductDetail & {
  api_key: string;
};

export type UpdateCommissionConfigRequest = {
  default_rate: number;
  max_payments: number;
  recurring_rate: number;
  one_time_rate: number;
  lifetime_commission_enabled?: boolean;
  min_payout_amount?: number;
};

export type UpdateCommissionConfigResponse = ProductDetail;

