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

export interface EarningsTrendResponse {
  data: EarningsTrendPoint[];
}

export interface ProductPerformanceResponse {
  data: ProductPerformance[];
}
