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
import { Banknote, ChevronRight, HandCoins, UserPlus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { useAffiliate } from "@/lib/hooks/use-affiliate";
import {
  getEarningsTrend,
  getProductPerformance,
  getConversionMetrics,
  getFunnel,
  getSignupTrend,
} from "@/lib/api/analytics";
import type { FunnelData } from "@/lib/types/analytics";
import { formatCurrency, formatInteger } from "@/lib/utils/format";
import { LOTTIE_ANALYTICS } from "@/lib/constants/lottie";

type FunnelAccent = "teal" | "violet" | "amber" | "emerald";

const FUNNEL_ACCENT: Record<
  FunnelAccent,
  { iconBg: string; iconText: string; ring: string; bar: string }
> = {
  teal: {
    iconBg: "bg-teal-500/10",
    iconText: "text-teal-300",
    ring: "ring-teal-500/20",
    bar: "bg-teal-500/60",
  },
  violet: {
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-300",
    ring: "ring-violet-500/20",
    bar: "bg-violet-500/60",
  },
  amber: {
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-300",
    ring: "ring-amber-500/20",
    bar: "bg-amber-500/60",
  },
  emerald: {
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-300",
    ring: "ring-emerald-500/20",
    bar: "bg-emerald-500/60",
  },
};

type RangedFunnelStage = {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
  accent: FunnelAccent;
  /** Relative bar width 0–100, scaled against the top stage (signups/earning). */
  width: number;
};

function FunnelConnector({ rate, note }: { rate: number; note: string }) {
  const safe = typeof rate === "number" && !isNaN(rate) ? rate : 0;
  const pct = `${formatInteger(Math.round(safe))}%`;
  return (
    <div className="flex shrink-0 flex-row items-center justify-center gap-1 py-1 sm:flex-col sm:py-0">
      <ChevronRight
        className="h-5 w-5 rotate-90 text-slate-600 sm:rotate-0"
        aria-hidden="true"
      />
      <div className="flex flex-row items-baseline gap-1 sm:flex-col sm:items-center sm:gap-0">
        <span className="text-sm font-semibold text-slate-200">{pct}</span>
        <span className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
          {note}
        </span>
      </div>
    </div>
  );
}

function RangedFunnelCard({ stage }: { stage: RangedFunnelStage }) {
  const palette = FUNNEL_ACCENT[stage.accent];
  const Icon = stage.icon;
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 ring-1 ring-inset ${palette.ring}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${palette.iconBg} ${palette.iconText}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
          {stage.label}
        </p>
      </div>
      <p className="mt-3 truncate text-xl font-semibold text-slate-50 sm:text-2xl">
        {stage.value}
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${palette.bar}`}
          style={{ width: `${Math.max(2, Math.min(100, stage.width))}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{stage.caption}</p>
    </div>
  );
}

function RangedFunnel({ funnel }: { funnel: FunnelData }) {
  const currency = funnel.currency;

  // Drop-off bars: count stages scale against signups, money stages against earning.
  const countMax = Math.max(funnel.signups, 1);
  const moneyMax = Math.max(funnel.earning, 1);

  const stages: RangedFunnelStage[] = [
    {
      label: "Signups",
      value: formatInteger(funnel.signups),
      caption: "Joined via your link",
      icon: UserPlus,
      accent: "teal",
      width: (funnel.signups / countMax) * 100,
    },
    {
      label: "Converted",
      value: formatInteger(funnel.converted),
      caption: "Became paying customers",
      icon: Users,
      accent: "violet",
      width: (funnel.converted / countMax) * 100,
    },
    {
      label: "Earning",
      value: formatCurrency(funnel.earning, currency),
      caption: "Commission credited",
      icon: HandCoins,
      accent: "amber",
      width: (funnel.earning / moneyMax) * 100,
    },
    {
      label: "Paid",
      value: formatCurrency(funnel.paid, currency),
      caption: "Cashed out to you",
      icon: Banknote,
      accent: "emerald",
      width: (funnel.paid / moneyMax) * 100,
    },
  ];

  return (
    <section
      aria-label="Referral funnel for selected range"
      className="bg-slate-900 p-6 rounded-lg border border-slate-800"
    >
      <h2 className="text-xl font-bold text-white mb-6">Referral Funnel</h2>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-stretch">
        <RangedFunnelCard stage={stages[0]} />
        <FunnelConnector rate={funnel.signup_to_converted_rate} note="convert" />
        <RangedFunnelCard stage={stages[1]} />
        <div className="flex shrink-0 items-center justify-center py-1 sm:py-0">
          <ChevronRight
            className="h-5 w-5 rotate-90 text-slate-600 sm:rotate-0"
            aria-hidden="true"
          />
        </div>
        <RangedFunnelCard stage={stages[2]} />
        <FunnelConnector rate={funnel.earning_to_paid_rate} note="paid out" />
        <RangedFunnelCard stage={stages[3]} />
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const { isAuthenticated } = useAffiliate();

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
      getEarningsTrend({
        from_date: dateRange.from,
        to_date: dateRange.to,
        granularity,
      }),
    enabled: isAuthenticated,
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
      getProductPerformance({
        from_date: dateRange.from,
        to_date: dateRange.to,
      }),
    enabled: isAuthenticated,
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
      getConversionMetrics({
        from_date: dateRange.from,
        to_date: dateRange.to,
      }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // Fetch funnel over the selected date range (the dashboard FunnelStrip uses
  // the default window; here we pass the page's range so it stays in sync).
  const {
    data: funnel,
    isLoading: isLoadingFunnel,
    error: funnelError,
  } = useQuery({
    queryKey: ["analytics", "funnel", dateRange],
    queryFn: () =>
      getFunnel({
        from_date: dateRange.from,
        to_date: dateRange.to,
      }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // Fetch signup trend
  const {
    data: signupTrend = [],
    isLoading: isLoadingSignups,
    error: signupsError,
  } = useQuery({
    queryKey: ["analytics", "signup-trend", dateRange, granularity],
    queryFn: () =>
      getSignupTrend({
        from_date: dateRange.from,
        to_date: dateRange.to,
        granularity,
      }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const isLoading =
    isLoadingTrend ||
    isLoadingProducts ||
    isLoadingConversions ||
    isLoadingFunnel ||
    isLoadingSignups;
  const hasError =
    trendError ||
    productsError ||
    conversionsError ||
    funnelError ||
    signupsError;

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400">Failed to load analytics data</p>
          <p className="text-slate-400 text-sm mt-2">
            {
              (trendError ||
                productsError ||
                conversionsError ||
                funnelError ||
                signupsError)?.message
            }
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
              className="w-full bg-slate-800 text-white px-4 py-2 rounded border border-slate-700 focus:border-teal-500 focus:outline-none"
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
              className="w-full bg-slate-800 text-white px-4 py-2 rounded border border-slate-700 focus:border-teal-500 focus:outline-none"
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
              className="w-full bg-slate-800 text-white px-4 py-2 rounded border border-slate-700 focus:border-teal-500 focus:outline-none"
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
          {/* Referral Funnel (selected range) */}
          {funnel && <RangedFunnel funnel={funnel} />}

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
                accent="from-green-500/20 to-teal-500/10"
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
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
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
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEarnings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Signups Trend Chart */}
          <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
            <h2 className="text-xl font-bold text-white mb-6">Signups</h2>
            {!signupTrend || signupTrend.length === 0 ? (
              <EmptyState
                lottieUrl={LOTTIE_ANALYTICS}
                message="No signups for this period"
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={signupTrend}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="period"
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8" }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value) => [
                      Number(value).toLocaleString(),
                      "Signups",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="signup_count"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSignups)"
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
                  <Bar dataKey="total_commissions" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </div>
  );
}
