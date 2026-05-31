export interface EarningsTrendPoint {
  period: string;
  total_earnings: number;
  commission_count: number;
}

export interface ProductPerformance {
  product_id: string;
  product_name: string;
  total_commissions: number;
  commission_count: number;
  average_rate: number;
}

export interface ConversionMetrics {
  total_referrals: number;
  successful_referrals: number;
  conversion_rate: number;
  total_earnings: number;
}

export interface FunnelData {
  currency: string;
  signups: number;
  converted: number;
  /** Total earning in the smallest currency unit (kobo/cents). */
  earning: number;
  /** Total paid out in the smallest currency unit (kobo/cents). */
  paid: number;
  /** Signup → converted conversion rate, as a percentage (0–100). */
  signup_to_converted_rate: number;
  /** Earning → paid-out rate, as a percentage (0–100). */
  earning_to_paid_rate: number;
}

export interface EarningsTrendResponse {
  data: EarningsTrendPoint[];
}

export interface ProductPerformanceResponse {
  data: ProductPerformance[];
}
