// server/routes.ts
import type { Express, Request, Response } from "express";
import express from "express";
import path from "path";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";

import { db } from "./db";
import {
  users,
  captains,
  charters,
  type User,
} from "@shared/schema";
import { and, eq, ilike } from "drizzle-orm";

/**
 * Tipado de session para evitar los errores de TS:
 */
declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: User;
  }
}

const PgStore = connectPg(session);

function andAll<T>(conds: (T | undefined)[]) {
  const filtered = conds.filter(Boolean) as T[];
  if (filtered.length === 0) return undefined as unknown as T;
  if (filtered.length === 1) return filtered[0];
  // @ts-expect-error drizzle acepta varargs
  return and(...filtered);
}

// ==============================
// registerRoutes
// ==============================
export async function registerRoutes(app: Express): Promise<Server> {
  // JSON y estáticos
  app.use(express.json());
  app.use(
    "/attached_assets",
    express.static(path.join(process.cwd(), "attached_assets"))
  );

  // Sesión en Postgres
  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: "session",
        createTableIfMissing: false,
      }),
      secret: process.env.SESSION_SECRET || "dev_secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  // ==============================
  // AUTH
  // ==============================
  app.post("/api/auth/local/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role } = req.body ?? {};
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing) return res.status(409).json({ message: "User already exists" });

      const hashed = await bcrypt.hash(password, 10);
      const userId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const [created] = await db.insert(users).values({
        id: userId,
        email,
        firstName: firstName ?? null,
        lastName: lastName ?? null,
        role: role ?? "user",
        password: hashed,
      }).returning();

      req.session.userId = created.id;
      req.session.user = created;
      return res.status(201).json(created);
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Failed to register" });
    }
  });

  app.post("/api/auth/local/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const [user] = await db.select().from(users).where(eq(users.email, email));
      if (!user) return res.status(401).json({ message: "Invalid email or password" });

      const hashed = (user as any).password as string | undefined;
      if (!hashed) return res.status(401).json({ message: "Invalid email or password" });

      const ok = await bcrypt.compare(password, hashed);
      if (!ok) return res.status(401).json({ message: "Invalid email or password" });

      req.session.userId = user.id;
      req.session.user = user;
      return res.json(user);
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) return res.status(401).json({ message: "Unauthorized" });

      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.json(user);
    } catch (err) {
      console.error("Get user error:", err);
      return res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  // ==============================
  // CHARTERS (JOIN con captains y users)
  // ==============================
  app.get("/api/charters", async (req: Request, res: Response) => {
    try {
      const { location, targetSpecies, duration, captainId } = req.query;

      const whereCond = andAll([
        eq(charters.isListed, true),
        location ? ilike(charters.location, `%${String(location)}%`) : undefined,
        targetSpecies ? ilike(charters.targetSpecies, `%${String(targetSpecies)}%`) : undefined,
        duration ? eq(charters.duration, String(duration)) : undefined,
        captainId ? eq(charters.captainId, Number(captainId)) : undefined,
      ]);

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
          c_id: captains.id,
          c_userId: captains.userId,
          c_bio: captains.bio,
          c_experience: captains.experience,
          c_licenseNumber: captains.licenseNumber,
          c_location: captains.location,
          c_avatar: captains.avatar,
          c_verified: captains.verified,
          c_rating: captains.rating,
          c_reviewCount: captains.reviewCount,
          u_firstName: users.firstName,
          u_lastName: users.lastName,
        })
        .from(charters)
        .leftJoin(captains, eq(charters.captainId, captains.id))
        .leftJoin(users, eq(captains.userId, users.id))
        .where(whereCond);

      const result = rows.map((r) => ({
        id: r.id,
        captainId: r.captainId,
        title: r.title,
        description: r.description,
        location: r.location,
        lat: r.lat,
        lng: r.lng,
        targetSpecies: r.targetSpecies,
        duration: r.duration,
        maxGuests: r.maxGuests,
        price: r.price,
        boatSpecs: r.boatSpecs,
        included: r.included,
        images: r.images ?? [],
        available: r.available,
        isListed: r.isListed,
        captain: r.c_id
          ? {
              id: r.c_id,
              userId: r.c_userId,
              bio: r.c_bio,
              experience: r.c_experience,
              licenseNumber: r.c_licenseNumber,
              location: r.c_location,
              avatar: r.c_avatar,
              verified: r.c_verified,
              rating: r.c_rating,
              reviewCount: r.c_reviewCount,
              name: [r.u_firstName, r.u_lastName].filter(Boolean).join(" ") || "Captain",
            }
          : undefined,
      }));

      return res.json(result);
    } catch (error) {
      console.error("Charters error:", error);
      return res.status(500).json({ message: "Failed to fetch charters" });
    }
  });

  app.get("/api/charters/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });

      const [r] = await db
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
          c_id: captains.id,
          c_userId: captains.userId,
          c_bio: captains.bio,
          c_experience: captains.experience,
          c_licenseNumber: captains.licenseNumber,
          c_location: captains.location,
          c_avatar: captains.avatar,
          c_verified: captains.verified,
          c_rating: captains.rating,
          c_reviewCount: captains.reviewCount,
          u_firstName: users.firstName,
          u_lastName: users.lastName,
        })
        .from(charters)
        .leftJoin(captains, eq(charters.captainId, captains.id))
        .leftJoin(users, eq(captains.userId, users.id))
        .where(eq(charters.id, id));

      if (!r) return res.status(404).json({ message: "Charter not found" });

      const result = {
        id: r.id,
        captainId: r.captainId,
        title: r.title,
        description: r.description,
        location: r.location,
        lat: r.lat,
        lng: r.lng,
        targetSpecies: r.targetSpecies,
        duration: r.duration,
        maxGuests: r.maxGuests,
        price: r.price,
        boatSpecs: r.boatSpecs,
        included: r.included,
        images: r.images ?? [],
        available: r.available,
        isListed: r.isListed,
        captain: r.c_id
          ? {
              id: r.c_id,
              userId: r.c_userId,
              bio: r.c_bio,
              experience: r.c_experience,
              licenseNumber: r.c_licenseNumber,
              location: r.c_location,
              avatar: r.c_avatar,
              verified: r.c_verified,
              rating: r.c_rating,
              reviewCount: r.c_reviewCount,
              name: [r.u_firstName, r.u_lastName].filter(Boolean).join(" ") || "Captain",
            }
          : undefined,
      };

      return res.json(result);
    } catch (error) {
      console.error("Get charter error:", error);
      return res.status(500).json({ message: "Failed to fetch charter" });
    }
  });

  // ==============================
  // CAPTAINS
  // ==============================
  app.get("/api/captains", async (req: Request, res: Response) => {
    try {
      const { search, rating, verified } = req.query;

      const whereCond = andAll([
        search ? ilike(users.firstName, `%${String(search)}%`) : undefined,
        search ? ilike(captains.location, `%${String(search)}%`) : undefined,
        rating ? eq(captains.rating, Number(rating)) : undefined,
        verified === "true" ? eq(captains.verified, true) : undefined,
      ]);

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
          u_firstName: users.firstName,
          u_lastName: users.lastName,
        })
        .from(captains)
        .leftJoin(users, eq(captains.userId, users.id))
        .where(whereCond);

      const result = rows.map((r) => ({
        id: r.id,
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
          firstName: r.u_firstName,
          lastName: r.u_lastName,
        },
      }));

      return res.json(result);
    } catch (error) {
      console.error("Captains error:", error);
      return res.status(500).json({ message: "Failed to fetch captains" });
    }
  });

  app.get("/api/captains/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid captain id" });

      const [row] = await db
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
          u_firstName: users.firstName,
          u_lastName: users.lastName,
        })
        .from(captains)
        .leftJoin(users, eq(captains.userId, users.id))
        .where(eq(captains.id, id));

      if (!row) return res.status(404).json({ message: "Captain not found" });

      const result = {
        id: row.id,
        userId: row.userId,
        bio: row.bio,
        experience: row.experience,
        licenseNumber: row.licenseNumber,
        location: row.location,
        avatar: row.avatar,
        verified: row.verified,
        rating: row.rating,
        reviewCount: row.reviewCount,
        user: {
          firstName: row.u_firstName,
          lastName: row.u_lastName,
        },
      };

      return res.json(result);
    } catch (error) {
      console.error("Get captain error:", error);
      return res.status(500).json({ message: "Failed to fetch captain" });
    }
  });

  // ==============================
  // HTTP SERVER
  // ==============================
  const httpServer = createServer(app);
  return httpServer;
}
