import { apiGet } from "./client";
import type {
  ConversionMetrics,
  EarningsTrendPoint,
  EarningsTrendResponse,
  ProductPerformance,
  ProductPerformanceResponse,
} from "../types/analytics";

export async function getEarningsTrend(
  authToken: string,
  params: {
    from_date?: string;
    to_date?: string;
    granularity?: "day" | "week" | "month";
  }
): Promise<EarningsTrendPoint[]> {
  const queryParams = new URLSearchParams();
  if (params.from_date) queryParams.append("from_date", params.from_date);
  if (params.to_date) queryParams.append("to_date", params.to_date);
  if (params.granularity) queryParams.append("granularity", params.granularity);

  const response = await apiGet<EarningsTrendResponse>(
    `/analytics/earnings-trend?${queryParams.toString()}`,
    authToken
  );
  return response.data;
}

export async function getProductPerformance(
  authToken: string,
  params: {
    from_date?: string;
    to_date?: string;
  }
): Promise<ProductPerformance[]> {
  const queryParams = new URLSearchParams();
  if (params.from_date) queryParams.append("from_date", params.from_date);
  if (params.to_date) queryParams.append("to_date", params.to_date);

  const response = await apiGet<ProductPerformanceResponse>(
    `/analytics/product-performance?${queryParams.toString()}`,
    authToken
  );
  return response.data;
}

export async function getConversionMetrics(
  authToken: string,
  params: {
    from_date?: string;
    to_date?: string;
  }
): Promise<ConversionMetrics> {
  const queryParams = new URLSearchParams();
  if (params.from_date) queryParams.append("from_date", params.from_date);
  if (params.to_date) queryParams.append("to_date", params.to_date);

  return await apiGet<ConversionMetrics>(
    `/analytics/conversion-metrics?${queryParams.toString()}`,
    authToken
  );
}
