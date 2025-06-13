import {
  users,
  captains,
  charters,
  bookings,
  messages,
  reviews,
  type User,
  type Captain,
  type Charter,
  type Booking,
  type Message,
  type Review,
  type UpsertUser,
  type InsertCaptain,
  type InsertCharter,
  type InsertBooking,
  type InsertMessage,
  type InsertReview,
  type CharterWithCaptain,
  type MessageThread,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, ilike, avg } from "drizzle-orm";

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
  searchCharters(filters: { location?: string; targetSpecies?: string; duration?: string }): Promise<CharterWithCaptain[]>;
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

  async searchCharters(filters: { location?: string; targetSpecies?: string; duration?: string }): Promise<CharterWithCaptain[]> {
    const conditions = [eq(charters.available, true)];
    
    if (filters.location) {
      conditions.push(ilike(charters.location, `%${filters.location}%`));
    }
    if (filters.targetSpecies) {
      conditions.push(ilike(charters.targetSpecies, `%${filters.targetSpecies}%`));
    }
    if (filters.duration) {
      conditions.push(eq(charters.duration, filters.duration));
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
}

export const storage = new DatabaseStorage();