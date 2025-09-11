// server/routes.ts
import type { Express, Request, Response } from "express";
import express from "express";
import path from "path";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import cors from "cors";

import { db } from "./db";
import {
  users as usersTable,
  captains as captainsTable,
  charters as chartersTable,
  bookings as bookingsTable,
  availability as availabilityTable,
  messages,
} from "@shared/schema";
import { and, eq, ilike, inArray, gte, lt } from "drizzle-orm";

/**
 * SessionData: solo guardamos userId para evitar conflictos de tipos
 * con otras declaraciones del proyecto.
 */
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const PgStore = connectPg(session);

// Helper para componer condiciones dinámicas en Drizzle
function andAll<T>(conds: (T | undefined)[]) {
  const filtered = conds.filter(Boolean) as T[];
  if (filtered.length === 0) return undefined as unknown as T;
  if (filtered.length === 1) return filtered[0];
  // drizzle and(...args)
  // @ts-ignore - helper variádico
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

  // ✅ CORS con credenciales (debe ir ANTES de session)
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        // "https://tu-dominio.com",
      ],
      credentials: true,
    })
  );

  // ✅ Confiar en proxy (Replit/Render/Vercel/Nginx)
  app.set("trust proxy", 1);

  // Sesión en Postgres (tabla: session)
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
        secure: false,     // true solo si usas HTTPS
        sameSite: "lax",   // necesario para que viaje cookie con fetch+credentials
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 semana
      },
    })
  );

  // (Opcional) Endpoint para depurar la sesión
  app.get("/api/debug/session", (req: Request, res: Response) => {
    res.json({ userId: req.session.userId ?? null });
  });

  // ==============================
  // AUTH LOCAL
  // ==============================

  // Crear cuenta
  app.post("/api/auth/local/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role } = req.body ?? {};

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const [existing] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      if (existing) {
        return res.status(409).json({ message: "User already exists" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const userId =
        "local_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);

      const [created] = await db
        .insert(usersTable)
        .values({
          id: userId,
          email,
          firstName: firstName ?? null,
          lastName: lastName ?? null,
          role: role ?? "user",
          // algunos tipos de schema no declaran password, forzamos tipo:
          password: hashed as any,
        })
        .returning();

      req.session.userId = created.id;
      return res.status(201).json(created);
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Failed to register" });
    }
  });

  // Login
  app.post("/api/auth/local/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const [userRow] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));
      if (!userRow) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const hashed = (userRow as any).password as string | undefined;
      if (!hashed) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const ok = await bcrypt.compare(password, hashed);
      if (!ok) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = userRow.id;
      return res.json(userRow);
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Failed to login" });
    }
  });

  // Obtener usuario actual
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const [userRow] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.session.userId));
      if (!userRow) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.json(userRow);
    } catch (err) {
      console.error("Get user error:", err);
      return res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // ==============================
  // USERS (Perfil + Password)
  // ==============================

  // PATCH /api/users/me → actualizar perfil del usuario logueado
  app.patch("/api/users/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { firstName, lastName } = req.body ?? {};

      const [updated] = await db
        .update(usersTable)
        .set({
          firstName: typeof firstName === "string" ? firstName : null,
          lastName: typeof lastName === "string" ? lastName : null,
        })
        .where(eq(usersTable.id, req.session.userId))
        .returning();

      return res.json(updated);
    } catch (err) {
      console.error("Error updating profile:", err);
      return res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Cambiar contraseña
  app.patch("/api/users/me/password", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { currentPassword, oldPassword, newPassword } = req.body ?? {};
      const current = currentPassword || oldPassword;
      if (!current || !newPassword) {
        return res
          .status(400)
          .json({ error: "Both current/old and newPassword are required" });
      }

      const [userRow] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.session.userId));
      if (!userRow) return res.status(404).json({ error: "User not found" });

      const hashed = (userRow as any).password as string | undefined;
      if (!hashed)
        return res.status(400).json({ error: "User has no password" });

      const ok = await bcrypt.compare(current, hashed);
      if (!ok) return res.status(400).json({ error: "Current password incorrect" });

      const newHashed = await bcrypt.hash(newPassword, 10);
      const [updated] = await db
        .update(usersTable)
        .set({ password: newHashed as any })
        .where(eq(usersTable.id, req.session.userId))
        .returning();

      return res.json({ success: true, id: updated.id });
    } catch (err) {
      console.error("Password change error:", err);
      return res.status(500).json({ error: "Failed to change password" });
    }
  });

  // ==============================
  // AVAILABILITY
  // ==============================

  // GET /api/availability?charterId=123&month=2025-09
  app.get("/api/availability", async (req: Request, res: Response) => {
    try {
      const charterId = Number(req.query.charterId);
      const month = String(req.query.month || "");
      if (!Number.isFinite(charterId) || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: "Invalid charterId or month" });
      }

      const [year, mm] = month.split("-").map(Number);
      const from = new Date(Date.UTC(year, mm - 1, 1, 0, 0, 0));
      const to = new Date(Date.UTC(year, mm, 1, 0, 0, 0)); // excluyente

      const rows = await db
        .select({
          id: availabilityTable.id,
          charterId: availabilityTable.charterId,
          date: availabilityTable.date,
          slots: availabilityTable.slots,
          bookedSlots: availabilityTable.bookedSlots,
        })
        .from(availabilityTable)
        .where(
          and(
            eq(availabilityTable.charterId, charterId),
            gte(availabilityTable.date as any, from as any),
            lt(availabilityTable.date as any, to as any),
          )
        );

      const result = rows.map(r => ({
        ...r,
        date: r.date instanceof Date ? r.date.toISOString() : r.date,
      }));

      return res.json(result);
    } catch (err) {
      console.error("Availability list error:", err);
      return res.status(500).json({ error: "Failed to fetch availability" });
    }
  });

  // POST /api/availability  { charterId, date, slots }
  app.post("/api/availability", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

      const { charterId, date, slots } = req.body ?? {};
      const cid = Number(charterId);
      const s = Number(slots);
      const d = date ? new Date(date) : null;

      if (!Number.isFinite(cid) || !d || !Number.isFinite(s) || s <= 0) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      // Verificamos que el charter pertenezca al capitán logueado
      const [cap] = await db.select({ id: captainsTable.id }).from(captainsTable).where(eq(captainsTable.userId, req.session.userId));
      if (!cap) return res.status(403).json({ error: "Captain profile required" });

      const [ownCharter] = await db
        .select({ id: chartersTable.id, captainId: chartersTable.captainId })
        .from(chartersTable)
        .where(eq(chartersTable.id, cid));

      if (!ownCharter || ownCharter.captainId !== cap.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const [created] = await db
        .insert(availabilityTable)
        .values({
          charterId: cid,
          date: d as any,
          slots: s,
          bookedSlots: 0,
        })
        .returning();

      return res.status(201).json(created);
    } catch (err) {
      console.error("Availability create error:", err);
      return res.status(500).json({ error: "Failed to create availability" });
    }
  });

  // PATCH /api/availability/:id  { slots }
  app.patch("/api/availability/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

      const id = Number(req.params.id);
      const { slots } = req.body ?? {};
      const s = Number(slots);

      if (!Number.isFinite(id) || !Number.isFinite(s) || s <= 0) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      // Validar ownership del charter vinculado
      const [row] = await db
        .select({
          id: availabilityTable.id,
          charterId: availabilityTable.charterId,
          bookedSlots: availabilityTable.bookedSlots,
        })
        .from(availabilityTable)
        .where(eq(availabilityTable.id, id));

      if (!row) return res.status(404).json({ error: "Availability not found" });
      if (s < row.bookedSlots) {
        return res.status(400).json({ error: "slots cannot be less than bookedSlots" });
      }

      const [cap] = await db.select({ id: captainsTable.id }).from(captainsTable).where(eq(captainsTable.userId, req.session.userId));
      if (!cap) return res.status(403).json({ error: "Captain profile required" });

      const [ownCharter] = await db
        .select({ id: chartersTable.id, captainId: chartersTable.captainId })
        .from(chartersTable)
        .where(eq(chartersTable.id, row.charterId));

      if (!ownCharter || ownCharter.captainId !== cap.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const [updated] = await db
        .update(availabilityTable)
        .set({ slots: s })
        .where(eq(availabilityTable.id, id))
        .returning();

      return res.json(updated);
    } catch (err) {
      console.error("Availability patch error:", err);
      return res.status(500).json({ error: "Failed to update availability" });
    }
  });

  // DELETE /api/availability/:id
  app.delete("/api/availability/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

      // Validar ownership
      const [row] = await db
        .select({ id: availabilityTable.id, charterId: availabilityTable.charterId })
        .from(availabilityTable)
        .where(eq(availabilityTable.id, id));

      if (!row) return res.status(404).json({ error: "Availability not found" });

      const [cap] = await db.select({ id: captainsTable.id }).from(captainsTable).where(eq(captainsTable.userId, req.session.userId));
      if (!cap) return res.status(403).json({ error: "Captain profile required" });

      const [ownCharter] = await db
        .select({ id: chartersTable.id, captainId: chartersTable.captainId })
        .from(chartersTable)
        .where(eq(chartersTable.id, row.charterId));

      if (!ownCharter || ownCharter.captainId !== cap.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await db.delete(availabilityTable).where(eq(availabilityTable.id, id));
      return res.json({ success: true });
    } catch (err) {
      console.error("Availability delete error:", err);
      return res.status(500).json({ error: "Failed to delete availability" });
    }
  });

  // ==============================
  // CHARTERS
  // ==============================
  // /api/charters (filtros: location, targetSpecies, duration, captainId)
  app.get("/api/charters", async (req: Request, res: Response) => {
    try {
      const { location, targetSpecies, duration, captainId } = req.query;

      const whereCond = andAll([
        eq(chartersTable.isListed, true),
        location
          ? ilike(chartersTable.location, `%${String(location)}%`)
          : undefined,
        targetSpecies
          ? ilike(chartersTable.targetSpecies, `%${String(targetSpecies)}%`)
          : undefined,
        duration ? eq(chartersTable.duration, String(duration)) : undefined,
        captainId ? eq(chartersTable.captainId, Number(captainId)) : undefined,
      ]);

      const baseQuery = db
        .select({
          // Charter
          id: chartersTable.id,
          captainId: chartersTable.captainId,
          title: chartersTable.title,
          description: chartersTable.description,
          location: chartersTable.location,
          lat: chartersTable.lat,
          lng: chartersTable.lng,
          targetSpecies: chartersTable.targetSpecies,
          duration: chartersTable.duration,
          maxGuests: chartersTable.maxGuests,
          price: chartersTable.price,
          boatSpecs: chartersTable.boatSpecs,
          included: chartersTable.included,
          images: chartersTable.images,
          available: chartersTable.available,
          isListed: chartersTable.isListed,
          // Captain
          c_id: captainsTable.id,
          c_userId: captainsTable.userId,
          c_bio: captainsTable.bio,
          c_experience: captainsTable.experience,
          c_licenseNumber: captainsTable.licenseNumber,
          c_location: captainsTable.location,
          c_avatar: captainsTable.avatar,
          c_verified: captainsTable.verified,
          c_rating: captainsTable.rating,
          c_reviewCount: captainsTable.reviewCount,
          // User (capitán)
          u_firstName: usersTable.firstName,
          u_lastName: usersTable.lastName,
        })
        .from(chartersTable)
        .leftJoin(captainsTable, eq(chartersTable.captainId, captainsTable.id))
        .leftJoin(usersTable, eq(captainsTable.userId, usersTable.id));

      const rows = whereCond 
        ? await baseQuery.where(whereCond)
        : await baseQuery;

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
              name:
                [r.u_firstName, r.u_lastName].filter(Boolean).join(" ") ||
                "Captain",
            }
          : undefined,
      }));

      return res.json(result);
    } catch (error) {
      console.error("Charters error:", error);
      return res.status(500).json({ message: "Failed to fetch charters" });
    }
  });

  // /api/charters/recommended -> primeros 6 listados
  app.get("/api/charters/recommended", async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          id: chartersTable.id,
          captainId: chartersTable.captainId,
          title: chartersTable.title,
          description: chartersTable.description,
          location: chartersTable.location,
          lat: chartersTable.lat,
          lng: chartersTable.lng,
          targetSpecies: chartersTable.targetSpecies,
          duration: chartersTable.duration,
          maxGuests: chartersTable.maxGuests,
          price: chartersTable.price,
          boatSpecs: chartersTable.boatSpecs,
          included: chartersTable.included,
          images: chartersTable.images,
          available: chartersTable.available,
          isListed: chartersTable.isListed,
          c_id: captainsTable.id,
          c_userId: captainsTable.userId,
          c_bio: captainsTable.bio,
          c_experience: captainsTable.experience,
          c_licenseNumber: captainsTable.licenseNumber,
          c_location: captainsTable.location,
          c_avatar: captainsTable.avatar,
          c_verified: captainsTable.verified,
          c_rating: captainsTable.rating,
          c_reviewCount: captainsTable.reviewCount,
          u_firstName: usersTable.firstName,
          u_lastName: usersTable.lastName,
        })
        .from(chartersTable)
        .leftJoin(captainsTable, eq(chartersTable.captainId, captainsTable.id))
        .leftJoin(usersTable, eq(captainsTable.userId, usersTable.id))
        .where(eq(chartersTable.isListed, true))
        .limit(6);

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
              name:
                [r.u_firstName, r.u_lastName].filter(Boolean).join(" ") ||
                "Captain",
            }
          : undefined,
      }));

      return res.json(result);
    } catch (error) {
      console.error("Recommended charters error:", error);
      return res.status(500).json({ message: "Failed to fetch recommended charters" });
    }
  });

  // /api/charters/:id
  app.get("/api/charters/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const [r] = await db
        .select({
          id: chartersTable.id,
          captainId: chartersTable.captainId,
          title: chartersTable.title,
          description: chartersTable.description,
          location: chartersTable.location,
          lat: chartersTable.lat,
          lng: chartersTable.lng,
          targetSpecies: chartersTable.targetSpecies,
          duration: chartersTable.duration,
          maxGuests: chartersTable.maxGuests,
          price: chartersTable.price,
          boatSpecs: chartersTable.boatSpecs,
          included: chartersTable.included,
          images: chartersTable.images,
          available: chartersTable.available,
          isListed: chartersTable.isListed,
          c_id: captainsTable.id,
          c_userId: captainsTable.userId,
          c_bio: captainsTable.bio,
          c_experience: captainsTable.experience,
          c_licenseNumber: captainsTable.licenseNumber,
          c_location: captainsTable.location,
          c_avatar: captainsTable.avatar,
          c_verified: captainsTable.verified,
          c_rating: captainsTable.rating,
          c_reviewCount: captainsTable.reviewCount,
          u_firstName: usersTable.firstName,
          u_lastName: usersTable.lastName,
        })
        .from(chartersTable)
        .leftJoin(captainsTable, eq(chartersTable.captainId, captainsTable.id))
        .leftJoin(usersTable, eq(captainsTable.userId, usersTable.id))
        .where(eq(chartersTable.id, id));

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
              name:
                [r.u_firstName, r.u_lastName].filter(Boolean).join(" ") ||
                "Captain",
            }
          : undefined,
      };

      return res.json(result);
    } catch (error) {
      console.error("Get charter error:", error);
      return res.status(500).json({ message: "Failed to fetch charter" });
    }
  });

  // === CAPTAIN CHARTERS (create + list propios) ===
  app.post("/api/captain/charters", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const {
        title,
        description,
        location,
        duration,
        maxGuests,
        price,
        targetSpecies,
        boatSpecs,     // lo construiremos desde el FE si no viene
        included,      // texto
        images,        // string[] (urls/base64)
        lat,           // opcional
        lng,           // opcional
        isListed = true,
        available = true,
      } = req.body ?? {};

      // localizar el captain del usuario actual
      const [cap] = await db
        .select({ id: captainsTable.id })
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId));

      if (!cap) {
        return res.status(400).json({ message: "Captain profile required before creating charters" });
      }

      // validaciones mínimas
      if (!title || !description || !location || !duration || !targetSpecies) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!maxGuests || !price) {
        return res.status(400).json({ message: "maxGuests and price are required" });
      }

      const [created] = await db
        .insert(chartersTable)
        .values({
          captainId: cap.id,
          title: String(title),
          description: String(description),
          location: String(location),
          lat: typeof lat === "number" ? lat : null,
          lng: typeof lng === "number" ? lng : null,
          targetSpecies: String(targetSpecies),
          duration: String(duration),
          maxGuests: Number(maxGuests),
          price: Number(price),
          boatSpecs: boatSpecs ? String(boatSpecs) : null,
          included: included ? String(included) : null,
          images: Array.isArray(images) ? images.slice(0, 10) : [],
          available: Boolean(available),
          isListed: Boolean(isListed),
        })
        .returning();

      return res.status(201).json(created);
    } catch (err) {
      console.error("Create captain charter error:", err);
      return res.status(500).json({ message: "Failed to create charter" });
    }
  });

  // (opcional) listar charters propios del capitán logueado
  app.get("/api/captain/charters", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const [cap] = await db
        .select({ id: captainsTable.id })
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId));

      if (!cap) return res.json([]);

      const rows = await db
        .select()
        .from(chartersTable)
        .where(eq(chartersTable.captainId, cap.id));

      return res.json(rows);
    } catch (err) {
      console.error("List captain charters error:", err);
      return res.status(500).json({ message: "Failed to fetch captain charters" });
    }
  });

  // ==============================
  // CAPTAINS
  // ==============================
  
  app.get("/api/captains", async (req: Request, res: Response) => {
    try {
      const { search, rating, verified } = req.query;

      const whereCond = andAll([
        search ? ilike(usersTable.firstName, `%${String(search)}%`) : undefined,
        search ? ilike(captainsTable.location, `%${String(search)}%`) : undefined,
        rating ? eq(captainsTable.rating, String(rating)) : undefined, // rating es numeric(string)
        verified === "true" ? eq(captainsTable.verified, true) : undefined,
      ]);

      const baseQuery = db
        .select({
          id: captainsTable.id,
          userId: captainsTable.userId,
          bio: captainsTable.bio,
          experience: captainsTable.experience,
          licenseNumber: captainsTable.licenseNumber,
          location: captainsTable.location,
          avatar: captainsTable.avatar,
          verified: captainsTable.verified,
          rating: captainsTable.rating,
          reviewCount: captainsTable.reviewCount,
          u_firstName: usersTable.firstName,
          u_lastName: usersTable.lastName,
        })
        .from(captainsTable)
        .leftJoin(usersTable, eq(captainsTable.userId, usersTable.id));

      const rows = whereCond 
        ? await baseQuery.where(whereCond)
        : await baseQuery;

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

  // /api/captains/:id
  app.get("/api/captains/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ message: "Invalid captain id" });
      }

      const [row] = await db
        .select({
          id: captainsTable.id,
          userId: captainsTable.userId,
          bio: captainsTable.bio,
          experience: captainsTable.experience,
          licenseNumber: captainsTable.licenseNumber,
          location: captainsTable.location,
          avatar: captainsTable.avatar,
          verified: captainsTable.verified,
          rating: captainsTable.rating,
          reviewCount: captainsTable.reviewCount,
          u_firstName: usersTable.firstName,
          u_lastName: usersTable.lastName,
        })
        .from(captainsTable)
        .leftJoin(usersTable, eq(captainsTable.userId, usersTable.id))
        .where(eq(captainsTable.id, id));

      if (!row) {
        return res.status(404).json({ message: "Captain not found" });
      }

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

  // PATCH /api/captains/:id  -> actualiza datos básicos del capitán
  app.patch("/api/captains/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "Invalid captain id" });
      }

      // Traer el capitán y validar titularidad
      const [cap] = await db.select().from(captainsTable).where(eq(captainsTable.id, id));
      if (!cap) return res.status(404).json({ error: "Captain not found" });
      if (cap.userId !== req.session.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { bio, licenseNumber, location, experience } = req.body ?? {};

      const [updated] = await db
        .update(captainsTable)
        .set({
          bio: typeof bio === "string" ? bio : cap.bio,
          licenseNumber: typeof licenseNumber === "string" ? licenseNumber : cap.licenseNumber,
          location: typeof location === "string" ? location : cap.location,
          experience: typeof experience === "string" ? experience : cap.experience,
        })
        .where(eq(captainsTable.id, id))
        .returning();

      return res.json(updated);
    } catch (err) {
      console.error("Update captain error:", err);
      return res.status(500).json({ error: "Failed to update captain" });
    }
  });

  // ==============================
  // CAPTAIN EARNINGS
  // ==============================
    // CAPTAIN EARNINGS (derivado de bookings/charters del capitán)
    app.get("/api/captain/earnings", async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }

        const rawPeriod = String(req.query.period || "30days") as
          | "7days" | "30days" | "90days" | "year";

        // 1) hallar captain.id del usuario en sesión
        const [cap] = await db
          .select({ id: captainsTable.id })
          .from(captainsTable)
          .where(eq(captainsTable.userId, req.session.userId));
        if (!cap) return res.json({
          period: rawPeriod,
          nowISO: new Date().toISOString(),
          fromISO: new Date().toISOString(),
          totals: {
            totalEarnings: 0,
            completedEarnings: 0,
            avgPerTrip: 0,
            tripsCount: 0,
            completedTrips: 0,
            pendingAmount: 0,
            pendingTrips: 0,
            changePct: 0,
          },
          recentTransactions: [],
        });

        // 2) traemos todas las bookings del capitán (filtraremos en JS)
        const rows = await db
          .select({
            // booking
            b_id: bookingsTable.id,
            b_tripDate: bookingsTable.tripDate,
            b_totalPrice: bookingsTable.totalPrice,
            b_status: bookingsTable.status,
            b_guests: bookingsTable.guests,
            // charter
            c_title: chartersTable.title,
            c_captainId: chartersTable.captainId,
          })
          .from(bookingsTable)
          .leftJoin(chartersTable, eq(bookingsTable.charterId, chartersTable.id))
          .where(eq(chartersTable.captainId, cap.id));

        // 3) rango temporal actual y anterior para % cambio
        const now = new Date();
        const { from, prevFrom, prevTo } = (() => {
          const n = new Date();
          if (rawPeriod === "7days") {
            const from = new Date(n); from.setDate(from.getDate() - 7);
            const prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - 7);
            return { from, prevFrom, prevTo: from };
          }
          if (rawPeriod === "30days") {
            const from = new Date(n); from.setDate(from.getDate() - 30);
            const prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - 30);
            return { from, prevFrom, prevTo: from };
          }
          if (rawPeriod === "90days") {
            const from = new Date(n); from.setDate(from.getDate() - 90);
            const prevFrom = new Date(from); prevFrom.setDate(prevFrom.getDate() - 90);
            return { from, prevFrom, prevTo: from };
          }
          // year: desde el 1 de enero
          const from = new Date(n.getFullYear(), 0, 1);
          const prevFrom = new Date(n.getFullYear() - 1, 0, 1);
          const prevTo = new Date(n.getFullYear(), 0, 1);
          return { from, prevFrom, prevTo };
        })();

        const inRange = rows.filter((r) => {
          const d = r.b_tripDate instanceof Date ? r.b_tripDate : new Date(r.b_tripDate as any);
          return d >= from && d <= now;
        });

        const inPrevRange = rows.filter((r) => {
          const d = r.b_tripDate instanceof Date ? r.b_tripDate : new Date(r.b_tripDate as any);
          return d >= prevFrom && d < prevTo;
        });

        // 4) métricas
        const sum = (arr: typeof inRange, predicate: (r: any) => boolean) =>
          arr.reduce((acc, r) => (predicate(r) ? acc + Number(r.b_totalPrice || 0) : acc), 0);

        const count = (arr: typeof inRange, predicate: (r: any) => boolean) =>
          arr.reduce((acc, r) => (predicate(r) ? acc + 1 : acc), 0);

        const isCompleted = (r: any) => r.b_status === "completed";
        const isConfirmed = (r: any) => r.b_status === "confirmed";
        const isPending = (r: any) => r.b_status === "pending";

        const totalEarnings = sum(inRange, (r) => isCompleted(r) || isConfirmed(r));
        const completedEarnings = sum(inRange, isCompleted);
        const tripsCount = inRange.length;
        const completedTrips = count(inRange, isCompleted);
        const avgPerTrip = completedTrips > 0 ? completedEarnings / completedTrips : 0;
        const pendingAmount = sum(inRange, isPending);
        const pendingTrips = count(inRange, isPending);

        const prevTotal = sum(inPrevRange, (r) => isCompleted(r) || isConfirmed(r));
        const changePct = prevTotal === 0 ? (totalEarnings > 0 ? 100 : 0) : ((totalEarnings - prevTotal) / prevTotal) * 100;

        // 5) transacciones recientes en el periodo
        const recentTransactions = inRange
          .slice()
          .sort((a, b) => {
            const da = a.b_tripDate instanceof Date ? a.b_tripDate : new Date(a.b_tripDate as any);
            const db = b.b_tripDate instanceof Date ? b.b_tripDate : new Date(b.b_tripDate as any);
            return db.getTime() - da.getTime();
          })
          .slice(0, 12)
          .map((r) => ({
            id: r.b_id,
            charterTitle: r.c_title || "Charter",
            guests: Number(r.b_guests || 0),
            status: r.b_status as any,
            amount: Number(r.b_totalPrice || 0),
            dateISO: (r.b_tripDate instanceof Date ? r.b_tripDate : new Date(r.b_tripDate as any)).toISOString(),
          }));

        return res.json({
          period: rawPeriod,
          nowISO: now.toISOString(),
          fromISO: from.toISOString(),
          totals: {
            totalEarnings,
            completedEarnings,
            avgPerTrip,
            tripsCount,
            completedTrips,
            pendingAmount,
            pendingTrips,
            changePct,
          },
          recentTransactions,
        });
      } catch (err) {
        console.error("Captain earnings error:", err);
        return res.status(500).json({ error: "Failed to compute earnings" });
      }
    });

    // Export CSV del mismo dataset
    app.get("/api/captain/earnings/export", async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

        const rawPeriod = String(req.query.period || "30days") as
          | "7days" | "30days" | "90days" | "year";

        const [cap] = await db
          .select({ id: captainsTable.id })
          .from(captainsTable)
          .where(eq(captainsTable.userId, req.session.userId));
        if (!cap) return res.status(200).type("text/csv").send("id,charterTitle,guests,status,amount,date\n");

        const rows = await db
          .select({
            b_id: bookingsTable.id,
            b_tripDate: bookingsTable.tripDate,
            b_totalPrice: bookingsTable.totalPrice,
            b_status: bookingsTable.status,
            b_guests: bookingsTable.guests,
            c_title: chartersTable.title,
            c_captainId: chartersTable.captainId,
          })
          .from(bookingsTable)
          .leftJoin(chartersTable, eq(bookingsTable.charterId, chartersTable.id))
          .where(eq(chartersTable.captainId, cap.id));

        const now = new Date();
        const { from } = (() => {
          const n = new Date();
          if (rawPeriod === "7days") { const d = new Date(n); d.setDate(d.getDate() - 7); return { from: d }; }
          if (rawPeriod === "30days") { const d = new Date(n); d.setDate(d.getDate() - 30); return { from: d }; }
          if (rawPeriod === "90days") { const d = new Date(n); d.setDate(d.getDate() - 90); return { from: d }; }
          return { from: new Date(n.getFullYear(), 0, 1) };
        })();

        const inRange = rows.filter((r) => {
          const d = r.b_tripDate instanceof Date ? r.b_tripDate : new Date(r.b_tripDate as any);
          return d >= from && d <= now;
        });

        const esc = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
        const csvHeader = "id,charterTitle,guests,status,amount,date\n";
        const csvRows = inRange
          .sort((a, b) => {
            const da = a.b_tripDate instanceof Date ? a.b_tripDate : new Date(a.b_tripDate as any);
            const db = b.b_tripDate instanceof Date ? b.b_tripDate : new Date(b.b_tripDate as any);
            return db.getTime() - da.getTime();
          })
          .map((r) => [
            r.b_id,
            esc(r.c_title || "Charter"),
            r.b_guests ?? 0,
            r.b_status,
            Number(r.b_totalPrice || 0).toFixed(2),
            (r.b_tripDate instanceof Date ? r.b_tripDate : new Date(r.b_tripDate as any)).toISOString(),
          ].join(","))
          .join("\n");

        res.setHeader("Content-Disposition", `attachment; filename="earnings_${rawPeriod}.csv"`);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        return res.send(csvHeader + csvRows);
      } catch (err) {
        console.error("Captain earnings export error:", err);
        return res.status(500).json({ error: "Failed to export earnings" });
      }
    });

    // ==============================
    // CAPTAINS EXTRA (Onboarding + Suscripción - stub)
    // ==============================
    app.post("/api/captains/onboarding", async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        const { bio, licenseNumber, location, experience } = req.body ?? {};

        const [created] = await db
          .insert(captainsTable)
          .values({
            userId: req.session.userId,
            name: `${req.body.firstName || 'Captain'} ${req.body.lastName || ''}`.trim(),
            bio: bio || '',
            licenseNumber: licenseNumber || '',
            location: location || '',
            experience: experience || '',
            verified: false,
          })
          .returning();

        return res.status(201).json(created);
      } catch (err) {
        console.error("Onboarding error:", err);
        return res.status(500).json({ error: "Failed captain onboarding" });
      }
    });

    // Stub de suscripción (luego integraremos Stripe)
    app.post("/api/captains/subscribe", async (req: Request, res: Response) => {
      try {
        if (!req.session.userId)
          return res.status(401).json({ error: "Unauthorized" });
        const { plan } = req.body ?? {};
        console.log("[Stub] subscribe:", { userId: req.session.userId, plan });
        return res.json({ success: true, plan });
      } catch (err) {
        console.error("Subscribe error:", err);
        return res.status(500).json({ error: "Failed to subscribe" });
      }
    });

    // ==============================
    // BOOKINGS
    // ==============================

    // Crea una reserva (usa el usuario en sesión)
    app.post("/api/bookings", async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const { charterId, tripDate, guests, message } = req.body ?? {};
        const charterNumeric = Number(charterId);
        if (!Number.isFinite(charterNumeric) || !tripDate || !guests) {
          return res.status(400).json({ message: "Invalid payload" });
        }

        // Traer charter para precio/validaciones
        const [c] = await db
          .select({
            id: chartersTable.id,
            price: chartersTable.price,
            isListed: chartersTable.isListed,
          })
          .from(chartersTable)
          .where(eq(chartersTable.id, charterNumeric));

        if (!c || !c.isListed) {
          return res.status(400).json({ message: "Charter not available" });
        }

        const totalPrice = c.price;

        const [created] = await db
          .insert(bookingsTable)
          .values({
            userId: req.session.userId,
            charterId: charterNumeric,
            tripDate: new Date(tripDate),
            guests: Number(guests),
            totalPrice: totalPrice.toString(),
            status: "pending",
            message: message ?? null,
          })
          .returning();

        return res.status(201).json(created);
      } catch (error) {
        console.error("Create booking error:", error);
        return res.status(500).json({ message: "Failed to create booking" });
      }
    });

    // Mis reservas (con JOIN + shape para frontend)
    app.get("/api/bookings/me", async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const rows = await db
          .select({
            // Booking
            b_id: bookingsTable.id,
            b_userId: bookingsTable.userId,
            b_charterId: bookingsTable.charterId,
            b_tripDate: bookingsTable.tripDate,
            b_guests: bookingsTable.guests,
            b_totalPrice: bookingsTable.totalPrice,
            b_status: bookingsTable.status,
            b_message: bookingsTable.message,
            b_createdAt: bookingsTable.createdAt,
            // Charter
            c_id: chartersTable.id,
            c_captainId: chartersTable.captainId,
            c_title: chartersTable.title,
            c_description: chartersTable.description,
            c_location: chartersTable.location,
            c_lat: chartersTable.lat,
            c_lng: chartersTable.lng,
            c_targetSpecies: chartersTable.targetSpecies,
            c_duration: chartersTable.duration,
            c_maxGuests: chartersTable.maxGuests,
            c_price: chartersTable.price,
            c_boatSpecs: chartersTable.boatSpecs,
            c_included: chartersTable.included,
            c_images: chartersTable.images,
            c_available: chartersTable.available,
            c_isListed: chartersTable.isListed,
            // Captain
            cap_id: captainsTable.id,
            cap_userId: captainsTable.userId,
            cap_bio: captainsTable.bio,
            cap_experience: captainsTable.experience,
            cap_licenseNumber: captainsTable.licenseNumber,
            cap_location: captainsTable.location,
            cap_avatar: captainsTable.avatar,
            cap_verified: captainsTable.verified,
            cap_rating: captainsTable.rating,
            cap_reviewCount: captainsTable.reviewCount,
            // Captain User
            u_firstName: usersTable.firstName,
            u_lastName: usersTable.lastName,
          })
          .from(bookingsTable)
          .leftJoin(chartersTable, eq(bookingsTable.charterId, chartersTable.id))
          .leftJoin(captainsTable, eq(chartersTable.captainId, captainsTable.id))
          .leftJoin(usersTable, eq(captainsTable.userId, usersTable.id))
          .where(eq(bookingsTable.userId, req.session.userId));

        const result = rows.map((r) => ({
          id: r.b_id,
          userId: r.b_userId,
          charterId: r.b_charterId,
          tripDate:
            r.b_tripDate instanceof Date
              ? r.b_tripDate.toISOString()
              : new Date(r.b_tripDate as any).toISOString(),
          guests: r.b_guests,
          totalPrice: r.b_totalPrice,
          status: r.b_status,
          message: r.b_message,
          createdAt: r.b_createdAt
            ? r.b_createdAt instanceof Date
              ? r.b_createdAt.toISOString()
              : new Date(r.b_createdAt as any).toISOString()
            : undefined,
          charter: r.c_id
            ? {
                id: r.c_id,
                captainId: r.c_captainId,
                title: r.c_title,
                description: r.c_description,
                location: r.c_location,
                lat: r.c_lat,
                lng: r.c_lng,
                targetSpecies: r.c_targetSpecies,
                duration: r.c_duration,
                maxGuests: r.c_maxGuests,
                price: r.c_price,
                boatSpecs: r.c_boatSpecs,
                included: r.c_included,
                images: r.c_images ?? [],
                available: r.c_available,
                isListed: r.c_isListed,
                captain: r.cap_id
                  ? {
                      id: r.cap_id,
                      userId: r.cap_userId,
                      bio: r.cap_bio,
                      experience: r.cap_experience,
                      licenseNumber: r.cap_licenseNumber,
                      location: r.cap_location,
                      avatar: r.cap_avatar,
                      verified: r.cap_verified,
                      rating: r.cap_rating,
                      reviewCount: r.cap_reviewCount,
                      name:
                        [r.u_firstName, r.u_lastName]
                          .filter(Boolean)
                          .join(" ") || "Captain",
                    }
                  : undefined,
              }
            : undefined,
        }));

        return res.json(result);
      } catch (error) {
        console.error("Get my bookings error:", error);
        return res.status(500).json({ message: "Failed to fetch bookings" });
      }
    });

    // Cancelar booking (perteneciente al usuario)
    app.patch("/api/bookings/:id/cancel", async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) {
          return res.status(400).json({ message: "Invalid id" });
        }

        // Verificar titularidad
        const [b] = await db
          .select({
            id: bookingsTable.id,
            userId: bookingsTable.userId,
            status: bookingsTable.status,
          })
          .from(bookingsTable)
          .where(eq(bookingsTable.id, id));

        if (!b) return res.status(404).json({ message: "Booking not found" });
        if (b.userId !== req.session.userId) {
          return res.status(403).json({ message: "Forbidden" });
        }

        const [updated] = await db
          .update(bookingsTable)
          .set({ status: "cancelled" })
          .where(eq(bookingsTable.id, id))
          .returning();

        return res.json(updated);
      } catch (error) {
        console.error("Cancel booking error:", error);
        return res.status(500).json({ message: "Failed to cancel booking" });
      }
    });

    // ==============================
    // MESSAGES (snake_case compatible)
    // ==============================

    // Crear mensaje (usa usuario en sesión como sender_id)
    app.post("/api/messages", async (req: Request, res: Response) => {
      try {
        if (!req.session.userId) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        const { receiverId, content, charterId } = req.body ?? {};
        if (!receiverId || !content) {
          return res.status(400).json({ error: "Missing fields" });
        }

        const [inserted] = await db
          .insert(messages)
          .values({
            senderId: req.session.userId,
            receiverId: String(receiverId),
            charterId: charterId ?? null,
            content: String(content),
          })
          .returning();

        return res.status(201).json(inserted);
      } catch (err) {
        console.error("Error sending message:", err);
        return res.status(500).json({ error: "Failed to send message" });
      }
    });

    // Listar conversaciones (threads del usuario)
    app.get("/api/messages/threads/:userId", async (req: Request, res: Response) => {
      const userId = String(req.params.userId);

      try {
        // Obtenemos el último mensaje por par de usuarios (DISTINCT ON)
        const result = await db.execute(
          `
          SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
            id, sender_id, receiver_id, content, created_at
          FROM messages
          WHERE sender_id = '${userId}' OR receiver_id = '${userId}'
          ORDER BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), created_at DESC
          `
        );

        const rows = result.rows as any[];

        const participantIds = rows.map((r) =>
          r.sender_id === userId ? r.receiver_id : r.sender_id
        );

        if (participantIds.length === 0) {
          return res.json([]);
        }

        // Traer nombres/avatars de los participantes
        const participants =
          (
            await db
              .select()
              .from(usersTable)
              .where(inArray(usersTable.id, participantIds))
          ) || [];

        const threads = rows.map((row) => {
          const participantId =
            row.sender_id === userId ? row.receiver_id : row.sender_id;
          const participant = participants.find((u) => u.id === participantId);

          return {
            participant: participant || { id: participantId },
            lastMessage: {
              content: row.content,
              created_at: row.created_at,
            },
            unreadCount: 0, // si luego marcas read, puedes calcular aquí
          };
        });

        return res.json(threads);
      } catch (err) {
        console.error("Error fetching threads:", err);
        return res.status(500).json({ error: "Failed to fetch threads" });
      }
    });

    // Historial de conversación entre 2 usuarios
    app.get("/api/messages/thread", async (req: Request, res: Response) => {
      const userId1 = String(req.query.userId1 || "");
      const userId2 = String(req.query.userId2 || "");

      if (!userId1 || !userId2) {
        return res.status(400).json({ error: "Missing userId1 or userId2" });
      }

      try {
        const result = await db.execute(
          `
          SELECT id, sender_id, receiver_id, charter_id, content, read, created_at
          FROM messages
          WHERE (sender_id = '${userId1}' AND receiver_id = '${userId2}')
             OR (sender_id = '${userId2}' AND receiver_id = '${userId1}')
          ORDER BY created_at ASC
          `
        );

        return res.json(result.rows);
      } catch (err) {
        console.error("Error fetching thread:", err);
        return res.status(500).json({ error: "Failed to fetch messages" });
      }
    });

    // Marcar mensajes como leídos
    app.post("/api/messages/read", async (req: Request, res: Response) => {
      const { userId, participantId } = req.body ?? {};
      if (!userId || !participantId) {
        return res.status(400).json({ error: "Missing userId/participantId" });
      }

      try {
        await db.execute(
          `
          UPDATE messages
          SET read = TRUE
          WHERE receiver_id = '${String(userId)}' AND sender_id = '${String(participantId)}' AND read = FALSE
          `
        );

        return res.json({ success: true });
      } catch (err) {
        console.error("Error marking messages as read:", err);
        return res.status(500).json({ error: "Failed to update read status" });
      }
    });

    // ==============================
    // HTTP SERVER
    // ==============================
    const httpServer = createServer(app);
    return httpServer;
  }
