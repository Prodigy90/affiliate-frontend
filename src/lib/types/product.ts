export type ProductSummary = {
  id: string;
  product_id: string;
  name: string;
  description: string;
  /** Legacy seed value — NOT enforced. Prefer commission_rate when present. */
  base_commission_rate: number;
  /** Legacy seed value — NOT enforced. */
  max_commission_payments: number | null;
  status: string;
  /**
   * The enforced commission_configs.default_rate. Absent when the product has
   * no commission config (its commissions are dropped by the worker).
   */
  commission_rate?: number;
  /**
   * The enforced payment cap. Only meaningful when commission_rate is
   * present; absent there means unlimited payments per referral.
   */
  commission_max_payments?: number | null;
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
  signup_path?: string;
  base_commission_rate: number;
  max_commission_payments?: number | null;
};

export type UpdateProductRequest = {
  name: string;
  description: string;
  base_url: string;
  signup_path?: string;
  base_commission_rate: number;
  max_commission_payments?: number | null;
  status?: string;
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

