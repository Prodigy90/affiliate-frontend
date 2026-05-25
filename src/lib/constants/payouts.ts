// Single source of truth for affiliate payout limits.
// Consumed by the payouts page (naira display) + UpcomingPayoutCard
// (kobo math). Edit MIN_PAYOUT_NGN; the kobo derivative follows.

export const MIN_PAYOUT_NGN = 5000;
export const MIN_PAYOUT_KOBO = MIN_PAYOUT_NGN * 100;
