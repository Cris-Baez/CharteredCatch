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
import { eq, and, or, ilike, sql } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  findUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<User | undefined>;

  // Captains
  getCaptain(id: number): Promise<Captain | undefined>;
  getCaptainByUserId(userId: string): Promise<Captain | undefined>;
  createCaptain(captain: InsertCaptain): Promise<Captain>;
  getAllCaptains(): Promise<Captain[]>;
  getAllCaptainsWithUsers(): Promise<(Captain & { user: User })[]>;

  // Charters
  getCharter(id: number): Promise<Charter | undefined>;
  getCharterWithCaptain(id: number): Promise<CharterWithCaptain | undefined>;
  getChartersByCaptain(captainId: number): Promise<Charter[]>;
  searchCharters(filters: {
    location?: string;
    targetSpecies?: string;
    duration?: string;
    lat?: number;
    lng?: number;
    distance?: number;
  }): Promise<CharterWithCaptain[]>;
  getAllCharters(): Promise<CharterWithCaptain[]>;
  createCharter(charter: InsertCharter): Promise<Charter>;
  updateCharter(id: number, updates: Partial<Charter>): Promise<Charter | undefined>;
  updateCharterVisibility(charterId: number, isListed: boolean): Promise<Charter | undefined>;
  getAllChartersForAdmin(): Promise<Charter[]>;

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
  getCaptainStats(captainId: number): Promise<any>;
  getCaptainRecentBookings(captainId: number): Promise<any[]>;
  getCaptainMessageThreads(captainId: number): Promise<any[]>;
  getCaptainEarnings(captainId: number): Promise<any>;

  // Admin
  updateCaptainVerification(captainId: number, verified: boolean): Promise<Captain | undefined>;
}

export class DatabaseStorage implements IStorage {
  getChartersByCaptain(captainId: number): Promise<Charter[]> {
      throw new Error("Method not implemented.");
  }
  // =====================
  // Users
  // =====================
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
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  }): Promise<User> {
    const userId = `local_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const [user] = await db
      .insert(users)
      .values({ ...userData, id: userId })
      .returning();
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ password, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // =====================
  // Captains
  // =====================
  async getCaptain(id: number): Promise<Captain | undefined> {
    const [captain] = await db.select().from(captains).where(eq(captains.id, id));
    return captain;
  }

  async getCaptainByUserId(userId: string): Promise<Captain | undefined> {
    const [captain] = await db.select().from(captains).where(eq(captains.userId, userId));
    return captain;
  }

  async createCaptain(insertCaptain: InsertCaptain): Promise<Captain> {
    const [captain] = await db.insert(captains).values(insertCaptain).returning();
    return captain;
  }

  async getAllCaptains(): Promise<Captain[]> {
    return await db.select().from(captains);
  }

  async getAllCaptainsWithUsers(): Promise<(Captain & { user: User })[]> {
    const results = await db
      .select({
        id: captains.id,
        name: captains.name,
        userId: captains.userId,
        bio: captains.bio,
        experience: captains.experience,
        licenseNumber: captains.licenseNumber,
        location: captains.location,
        avatar: captains.avatar,
        verified: captains.verified,
        rating: captains.rating,
        reviewCount: captains.reviewCount,

        user_id: users.id,
        user_email: users.email,
        user_firstName: users.firstName,
        user_lastName: users.lastName,
      })
      .from(captains)
      .leftJoin(users, eq(captains.userId, users.id));

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      userId: r.userId,
      bio: r.bio,
      experience: r.experience,
      licenseNumber: r.licenseNumber,
      location: r.location,
      avatar: r.avatar,
      verified: r.verified,
      rating: r.rating,
      reviewCount: r.reviewCount,
      user: {
        id: r.user_id,
        email: r.user_email,
        firstName: r.user_firstName,
        lastName: r.user_lastName,
        password: "",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));
  }

  // =====================
  // Charters
  // =====================
  async getCharter(id: number): Promise<Charter | undefined> {
    const [charter] = await db.select().from(charters).where(eq(charters.id, id));
    return charter;
  }

  async getCharterWithCaptain(id: number): Promise<CharterWithCaptain | undefined> {
    const [row] = await db
      .select({
        id: charters.id,
        captainId: charters.captainId,
        title: charters.title,
        description: charters.description,
        location: charters.location,
        lat: charters.lat,
        lng: charters.lng,
        targetSpecies: charters.targetSpecies,
        duration: charters.duration,
        maxGuests: charters.maxGuests,
        price: charters.price,
        boatSpecs: charters.boatSpecs,
        included: charters.included,
        images: charters.images,
        available: charters.available,
        isListed: charters.isListed,

        captainId_fk: captains.id,
        captainName: captains.name,
        captainUserId: captains.userId,
        captainBio: captains.bio,
        captainExperience: captains.experience,
        captainLicense: captains.licenseNumber,
        captainLocation: captains.location,
        captainAvatar: captains.avatar,
        captainVerified: captains.verified,
        captainRating: captains.rating,
        captainReviewCount: captains.reviewCount,
      })
      .from(charters)
      .leftJoin(captains, eq(charters.captainId, captains.id))
      .where(eq(charters.id, id));

    if (!row) return undefined;

    return {
      id: row.id,
      captainId: row.captainId,
      title: row.title,
      description: row.description,
      location: row.location,
      lat: row.lat,
      lng: row.lng,
      targetSpecies: row.targetSpecies,
      duration: row.duration,
      maxGuests: row.maxGuests,
      price: row.price,
      boatSpecs: row.boatSpecs,
      included: row.included,
      images: row.images,
      available: row.available,
      isListed: row.isListed,
      captain: {
        id: row.captainId_fk,
        userId: row.captainUserId,
        name: row.captainName,
        bio: row.captainBio,
        experience: row.captainExperience,
        licenseNumber: row.captainLicense,
        location: row.captainLocation,
        avatar: row.captainAvatar,
        verified: row.captainVerified,
        rating: row.captainRating,
        reviewCount: row.captainReviewCount,
      },
    };
  }

  async getAllCharters(): Promise<CharterWithCaptain[]> {
    const rows = await db
      .select({
        id: charters.id,
        captainId: charters.captainId,
        title: charters.title,
        description: charters.description,
        location: charters.location,
        lat: charters.lat,
        lng: charters.lng,
        targetSpecies: charters.targetSpecies,
        duration: charters.duration,
        maxGuests: charters.maxGuests,
        price: charters.price,
        boatSpecs: charters.boatSpecs,
        included: charters.included,
        images: charters.images,
        available: charters.available,
        isListed: charters.isListed,

        captainId_fk: captains.id,
        captainName: captains.name,
        captainUserId: captains.userId,
        captainBio: captains.bio,
        captainExperience: captains.experience,
        captainLicense: captains.licenseNumber,
        captainLocation: captains.location,
        captainAvatar: captains.avatar,
        captainVerified: captains.verified,
        captainRating: captains.rating,
        captainReviewCount: captains.reviewCount,
      })
      .from(charters)
      .leftJoin(captains, eq(charters.captainId, captains.id));

    return rows.map((row) => ({
      id: row.id,
      captainId: row.captainId,
      title: row.title,
      description: row.description,
      location: row.location,
      lat: row.lat,
      lng: row.lng,
      targetSpecies: row.targetSpecies,
      duration: row.duration,
      maxGuests: row.maxGuests,
      price: row.price,
      boatSpecs: row.boatSpecs,
      included: row.included,
      images: row.images,
      available: row.available,
      isListed: row.isListed,
      captain: {
        id: row.captainId_fk,
        userId: row.captainUserId,
        name: row.captainName,
        bio: row.captainBio,
        experience: row.captainExperience,
        licenseNumber: row.captainLicense,
        location: row.captainLocation,
        avatar: row.captainAvatar,
        verified: row.captainVerified,
        rating: row.captainRating,
        reviewCount: row.captainReviewCount,
      },
    }));
  }

  // TODO: implementar searchCharters y demás con mismo patrón
  searchCharters(): Promise<CharterWithCaptain[]> {
    return this.getAllCharters();
  }

  async createCharter(charter: InsertCharter): Promise<Charter> {
    const [c] = await db.insert(charters).values(charter).returning();
    return c;
  }

  async updateCharter(id: number, updates: Partial<Charter>): Promise<Charter | undefined> {
    const [c] = await db.update(charters).set(updates).where(eq(charters.id, id)).returning();
    return c;
  }

  async updateCharterVisibility(charterId: number, isListed: boolean): Promise<Charter | undefined> {
    const [c] = await db.update(charters).set({ isListed }).where(eq(charters.id, charterId)).returning();
    return c;
  }

  async getAllChartersForAdmin(): Promise<Charter[]> {
    return db.select().from(charters);
  }

  // =====================
  // Bookings / Messages / Reviews / Availability / Dashboard
  // =====================
  async createBooking(b: InsertBooking): Promise<Booking> {
    const [bk] = await db.insert(bookings).values(b).returning();
    return bk;
  }
  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.userId, userId));
  }
  async getBookingsByCaptain(captainId: number): Promise<Booking[]> {
    return db.select().from(bookings).where(eq(bookings.captainId, captainId));
  }
  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [bk] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return bk;
  }

  async createMessage(m: InsertMessage): Promise<Message> {
    const [msg] = await db.insert(messages).values(m).returning();
    return msg;
  }
  async getMessageThread(): Promise<Message[]> {
    return [];
  }
  async getMessageThreads(): Promise<MessageThread[]> {
    return [];
  }
  async markMessageAsRead(): Promise<void> {}

  async createReview(r: InsertReview): Promise<Review> {
    const [rev] = await db.insert(reviews).values(r).returning();
    return rev;
  }
  async getReviewsByCaptain(captainId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.captainId, captainId));
  }
  async updateCaptainRating(): Promise<void> {}

  async createAvailability(a: InsertAvailability): Promise<Availability> {
    const [av] = await db.insert(availability).values(a).returning();
    return av;
  }
  async getAvailability(): Promise<Availability[]> {
    return [];
  }
  async updateAvailabilitySlots(): Promise<boolean> {
    return true;
  }
  async checkAvailability(): Promise<boolean> {
    return true;
  }

  async getCaptainStats(): Promise<any> {
    return {};
  }
  async getCaptainRecentBookings(): Promise<any[]> {
    return [];
  }
  async getCaptainMessageThreads(): Promise<any[]> {
    return [];
  }
  async getCaptainEarnings(): Promise<any> {
    return {};
  }

  async updateCaptainVerification(captainId: number, verified: boolean): Promise<Captain | undefined> {
    const [c] = await db.update(captains).set({ verified }).where(eq(captains.id, captainId)).returning();
    return c;
  }
}

export const storage = new DatabaseStorage();
