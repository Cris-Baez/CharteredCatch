import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  isCaptin: boolean("is_captain").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const captains = pgTable("captains", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  bio: text("bio").notNull(),
  experience: text("experience").notNull(),
  licenseNumber: text("license_number").notNull(),
  location: text("location").notNull(),
  avatar: text("avatar"),
  verified: boolean("verified").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
});

export const charters = pgTable("charters", {
  id: serial("id").primaryKey(),
  captainId: integer("captain_id").references(() => captains.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  targetSpecies: text("target_species").notNull(),
  duration: text("duration").notNull(),
  maxGuests: integer("max_guests").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  boatSpecs: text("boat_specs"),
  included: text("included"),
  images: text("images").array(),
  available: boolean("available").default(true),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  charterId: integer("charter_id").references(() => charters.id).notNull(),
  tripDate: timestamp("trip_date").notNull(),
  guests: integer("guests").notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'pending', 'confirmed', 'cancelled'
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  charterId: integer("charter_id").references(() => charters.id),
  content: text("content").notNull(),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  captainId: integer("captain_id").references(() => captains.id).notNull(),
  charterId: integer("charter_id").references(() => charters.id).notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
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

// Types
export type User = typeof users.$inferSelect;
export type Captain = typeof captains.$inferSelect;
export type Charter = typeof charters.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCaptain = z.infer<typeof insertCaptainSchema>;
export type InsertCharter = z.infer<typeof insertCharterSchema>;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;

// Extended types for API responses
export type CharterWithCaptain = Charter & {
  captain: Captain & { user: User };
  reviews: Review[];
};

export type MessageThread = {
  participant: User;
  lastMessage: Message;
  unreadCount: number;
};
