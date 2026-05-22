import { NextResponse } from "next/server";

import type {
  ReferralEvent,
  ReferralEventsResponse
} from "@/components/activity-feed/types";

// TODO: when affiliate-system-go ships GET /api/v1/events, swap this mock for
// a real proxy call (same pattern as the existing /api/proxy/[...path]/route.ts
// catchall — Better Auth session -> JWT -> backend GET /events). Until then,
// this route returns a fixed mock payload so the ActivityFeed UI renders
// against representative data spanning all three event types.

const now = Date.now();
const HOUR_MS = 60 * 60 * 1000;

const MOCK_EVENTS: ReferralEvent[] = [
  {
    id: "evt_mock_001",
    type: "signup",
    ref_id: "mock_ref_a",
    occurred_at: new Date(now - 2 * HOUR_MS).toISOString()
  },
  {
    id: "evt_mock_002",
    type: "activation",
    ref_id: "mock_ref_a",
    occurred_at: new Date(now - 6 * HOUR_MS).toISOString(),
    product_name: "WASBOT Premium"
  },
  {
    id: "evt_mock_003",
    type: "commission",
    ref_id: "mock_ref_b",
    occurred_at: new Date(now - 14 * HOUR_MS).toISOString(),
    amount_kobo: 200_000, // ₦2,000
    product_name: "WASBOT Premium"
  },
  {
    id: "evt_mock_004",
    type: "signup",
    ref_id: "mock_ref_b",
    occurred_at: new Date(now - 28 * HOUR_MS).toISOString()
  },
  {
    id: "evt_mock_005",
    type: "commission",
    ref_id: "mock_ref_c",
    occurred_at: new Date(now - 44 * HOUR_MS).toISOString(),
    amount_kobo: 500_000, // ₦5,000
    product_name: "WASBOT Pro"
  }
];

export async function GET(): Promise<NextResponse> {
  const body: ReferralEventsResponse = { events: MOCK_EVENTS };
  return NextResponse.json(body);
}
