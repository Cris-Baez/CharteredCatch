// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import express from "express";
import bcrypt from "bcrypt";
import { z } from "zod";

import { storage } from "./storage";
import {
  insertBookingSchema,
  insertMessageSchema,
  insertReviewSchema,
  insertAvailabilitySchema,
} from "@shared/schema";

// ========== HELPERS ==========

// Verifica si el usuario es admin
function isAdmin(req: any, res: any, next: any) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// Middleware: requiere sesión activa
function requireAuth(req: any, res: any, next: any) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// ========== ROUTES ==========

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static assets
  app.use(
    "/attached_assets",
    express.static(path.join(process.cwd(), "attached_assets"))
  );

  // -------- AUTH LOCAL --------

  // Registro
  app.post("/api/auth/local/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const existing = await storage.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        email,
        password: hashed,
        firstName,
        lastName,
        role: role || "user", // "user" o "captain"
      });

      req.session.userId = user.id;
      req.session.user = user;
      res.status(201).json(user);
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  // Login
  app.post("/api/auth/local/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      console.log("Login attempt:", { email: email?.substring(0, 3) + "***" });
      
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      const user = await storage.findUserByEmail(email);
      console.log("User found:", !!user);
      
      if (!user) {
        console.log("User not found for email:", email);
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (!user.password) {
        console.log("User has no password set");
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const valid = await bcrypt.compare(password, user.password);
      console.log("Password valid:", valid);
      
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;
      req.session.user = user;
      console.log("Login successful for user:", user.id);
      res.json(user);
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  // Usuario de sesión
  app.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json(user);
    } catch (err) {
      console.error("Get user error:", err);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // -------- CHARTERS --------
  app.get("/api/charters", async (req, res) => {
    try {
      const { location, targetSpecies, duration, lat, lng, distance } =
        req.query;

      const filters = {
        ...(location && { location: location as string }),
        ...(targetSpecies && { targetSpecies: targetSpecies as string }),
        ...(duration && { duration: duration as string }),
        ...(lat && { lat: parseFloat(lat as string) }),
        ...(lng && { lng: parseFloat(lng as string) }),
        ...(distance && { distance: parseFloat(distance as string) }),
      };

      const charters = await storage.searchCharters(filters);
      res.json(charters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch charters" });
    }
  });

  app.get("/api/charters/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const charter = await storage.getCharterWithCaptain(id);

      if (!charter) {
        return res.status(404).json({ message: "Charter not found" });
      }

      res.json(charter);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch charter" });
    }
  });

  // -------- AVAILABILITY --------
  app.get("/api/availability", async (req, res) => {
    try {
      const { charterId, month } = req.query;

      if (!charterId || !month) {
        return res
          .status(400)
          .json({ message: "charterId and month are required" });
      }

      const availability = await storage.getAvailability(
        parseInt(charterId as string),
        month as string
      );
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post("/api/availability", requireAuth, async (req: any, res) => {
    try {
      const availabilityData = insertAvailabilitySchema.parse(req.body);
      const availability = await storage.createAvailability(availabilityData);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid availability data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  // -------- BOOKINGS --------
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);

      const isAvailable = await storage.checkAvailability(
        bookingData.charterId,
        bookingData.tripDate,
        1
      );

      if (!isAvailable) {
        return res.status(409).json({ message: "No availability for this date" });
      }

      const booking = await storage.createBooking(bookingData);
      await storage.updateAvailabilitySlots(
        bookingData.charterId,
        bookingData.tripDate,
        1
      );

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // -------- MESSAGES --------
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // -------- REVIEWS --------
  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // -------- ADMIN --------
  app.get("/api/admin/captains", requireAuth, isAdmin, async (_req, res) => {
    try {
      const captains = await storage.getAllCaptainsWithUsers();
      res.json(captains);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captains" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

