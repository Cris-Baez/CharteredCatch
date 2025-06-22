import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertBookingSchema, insertMessageSchema, insertReviewSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./replitAuth";
import path from "path";
import express from "express";

// Helper function to ensure captain profile exists
async function ensureCaptainExists(userId: string) {
  let captain = await storage.getCaptainByUserId(userId);
  
  if (!captain) {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    captain = await storage.createCaptain({
      userId: userId,
      bio: 'Experienced fishing captain ready to provide amazing charter experiences.',
      experience: '5+ years',
      licenseNumber: 'USCG-123456',
      location: 'Florida Keys'
    });
  }
  
  return captain;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Serve attached assets
  app.use("/attached_assets", express.static(path.join(process.cwd(), "attached_assets")));

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
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
      const userId = req.params.userId;
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
      const userId = req.params.userId;
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
        userId1 as string,
        userId2 as string,
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

  // Captain portal routes
  app.get("/api/captain/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const captain = await ensureCaptainExists(userId);

      const bookings = await storage.getBookingsByCaptain(captain.id);
      const totalRevenue = bookings.reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0);
      
      const stats = {
        totalBookings: bookings.length,
        totalRevenue,
        averageRating: captain.rating,
        responseRate: 98,
        upcomingTrips: bookings.filter(b => b.status === 'confirmed' && new Date(b.tripDate) > new Date()).length,
        newMessages: 0
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captain stats" });
    }
  });

  app.get("/api/captain/bookings/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const captain = await ensureCaptainExists(userId);

      const bookings = await storage.getBookingsByCaptain(captain.id);
      const recentBookings = bookings
        .sort((a, b) => new Date(b.tripDate).getTime() - new Date(a.tripDate).getTime())
        .slice(0, 5);
      
      res.json(recentBookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent bookings" });
    }
  });

  app.get("/api/captain/charters", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const captain = await ensureCaptainExists(userId);

      const charters = await storage.getChartersByCaptain(captain.id);
      res.json(charters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captain charters" });
    }
  });

  app.get("/api/captain/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const captain = await ensureCaptainExists(userId);

      const bookings = await storage.getBookingsByCaptain(captain.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captain bookings" });
    }
  });

  app.get("/api/captain/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await ensureCaptainExists(userId); // Ensure captain exists even if not needed for this endpoint
      
      const threads = await storage.getMessageThreads(userId);
      res.json(threads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captain messages" });
    }
  });

  app.get("/api/captain/earnings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const captain = await ensureCaptainExists(userId);

      const bookings = await storage.getBookingsByCaptain(captain.id);
      const earnings = {
        totalEarnings: bookings.reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0),
        thisMonth: bookings
          .filter(b => new Date(b.tripDate).getMonth() === new Date().getMonth())
          .reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0),
        pendingPayouts: bookings
          .filter(b => b.status === 'completed')
          .reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0)
      };
      
      res.json(earnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captain earnings" });
    }
  });

  app.get("/api/captain/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const captain = await ensureCaptainExists(userId);
      
      res.json(captain);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch captain profile" });
    }
  });

  app.post("/api/captain/charters", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const captain = await ensureCaptainExists(userId);
      
      const charterData = {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        duration: req.body.duration,
        maxGuests: req.body.maxGuests,
        price: req.body.price.toString(),
        targetSpecies: req.body.targetSpecies,
        boatType: req.body.boatType,
        experienceLevel: req.body.experienceLevel,
        included: req.body.includes || null,
        boatSpecs: `${req.body.boatType} | ${req.body.experienceLevel} | ${req.body.excludes || ''}`,
        images: req.body.photos || [],
        captainId: captain.id,
      };
      
      const charter = await storage.createCharter(charterData);
      res.json(charter);
    } catch (error) {
      console.error("Error creating charter:", error);
      res.status(500).json({ message: "Failed to create charter" });
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
