import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";

import { db, pool } from "../server/db";
import { storage } from "../server/storage";
import {
  availability,
  bookings,
  captains,
  charters,
  users,
} from "../shared/schema";

async function main() {
  const uniqueSuffix = randomUUID().slice(0, 8);
  const bookingDate = new Date();
  bookingDate.setUTCHours(0, 0, 0, 0);

  let userId: string | null = null;
  let captainUserId: string | null = null;
  let captainId: number | null = null;
  let charterId: number | null = null;
  let availabilityId: number | null = null;

  try {
    const [user] = await db
      .insert(users)
      .values({
        id: `user_${uniqueSuffix}`,
        email: `user_${uniqueSuffix}@example.com`,
        firstName: "Concurrency",
        lastName: "Tester",
        role: "user",
        password: "test",
      })
      .returning();
    userId = user.id;

    const [captainUser] = await db
      .insert(users)
      .values({
        id: `captain_${uniqueSuffix}`,
        email: `captain_${uniqueSuffix}@example.com`,
        firstName: "Captain",
        lastName: "Concurrent",
        role: "captain",
        password: "test",
      })
      .returning();
    captainUserId = captainUser.id;

    const [captain] = await db
      .insert(captains)
      .values({
        userId: captainUser.id,
        name: "Captain Concurrent",
        bio: "Testing concurrency handling.",
        experience: "Seasoned captain",
        licenseNumber: `LIC-${uniqueSuffix}`,
        location: "Test Harbor",
        verified: true,
      })
      .returning();
    captainId = captain.id;

    const [charter] = await db
      .insert(charters)
      .values({
        captainId: captain.id,
        title: "Concurrency Charter",
        description: "Charter used to test concurrent bookings.",
        location: "Test Harbor",
        targetSpecies: "Test Fish",
        duration: "4 hours",
        maxGuests: 6,
        price: "200.00",
        boatSpecs: "Fast test boat",
        included: "All equipment",
        images: [],
        available: true,
        isListed: true,
      })
      .returning();
    charterId = charter.id;

    const [slot] = await db
      .insert(availability)
      .values({
        charterId: charter.id,
        date: bookingDate,
        slots: 1,
        bookedSlots: 0,
      })
      .returning();
    availabilityId = slot.id;

    async function attemptBooking(label: string) {
      return await db.transaction(async (tx) => {
        const available = await storage.checkAvailability(
          charter.id,
          bookingDate,
          1,
          tx,
        );

        if (!available) {
          throw new Error(`${label}: slot unavailable`);
        }

        const [created] = await tx
          .insert(bookings)
          .values({
            userId: user.id,
            charterId: charter.id,
            tripDate: bookingDate,
            guests: 2,
            totalPrice: "200.00",
            status: "pending",
            message: `${label} booking`,
          })
          .returning({ id: bookings.id });

        const updated = await storage.updateAvailabilitySlots(
          charter.id,
          bookingDate,
          1,
          tx,
        );

        if (!updated) {
          throw new Error(`${label}: failed to decrement availability`);
        }

        return created.id;
      });
    }

    const [firstResult, secondResult] = await Promise.allSettled([
      attemptBooking("First"),
      attemptBooking("Second"),
    ]);

    const formatResult = (
      label: string,
      result: PromiseSettledResult<number>,
    ) => {
      if (result.status === "fulfilled") {
        console.log(`${label} booking succeeded with id ${result.value}`);
      } else {
        const reason =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        console.log(`${label} booking failed -> ${reason}`);
      }
    };

    console.log("=== Concurrent booking test ===");
    formatResult("First", firstResult);
    formatResult("Second", secondResult);

    const [remainingAvailability] = await db
      .select({
        slots: availability.slots,
        bookedSlots: availability.bookedSlots,
      })
      .from(availability)
      .where(eq(availability.id, slot.id));

    console.log("Availability after attempts:", remainingAvailability);

    const resultingBookings = await db
      .select({ id: bookings.id, status: bookings.status })
      .from(bookings)
      .where(eq(bookings.charterId, charter.id));

    console.log(
      `Total bookings stored for charter: ${resultingBookings.length}`,
    );
    console.log("Stored bookings:", resultingBookings);
  } finally {
    try {
      if (charterId !== null) {
        await db.delete(bookings).where(eq(bookings.charterId, charterId));
      }
      if (availabilityId !== null) {
        await db.delete(availability).where(eq(availability.id, availabilityId));
      }
      if (charterId !== null) {
        await db.delete(charters).where(eq(charters.id, charterId));
      }
      if (captainId !== null) {
        await db.delete(captains).where(eq(captains.id, captainId));
      }
      if (captainUserId) {
        await db.delete(users).where(eq(users.id, captainUserId));
      }
      if (userId) {
        await db.delete(users).where(eq(users.id, userId));
      }
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }

    await pool.end();
  }
}

main().catch((err) => {
  console.error("Concurrency test failed", err);
  process.exit(1);
});
