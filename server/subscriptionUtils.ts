export const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing"] as const;
export type ActiveSubscriptionStatus = typeof ACTIVE_SUBSCRIPTION_STATUSES[number];

export function isActiveSubscriptionStatus(
  status: string | null | undefined,
): status is ActiveSubscriptionStatus {
  return status != null && (ACTIVE_SUBSCRIPTION_STATUSES as readonly string[]).includes(status);
}

export const PENDING_SUBSCRIPTION_GRACE_PERIOD_MS = 1000 * 60 * 60 * 24; // 24 hours
