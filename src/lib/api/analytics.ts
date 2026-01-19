import { apiGet } from "./client";
import type {
  ConversionMetrics,
  EarningsTrendPoint,
  EarningsTrendResponse,
  ProductPerformance,
  ProductPerformanceResponse,
} from "../types/analytics";

// Note: authToken parameters removed - authentication is now handled
// automatically by the proxy via Better Auth cookies

export async function getEarningsTrend(params: {
  from_date?: string;
  to_date?: string;
  granularity?: "day" | "week" | "month";
}): Promise<EarningsTrendPoint[]> {
  const queryParams = new URLSearchParams();
  if (params.from_date) queryParams.append("from_date", params.from_date);
  if (params.to_date) queryParams.append("to_date", params.to_date);
  if (params.granularity) queryParams.append("granularity", params.granularity);

  const response = await apiGet<EarningsTrendResponse>(
    `/analytics/earnings-trend?${queryParams.toString()}`
  );
  return response.data;
}

export async function getProductPerformance(params: {
  from_date?: string;
  to_date?: string;
}): Promise<ProductPerformance[]> {
  const queryParams = new URLSearchParams();
  if (params.from_date) queryParams.append("from_date", params.from_date);
  if (params.to_date) queryParams.append("to_date", params.to_date);

  const response = await apiGet<ProductPerformanceResponse>(
    `/analytics/product-performance?${queryParams.toString()}`
  );
  return response.data;
}

export async function getConversionMetrics(params: {
  from_date?: string;
  to_date?: string;
}): Promise<ConversionMetrics> {
  const queryParams = new URLSearchParams();
  if (params.from_date) queryParams.append("from_date", params.from_date);
  if (params.to_date) queryParams.append("to_date", params.to_date);

  return await apiGet<ConversionMetrics>(
    `/analytics/conversion-metrics?${queryParams.toString()}`
  );
}
