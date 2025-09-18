import { db } from "./db";
import {
  subscriptions as subscriptionsTable,
  captains as captainsTable,
  charters as chartersTable,
} from "@shared/schema";
import { and, eq, inArray, lt, or, sql } from "drizzle-orm";

const DEFAULT_INTERVAL_MS = 1000 * 60 * 60; // 1 hour
let maintenanceTimer: NodeJS.Timeout | undefined;

interface MaintenanceResult {
  processedSubscriptions: number;
  affectedCaptains: number;
  chartersUnlisted: number;
}

function logMaintenance(message: string, ...optionalParams: unknown[]) {
  console.log(`[subscription-maintenance] ${message}`, ...optionalParams);
}

export async function runSubscriptionMaintenance(
  referenceDate: Date = new Date(),
): Promise<MaintenanceResult> {
  const now = referenceDate;

  const subscriptionsNeedingDemotion = await db
    .select({
      id: subscriptionsTable.id,
      userId: subscriptionsTable.userId,
      status: subscriptionsTable.status,
    })
    .from(subscriptionsTable)
    .where(
      or(
        eq(subscriptionsTable.status, "past_due"),
        and(
          eq(subscriptionsTable.status, "pending"),
          or(
            lt(subscriptionsTable.trialEndDate, now),
            sql`${subscriptionsTable.trialEndDate} IS NULL`,
          ),
        ),
      ),
    );

  if (subscriptionsNeedingDemotion.length === 0) {
    return {
      processedSubscriptions: 0,
      affectedCaptains: 0,
      chartersUnlisted: 0,
    };
  }

  const userIds = Array.from(
    new Set(subscriptionsNeedingDemotion.map((subscription) => subscription.userId)),
  );

  const captains = await db
    .select({ id: captainsTable.id })
    .from(captainsTable)
    .where(inArray(captainsTable.userId, userIds));

  if (captains.length === 0) {
    return {
      processedSubscriptions: subscriptionsNeedingDemotion.length,
      affectedCaptains: 0,
      chartersUnlisted: 0,
    };
  }

  const captainIds = captains.map((captain) => captain.id);

  const updatedCharters = await db
    .update(chartersTable)
    .set({ isListed: false })
    .where(inArray(chartersTable.captainId, captainIds))
    .returning({ id: chartersTable.id });

  const result: MaintenanceResult = {
    processedSubscriptions: subscriptionsNeedingDemotion.length,
    affectedCaptains: captainIds.length,
    chartersUnlisted: updatedCharters.length,
  };

  if (result.chartersUnlisted > 0) {
    logMaintenance(
      `Unlisted ${result.chartersUnlisted} charters for ${result.affectedCaptains} captain(s)`,
    );
  }

  return result;
}

export function scheduleSubscriptionMaintenance() {
  if (process.env.SUBSCRIPTION_MAINTENANCE_DISABLED === "1") {
    logMaintenance("Scheduler disabled via SUBSCRIPTION_MAINTENANCE_DISABLED");
    return;
  }

  if (maintenanceTimer) {
    return;
  }

  const requestedInterval = Number(process.env.SUBSCRIPTION_MAINTENANCE_INTERVAL_MS);
  const intervalMs =
    Number.isFinite(requestedInterval) && requestedInterval > 0
      ? requestedInterval
      : DEFAULT_INTERVAL_MS;

  const run = () => {
    runSubscriptionMaintenance().catch((error) => {
      console.error("[subscription-maintenance] Failed to run maintenance job", error);
    });
  };

  run();
  maintenanceTimer = setInterval(run, intervalMs);
  logMaintenance(`Scheduler started with interval ${intervalMs}ms`);
}
