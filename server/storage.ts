import {
  users,
  captains,
  charters,
  bookings,
  messages,
  reviews,
  availability,
  captainPaymentInfo,
  type User,
  type Captain,
  type Charter,
  type Booking,
  type Message,
  type Review,
  type Availability,
  type CaptainPaymentInfo,
  type UpsertUser,
  type InsertCaptain,
  type InsertCharter,
  type InsertBooking,
  type InsertMessage,
  type InsertReview,
  type InsertAvailability,
  type InsertCaptainPaymentInfo,
  type CharterWithCaptain,
  type MessageThread,
} from "@shared/schema";

import { db } from "./db";
import { eq, ilike, and } from "drizzle-orm";


// =======================================
// INTERFAZ PRINCIPAL
// =======================================

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

  // Charters
  getCharter(id: number): Promise<Charter | undefined>;
  getCharterWithCaptain(id: number): Promise<CharterWithCaptain | undefined>;
  getChartersByCaptain(captainId: number): Promise<Charter[]>;
  searchCharters(filters: {
    location?: string;
    targetSpecies?: string;
    duration?: string;
  }): Promise<CharterWithCaptain[]>;
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
  getCaptainStats(captainId: number): Promise<any>;
  getCaptainRecentBookings(captainId: number): Promise<any[]>;
  getCaptainMessageThreads(captainId: number): Promise<any[]>;
  getCaptainEarnings(captainId: number): Promise<any>;

  // Captain Payment Info
  getCaptainPaymentInfo(captainId: number): Promise<CaptainPaymentInfo | undefined>;
  upsertCaptainPaymentInfo(captainId: number, paymentInfo: Partial<InsertCaptainPaymentInfo>): Promise<CaptainPaymentInfo>;

  // Admin operations
  getAllCaptainsWithUsers(): Promise<(Captain & { user: User })[]>;
  updateCaptainVerification(captainId: number, verified: boolean): Promise<Captain | undefined>;
  getAllChartersForAdmin(): Promise<Charter[]>;
  updateCharterVisibility(charterId: number, isListed: boolean): Promise<Charter | undefined>;
}

// =======================================
// IMPLEMENTACIÓN
// =======================================

export class DatabaseStorage implements IStorage {
  // =====================
  // USERS
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
    const userId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const [user] = await db.insert(users).values({ ...userData, id: userId }).returning();
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
  // CAPTAINS
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

  // =====================
  // CHARTERS
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
        captain: {
          id: captains.id,
          userId: captains.userId,
          name: captains.name,
          bio: captains.bio,
          experience: captains.experience,
          licenseNumber: captains.licenseNumber,
          location: captains.location,
          avatar: captains.avatar,
          verified: captains.verified,
          rating: captains.rating,
          reviewCount: captains.reviewCount,
          onboardingCompleted: captains.onboardingCompleted,
          licenseDocument: captains.licenseDocument,
          boatDocumentation: captains.boatDocumentation,
          insuranceDocument: captains.insuranceDocument,
          identificationPhoto: captains.identificationPhoto,
          localPermit: captains.localPermit,
          cprCertification: captains.cprCertification,
          drugTestingResults: captains.drugTestingResults,
          onboardingStartedAt: captains.onboardingStartedAt,
          onboardingCompletedAt: captains.onboardingCompletedAt,
        },
      })
      .from(charters)
      .leftJoin(captains, eq(charters.captainId, captains.id))
      .where(eq(charters.id, id));

    return row
      ? {
          ...row,
          captain: row.captain || { 
            id: 0, 
            userId: "",
            name: "Unknown", 
            bio: "",
            experience: "",
            licenseNumber: "",
            location: "",
            avatar: null,
            verified: false,
            rating: "0.0", 
            reviewCount: 0,
            onboardingCompleted: false,
            licenseDocument: null,
            boatDocumentation: null,
            insuranceDocument: null,
            identificationPhoto: null,
            localPermit: null,
            cprCertification: null,
            drugTestingResults: null,
            onboardingStartedAt: null,
            onboardingCompletedAt: null
          },
        }
      : undefined;
  }

  async getChartersByCaptain(captainId: number): Promise<Charter[]> {
    return await db.select().from(charters).where(eq(charters.captainId, captainId));
  }

  async searchCharters(filters: {
    location?: string;
    targetSpecies?: string;
    duration?: string;
  }): Promise<CharterWithCaptain[]> {
    const baseQuery = db
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
        captain: {
          id: captains.id,
          userId: captains.userId,
          name: captains.name,
          bio: captains.bio,
          experience: captains.experience,
          licenseNumber: captains.licenseNumber,
          location: captains.location,
          avatar: captains.avatar,
          verified: captains.verified,
          rating: captains.rating,
          reviewCount: captains.reviewCount,
          onboardingCompleted: captains.onboardingCompleted,
          licenseDocument: captains.licenseDocument,
          boatDocumentation: captains.boatDocumentation,
          insuranceDocument: captains.insuranceDocument,
          identificationPhoto: captains.identificationPhoto,
          localPermit: captains.localPermit,
          cprCertification: captains.cprCertification,
          drugTestingResults: captains.drugTestingResults,
          onboardingStartedAt: captains.onboardingStartedAt,
          onboardingCompletedAt: captains.onboardingCompletedAt,
        },
      })
      .from(charters)
      .leftJoin(captains, eq(charters.captainId, captains.id));

    const conditions = [];
    if (filters.location) {
      conditions.push(ilike(charters.location, `%${filters.location}%`));
    }
    if (filters.targetSpecies) {
      conditions.push(ilike(charters.targetSpecies, `%${filters.targetSpecies}%`));
    }
    if (filters.duration) {
      conditions.push(eq(charters.duration, filters.duration));
    }

    const results = conditions.length > 0 
      ? await baseQuery.where(and(...conditions))
      : await baseQuery;

    return results.map((row: any) => ({
      ...row,
      captain: row.captain || { 
        id: 0, 
        userId: "",
        name: "Unknown", 
        bio: "",
        experience: "",
        licenseNumber: "",
        location: "",
        avatar: null,
        verified: false,
        rating: "0.0", 
        reviewCount: 0 
      },
    }));
  }

  async getAllCharters(): Promise<CharterWithCaptain[]> {
    const results = await db
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
        captain: {
          id: captains.id,
          name: captains.name,
          rating: captains.rating,
          reviewCount: captains.reviewCount,
        },
      })
      .from(charters)
      .leftJoin(captains, eq(charters.captainId, captains.id));

    return results.map((row: any) => ({
      ...row,
      captain: row.captain || { id: 0, name: "Unknown", rating: "0.0", reviewCount: 0 },
    }));
  }

  async createCharter(insertCharter: InsertCharter): Promise<Charter> {
    const [charter] = await db.insert(charters).values(insertCharter).returning();
    return charter;
  }

  async updateCharter(id: number, updates: Partial<Charter>): Promise<Charter | undefined> {
    const [charter] = await db.update(charters).set(updates).where(eq(charters.id, id)).returning();
    return charter;
  }

  // =====================
  // BOOKING (solo base)
  // =====================

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.userId, userId));
  }

  async getBookingsByCaptain(captainId: number): Promise<Booking[]> {
    const results = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        charterId: bookings.charterId,
        tripDate: bookings.tripDate,
        guests: bookings.guests,
        totalPrice: bookings.totalPrice,
        status: bookings.status,
        message: bookings.message,
        paymentProofUrl: bookings.paymentProofUrl,
        paymentMethod: bookings.paymentMethod,
        paymentStatus: bookings.paymentStatus,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .leftJoin(charters, eq(bookings.charterId, charters.id))
      .where(eq(charters.captainId, captainId));
    
    return results;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings).set({ status }).where(eq(bookings.id, id)).returning();
    return booking;
  }

  // =====================
  // MENSAJES / REVIEWS / AVAILABILITY
  // (puedes implementar según necesidad real)
  // =====================

  async createMessage(): Promise<Message> {
    throw new Error("Not implemented");
  }
  async getMessageThread(): Promise<Message[]> {
    return [];
  }
  async getMessageThreads(): Promise<MessageThread[]> {
    return [];
  }
  async markMessageAsRead(): Promise<void> {
    return;
  }

  async createReview(): Promise<Review> {
    throw new Error("Not implemented");
  }
  async getReviewsByCaptain(): Promise<Review[]> {
    return [];
  }
  async updateCaptainRating(): Promise<void> {
    return;
  }

  async createAvailability(): Promise<Availability> {
    throw new Error("Not implemented");
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

  async getAllCaptainsWithUsers(): Promise<(Captain & { user: User })[]> {
    const rows = await db
      .select({
        id: captains.id,
        userId: captains.userId,
        bio: captains.bio,
        experience: captains.experience,
        licenseNumber: captains.licenseNumber,
        location: captains.location,
        avatar: captains.avatar,
        verified: captains.verified,
        rating: captains.rating,
        reviewCount: captains.reviewCount,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(captains)
      .leftJoin(users, eq(captains.userId, users.id));

    return rows as any;
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

  // =====================
  // CAPTAIN PAYMENT INFO
  // =====================

  async getCaptainPaymentInfo(captainId: number): Promise<CaptainPaymentInfo | undefined> {
    const [paymentInfo] = await db
      .select()
      .from(captainPaymentInfo)
      .where(eq(captainPaymentInfo.captainId, captainId));
    return paymentInfo;
  }

  async upsertCaptainPaymentInfo(captainId: number, paymentInfo: Partial<InsertCaptainPaymentInfo>): Promise<CaptainPaymentInfo> {
    const [result] = await db
      .insert(captainPaymentInfo)
      .values({ captainId, ...paymentInfo })
      .onConflictDoUpdate({
        target: captainPaymentInfo.captainId,
        set: { ...paymentInfo, updatedAt: new Date() },
      })
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
