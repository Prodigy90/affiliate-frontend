export type ReferralEventType = "signup" | "activation" | "commission";

export interface ReferralEvent {
  id: string;
  type: ReferralEventType;
  ref_id: string;
  occurred_at: string; // ISO8601
  amount_kobo?: number; // present only for commission events
  product_name?: string; // e.g. "WASBOT Premium"
}

export interface ReferralEventsResponse {
  events: ReferralEvent[];
  next_cursor?: string;
}
