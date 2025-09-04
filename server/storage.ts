import {
  users,
  captains,
  charters,
  bookings,
  messages,
  reviews,
  availability,
  type User,
  type Captain,
  type Charter,
  type Booking,
  type Message,
  type Review,
  type Availability,
  type UpsertUser,
  type InsertCaptain,
  type InsertCharter,
  type InsertBooking,
  type InsertMessage,
  type InsertReview,
  type InsertAvailability,
  type CharterWithCaptain,
  type MessageThread,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, ilike, avg, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Captains
  getCaptain(id: number): Promise<Captain | undefined>;
  getCaptainByUserId(userId: string): Promise<Captain | undefined>;
  createCaptain(captain: InsertCaptain): Promise<Captain>;
  getAllCaptains(): Promise<Captain[]>;

  // Charters
  getCharter(id: number): Promise<Charter | undefined>;
  getCharterWithCaptain(id: number): Promise<CharterWithCaptain | undefined>;
  getChartersByCaptain(captainId: number): Promise<Charter[]>;
  searchCharters(filters: { location?: string; targetSpecies?: string; duration?: string; lat?: number; lng?: number; distance?: number }): Promise<CharterWithCaptain[]>;
  getAllCharters(): Promise<CharterWithCaptain[]>;
  createCharter(charter: InsertCharter): Promise<Charter>;
  updateCharter(id: number, updates: Partial<Charter>): Promise<Charter | undefined>;

  // Bookings
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingsByUser(userId: string): Promise<Booking[]>;
  getBookingsByCaptain(captainId: number): Promise<Booking[]>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;

  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getMessageThread(userId1: string, userId2: string, charterId?: number): Promise<Message[]>;
  getMessageThreads(userId: string): Promise<MessageThread[]>;
  markMessageAsRead(id: number): Promise<void>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByCaptain(captainId: number): Promise<Review[]>;
  updateCaptainRating(captainId: number): Promise<void>;

  // Availability
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  getAvailability(charterId: number, month: string): Promise<Availability[]>;
  updateAvailabilitySlots(charterId: number, date: Date, slotsToBook: number): Promise<boolean>;
  checkAvailability(charterId: number, date: Date, requiredSlots: number): Promise<boolean>;

  // Captain dashboard
  getCaptainStats(captainId: number): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    responseRate: number;
    upcomingTrips: number;
    newMessages: number;
  }>;
  getCaptainRecentBookings(captainId: number): Promise<any[]>;
  getCaptainMessageThreads(captainId: number): Promise<any[]>;
  getCaptainEarnings(captainId: number): Promise<{
    totalEarnings: number;
    thisMonth: number;
    pendingPayouts: number;
  }>;

  // Admin operations
  getAllCaptainsWithUsers(): Promise<(Captain & { user: User })[]>;
  updateCaptainVerification(captainId: number, verified: boolean): Promise<Captain | undefined>;
  getAllChartersForAdmin(): Promise<Charter[]>;
  updateCharterVisibility(charterId: number, isListed: boolean): Promise<Charter | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Captain operations
  async getCaptain(id: number): Promise<Captain | undefined> {
    const [captain] = await db.select().from(captains).where(eq(captains.id, id));
    return captain;
  }

  async getCaptainByUserId(userId: string): Promise<Captain | undefined> {
    const [captain] = await db.select().from(captains).where(eq(captains.userId, userId));
    return captain;
  }

  async createCaptain(insertCaptain: InsertCaptain): Promise<Captain> {
    const [captain] = await db
      .insert(captains)
      .values(insertCaptain)
      .returning();
    return captain;
  }

  async getAllCaptains(): Promise<Captain[]> {
    return await db.select().from(captains);
  }

  // Charter operations
  async getCharter(id: number): Promise<Charter | undefined> {
    const [charter] = await db.select().from(charters).where(eq(charters.id, id));
    return charter;
  }

  async getCharterWithCaptain(id: number): Promise<CharterWithCaptain | undefined> {
    const result = await db
      .select()
      .from(charters)
      .leftJoin(captains, eq(charters.captainId, captains.id))
      .leftJoin(users, eq(captains.userId, users.id))
      .where(eq(charters.id, id));

    if (!result[0] || !result[0].captains || !result[0].users) {
      return undefined;
    }

    const reviewResults = await db
      .select()
      .from(reviews)
      .where(eq(reviews.captainId, result[0].captains.id));

    return {
      ...result[0].charters,
      captain: {
        ...result[0].captains,
        user: result[0].users,
      },
      reviews: reviewResults,
    };
  }

  async getChartersByCaptain(captainId: number): Promise<Charter[]> {
    return await db.select().from(charters).where(eq(charters.captainId, captainId));
  }

  async searchCharters(filters: { location?: string; targetSpecies?: string; duration?: string; lat?: number; lng?: number; distance?: number }): Promise<CharterWithCaptain[]> {
    const conditions = [
      eq(charters.available, true),
      eq(charters.isListed, true),
      eq(captains.verified, true)
    ];
    
    if (filters.location) {
      conditions.push(ilike(charters.location, `%${filters.location}%`));
    }
    if (filters.targetSpecies) {
      conditions.push(ilike(charters.targetSpecies, `%${filters.targetSpecies}%`));
    }
    if (filters.duration) {
      conditions.push(eq(charters.duration, filters.duration));
    }
    
    // Geographic search using bounding box for simplicity
    if (filters.lat && filters.lng && filters.distance) {
      const latDelta = filters.distance / 69; // Rough conversion: 1 degree ≈ 69 miles
      const lngDelta = filters.distance / (69 * Math.cos(filters.lat * Math.PI / 180));
      
      conditions.push(
        and(
          gte(charters.lat, (filters.lat - latDelta).toString()),
          lte(charters.lat, (filters.lat + latDelta).toString()),
          gte(charters.lng, (filters.lng - lngDelta).toString()),
          lte(charters.lng, (filters.lng + lngDelta).toString())
        )
      );
    }

    const results = await db
      .select()
      .from(charters)
      .leftJoin(captains, eq(charters.captainId, captains.id))
      .leftJoin(users, eq(captains.userId, users.id))
      .where(and(...conditions));

    const chartersWithReviews = await Promise.all(
      results.map(async (result) => {
        if (!result.captains || !result.users) {
          return null;
        }

        const reviewResults = await db
          .select()
          .from(reviews)
          .where(eq(reviews.captainId, result.captains.id));

        return {
          ...result.charters,
          captain: {
            ...result.captains,
            user: result.users,
          },
          reviews: reviewResults,
        };
      })
    );

    return chartersWithReviews.filter((charter): charter is CharterWithCaptain => charter !== null);
  }

  async getAllCharters(): Promise<CharterWithCaptain[]> {
    const results = await db
      .select()
      .from(charters)
      .leftJoin(captains, eq(charters.captainId, captains.id))
      .leftJoin(users, eq(captains.userId, users.id));

    const chartersWithReviews = await Promise.all(
      results.map(async (result) => {
        if (!result.captains || !result.users) {
          return null;
        }

        const reviewResults = await db
          .select()
          .from(reviews)
          .where(eq(reviews.captainId, result.captains.id));

        return {
          ...result.charters,
          captain: {
            ...result.captains,
            user: result.users,
          },
          reviews: reviewResults,
        };
      })
    );

    return chartersWithReviews.filter((charter): charter is CharterWithCaptain => charter !== null);
  }

  async createCharter(insertCharter: InsertCharter): Promise<Charter> {
    const [charter] = await db
      .insert(charters)
      .values(insertCharter)
      .returning();
    return charter;
  }

  async updateCharter(id: number, updates: Partial<Charter>): Promise<Charter | undefined> {
    const [charter] = await db
      .update(charters)
      .set(updates)
      .where(eq(charters.id, id))
      .returning();
    return charter;
  }

  // Booking operations
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getBookingsByCaptain(captainId: number): Promise<Booking[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(charters, eq(bookings.charterId, charters.id))
      .where(eq(charters.captainId, captainId));

    return results.map(result => result.bookings);
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  // Message operations
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getMessageThread(userId1: string, userId2: string, charterId?: number): Promise<Message[]> {
    const conditions = [
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    ];

    if (charterId) {
      conditions.push(eq(messages.charterId, charterId));
    }

    return await db
      .select()
      .from(messages)
      .where(and(...conditions))
      .orderBy(messages.createdAt);
  }

  async getMessageThreads(userId: string): Promise<MessageThread[]> {
    const messageResults = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(messages.createdAt);

    const threadsMap = new Map<string, { participant: User; lastMessage: Message; unreadCount: number }>();

    for (const message of messageResults) {
      const participantId = message.senderId === userId ? message.receiverId : message.senderId;
      
      const [participant] = await db
        .select()
        .from(users)
        .where(eq(users.id, participantId));

      if (!participant) continue;

      if (!threadsMap.has(participantId) || message.createdAt > threadsMap.get(participantId)!.lastMessage.createdAt) {
        const unreadCount = await db
          .select({ count: messages.id })
          .from(messages)
          .where(
            and(
              eq(messages.senderId, participantId),
              eq(messages.receiverId, userId),
              eq(messages.read, false)
            )
          );

        threadsMap.set(participantId, {
          participant,
          lastMessage: message,
          unreadCount: unreadCount.length,
        });
      }
    }

    return Array.from(threadsMap.values());
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id));
  }

  // Review operations
  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();

    // Update captain rating
    await this.updateCaptainRating(insertReview.captainId);

    return review;
  }

  async getReviewsByCaptain(captainId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.captainId, captainId));
  }

  async updateCaptainRating(captainId: number): Promise<void> {
    const reviewResults = await db
      .select({ rating: reviews.rating })
      .from(reviews)
      .where(eq(reviews.captainId, captainId));

    if (reviewResults.length === 0) return;

    const avgRating = reviewResults.reduce((sum, review) => sum + review.rating, 0) / reviewResults.length;

    await db
      .update(captains)
      .set({
        rating: avgRating.toFixed(2),
        reviewCount: reviewResults.length,
      })
      .where(eq(captains.id, captainId));
  }

  // Availability operations
  async createAvailability(availabilityData: InsertAvailability): Promise<Availability> {
    const [availabilityRecord] = await db
      .insert(availability)
      .values(availabilityData)
      .returning();
    return availabilityRecord;
  }

  async getAvailability(charterId: number, month: string): Promise<Availability[]> {
    const startOfMonth = new Date(month + "-01");
    const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);
    
    return await db
      .select()
      .from(availability)
      .where(
        and(
          eq(availability.charterId, charterId),
          gte(availability.date, startOfMonth),
          lte(availability.date, endOfMonth)
        )
      )
      .orderBy(availability.date);
  }

  async updateAvailabilitySlots(charterId: number, date: Date, slotsToBook: number): Promise<boolean> {
    const result = await db
      .update(availability)
      .set({
        bookedSlots: sql`${availability.bookedSlots} + ${slotsToBook}`,
      })
      .where(
        and(
          eq(availability.charterId, charterId),
          eq(availability.date, date),
          sql`${availability.slots} - ${availability.bookedSlots} >= ${slotsToBook}`
        )
      )
      .returning();
    
    return result.length > 0;
  }

  async checkAvailability(charterId: number, date: Date, requiredSlots: number = 1): Promise<boolean> {
    const [result] = await db
      .select({
        availableSlots: sql<number>`${availability.slots} - ${availability.bookedSlots}`,
      })
      .from(availability)
      .where(
        and(
          eq(availability.charterId, charterId),
          eq(availability.date, date)
        )
      );
    
    return result ? result.availableSlots >= requiredSlots : false;
  }

  // Captain dashboard operations
  async getCaptainStats(captainId: number): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    responseRate: number;
    upcomingTrips: number;
    newMessages: number;
  }> {
    // Get captain's charters
    const captainCharters = await db
      .select({ id: charters.id })
      .from(charters)
      .where(eq(charters.captainId, captainId));
    
    const charterIds = captainCharters.map(c => c.id);
    
    if (charterIds.length === 0) {
      return {
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        responseRate: 100,
        upcomingTrips: 0,
        newMessages: 0
      };
    }

    // Get total bookings
    const totalBookingsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(sql`${bookings.charterId} = ANY(${charterIds})`);
    
    const totalBookings = totalBookingsResult[0]?.count || 0;

    // Get total revenue
    const totalRevenueResult = await db
      .select({ 
        total: sql<number>`COALESCE(sum(cast(${charters.price} as numeric)), 0)` 
      })
      .from(charters)
      .leftJoin(bookings, eq(charters.id, bookings.charterId))
      .where(
        and(
          eq(charters.captainId, captainId),
          eq(bookings.status, 'confirmed')
        )
      );
    
    const totalRevenue = Number(totalRevenueResult[0]?.total || 0);

    // Get captain rating
    const captain = await this.getCaptain(captainId);
    const averageRating = captain?.rating || 0;

    // Get upcoming trips (bookings in the future)
    const upcomingTripsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(
        and(
          sql`${bookings.charterId} = ANY(${charterIds})`,
          eq(bookings.status, 'confirmed'),
          sql`${bookings.date} > CURRENT_DATE`
        )
      );
    
    const upcomingTrips = upcomingTripsResult[0]?.count || 0;

    // Mock response rate and new messages for now
    const responseRate = 98;
    const newMessages = 0;

    return {
      totalBookings,
      totalRevenue,
      averageRating,
      responseRate,
      upcomingTrips,
      newMessages
    };
  }

  async getCaptainRecentBookings(captainId: number): Promise<any[]> {
    const captainCharters = await db
      .select({ id: charters.id })
      .from(charters)
      .where(eq(charters.captainId, captainId));
    
    const charterIds = captainCharters.map(c => c.id);
    
    if (charterIds.length === 0) {
      return [];
    }

    const recentBookings = await db
      .select({
        id: bookings.id,
        date: bookings.date,
        guests: bookings.guests,
        totalAmount: bookings.totalAmount,
        status: bookings.status,
        charterTitle: charters.title,
        customerUserId: bookings.userId,
      })
      .from(bookings)
      .leftJoin(charters, eq(bookings.charterId, charters.id))
      .where(sql`${bookings.charterId} = ANY(${charterIds})`)
      .orderBy(desc(bookings.date))
      .limit(10);

    // Get customer names
    const enrichedBookings = await Promise.all(
      recentBookings.map(async (booking) => {
        const customer = await this.getUser(booking.customerUserId);
        return {
          id: booking.id,
          customerName: customer?.name || 'Unknown Customer',
          date: booking.date.toISOString().split('T')[0],
          duration: '8 hours', // Default duration - should be from charter
          charterTitle: booking.charterTitle,
          amount: Number(booking.totalAmount),
          status: booking.status
        };
      })
    );

    return enrichedBookings;
  }

  async getCaptainMessageThreads(captainId: number): Promise<any[]> {
    // Get captain's charters
    const captainCharters = await db
      .select({ id: charters.id })
      .from(charters)
      .where(eq(charters.captainId, captainId));
    
    const charterIds = captainCharters.map(c => c.id);
    
    if (charterIds.length === 0) {
      return [];
    }

    // Get unique users who have messaged about these charters
    const messageThreads = await db
      .select({
        charterId: messages.charterId,
        userId: messages.userId,
        lastMessage: messages.content,
        lastMessageTime: messages.createdAt,
      })
      .from(messages)
      .where(sql`${messages.charterId} = ANY(${charterIds})`)
      .orderBy(desc(messages.createdAt));

    // Group by user and get the latest message for each
    const threadMap = new Map();
    
    for (const msg of messageThreads) {
      const key = `${msg.userId}-${msg.charterId}`;
      if (!threadMap.has(key)) {
        threadMap.set(key, {
          id: msg.charterId,
          userId: msg.userId,
          lastMessage: msg.lastMessage,
          lastMessageTime: msg.lastMessageTime.toISOString(),
          unreadCount: 0 // TODO: Implement read tracking
        });
      }
    }

    // Enrich with user names
    const enrichedThreads = await Promise.all(
      Array.from(threadMap.values()).map(async (thread) => {
        const user = await this.getUser(thread.userId);
        return {
          ...thread,
          otherUserName: user?.name || 'Unknown User',
        };
      })
    );

    return enrichedThreads.slice(0, 20); // Limit to 20 recent threads
  }

  async getCaptainEarnings(captainId: number): Promise<{
    totalEarnings: number;
    thisMonth: number;
    pendingPayouts: number;
  }> {
    // Get captain's charters
    const captainCharters = await db
      .select({ id: charters.id })
      .from(charters)
      .where(eq(charters.captainId, captainId));
    
    const charterIds = captainCharters.map(c => c.id);
    
    if (charterIds.length === 0) {
      return {
        totalEarnings: 0,
        thisMonth: 0,
        pendingPayouts: 0
      };
    }

    // Get total earnings from completed bookings
    const totalEarningsResult = await db
      .select({ 
        total: sql<number>`COALESCE(sum(cast(${bookings.totalAmount} as numeric)), 0)` 
      })
      .from(bookings)
      .where(
        and(
          sql`${bookings.charterId} = ANY(${charterIds})`,
          eq(bookings.status, 'confirmed')
        )
      );
    
    const totalEarnings = Number(totalEarningsResult[0]?.total || 0);

    // Get this month's earnings
    const thisMonthResult = await db
      .select({ 
        total: sql<number>`COALESCE(sum(cast(${bookings.totalAmount} as numeric)), 0)` 
      })
      .from(bookings)
      .where(
        and(
          sql`${bookings.charterId} = ANY(${charterIds})`,
          eq(bookings.status, 'confirmed'),
          sql`EXTRACT(MONTH FROM ${bookings.date}) = EXTRACT(MONTH FROM CURRENT_DATE)`,
          sql`EXTRACT(YEAR FROM ${bookings.date}) = EXTRACT(YEAR FROM CURRENT_DATE)`
        )
      );
    
    const thisMonth = Number(thisMonthResult[0]?.total || 0);

    // Get pending payouts (bookings that are confirmed but not yet paid out)
    const pendingResult = await db
      .select({ 
        total: sql<number>`COALESCE(sum(cast(${bookings.totalAmount} as numeric)), 0)` 
      })
      .from(bookings)
      .where(
        and(
          sql`${bookings.charterId} = ANY(${charterIds})`,
          eq(bookings.status, 'confirmed'),
          sql`${bookings.date} <= CURRENT_DATE`
        )
      );
    
    // For now, assume 10% of total earnings are pending
    const pendingPayouts = Math.round(Number(pendingResult[0]?.total || 0) * 0.1);

    return {
      totalEarnings,
      thisMonth,
      pendingPayouts
    };
  }

  // Admin operations
  async getAllCaptainsWithUsers(): Promise<(Captain & { user: User })[]> {
    const results = await db
      .select()
      .from(captains)
      .leftJoin(users, eq(captains.userId, users.id));

    return results.map(result => ({
      ...result.captains,
      user: result.users!,
    }));
  }

  async updateCaptainVerification(captainId: number, verified: boolean): Promise<Captain | undefined> {
    const [captain] = await db
      .update(captains)
      .set({ verified })
      .where(eq(captains.id, captainId))
      .returning();
    
    return captain;
  }

  async getAllChartersForAdmin(): Promise<Charter[]> {
    return await db.select().from(charters);
  }

  async updateCharterVisibility(charterId: number, isListed: boolean): Promise<Charter | undefined> {
    const [charter] = await db
      .update(charters)
      .set({ isListed })
      .where(eq(charters.id, charterId))
      .returning();
    
    return charter;
  }
}

export const storage = new DatabaseStorage();