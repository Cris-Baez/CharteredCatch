import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertBookingSchema, insertMessageSchema, insertReviewSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Charter routes
  app.get("/api/charters", async (req, res) => {
    try {
      const { location, targetSpecies, duration } = req.query;
      
      const filters = {
        ...(location && { location: location as string }),
        ...(targetSpecies && { targetSpecies: targetSpecies as string }),
        ...(duration && { duration: duration as string }),
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

  app.get("/api/charters/captain/:captainId", async (req, res) => {
    try {
      const captainId = parseInt(req.params.captainId);
      const charters = await storage.getChartersByCaptain(captainId);
      res.json(charters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captain charters" });
    }
  });

  // Booking routes
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get("/api/bookings/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const bookings = await storage.getBookingsByUser(userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/captain/:captainId", async (req, res) => {
    try {
      const captainId = parseInt(req.params.captainId);
      // This would need to be implemented in storage
      const bookings = await storage.getBookingsByCaptain(captainId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captain bookings" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "confirmed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const booking = await storage.updateBookingStatus(id, status);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Message routes
  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get("/api/messages/threads/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const threads = await storage.getMessageThreads(userId);
      res.json(threads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch message threads" });
    }
  });

  app.get("/api/messages/thread", async (req, res) => {
    try {
      const { userId1, userId2, charterId } = req.query;
      
      if (!userId1 || !userId2) {
        return res.status(400).json({ message: "Both user IDs are required" });
      }
      
      const messages = await storage.getMessageThread(
        parseInt(userId1 as string),
        parseInt(userId2 as string),
        charterId ? parseInt(charterId as string) : undefined
      );
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch message thread" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markMessageAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Review routes
  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get("/api/reviews/captain/:captainId", async (req, res) => {
    try {
      const captainId = parseInt(req.params.captainId);
      const reviews = await storage.getReviewsByCaptain(captainId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Captain routes
  app.get("/api/captains", async (req, res) => {
    try {
      const captains = await storage.getAllCaptains();
      res.json(captains);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captains" });
    }
  });

  app.get("/api/captains/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const captain = await storage.getCaptain(id);
      
      if (!captain) {
        return res.status(404).json({ message: "Captain not found" });
      }
      
      res.json(captain);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captain" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
