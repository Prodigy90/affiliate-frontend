"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { useAffiliate } from "@/lib/hooks/use-affiliate";
import {
  getEarningsTrend,
  getProductPerformance,
  getConversionMetrics,
} from "@/lib/api/analytics";
import { LOTTIE_ANALYTICS } from "@/lib/constants/lottie";

export default function AnalyticsPage() {
  const { backendToken } = useAffiliate();

  // Date range state (default to last 30 days)
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return {
      from: thirtyDaysAgo.toISOString().split("T")[0],
      to: now.toISOString().split("T")[0],
    };
  });

  const [granularity, setGranularity] = useState<"day" | "week" | "month">(
    "day"
  );

  // Fetch earnings trend
  const {
    data: earningsTrend = [],
    isLoading: isLoadingTrend,
    error: trendError,
  } = useQuery({
    queryKey: ["analytics", "earnings-trend", dateRange, granularity],
    queryFn: () =>
      getEarningsTrend(backendToken!, {
        from_date: dateRange.from,
        to_date: dateRange.to,
        granularity,
      }),
    enabled: !!backendToken,
    staleTime: 30_000,
  });

  // Fetch product performance
  const {
    data: productPerformance = [],
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["analytics", "product-performance", dateRange],
    queryFn: () =>
      getProductPerformance(backendToken!, {
        from_date: dateRange.from,
        to_date: dateRange.to,
      }),
    enabled: !!backendToken,
    staleTime: 30_000,
  });

  // Fetch conversion metrics
  const {
    data: conversionMetrics,
    isLoading: isLoadingConversions,
    error: conversionsError,
  } = useQuery({
    queryKey: ["analytics", "conversion-metrics", dateRange],
    queryFn: () =>
      getConversionMetrics(backendToken!, {
        from_date: dateRange.from,
        to_date: dateRange.to,
      }),
    enabled: !!backendToken,
    staleTime: 30_000,
  });

  const isLoading = isLoadingTrend || isLoadingProducts || isLoadingConversions;
  const hasError = trendError || productsError || conversionsError;

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400">Failed to load analytics data</p>
          <p className="text-slate-400 text-sm mt-2">
            {(trendError || productsError || conversionsError)?.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics</h1>
        <p className="text-slate-400 mt-2">
          Track your performance and earnings over time
        </p>
      </div>

      {/* Date Range Filters */}
      <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-50">
            <label className="block text-sm text-slate-400 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, from: e.target.value }))
              }
              className="w-full bg-slate-800 text-white px-4 py-2 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-50">
            <label className="block text-sm text-slate-400 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, to: e.target.value }))
              }
              className="w-full bg-slate-800 text-white px-4 py-2 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex-1 min-w-50">
            <label className="block text-sm text-slate-400 mb-2">
              Granularity
            </label>
            <select
              value={granularity}
              onChange={(e) =>
                setGranularity(e.target.value as "day" | "week" | "month")
              }
              className="w-full bg-slate-800 text-white px-4 py-2 rounded border border-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-100">
          <div className="text-slate-400">Loading analytics...</div>
        </div>
      ) : (
        <>
          {/* Conversion Metrics */}
          {conversionMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Referrals"
                value={conversionMetrics.total_referrals.toString()}
                subtitle="All time clicks"
              />
              <StatCard
                title="Successful Referrals"
                value={conversionMetrics.successful_referrals.toString()}
                subtitle="Converted to sales"
                accent="from-green-500/20 to-emerald-500/10"
              />
              <StatCard
                title="Conversion Rate"
                value={`${conversionMetrics.conversion_rate.toFixed(1)}%`}
                subtitle="Success rate"
                accent="from-blue-500/20 to-cyan-500/10"
              />
              <StatCard
                title="Total Earnings"
                value={`₦${conversionMetrics.total_earnings.toLocaleString()}`}
                subtitle="In selected period"
              />
            </div>
          )}

          {/* Earnings Trend Chart */}
          <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">
              Earnings Trend
            </h2>
            {!earningsTrend || earningsTrend.length === 0 ? (
              <EmptyState
                lottieUrl={LOTTIE_ANALYTICS}
                message="No earnings data for this period"
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={earningsTrend}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="period"
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8" }}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value) => [
                      `₦${Number(value).toLocaleString()}`,
                      "Earnings",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_earnings"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEarnings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Product Performance Chart */}
          <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">
              Product Performance
            </h2>
            {!productPerformance || productPerformance.length === 0 ? (
              <EmptyState
                lottieUrl={LOTTIE_ANALYTICS}
                message="No product data for this period"
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="product_name"
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8" }}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value) => [
                      `₦${Number(value).toLocaleString()}`,
                      "Commissions",
                    ]}
                  />
                  <Bar dataKey="total_commissions" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
