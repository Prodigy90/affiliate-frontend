import { NextResponse } from "next/server";

import type { ReferralEventsResponse } from "@/components/activity-feed/types";

// TODO: when affiliate-system-go ships GET /api/v1/events, replace this stub
// with a real proxy call (Better Auth session -> JWT -> backend GET /events,
// same pattern as the existing /api/proxy/[...path]/route.ts catchall).
// Until then, return an empty list so the dashboard ActivityFeed shows its
// proper empty state instead of fabricated commissions/signups.

export async function GET(): Promise<NextResponse> {
  const body: ReferralEventsResponse = { events: [] };
  return NextResponse.json(body);
}
