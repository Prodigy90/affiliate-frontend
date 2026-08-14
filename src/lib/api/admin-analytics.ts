import { apiGet } from "./client";
import type {
  EarningsTrendPoint,
  EarningsTrendResponse,
  ProductPerformance,
  ProductPerformanceResponse,
  SignupTrendPoint,
  SignupTrendResponse,
} from "../types/analytics";

// Program-wide analytics for the admin dashboard. Backed by the admin-gated
// /admin/analytics/* endpoints — trends reuse the per-affiliate point shapes
// (naira main units), overview amounts are kobo like FunnelData.

export interface AdminOverviewAllTime {
  /** Sum of every affiliate's lifetime earnings counter, in kobo. */
  total_earned: number;
  /** Sum of completed payouts, in kobo. */
  total_paid: number;
  pending_payouts_count: number;
  /** Pending + processing payout volume, in kobo. */
  pending_payouts_amount: number;
  /** Affiliate-role accounts (admins excluded). */
  affiliates_total: number;
  /** Affiliates with earnings > 0 (the leaderboard's ranked population). */
  affiliates_earning: number;
  signups_total: number;
}

export interface AdminOverviewWindow {
  signups: number;
  converted: number;
  /** Credited commission volume in the window, in kobo. */
  earned: number;
  /** Completed payout volume requested in the window, in kobo. */
  paid: number;
}

export interface AdminOverview {
  currency: string;
  all_time: AdminOverviewAllTime;
  window: AdminOverviewWindow;
}

export interface AdminLeaderboardEntry {
  rank: number;
  affiliate_id: string;
  name: string;
  email: string;
  /** Kobo. All-time by default; windowed commission sum when from/to given. */
  total_earnings: number;
  /** All-time counters; zero in windowed mode (not meaningful there). */
  total_referrals: number;
  successful_referrals: number;
  currency: string;
}

export interface AdminLeaderboardResult {
  entries: AdminLeaderboardEntry[];
  total_affiliates: number;
}

type RangeParams = {
  from_date?: string;
  to_date?: string;
};

function rangeQuery(params: RangeParams, extra?: Record<string, string>) {
  const queryParams = new URLSearchParams();
  if (params.from_date) queryParams.append("from_date", params.from_date);
  if (params.to_date) queryParams.append("to_date", params.to_date);
  for (const [k, v] of Object.entries(extra ?? {})) {
    queryParams.append(k, v);
  }
  return queryParams.toString();
}

export async function getAdminOverview(
  params: RangeParams
): Promise<AdminOverview> {
  return await apiGet<AdminOverview>(
    `/admin/analytics/overview?${rangeQuery(params)}`
  );
}

export async function getAdminEarningsTrend(params: {
  from_date?: string;
  to_date?: string;
  granularity?: "day" | "week" | "month";
}): Promise<EarningsTrendPoint[]> {
  const query = rangeQuery(
    params,
    params.granularity ? { granularity: params.granularity } : undefined
  );
  const response = await apiGet<EarningsTrendResponse>(
    `/admin/analytics/earnings-trend?${query}`
  );
  return response.data ?? [];
}

export async function getAdminSignupTrend(params: {
  from_date?: string;
  to_date?: string;
  granularity?: "day" | "week" | "month";
}): Promise<SignupTrendPoint[]> {
  const query = rangeQuery(
    params,
    params.granularity ? { granularity: params.granularity } : undefined
  );
  const response = await apiGet<SignupTrendResponse>(
    `/admin/analytics/signup-trend?${query}`
  );
  return response.data ?? [];
}

export async function getAdminProductPerformance(
  params: RangeParams
): Promise<ProductPerformance[]> {
  const response = await apiGet<ProductPerformanceResponse>(
    `/admin/analytics/product-performance?${rangeQuery(params)}`
  );
  return response.data ?? [];
}

export async function getAdminLeaderboard(params: {
  limit?: number;
  from_date?: string;
  to_date?: string;
}): Promise<AdminLeaderboardResult> {
  const query = rangeQuery(
    params,
    params.limit ? { limit: String(params.limit) } : undefined
  );
  const result = await apiGet<AdminLeaderboardResult>(
    `/admin/leaderboard?${query}`
  );
  return {
    entries: result.entries ?? [],
    total_affiliates: result.total_affiliates ?? 0,
  };
}
