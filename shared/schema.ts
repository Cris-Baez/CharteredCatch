import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  varchar,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =====================
// Session storage table
// =====================
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// =====================
// Users
// =====================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  password: text("password").notNull(), // 👈 NECESARIO PARA LOGIN LOCAL
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user"), // "user" | "captain" | "admin"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =====================
// Captains
// =====================
export const captains = pgTable("captains", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  experience: text("experience").notNull(),
  licenseNumber: text("license_number").notNull(),
  location: text("location").notNull(),
  avatar: text("avatar"),
  verified: boolean("verified").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
});

// =====================
// Charters
// =====================
export const charters = pgTable("charters", {
  id: serial("id").primaryKey(),
  captainId: integer("captain_id").references(() => captains.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  targetSpecies: text("target_species").notNull(),
  duration: text("duration").notNull(),
  maxGuests: integer("max_guests").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  boatSpecs: text("boat_specs"),
  included: text("included"),
  images: text("images").array(),
  available: boolean("available").default(true),
  isListed: boolean("is_listed").default(true),
});

// =====================
// Bookings
// =====================
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  charterId: integer("charter_id").references(() => charters.id).notNull(),
  tripDate: timestamp("trip_date").notNull(),
  guests: integer("guests").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'pending', 'confirmed', 'cancelled'
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =====================
// Messages
// =====================
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  charterId: integer("charter_id").references(() => charters.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =====================
// Reviews
// =====================
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  captainId: integer("captain_id").references(() => captains.id).notNull(),
  charterId: integer("charter_id").references(() => charters.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =====================
// Availability
// =====================
export const availability = pgTable(
  "availability",
  {
    id: serial("id").primaryKey(),
    charterId: integer("charter_id").references(() => charters.id).notNull(),
    date: timestamp("date").notNull(),
    slots: integer("slots").notNull().default(1),
    bookedSlots: integer("booked_slots").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_availability_charter_date").on(table.charterId, table.date),
  ]
);

// =====================
// Insert Schemas
// =====================
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCaptainSchema = createInsertSchema(captains).omit({
  id: true,
  rating: true,
  reviewCount: true,
});

export const insertCharterSchema = createInsertSchema(charters).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  read: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
  createdAt: true,
});

// =====================
// Types
// =====================
export type User = typeof users.$inferSelect;
export type Captain = typeof captains.$inferSelect;
export type Charter = typeof charters.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Availability = typeof availability.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type InsertCaptain = z.infer<typeof insertCaptainSchema>;
export type InsertCharter = z.infer<typeof insertCharterSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;

// Extended types for API responses
export type CharterWithCaptain = Charter & {
  captain: Captain & {
    name: string;
    user?: User;
  };
  reviews?: Review[];
};

export type MessageThread = {
  participant: User;
  lastMessage: Message;
  unreadCount: number;
};
