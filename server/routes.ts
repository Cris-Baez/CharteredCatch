// server/routes.ts
import type { Express, Request, Response } from "express";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import cors from "cors";
import Stripe from "stripe"; // Stripe integration for subscriptions
import multer from "multer";
import { db } from "./db";
import { storage } from "./storage";
import { randomBytes, randomUUID } from "crypto";

import {
  users as usersTable,
  captains as captainsTable,
  charters as chartersTable,
  bookings as bookingsTable,
  availability as availabilityTable,
  messages,
  reviews as reviewsTable,
  captainPaymentInfo as captainPaymentInfoTable,
  emailVerificationTokens,
  subscriptions as subscriptionsTable,
  insertCaptainPaymentInfoSchema,
  insertBookingSchema,
  insertReviewSchema,
  insertEmailVerificationTokenSchema,
  insertSubscriptionSchema,
  type CaptainPaymentInfo,
  type EmailVerificationToken,
  type Subscription,
} from "@shared/schema";
import { z } from "zod";
import { and, eq, ilike, inArray, gte, lt, or, isNotNull, desc, sql } from "drizzle-orm";
import { sendEmailVerification, sendWelcomeEmail, generateVerificationToken , sendEmail  , } from "./emailService";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { handleStripeWebhook } from "./stripe-webhooks";
import {
  makeCancelCaptainSubscriptionHandler,
  makeCreateCaptainSubscriptionHandler,
  makeGetCaptainSubscriptionHandler,
} from "./stripe-subscription-handlers";
import * as schema from "../shared/schema";

export const stripeWebhookRouter = express.Router();

stripeWebhookRouter.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (typeof signature !== "string") {
      res.status(400).send("Missing Stripe signature");
      return;
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(req.body ?? "");

    try {
      await handleStripeWebhook(rawBody, signature);
      res.status(200).send("OK");
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).send("Webhook error");
    }
  }
);

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

const fsPromises = fs.promises;
const ATTACHED_ASSETS_DIR = path.resolve(process.cwd(), "attached_assets");
const SECURE_UPLOADS_DIR = path.resolve(process.cwd(), "private_uploads");
const SECURE_UPLOAD_ROUTE = "/secure_uploads" as const;
const UNSUPPORTED_IMAGE_TYPE_MESSAGE = "Only JPEG, PNG, or GIF images are allowed.";
const SAFE_IMAGE_MIME_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/pjpeg", ".jpg"],
  ["image/jpg", ".jpg"],
  ["image/png", ".png"],
  ["image/x-png", ".png"],
  ["image/gif", ".gif"],
]);
const SAFE_IMAGE_CONTENT_TYPES = new Map<string, string>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".gif", "image/gif"],
]);
const SAFE_IMAGE_EXTENSIONS = new Set(SAFE_IMAGE_CONTENT_TYPES.keys());
const IMAGE_SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none'",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
} as const;

try {
  fs.mkdirSync(SECURE_UPLOADS_DIR, { recursive: true });
} catch (error) {
  console.error("Failed to ensure upload directory exists", error);
}

function getValidatedImageExtension(file: Express.Multer.File): string | null {
  const mimeType = (file.mimetype || "").toLowerCase();
  const extFromMime = SAFE_IMAGE_MIME_TYPES.get(mimeType);
  if (!extFromMime) {
    return null;
  }

  const originalExt = (file.originalname ? path.extname(file.originalname) : "").toLowerCase();
  if (originalExt) {
    if (!SAFE_IMAGE_EXTENSIONS.has(originalExt)) {
      return null;
    }

    if (originalExt === ".jpeg" || originalExt === ".jpg") {
      return extFromMime === ".jpg" ? ".jpg" : null;
    }

    if (originalExt !== extFromMime) {
      return null;
    }
  }

  return extFromMime;
}

function resolveSafeAssetPath(baseDir: string, rawPath: string | undefined): string | null {
  if (!rawPath) return null;

  const sanitized = rawPath.replace(/\\/g, "/");
  if (sanitized.includes("\0")) {
    return null;
  }

  const normalized = path.posix.normalize(sanitized);
  if (!normalized || normalized === "." || normalized.startsWith("..")) {
    return null;
  }

  const absolutePath = path.resolve(baseDir, normalized);
  const relativePath = path.relative(baseDir, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return absolutePath;
}

async function sendSafeImage(
  res: Response,
  absolutePath: string,
  {
    cacheControl,
    logLabel,
  }: {
    cacheControl: string;
    logLabel: string;
  }
): Promise<void> {
  const extension = path.extname(absolutePath).toLowerCase();
  if (!SAFE_IMAGE_EXTENSIONS.has(extension)) {
    res.status(403).json({ error: "Unsupported asset type" });
    return;
  }

  const contentType = SAFE_IMAGE_CONTENT_TYPES.get(extension);

  if (!contentType) {
    res.status(403).json({ error: "Unsupported asset type" });
    return;
  }

  try {
    const stats = await fsPromises.stat(absolutePath);
    res.set({
      ...IMAGE_SECURITY_HEADERS,
      "Cache-Control": cacheControl,
      "Content-Type": contentType,
      "Content-Length": stats.size.toString(),
      "Content-Disposition": "inline",
    });
    res.sendFile(absolutePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    console.error(`Failed to serve ${logLabel}:`, error);
    res.status(500).json({ error: "Failed to serve asset" });
  }
}

// Configure multer for file uploads
const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, SECURE_UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const normalizedExtension = getValidatedImageExtension(file);
    if (!normalizedExtension) {
      cb(new Error(UNSUPPORTED_IMAGE_TYPE_MESSAGE), "");
      return;
    }

    cb(null, `${randomUUID()}${normalizedExtension}`);
  }
});

// Configure multer with file validation
const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (!getValidatedImageExtension(file)) {
      cb(new Error(UNSUPPORTED_IMAGE_TYPE_MESSAGE));
      return;
    }
    cb(null, true);
  }
});

// Helper para componer condiciones dinámicas en Drizzle
function andAll<T>(conds: (T | undefined)[]) {
  const filtered = conds.filter(Boolean) as T[];
  if (filtered.length === 0) return undefined as unknown as T;
  if (filtered.length === 1) return filtered[0];
  // drizzle and(...args)
  // @ts-ignore - helper variádico
  return and(...filtered);
}

// Helper para convertir campos numéricos manejando nulos
function toNumberOrNull(value: any): number | null {
  return value != null ? Number(value) : null;
}

// Helper para enmascarar datos sensibles en payment info
function maskSensitivePaymentData(paymentInfo: CaptainPaymentInfo): CaptainPaymentInfo {
  return {
    ...paymentInfo,
    accountNumber: paymentInfo.accountNumber ? `****${paymentInfo.accountNumber.slice(-4)}` : null,
    routingNumber: paymentInfo.routingNumber ? `****${paymentInfo.routingNumber.slice(-4)}` : null,
  };
}

// Helper para verificar si la información de pago está completa
function isPaymentInfoComplete(paymentInfo: CaptainPaymentInfo): boolean {
  const method = paymentInfo.preferredMethod;
  
  switch (method) {
    case "bank":
      return !!(paymentInfo.bankName && paymentInfo.accountNumber && 
                paymentInfo.routingNumber && paymentInfo.accountHolderName);
    case "paypal":
      return !!paymentInfo.paypalEmail;
    case "venmo":
      return !!paymentInfo.venmoUsername;
    case "zelle":
      return !!paymentInfo.zelleEmail;
    case "cashapp":
      return !!paymentInfo.cashAppTag;
    default:
      return false;
  }
}

// Serializador para charters
function serializeCharter(row: any) {
  return {
    ...row,
    price: Number(row.price),
    lat: toNumberOrNull(row.lat),
    lng: toNumberOrNull(row.lng),
    captain: row.captain ? {
      ...row.captain,
      rating: toNumberOrNull(row.captain.rating),
      reviewCount: toNumberOrNull(row.captain.reviewCount)
    } : row.captain
  };
}

// Serializador para bookings
function serializeBooking(row: any) {
  return {
    ...row,
    totalPrice: Number(row.totalPrice),
    charter: row.charter ? serializeCharter(row.charter) : row.charter
  };
}

// ==============================
// registerRoutes
// ==============================
export async function registerRoutes(app: Express): Promise<Server> {
  // JSON y estáticos (límite configurado en index.ts)
  // app.use(express.json()); // Ya configurado en index.ts con 50MB limit
  app.get("/attached_assets/:assetPath(*)", async (req: Request, res: Response) => {
    const absolutePath = resolveSafeAssetPath(ATTACHED_ASSETS_DIR, req.params.assetPath);
    if (!absolutePath) {
      return res.status(404).json({ error: "Asset not found" });
    }

    await sendSafeImage(res, absolutePath, {
      cacheControl: "public, max-age=3600, immutable",
      logLabel: "attached asset",
    });
  });

  app.get(`${SECURE_UPLOAD_ROUTE}/:assetPath(*)`, async (req: Request, res: Response) => {
    const absolutePath = resolveSafeAssetPath(SECURE_UPLOADS_DIR, req.params.assetPath);
    if (!absolutePath) {
      return res.status(404).json({ error: "Asset not found" });
    }

    await sendSafeImage(res, absolutePath, {
      cacheControl: "private, no-store",
      logLabel: "uploaded asset",
    });
  });

  // ✅ CORS con credenciales (debe ir ANTES de session)
  const getAllowedOrigins = () => {
    const origins = [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];

    // Add specific Replit deployment URLs based on environment
    if (process.env.REPLIT_DEPLOYMENT === "1") {
      // Get the specific Replit app URL from environment
      const replitUrl = process.env.REPL_SLUG ? 
        `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.app` : 
        null;
      
      if (replitUrl) {
        origins.push(replitUrl);
      }
      
      // Fallback for common Replit patterns (but more restrictive)
      if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
        origins.push(`https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev`);
      }
    }

    // Allow additional origins from environment variable for flexibility
    if (process.env.ALLOWED_ORIGINS) {
      const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
      origins.push(...envOrigins);
    }

    return origins;
  };

  app.use(
    cors({
      origin: getAllowedOrigins(),
      credentials: true,
      // Additional security headers
      optionsSuccessStatus: 200,
    })
  );

  // ✅ Confiar en proxy (Replit/Render/Vercel/Nginx)
  app.set("trust proxy", 1);

  // Sesión en Postgres (tabla: session)
  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: "sessions",
        createTableIfMissing: false,
      }),
      secret: process.env.SESSION_SECRET || "dev_secret_insecure_change_in_production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        // Auto secure cookies based on connection type (HTTP/HTTPS)
        secure: "auto",
        sameSite: "lax",
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

      // Validar y sanitizar el rol - solo permitir "user" y "captain"
      const allowedRoles = ["user", "captain"];
      const sanitizedRole = allowedRoles.includes(role) ? role : "user";

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

      // Usar transacción para garantizar atomicidad
      const result = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(usersTable)
          .values({
            id: userId,
            email,
            firstName: firstName ?? null,
            lastName: lastName ?? null,
            role: sanitizedRole,
            password: hashed as any,
          })
          .returning();

        // Si el rol creado es captain, crear automáticamente el perfil de captain
        if (created.role === "captain") {
          await tx.insert(captainsTable).values({
            userId: created.id,
            name: `${firstName || "Captain"} ${lastName || ""}`.trim(),
            bio: "",
            licenseNumber: "",
            location: "",
            experience: "",
            verified: false,
          });
        }

        return created;
      });

      // 🔑 ENVIAR VERIFICACIÓN DE EMAIL
      const token = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // expira en 1 hora

      await db.insert(emailVerificationTokens).values({
        email,
        token,
        expiresAt,
      });

      await sendEmailVerification(email, token, firstName);

      req.session.userId = result.id;

      // No devolver el hash de contraseña por seguridad
      const { password: hashedPassword, ...safeResult } = result;
      return res.status(201).json({
        ...safeResult,
        message: "User registered. Verification email sent.",
      });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ message: "Failed to register" });
    }
  });

  // Verificar email
  app.get("/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query as { token?: string };
      if (!token) {
        return res.status(400).send("Invalid verification link");
      }

      // Buscar token
      const [record] = await db
        .select()
        .from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.token, token));

      if (!record || record.expiresAt < new Date()) {
        return res.status(400).send("Verification link expired or invalid");
      }

      // Marcar usuario como verificado
      await db
        .update(usersTable)
        .set({ emailVerified: true })
        .where(eq(usersTable.email, record.email));

      // Borrar token usado
      await db
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.email, record.email));

      // Buscar usuario
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, record.email));

      // Enviar welcome email
      if (user.email) {
        await sendWelcomeEmail(user.email, user.firstName || '');
      }

      // 🔑 Redirigir según rol
      if (user.role === "captain") {
        return res.redirect("/captain/onboarding");
      } else {
        return res.redirect("/dashboard");
      }
    } catch (err) {
      console.error("Verify email error:", err);
      return res.status(500).send("Server error");
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
      // No devolver el hash de contraseña por seguridad
      const { password: _, ...safeUserRow } = userRow as any;
      return res.json(safeUserRow);
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
      // No devolver el hash de contraseña por seguridad
      const { password: _, ...safeUserRow } = userRow as any;
      return res.json(safeUserRow);
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
  // EMAIL VERIFICATION
  // ==============================

  // Enviar email de verificación
  app.post("/api/email/send-verification", async (req: Request, res: Response) => {
    try {
      const { email, firstName } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Verificar que el usuario existe
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generar token de verificación
      const token = generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

      // Eliminar tokens existentes para este email
      await db
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.email, email));

      // Crear nuevo token
      await db
        .insert(emailVerificationTokens)
        .values({
          email,
          token,
          expiresAt,
        });

      // Enviar email
      const emailSent = await sendEmailVerification(email, token, firstName || user.firstName);

      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send verification email" });
      }

      res.json({ message: "Verification email sent successfully" });
    } catch (error) {
      console.error("Send verification email error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verificar email con token
  app.get("/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid token" });
      }

      // Buscar token
      const [tokenRecord] = await db
        .select()
        .from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.token, token));

      if (!tokenRecord) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Verificar que no haya expirado
      if (new Date() > tokenRecord.expiresAt) {
        // Eliminar token expirado
        await db
          .delete(emailVerificationTokens)
          .where(eq(emailVerificationTokens.token, token));
        
        return res.status(400).json({ message: "Token has expired" });
      }

      // Actualizar usuario como verificado
      await db.transaction(async (tx) => {
        await tx
          .update(usersTable)
          .set({ 
            emailVerified: true,
            emailVerifiedAt: new Date()
          })
          .where(eq(usersTable.email, tokenRecord.email));

        // Eliminar token usado
        await tx
          .delete(emailVerificationTokens)
          .where(eq(emailVerificationTokens.token, token));
      });

      // Buscar usuario para enviar email de bienvenida
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, tokenRecord.email));

      if (user && user.email) {
        // Enviar email de bienvenida
        await sendWelcomeEmail(user.email, user.firstName || undefined);
      }

      // Redirigir a la página de éxito o dashboard
      res.redirect("/?email-verified=true");
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Verificar estado de verificación de email
  app.get("/api/email/verification-status", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, req.session.userId));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        email: user.email,
        verified: user.emailVerified || false,
        verifiedAt: user.emailVerifiedAt
      });
    } catch (error) {
      console.error("Check verification status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
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

      // No devolver el hash de contraseña por seguridad
      const { password: _, ...safeUpdated } = updated as any;
      return res.json(safeUpdated);
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

  // POST /api/availability/bulk - Create multiple availability entries at once
  app.post("/api/availability/bulk", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

      const { charterId, dates, slots } = req.body ?? {};
      const cid = Number(charterId);
      const s = Number(slots);
      
      if (!Number.isFinite(cid) || !Array.isArray(dates) || !Number.isFinite(s) || s <= 0 || dates.length === 0) {
        return res.status(400).json({ error: "Invalid payload. Need charterId, dates array, and slots" });
      }

      // Verificar que el charter pertenezca al capitán logueado
      const [cap] = await db.select({ id: captainsTable.id }).from(captainsTable).where(eq(captainsTable.userId, req.session.userId));
      if (!cap) return res.status(403).json({ error: "Captain profile required" });

      const [ownCharter] = await db
        .select({ id: chartersTable.id, captainId: chartersTable.captainId })
        .from(chartersTable)
        .where(eq(chartersTable.id, cid));

      if (!ownCharter || ownCharter.captainId !== cap.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Crear múltiples entradas de disponibilidad
      const validDates = dates.filter(date => {
        try {
          const d = new Date(date);
          return !isNaN(d.getTime());
        } catch {
          return false;
        }
      });

      if (validDates.length === 0) {
        return res.status(400).json({ error: "No valid dates provided" });
      }

      const availabilityEntries = validDates.map(date => ({
        charterId: cid,
        date: new Date(date) as any,
        slots: s,
        bookedSlots: 0,
      }));

      const created = await db
        .insert(availabilityTable)
        .values(availabilityEntries)
        .returning();

      return res.status(201).json({ 
        message: `Created ${created.length} availability entries`,
        created: created.length,
        entries: created
      });
    } catch (err) {
      console.error("Bulk availability create error:", err);
      return res.status(500).json({ error: "Failed to create bulk availability" });
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
        location && String(location).trim() !== ""
          ? ilike(chartersTable.location, `%${String(location)}%`)
          : undefined,
        targetSpecies && String(targetSpecies).trim() !== ""
          ? ilike(chartersTable.targetSpecies, `%${String(targetSpecies)}%`)
          : undefined,
        duration && String(duration).trim() !== ""
          ? eq(chartersTable.duration, String(duration))
          : undefined,
        captainId && String(captainId).trim() !== ""
          ? eq(chartersTable.captainId, Number(captainId))
          : undefined,
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
        lat: r.lat != null ? Number(r.lat) : null,
        lng: r.lng != null ? Number(r.lng) : null,
        targetSpecies: r.targetSpecies,
        duration: r.duration,
        maxGuests: r.maxGuests,
        price: Number(r.price),
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
              rating: toNumberOrNull(r.c_rating),
              reviewCount: toNumberOrNull(r.c_reviewCount),
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
        lat: r.lat != null ? Number(r.lat) : null,
        lng: r.lng != null ? Number(r.lng) : null,
        targetSpecies: r.targetSpecies,
        duration: r.duration,
        maxGuests: r.maxGuests,
        price: Number(r.price),
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
              rating: toNumberOrNull(r.c_rating),
              reviewCount: toNumberOrNull(r.c_reviewCount),
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
        lat: r.lat != null ? Number(r.lat) : null,
        lng: r.lng != null ? Number(r.lng) : null,
        targetSpecies: r.targetSpecies,
        duration: r.duration,
        maxGuests: r.maxGuests,
        price: Number(r.price),
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
              rating: toNumberOrNull(r.c_rating),
              reviewCount: toNumberOrNull(r.c_reviewCount),
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

      // Validar imágenes (solo URLs)
      let validImages: string[] = [];
      if (Array.isArray(images)) {
        for (const img of images) {
          if (typeof img === "string") {
            if (!img.startsWith("http://") && !img.startsWith("https://")) {
              return res.status(400).json({ message: "Invalid image format, only URLs allowed" });
            }
            validImages.push(img);
          }
        }
        validImages = validImages.slice(0, 10);
      }

      const payload: typeof chartersTable.$inferInsert = {
        captainId: cap.id,
        title: String(title),
        description: String(description),
        location: String(location),
        lat: typeof lat === "number" ? lat.toString() : null,
        lng: typeof lng === "number" ? lng.toString() : null,
        targetSpecies: String(targetSpecies),
        duration: String(duration),
        maxGuests: Number(maxGuests),
        price: String(price),
        boatSpecs: boatSpecs ? String(boatSpecs) : null,
        included: included ? String(included) : null,
        images: validImages,
        available: Boolean(available),
        isListed: Boolean(isListed),
      };
      
      const [created] = await db
        .insert(chartersTable)
        .values(payload)
        .returning();

      return res.status(201).json(serializeCharter(created));
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

      return res.json(rows.map(serializeCharter));
    } catch (err) {
      console.error("List captain charters error:", err);
      return res.status(500).json({ message: "Failed to fetch captain charters" });
    }
  });

  // PATCH /api/charters/:id → actualizar charter (solo del captain propietario)
  app.patch("/api/charters/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const charterId = Number(req.params.id);
      if (!Number.isFinite(charterId)) {
        return res.status(400).json({ message: "Invalid charter ID" });
      }

      // Verificar que el usuario es un capitán
      const [cap] = await db
        .select({ id: captainsTable.id })
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId));

      if (!cap) {
        return res.status(403).json({ message: "Captain profile required" });
      }

      // Verificar que el charter pertenece al capitán
      const [existingCharter] = await db
        .select({ id: chartersTable.id, captainId: chartersTable.captainId })
        .from(chartersTable)
        .where(eq(chartersTable.id, charterId));

      if (!existingCharter) {
        return res.status(404).json({ message: "Charter not found" });
      }

      if (existingCharter.captainId !== cap.id) {
        return res.status(403).json({ message: "Not your charter" });
      }

      const {
        title,
        description,
        location,
        price,
        duration,
        maxGuests,
        isListed,
        images,
      } = req.body ?? {};

      // Construir objeto de actualización solo con campos válidos
      const updateData: any = {};

      if (title !== undefined) updateData.title = String(title);
      if (description !== undefined) updateData.description = String(description);
      if (location !== undefined) updateData.location = String(location);
      if (price !== undefined) updateData.price = String(price);
      if (duration !== undefined) updateData.duration = String(duration);
      if (maxGuests !== undefined) updateData.maxGuests = Number(maxGuests);
      if (isListed !== undefined) updateData.isListed = Boolean(isListed);

      if (images !== undefined) {
        if (Array.isArray(images)) {
          // Validar que sean URLs válidas
          const validImages = [];
          for (const img of images) {
            if (typeof img === "string") {
              if (!img.startsWith("http://") && !img.startsWith("https://")) {
                return res.status(400).json({ message: "Invalid image format, only URLs allowed" });
              }
              validImages.push(img);
            }
          }
          updateData.images = validImages.slice(0, 10);
        } else {
          updateData.images = [];
        }
      }

      const [updated] = await db
        .update(chartersTable)
        .set(updateData)
        .where(eq(chartersTable.id, charterId))
        .returning();

      return res.json(serializeCharter(updated));
    } catch (error) {
      console.error("Update charter error:", error);
      return res.status(500).json({ message: "Failed to update charter" });
    }
  });

  // DELETE /api/charters/:id (eliminar charter)
  app.delete("/api/charters/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const charterId = Number(req.params.id);
      if (!Number.isFinite(charterId)) {
        return res.status(400).json({ message: "Invalid charter ID" });
      }

      // Verificar que el usuario es un capitán
      const [cap] = await db
        .select({ id: captainsTable.id })
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId));

      if (!cap) {
        return res.status(403).json({ message: "Captain profile required" });
      }

      // Verificar que el charter pertenece al capitán
      const [existingCharter] = await db
        .select({ id: chartersTable.id, captainId: chartersTable.captainId })
        .from(chartersTable)
        .where(eq(chartersTable.id, charterId));

      if (!existingCharter) {
        return res.status(404).json({ message: "Charter not found" });
      }

      if (existingCharter.captainId !== cap.id) {
        return res.status(403).json({ message: "Not your charter" });
      }

      // Eliminar el charter
      await db.delete(chartersTable).where(eq(chartersTable.id, charterId));

      return res.json({ success: true, message: "Charter deleted successfully" });
    } catch (error) {
      console.error("Delete charter error:", error);
      return res.status(500).json({ message: "Failed to delete charter" });
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
        rating: toNumberOrNull(r.rating),
        reviewCount: toNumberOrNull(r.reviewCount),
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
            b_createdAt: bookingsTable.createdAt,
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

        // Para earnings, usamos una lógica híbrida: si el booking es muy reciente (últimas 24h)
        // y está confirmado, asumimos que se confirmó ahora. Esto simula tener un campo confirmedAt.
        // Idealmente deberíamos agregar un campo confirmedAt al schema para una solución más robusta.
        const inRange = rows.filter((r) => {
          // Solo incluir bookings confirmed/completed para earnings
          if (r.b_status !== "confirmed" && r.b_status !== "completed") {
            return false;
          }
          
          const createdAt = r.b_createdAt instanceof Date ? r.b_createdAt : new Date(r.b_createdAt as any);
          const is24hOld = (now.getTime() - createdAt.getTime()) > (24 * 60 * 60 * 1000);
          
          // Si es confirmed y es muy reciente, probablemente se confirmó ahora
          if (r.b_status === "confirmed" && !is24hOld) {
            return now >= from && now <= now; // Usar fecha actual para confirmed recientes
          }
          
          // Para completed o confirmed antiguos, usar createdAt
          return createdAt >= from && createdAt <= now;
        });

        const inPrevRange = rows.filter((r) => {
          // Solo incluir bookings confirmed/completed para earnings
          if (r.b_status !== "confirmed" && r.b_status !== "completed") {
            return false;
          }
          
          const createdAt = r.b_createdAt instanceof Date ? r.b_createdAt : new Date(r.b_createdAt as any);
          const prevNow = prevTo;
          const is24hOldPrev = (prevNow.getTime() - createdAt.getTime()) > (24 * 60 * 60 * 1000);
          
          // Si era confirmed y era reciente en el periodo anterior
          if (r.b_status === "confirmed" && !is24hOldPrev) {
            return prevNow >= prevFrom && prevNow < prevTo;
          }
          
          return createdAt >= prevFrom && createdAt < prevTo;
        });

        // 4) métricas - simplificadas porque ya filtramos por status
        const sum = (arr: typeof inRange, predicate: (r: any) => boolean) =>
          arr.reduce((acc, r) => (predicate(r) ? acc + Number(r.b_totalPrice || 0) : acc), 0);

        const count = (arr: typeof inRange, predicate: (r: any) => boolean) =>
          arr.reduce((acc, r) => (predicate(r) ? acc + 1 : acc), 0);

        const isCompleted = (r: any) => r.b_status === "completed";
        const isConfirmed = (r: any) => r.b_status === "confirmed";

        // Como ya filtramos por confirmed/completed, todos los inRange son earnings válidos
        const totalEarnings = inRange.reduce((acc, r) => acc + Number(r.b_totalPrice || 0), 0);
        const completedEarnings = sum(inRange, isCompleted);
        const tripsCount = inRange.length;
        const completedTrips = count(inRange, isCompleted);
        const avgPerTrip = tripsCount > 0 ? totalEarnings / tripsCount : 0;
        
        // Para pending, necesitamos buscar en todos los bookings (no solo inRange)
        const allPendingInRange = rows.filter((r) => {
          if (r.b_status !== "pending") return false;
          const d = r.b_createdAt instanceof Date ? r.b_createdAt : new Date(r.b_createdAt as any);
          return d >= from && d <= now;
        });
        const pendingAmount = allPendingInRange.reduce((acc, r) => acc + Number(r.b_totalPrice || 0), 0);
        const pendingTrips = allPendingInRange.length;

        const prevTotal = inPrevRange.reduce((acc, r) => acc + Number(r.b_totalPrice || 0), 0);
        const changePct = prevTotal === 0 ? (totalEarnings > 0 ? 100 : 0) : ((totalEarnings - prevTotal) / prevTotal) * 100;

        // 5) transacciones recientes en el periodo (ordenadas por fecha de booking)
        const recentTransactions = inRange
          .slice()
          .sort((a, b) => {
            const da = a.b_createdAt instanceof Date ? a.b_createdAt : new Date(a.b_createdAt as any);
            const db = b.b_createdAt instanceof Date ? b.b_createdAt : new Date(b.b_createdAt as any);
            return db.getTime() - da.getTime();
          })
          .slice(0, 12)
          .map((r) => ({
            id: r.b_id,
            charterTitle: r.c_title || "Charter",
            guests: Number(r.b_guests || 0),
            status: r.b_status as any,
            amount: Number(r.b_totalPrice || 0),
            dateISO: (r.b_createdAt instanceof Date ? r.b_createdAt : new Date(r.b_createdAt as any)).toISOString(),
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
  // CAPTAIN PROFILE MANAGEMENT
  // ==============================
  
  // GET /api/captain/me - obtener perfil del captain logueado
  app.get("/api/captain/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [captain] = await db
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
          // Campos de documentos para el onboarding
          licenseDocument: captainsTable.licenseDocument,
          boatDocumentation: captainsTable.boatDocumentation,
          insuranceDocument: captainsTable.insuranceDocument,
          identificationPhoto: captainsTable.identificationPhoto,
          localPermit: captainsTable.localPermit,
          cprCertification: captainsTable.cprCertification,
          drugTestingResults: captainsTable.drugTestingResults,
          onboardingCompleted: captainsTable.onboardingCompleted,
        })
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId));

      if (!captain) {
        return res.status(404).json({ error: "Captain profile not found" });
      }

      return res.json(captain);
    } catch (error) {
      console.error("Get captain me error:", error);
      return res.status(500).json({ error: "Failed to fetch captain profile" });
    }
  });

  // PATCH /api/captain/me - actualizar perfil del captain logueado
  app.patch("/api/captain/me", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const [captain] = await db
        .select()
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId));

      if (!captain) {
        return res.status(404).json({ error: "Captain profile not found" });
      }

      const { 
        bio, 
        licenseNumber, 
        location, 
        experience,
        name,
        avatar,
        // Document fields
        licenseDocument,
        boatDocumentation,
        insuranceDocument,
        identificationPhoto,
        localPermit,
        cprCertification,
        drugTestingResults
      } = req.body ?? {};

      // Build update object with only provided fields
      const updateData: any = {};
      
      if (typeof bio === "string") updateData.bio = bio;
      if (typeof licenseNumber === "string") updateData.licenseNumber = licenseNumber;
      if (typeof location === "string") updateData.location = location;
      if (typeof experience === "string") updateData.experience = experience;
      if (typeof name === "string") updateData.name = name;
      if (typeof avatar === "string") updateData.avatar = avatar;
      
      // Handle document uploads
      if (typeof licenseDocument === "string") updateData.licenseDocument = licenseDocument;
      if (typeof boatDocumentation === "string") updateData.boatDocumentation = boatDocumentation;
      if (typeof insuranceDocument === "string") updateData.insuranceDocument = insuranceDocument;
      if (typeof identificationPhoto === "string") updateData.identificationPhoto = identificationPhoto;
      if (typeof localPermit === "string") updateData.localPermit = localPermit;
      if (typeof cprCertification === "string") updateData.cprCertification = cprCertification;
      if (typeof drugTestingResults === "string") updateData.drugTestingResults = drugTestingResults;

      const [updated] = await db
        .update(captainsTable)
        .set(updateData)
        .where(eq(captainsTable.userId, req.session.userId))
        .returning();

      return res.json(updated);
    } catch (error) {
      console.error("Update captain me error:", error);
      return res.status(500).json({ error: "Failed to update captain profile" });
    }
  });

  // PATCH /api/captain/avatar - subir avatar del captain
  app.patch("/api/captain/avatar", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { avatar } = req.body ?? {};

      if (!avatar || typeof avatar !== "string") {
        return res.status(400).json({ error: "Avatar URL required" });
      }

      // Validar que sea una URL válida (http/https)
      if (!avatar.startsWith("http://") && !avatar.startsWith("https://")) {
        return res.status(400).json({ error: "Invalid avatar format, only URLs allowed" });
      }

      const [captain] = await db
        .select()
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId));

      if (!captain) {
        return res.status(404).json({ error: "Captain profile not found" });
      }

      const [updated] = await db
        .update(captainsTable)
        .set({ avatar })
        .where(eq(captainsTable.userId, req.session.userId))
        .returning();

      return res.json({ success: true, avatar: updated.avatar });
    } catch (error) {
      console.error("Update avatar error:", error);
      return res.status(500).json({ error: "Failed to update avatar" });
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

        const { bio, licenseNumber, location, experience, firstName, lastName } =
          req.body ?? {};

        const computedName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
        const updateData: Partial<typeof captainsTable.$inferInsert> = {};

        if (typeof bio === "string") {
          updateData.bio = bio;
        }
        if (typeof licenseNumber === "string") {
          updateData.licenseNumber = licenseNumber;
        }
        if (typeof location === "string") {
          updateData.location = location;
        }
        if (typeof experience === "string") {
          updateData.experience = experience;
        }
        if (computedName) {
          updateData.name = computedName;
        }

        const [existingCaptain] = await db
          .select({ id: captainsTable.id })
          .from(captainsTable)
          .where(eq(captainsTable.userId, req.session.userId));

        if (existingCaptain) {
          if (Object.keys(updateData).length === 0) {
            const [current] = await db
              .select()
              .from(captainsTable)
              .where(eq(captainsTable.id, existingCaptain.id));
            return res.status(200).json(current);
          }

          const [updated] = await db
            .update(captainsTable)
            .set(updateData)
            .where(eq(captainsTable.userId, req.session.userId))
            .returning();
          return res.status(200).json(updated);
        }

        const [created] = await db
          .insert(captainsTable)
          .values({
            userId: req.session.userId,
            name: computedName || "Captain",
            bio: typeof bio === "string" ? bio : "",
            licenseNumber: typeof licenseNumber === "string" ? licenseNumber : "",
            location: typeof location === "string" ? location : "",
            experience: typeof experience === "string" ? experience : "",
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
      const SLOTS_PER_BOOKING = 1;
      const AVAILABILITY_NOT_FOUND = "AVAILABILITY_NOT_FOUND";
      const AVAILABILITY_UPDATE_FAILED = "AVAILABILITY_UPDATE_FAILED";

      try {
        if (!req.session.userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Enhanced Zod validation for booking creation
        const bookingValidationSchema = insertBookingSchema.extend({
          charterId: z.number().positive().int(),
          tripDate: z.string().datetime().or(z.date()),
          guests: z.number().positive().int().min(1).max(50),
          message: z.string().max(1000).optional(),
        }).omit({
          userId: true, // Will be set from session
          totalPrice: true, // Will be calculated server-side
          status: true, // Will be set to 'pending'
        });

        const validationResult = bookingValidationSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ 
            message: "Invalid request data",
            errors: validationResult.error.issues.map(issue => ({
              field: issue.path.join('.'),
              message: issue.message
            }))
          });
        }

        const { charterId, tripDate, guests, message } = validationResult.data;

        // Enhanced charter validation with price integrity checks
        const [c] = await db
          .select({
            id: chartersTable.id,
            price: chartersTable.price,
            isListed: chartersTable.isListed,
            maxGuests: chartersTable.maxGuests,
            available: chartersTable.available,
            captainId: chartersTable.captainId,
          })
          .from(chartersTable)
          .where(eq(chartersTable.id, charterId));

        if (!c) {
          return res.status(404).json({ message: "Charter not found" });
        }

        if (!c.isListed || !c.available) {
          return res.status(400).json({ message: "Charter not available for booking" });
        }

        // Validate guest count against charter capacity
        if (guests > c.maxGuests) {
          return res.status(400).json({ 
            message: `Guests exceeds charter capacity. Maximum allowed: ${c.maxGuests}` 
          });
        }

        // Server-side price calculation and validation
        const charterPriceDecimal = Number(c.price);
        if (!Number.isFinite(charterPriceDecimal) || charterPriceDecimal <= 0) {
          return res.status(500).json({ message: "Invalid charter pricing configuration" });
        }

        // Calculate total price server-side (never trust client data for pricing)
        // Future enhancement: add guest-based pricing, date-based pricing, etc.
        const totalPrice = charterPriceDecimal;

        const tripDateValue =
          tripDate instanceof Date ? tripDate : new Date(tripDate);

        if (Number.isNaN(tripDateValue.getTime())) {
          return res.status(400).json({ message: "Invalid trip date" });
        }

        const created = await db.transaction(async (tx) => {
          const available = await storage.checkAvailability(
            charterId,
            tripDateValue,
            SLOTS_PER_BOOKING,
            tx,
          );

          if (!available) {
            throw new Error(AVAILABILITY_NOT_FOUND);
          }

          const [insertedBooking] = await tx
            .insert(bookingsTable)
            .values({
              userId: req.session.userId!,
              charterId: charterId,
              tripDate: tripDateValue,
              guests: Number(guests),
              totalPrice: totalPrice.toString(),
              status: "pending",
              message: message ?? null,
            })
            .returning();

          const updated = await storage.updateAvailabilitySlots(
            charterId,
            tripDateValue,
            SLOTS_PER_BOOKING,
            tx,
          );

          if (!updated) {
            throw new Error(AVAILABILITY_UPDATE_FAILED);
          }

          return insertedBooking;
        });

        return res.status(201).json(serializeBooking(created));
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === AVAILABILITY_NOT_FOUND) {
            return res.status(409).json({ message: "Selected date is no longer available" });
          }
          if (error.message === AVAILABILITY_UPDATE_FAILED) {
            return res.status(409).json({ message: "Unable to reserve the selected slot" });
          }
        }
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
          totalPrice: Number(r.b_totalPrice),
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
                lat: r.c_lat != null ? Number(r.c_lat) : null,
                lng: r.c_lng != null ? Number(r.c_lng) : null,
                targetSpecies: r.c_targetSpecies,
                duration: r.c_duration,
                maxGuests: r.c_maxGuests,
                price: Number(r.c_price),
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
                      rating: toNumberOrNull(r.cap_rating),
                      reviewCount: toNumberOrNull(r.cap_reviewCount),
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
  // STRIPE SUBSCRIPTION ENDPOINTS  
  // ==============================

  const stripeFactory = () =>
    new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil",
    });

  app.post(
    "/api/captain/subscribe",
    makeCreateCaptainSubscriptionHandler({
      db,
      stripeFactory,
    }),
  );

  app.get(
    "/api/captain/subscription",
    makeGetCaptainSubscriptionHandler({
      db,
      stripeFactory,
    }),
  );

  app.post(
    "/api/captain/subscription/cancel",
    makeCancelCaptainSubscriptionHandler({
      db,
      stripeFactory,
    }),
  );

  // CAPTAIN: Crear Stripe Checkout Session (Opción A - Redirección a página segura de Stripe)
  app.post("/api/captain/create-checkout-session", async (req, res) => {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ error: 'Stripe not configured' });
      }
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2025-08-27.basil",
      });

      // Buscar usuario
      const user = await db.query.users.findFirst({
        where: eq(usersTable.id, req.session.userId!),
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Crear o obtener Stripe customer
      let customer;
      if (user.stripeCustomerId) {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email || "",
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
        });

        // Actualizar usuario con customer ID
        await db
          .update(usersTable)
          .set({ stripeCustomerId: customer.id })
          .where(eq(usersTable.id, user.id));
      }

      // Crear Stripe Checkout Session - REDIRECCIONA A STRIPE SEGURO
      const session = await stripe.checkout.sessions.create({
        customer: customer.id,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Captain Professional Plan',
            },
            unit_amount: 4900, // $49.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
        subscription_data: {
          trial_period_days: 30,
        },
        success_url: `${req.protocol}://${req.get('host')}/captain/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/captain/subscription-cancel`,
        metadata: {
          userId: req.session.userId!.toString(),
        },
      });

      res.json({ 
        checkout_url: session.url,
        session_id: session.id
      });
    } catch (error: any) {
      console.error("Checkout session creation error:", error);
      res.status(500).json({ error: "Failed to create checkout session: " + error.message });
    }
  });

  // CAPTAIN: Crear suscripción (para "Do it later" option)
  app.post("/api/captain/subscription/create", async (req, res) => {
    try {
      // La autenticación y verificación ya la hizo el middleware
      const user = await db.query.users.findFirst({
        where: eq(usersTable.id, req.session.userId!),
      });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verificar si ya tiene suscripción activa
      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptionsTable.userId, req.session.userId!),
      });
      
      if (existingSub && existingSub.status === "active") {
        return res.json({ success: true, subscription: existingSub });
      }

      // Crear suscripción en estado "pending" (Do it later option)
      const subscription = await db.insert(subscriptionsTable).values({
        userId: req.session.userId!,
        status: "pending", // "pending" = usuario seleccionó "Do it later"
        planType: "captain_monthly",
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days trial
      }).returning();

      res.json({ success: true, subscription: subscription[0] });
    } catch (error: any) {
      console.error("Create subscription error:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });


  // CAPTAIN: Aprobar/rechazar booking
  app.patch("/api/captain/bookings/:id/approve", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bookingId = Number(req.params.id);
      if (!Number.isFinite(bookingId)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }

      // Verificar que el booking pertenezca a un charter del captain logueado
      const [cap] = await db.select({ id: captainsTable.id }).from(captainsTable).where(eq(captainsTable.userId, req.session.userId));
      if (!cap) return res.status(403).json({ error: "Captain profile required" });

      // Obtener datos completos del booking para enviar mensaje
      const [booking] = await db
        .select({
          id: bookingsTable.id,
          status: bookingsTable.status,
          charterId: bookingsTable.charterId,
          userId: bookingsTable.userId,
          totalPrice: bookingsTable.totalPrice,
          tripDate: bookingsTable.tripDate,
          guests: bookingsTable.guests,
          charterTitle: chartersTable.title,
        })
        .from(bookingsTable)
        .leftJoin(chartersTable, eq(bookingsTable.charterId, chartersTable.id))
        .where(and(eq(bookingsTable.id, bookingId), eq(chartersTable.captainId, cap.id)));

      // Obtener información de pago del capitán
      const [paymentInfo] = await db
        .select()
        .from(captainPaymentInfoTable)
        .where(eq(captainPaymentInfoTable.captainId, cap.id));

      if (!booking) {
        return res.status(404).json({ error: "Booking not found or not accessible" });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({ error: "Only pending bookings can be approved" });
      }

      const [updated] = await db
        .update(bookingsTable)
        .set({ status: "confirmed" })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      // Enviar mensaje automático al usuario sobre el pago
      try {
        const tripDateText = booking.tripDate 
          ? new Date(booking.tripDate).toLocaleDateString("en-US", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })
          : "your scheduled date";

        // Construir información de pago según método preferido del capitán
        let paymentInstructions = "Please contact me directly for payment details.";
        
        if (paymentInfo) {
          const method = paymentInfo.preferredMethod;
          
          switch (method) {
            case "bank":
              if (paymentInfo.bankName && paymentInfo.accountHolderName) {
                paymentInstructions = `💳 Bank Transfer:
• Bank: ${paymentInfo.bankName}
• Account Holder: ${paymentInfo.accountHolderName}
• Account Number: ${paymentInfo.accountNumber?.replace(/\d(?=\d{4})/g, "*") || "Contact me for details"}
• Routing Number: ${paymentInfo.routingNumber?.replace(/\d(?=\d{4})/g, "*") || "Contact me for details"}`;
              }
              break;
            case "paypal":
              if (paymentInfo.paypalEmail) {
                paymentInstructions = `💰 PayPal: Send payment to ${paymentInfo.paypalEmail}`;
              }
              break;
            case "venmo":
              if (paymentInfo.venmoUsername) {
                paymentInstructions = `📱 Venmo: Send payment to ${paymentInfo.venmoUsername}`;
              }
              break;
            case "zelle":
              if (paymentInfo.zelleEmail) {
                paymentInstructions = `🏦 Zelle: Send payment to ${paymentInfo.zelleEmail}`;
              }
              break;
            case "cashapp":
              if (paymentInfo.cashAppTag) {
                paymentInstructions = `💵 Cash App: Send payment to ${paymentInfo.cashAppTag}`;
              }
              break;
          }
          
          // Agregar instrucciones adicionales si las hay
          if (paymentInfo.instructions) {
            paymentInstructions += `\n\n📝 Additional Instructions:\n${paymentInfo.instructions}`;
          }
        }

        const paymentMessage = `🎉 Great news! Your booking for "${booking.charterTitle}" has been approved!

📅 Trip Date: ${tripDateText}
👥 Guests: ${booking.guests}
💰 Total: $${booking.totalPrice}

💳 PAYMENT INSTRUCTIONS:
${paymentInstructions}

📸 After payment, please upload a screenshot in your "My Trips" section to confirm payment was sent.

If you have any questions about payment or your trip, feel free to message me directly.

Looking forward to an amazing day on the water! 🛥️`;

        await db
          .insert(messages)
          .values({
            senderId: req.session.userId, // Captain sending the message
            receiverId: booking.userId,   // User who made the booking
            charterId: booking.charterId,
            content: paymentMessage,
          });
      } catch (messageError) {
        // Log error but don't fail the approval - the booking is already approved
        console.error("Failed to send approval message:", messageError);
      }

      return res.json(serializeBooking(updated));
    } catch (error) {
      console.error("Approve booking error:", error);
      return res.status(500).json({ error: "Failed to approve booking" });
    }
  });

  // CAPTAIN: Rechazar booking
  app.patch("/api/captain/bookings/:id/reject", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bookingId = Number(req.params.id);
      if (!Number.isFinite(bookingId)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }

      // Verificar que el booking pertenezca a un charter del captain logueado
      const [cap] = await db.select({ id: captainsTable.id }).from(captainsTable).where(eq(captainsTable.userId, req.session.userId));
      if (!cap) return res.status(403).json({ error: "Captain profile required" });

      const [booking] = await db
        .select({
          id: bookingsTable.id,
          status: bookingsTable.status,
          charterId: bookingsTable.charterId,
        })
        .from(bookingsTable)
        .leftJoin(chartersTable, eq(bookingsTable.charterId, chartersTable.id))
        .where(and(eq(bookingsTable.id, bookingId), eq(chartersTable.captainId, cap.id)));

      if (!booking) {
        return res.status(404).json({ error: "Booking not found or not accessible" });
      }

      if (booking.status !== "pending") {
        return res.status(400).json({ error: "Only pending bookings can be rejected" });
      }

      const [updated] = await db
        .update(bookingsTable)
        .set({ status: "cancelled" })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      return res.json(serializeBooking(updated));
    } catch (error) {
      console.error("Reject booking error:", error);
      return res.status(500).json({ error: "Failed to reject booking" });
    }
  });

  // CAPTAIN: Verificar payment proof
  app.patch("/api/captain/bookings/:id/verify-payment", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bookingId = Number(req.params.id);
      if (!Number.isFinite(bookingId)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }

      // Verificar que el booking pertenezca a un charter del captain logueado
      const [captain] = await db.select({ id: captainsTable.id }).from(captainsTable).where(eq(captainsTable.userId, req.session.userId));
      if (!captain) return res.status(403).json({ error: "Captain profile required" });

      const [booking] = await db
        .select({
          id: bookingsTable.id,
          paymentStatus: bookingsTable.paymentStatus,
          charterId: bookingsTable.charterId,
        })
        .from(bookingsTable)
        .leftJoin(chartersTable, eq(bookingsTable.charterId, chartersTable.id))
        .where(and(eq(bookingsTable.id, bookingId), eq(chartersTable.captainId, captain.id)));

      if (!booking) {
        return res.status(404).json({ error: "Booking not found or not accessible" });
      }

      if (booking.paymentStatus !== "proof_submitted") {
        return res.status(400).json({ error: "Only bookings with submitted payment proof can be verified" });
      }

      // Actualizar el booking para marcar payment como verified
      const [updatedBooking] = await db
        .update(bookingsTable)
        .set({ paymentStatus: "verified" })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      res.json({ 
        message: "Payment proof verified successfully", 
        booking: serializeBooking(updatedBooking) 
      });
    } catch (error) {
      console.error("Verify payment error:", error);
      return res.status(500).json({ error: "Failed to verify payment proof" });
    }
  });

  // CAPTAIN: Rechazar payment proof
  app.patch("/api/captain/bookings/:id/reject-payment", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bookingId = Number(req.params.id);
      if (!Number.isFinite(bookingId)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }

      // Verificar que el booking pertenezca a un charter del captain logueado
      const [captain] = await db.select({ id: captainsTable.id }).from(captainsTable).where(eq(captainsTable.userId, req.session.userId));
      if (!captain) return res.status(403).json({ error: "Captain profile required" });

      const [booking] = await db
        .select({
          id: bookingsTable.id,
          paymentStatus: bookingsTable.paymentStatus,
          charterId: bookingsTable.charterId,
        })
        .from(bookingsTable)
        .leftJoin(chartersTable, eq(bookingsTable.charterId, chartersTable.id))
        .where(and(eq(bookingsTable.id, bookingId), eq(chartersTable.captainId, captain.id)));

      if (!booking) {
        return res.status(404).json({ error: "Booking not found or not accessible" });
      }

      if (booking.paymentStatus !== "proof_submitted") {
        return res.status(400).json({ error: "Only bookings with submitted payment proof can be rejected" });
      }

      // Actualizar el booking para marcar payment como rejected
      const [updatedBooking] = await db
        .update(bookingsTable)
        .set({ 
          paymentStatus: "rejected",
          // Clear the payment proof URL so user can resubmit
          paymentProofUrl: null,
          paymentMethod: null
        })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      res.json({ 
        message: "Payment proof rejected successfully", 
        booking: serializeBooking(updatedBooking) 
      });
    } catch (error) {
      console.error("Reject payment error:", error);
      return res.status(500).json({ error: "Failed to reject payment proof" });
    }
  });

  // CAPTAIN: Ver todos sus bookings
  app.get("/api/captain/bookings", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Verificar que el usuario sea capitán
      const [captain] = await db
        .select({ id: captainsTable.id })
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId));

      if (!captain) {
        return res.status(403).json({ error: "Captain profile required" });
      }

      // Obtener todos los bookings para charters de este capitán
      const rows = await db
        .select({
          // Booking info
          b_id: bookingsTable.id,
          b_userId: bookingsTable.userId,
          b_charterId: bookingsTable.charterId,
          b_tripDate: bookingsTable.tripDate,
          b_guests: bookingsTable.guests,
          b_totalPrice: bookingsTable.totalPrice,
          b_status: bookingsTable.status,
          b_message: bookingsTable.message,
          b_createdAt: bookingsTable.createdAt,
          // Payment info
          b_paymentProofUrl: bookingsTable.paymentProofUrl,
          b_paymentStatus: bookingsTable.paymentStatus,
          b_paymentMethod: bookingsTable.paymentMethod,
          // Charter info
          c_title: chartersTable.title,
          c_location: chartersTable.location,
          c_duration: chartersTable.duration,
          // User info (who made the booking)
          u_firstName: usersTable.firstName,
          u_lastName: usersTable.lastName,
          u_email: usersTable.email,
        })
        .from(bookingsTable)
        .innerJoin(chartersTable, eq(bookingsTable.charterId, chartersTable.id))
        .innerJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
        .where(eq(chartersTable.captainId, captain.id))
        .orderBy(desc(bookingsTable.createdAt));

      // Transform to expected format
      const bookings = rows.map(row => ({
        id: row.b_id,
        userId: row.b_userId,
        charterId: row.b_charterId,
        tripDate: row.b_tripDate?.toISOString() || null,
        guests: row.b_guests,
        totalPrice: row.b_totalPrice,
        status: row.b_status,
        message: row.b_message,
        createdAt: row.b_createdAt?.toISOString() || null,
        // Payment info
        paymentProofUrl: row.b_paymentProofUrl,
        paymentStatus: row.b_paymentStatus,
        paymentMethod: row.b_paymentMethod,
        charter: {
          title: row.c_title,
          location: row.c_location,
          duration: row.c_duration,
        },
        user: {
          firstName: row.u_firstName,
          lastName: row.u_lastName,
          email: row.u_email,
        }
      }));

      res.json(bookings);
    } catch (error) {
      console.error("Get captain bookings error:", error);
      res.status(500).json({ error: "Failed to get bookings" });
    }
  });

  // USER: Crear payment intent para booking confirmado
  // DISABLED: Booking payments now use direct payment to captains, not Stripe
  /*
  app.post("/api/bookings/:id/create-payment-intent", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bookingId = Number(req.params.id);
      if (!Number.isFinite(bookingId)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }

      // Verificar que el booking pertenezca al usuario y esté confirmado
      const [booking] = await db
        .select({
          id: bookingsTable.id,
          userId: bookingsTable.userId,
          status: bookingsTable.status,
          totalPrice: bookingsTable.totalPrice,
        })
        .from(bookingsTable)
        .where(eq(bookingsTable.id, bookingId));

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.userId !== req.session.userId) {
        return res.status(403).json({ error: "Not your booking" });
      }

      if (booking.status !== "confirmed") {
        return res.status(400).json({ error: "Booking must be confirmed by captain first" });
      }

      // Crear payment intent para pago directo 
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-08-27.basil",
      });
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(Number(booking.totalPrice) * 100), // Convert to cents
        currency: "usd",
        metadata: {
          bookingId: booking.id.toString(),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Create payment intent error:", error);
      res.status(500).json({ error: "Failed to create payment intent: " + error.message });
    }
  });
  */

  // ==============================
  // CAPTAIN PAYMENT INFO
  // ==============================

  // CAPTAIN: Get payment info
  app.get("/api/captain/payment-info", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get captain profile using storage
      const captain = await storage.getCaptainByUserId(req.session.userId);
      if (!captain) {
        return res.status(403).json({ error: "Captain profile required" });
      }

      // Get payment info using storage
      const paymentInfo = await storage.getCaptainPaymentInfo(captain.id);
      if (!paymentInfo) {
        return res.status(404).json({ error: "Payment information not found" });
      }

      // Return masked sensitive data for security
      const maskedPaymentInfo = maskSensitivePaymentData(paymentInfo);
      res.json(maskedPaymentInfo);
    } catch (error) {
      console.error("Get payment info error:", error);
      res.status(500).json({ error: "Failed to get payment information" });
    }
  });

  // CAPTAIN: Save payment info
  app.post("/api/captain/payment-info", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Get captain profile using storage
      const captain = await storage.getCaptainByUserId(req.session.userId);
      if (!captain) {
        return res.status(403).json({ error: "Captain profile required" });
      }

      // Validate request body using Zod schema
      const validationResult = insertCaptainPaymentInfoSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid payment information", 
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      const validatedData = validationResult.data;

      // Save payment info using storage interface
      const paymentInfo = await storage.upsertCaptainPaymentInfo(captain.id, validatedData);

      // Return masked sensitive data for security
      const maskedPaymentInfo = maskSensitivePaymentData(paymentInfo);
      res.json(maskedPaymentInfo);
    } catch (error) {
      console.error("Save payment info error:", error);
      res.status(500).json({ error: "Failed to save payment information" });
    }
  });

  // SECURED: Get captain payment info by ID (for users making payments)
  app.get("/api/captain/:id/payment-info", async (req: Request, res: Response) => {
    try {
      const captainId = Number(req.params.id);
      if (!Number.isFinite(captainId)) {
        return res.status(400).json({ error: "Invalid captain ID" });
      }

      // SECURITY FIX: Require authentication
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized - login required" });
      }

      // Get payment info
      const paymentInfo = await storage.getCaptainPaymentInfo(captainId);
      if (!paymentInfo) {
        // Return empty payment info object instead of error
        return res.json({
          isEmpty: true,
          preferredMethod: null,
          message: "Captain has not configured payment information yet. Please contact them directly."
        });
      }

      // SECURITY FIX: Check if user has confirmed bookings with this captain
      const [userBooking] = await db
        .select()
        .from(bookingsTable)
        .leftJoin(chartersTable, eq(bookingsTable.charterId, chartersTable.id))
        .where(
          and(
            eq(bookingsTable.userId, req.session.userId),
            eq(chartersTable.captainId, captainId),
            eq(bookingsTable.status, "confirmed")
          )
        );

      if (!userBooking) {
        // User has no confirmed bookings with this captain - return masked info only
        const maskedPaymentInfo = maskSensitivePaymentData(paymentInfo);
        const isComplete = isPaymentInfoComplete(paymentInfo);
        return res.json({
          ...maskedPaymentInfo,
          isIncomplete: !isComplete,
          message: !isComplete ? "Payment information is incomplete. Please contact the captain directly." : undefined
        });
      }

      // User has confirmed booking - return unmasked payment info for actual payments
      const isComplete = isPaymentInfoComplete(paymentInfo);
      res.json({
        ...paymentInfo,
        isIncomplete: !isComplete,
        message: !isComplete ? "Payment information is incomplete. Please contact the captain directly." : undefined
      });
    } catch (error) {
      console.error("Get captain payment info error:", error);
      res.status(500).json({ error: "Failed to get payment information" });
    }
  });

  // ==============================
  // PAYMENT PROOF UPLOAD
  // ==============================

  // Upload payment proof for booking - FIXED with multer
  app.post("/api/bookings/:id/payment-proof", (req: Request, res: Response, next: any) => {
    // Handle multer upload with error handling
    upload.single("paymentProof")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Handle multer-specific errors
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File size too large. Maximum size is 100MB." });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ error: "Unexpected file field. Use 'paymentProof' field name." });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        // Handle custom validation errors (like file type)
        if (err.message === UNSUPPORTED_IMAGE_TYPE_MESSAGE) {
          return res.status(400).json({ error: UNSUPPORTED_IMAGE_TYPE_MESSAGE });
        }
        return res.status(400).json({ error: err.message });
      }
      // No errors, proceed with the handler
      next();
    });
  }, async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const bookingId = Number(req.params.id);
      if (!Number.isFinite(bookingId)) {
        return res.status(400).json({ error: "Invalid booking ID" });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ error: "No payment proof file uploaded" });
      }

      // Verify booking belongs to the user
      const [booking] = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.id, bookingId));

      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.userId !== req.session.userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (booking.status !== "confirmed") {
        return res.status(400).json({ error: "Can only upload payment proof for confirmed bookings" });
      }

      // Get payment method from form data
      const paymentMethod = req.body.paymentMethod || "unknown";
      
      // Use the uploaded file path
      const paymentProofUrl = `${SECURE_UPLOAD_ROUTE}/${req.file.filename}`;

      // Update booking with payment proof
      const [updatedBooking] = await db
        .update(bookingsTable)
        .set({
          paymentProofUrl,
          paymentMethod,
          paymentStatus: "proof_submitted"
        })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      res.json({ 
        message: "Payment proof uploaded successfully",
        booking: serializeBooking(updatedBooking),
        uploadedFile: {
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      });
    } catch (error) {
      console.error("Upload payment proof error:", error);
      res.status(500).json({ error: "Failed to upload payment proof" });
    }
  });

  // ==============================
  // ADMIN ENDPOINTS
  // ==============================

  // Helper function to check if user is admin
  const isAdmin = async (userId: string): Promise<boolean> => {
    try {
      const user = await storage.getUser(userId);
      return user?.role === 'admin';
    } catch {
      return false;
    }
  };

  // ADMIN: Get all captains with user data
  app.get("/api/admin/captains", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const admin = await isAdmin(req.session.userId);
      if (!admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Get all captains with user data
      const captainsWithUsers = await db
        .select({
          id: captainsTable.id,
          userId: captainsTable.userId,
          name: captainsTable.name,
          bio: captainsTable.bio,
          experience: captainsTable.experience,
          licenseNumber: captainsTable.licenseNumber,
          location: captainsTable.location,
          avatar: captainsTable.avatar,
          verified: captainsTable.verified,
          rating: captainsTable.rating,
          reviewCount: captainsTable.reviewCount,
          user: {
            id: usersTable.id,
            email: usersTable.email,
            firstName: usersTable.firstName,
            lastName: usersTable.lastName,
            role: usersTable.role,
            createdAt: usersTable.createdAt,
          }
        })
        .from(captainsTable)
        .leftJoin(usersTable, eq(captainsTable.userId, usersTable.id))
        .orderBy(captainsTable.id);

      res.json(captainsWithUsers);
    } catch (error) {
      console.error("Admin get captains error:", error);
      res.status(500).json({ error: "Failed to get captains" });
    }
  });

  // ADMIN: Update captain verification status
  app.patch("/api/admin/captains/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const admin = await isAdmin(req.session.userId);
      if (!admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const captainId = Number(req.params.id);
      const { verified } = req.body;

      if (!Number.isFinite(captainId)) {
        return res.status(400).json({ error: "Invalid captain ID" });
      }

      if (typeof verified !== "boolean") {
        return res.status(400).json({ error: "Verified must be boolean" });
      }

      const [updatedCaptain] = await db
        .update(captainsTable)
        .set({ verified })
        .where(eq(captainsTable.id, captainId))
        .returning();

      if (!updatedCaptain) {
        return res.status(404).json({ error: "Captain not found" });
      }

      res.json(updatedCaptain);
    } catch (error) {
      console.error("Admin update captain error:", error);
      res.status(500).json({ error: "Failed to update captain" });
    }
  });

  // ADMIN: Get all charters
  app.get("/api/admin/charters", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const admin = await isAdmin(req.session.userId);
      if (!admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const charters = await db
        .select()
        .from(chartersTable)
        .orderBy(chartersTable.id);

      res.json(charters);
    } catch (error) {
      console.error("Admin get charters error:", error);
      res.status(500).json({ error: "Failed to get charters" });
    }
  });

  // ADMIN: Update charter visibility
  app.patch("/api/admin/charters/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const admin = await isAdmin(req.session.userId);
      if (!admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const charterId = Number(req.params.id);
      const { isListed } = req.body;

      if (!Number.isFinite(charterId)) {
        return res.status(400).json({ error: "Invalid charter ID" });
      }

      if (typeof isListed !== "boolean") {
        return res.status(400).json({ error: "isListed must be boolean" });
      }

      const [updatedCharter] = await db
        .update(chartersTable)
        .set({ isListed })
        .where(eq(chartersTable.id, charterId))
        .returning();

      if (!updatedCharter) {
        return res.status(404).json({ error: "Charter not found" });
      }

      res.json(updatedCharter);
    } catch (error) {
      console.error("Admin update charter error:", error);
      res.status(500).json({ error: "Failed to update charter" });
    }
  });

  // ADMIN: Get subscription overview
  app.get("/api/admin/subscriptions", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const admin = await isAdmin(req.session.userId);
      if (!admin) {
        return res.status(403).json({ error: "Admin access required" });
      }

      const subscriptions = await db
        .select({
          userId: usersTable.id,
          email: usersTable.email,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          role: usersTable.role,
          stripeCustomerId: usersTable.stripeCustomerId,
          stripeSubscriptionId: usersTable.stripeSubscriptionId,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .where(or(
          isNotNull(usersTable.stripeCustomerId),
          isNotNull(usersTable.stripeSubscriptionId)
        ))
        .orderBy(usersTable.createdAt);

      res.json(subscriptions);
    } catch (error) {
      console.error("Admin get subscriptions error:", error);
      res.status(500).json({ error: "Failed to get subscriptions" });
    }
  });

  // ==============================
  // REVIEWS ENDPOINTS
  // ==============================

  // GET: Obtener reviews de un charter
  app.get("/api/reviews/:charterId", async (req: Request, res: Response) => {
    try {
      const charterId = Number(req.params.charterId);
      if (!Number.isFinite(charterId)) {
        return res.status(400).json({ error: "Invalid charter ID" });
      }

      const reviewsData = await db
        .select({
          id: reviewsTable.id,
          userId: reviewsTable.userId,
          rating: reviewsTable.rating,
          comment: reviewsTable.comment,
          createdAt: reviewsTable.createdAt,
          // User info
          userFirstName: usersTable.firstName,
          userLastName: usersTable.lastName,
          userAvatar: usersTable.profileImageUrl,
        })
        .from(reviewsTable)
        .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
        .where(eq(reviewsTable.charterId, charterId))
        .orderBy(desc(reviewsTable.createdAt));

      const reviews = reviewsData.map((r) => ({
        id: r.id,
        userId: r.userId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt?.toISOString(),
        user: {
          firstName: r.userFirstName,
          lastName: r.userLastName,
          avatar: r.userAvatar,
        },
      }));

      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  // POST: Crear nuevo review (solo después de 5h del viaje)
  app.post("/api/reviews", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Validar el request body usando drizzle-zod
      const validation = z.object({
        charterId: z.number().positive().int(),
        captainId: z.number().positive().int(),
        rating: z.number().min(1).max(5).int(),
        comment: z.string().min(10, "Comment must be at least 10 characters").max(1000),
      }).safeParse({
        charterId: Number(req.body.charterId),
        captainId: Number(req.body.captainId),
        rating: Number(req.body.rating),
        comment: String(req.body.comment || "").trim(),
      });

      if (!validation.success) {
        console.error("Review validation failed:", validation.error.issues);
        return res.status(400).json({ 
          error: "Invalid request data",
          details: validation.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        });
      }

      const { charterId, rating, comment } = validation.data;

      // Verificar que el usuario tiene un booking completado para este charter
      const [booking] = await db
        .select({
          id: bookingsTable.id,
          tripDate: bookingsTable.tripDate,
          status: bookingsTable.status,
          charterId: bookingsTable.charterId,
        })
        .from(bookingsTable)
        .where(and(
          eq(bookingsTable.userId, req.session.userId),
          eq(bookingsTable.charterId, charterId),
          eq(bookingsTable.status, "completed")
        ));

      if (!booking) {
        return res.status(403).json({ 
          error: "You can only review charters you have completed" 
        });
      }

      // Verificar que han pasado al menos 5 horas desde el viaje
      const tripDate = new Date(booking.tripDate);
      const fiveHoursLater = new Date(tripDate.getTime() + (5 * 60 * 60 * 1000));
      const now = new Date();

      if (now < fiveHoursLater) {
        const hoursLeft = Math.ceil((fiveHoursLater.getTime() - now.getTime()) / (60 * 60 * 1000));
        return res.status(403).json({
          error: `You can review this charter in ${hoursLeft} hours after the trip ends`
        });
      }

      // Verificar que no haya review duplicado
      const [existingReview] = await db
        .select({ id: reviewsTable.id })
        .from(reviewsTable)
        .where(and(
          eq(reviewsTable.userId, req.session.userId),
          eq(reviewsTable.charterId, charterId)
        ));

      if (existingReview) {
        return res.status(409).json({ error: "You have already reviewed this charter" });
      }

      // Obtener info del captain para el review
      const [charter] = await db
        .select({
          captainId: chartersTable.captainId,
          title: chartersTable.title
        })
        .from(chartersTable)
        .where(eq(chartersTable.id, charterId));

      if (!charter) {
        return res.status(404).json({ error: "Charter not found" });
      }

      // Crear el review
      const [newReview] = await db
        .insert(reviewsTable)
        .values({
          userId: req.session.userId,
          captainId: charter.captainId,
          charterId,
          rating,
          comment: comment.trim(),
        })
        .returning();

      // Actualizar rating promedio del captain
      await updateCaptainRating(charter.captainId);

      res.json({
        message: "Review submitted successfully",
        review: {
          id: newReview.id,
          rating: newReview.rating,
          comment: newReview.comment,
          createdAt: newReview.createdAt?.toISOString(),
        }
      });
    } catch (error) {
      console.error("Create review error:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // Helper function para actualizar rating del captain
  async function updateCaptainRating(captainId: number) {
    try {
      const reviewStats = await db
        .select({
          avgRating: sql<number>`ROUND(AVG(${reviewsTable.rating}::numeric), 2)`,
          count: sql<number>`COUNT(*)::integer`,
        })
        .from(reviewsTable)
        .where(eq(reviewsTable.captainId, captainId));

      const stats = reviewStats[0];
      if (stats && stats.count > 0) {
        await db
          .update(captainsTable)
          .set({
            rating: String(stats.avgRating),
            reviewCount: stats.count,
          })
          .where(eq(captainsTable.id, captainId));
      }
    } catch (error) {
      console.error("Update captain rating error:", error);
    }
  }

  // ==============================
  // PROFILE IMAGE UPLOAD
  // ==============================

  // Upload profile image for user
  app.post("/api/user/profile-image", (req: Request, res: Response, next: any) => {
    // Handle multer upload with error handling
    upload.single("profileImage")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Handle multer-specific errors
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "File size too large. Maximum size is 100MB." });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ error: "Unexpected file field. Use 'profileImage' field name." });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
      } else if (err) {
        // Handle custom validation errors (like file type)
        if (err.message === UNSUPPORTED_IMAGE_TYPE_MESSAGE) {
          return res.status(400).json({ error: UNSUPPORTED_IMAGE_TYPE_MESSAGE });
        }
        return res.status(400).json({ error: err.message });
      }
      // No errors, proceed with the handler
      handleProfileImageUpload(req, res);
    });
  });

  async function handleProfileImageUpload(req: Request, res: Response) {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Use the uploaded file path
      const profileImageUrl = `${SECURE_UPLOAD_ROUTE}/${req.file.filename}`;

      // Update user with new profile image
      const [updatedUser] = await db
        .update(usersTable)
        .set({
          profileImageUrl,
        })
        .where(eq(usersTable.id, req.session.userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        message: "Profile image uploaded successfully",
        profileImageUrl,
        user: {
          id: updatedUser.id,
          profileImageUrl: updatedUser.profileImageUrl,
        },
      });
    } catch (error) {
      console.error("Profile image upload error:", error);
      return res.status(500).json({ error: "Failed to upload profile image" });
    }
  }

  // ==============================
  // OBJECT STORAGE ROUTES
  // ==============================

  // Get upload URL for an object entity (protected)
  app.post("/api/objects/upload", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects (protected)
  app.get("/objects/:objectPath(*)", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // For now, allow access to all logged-in users
      // In the future, implement proper ACL checks here
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "File not found" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve public objects (no authentication required)
  app.get("/public-objects/:filePath(*)", async (req: Request, res: Response) => {
    try {
      const filePath = req.params.filePath;
      const objectStorageService = new ObjectStorageService();
      const file = await objectStorageService.searchPublicObject(filePath);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving public object:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update document after upload for captain onboarding
  const isUniqueConstraintError = (error: unknown): error is { code: string } => {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    );
  };

  app.put("/api/captain/documents", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { documentType, documentURL } = req.body;

      if (!documentType || !documentURL) {
        return res.status(400).json({ error: "Document type and URL are required" });
      }

      // Validate document type
      const validDocumentTypes = [
        "licenseDocument",
        "boatDocumentation",
        "insuranceDocument",
        "identificationPhoto",
        "localPermit",
        "cprCertification",
        "drugTestingResults"
      ];

      if (!validDocumentTypes.includes(documentType)) {
        return res.status(400).json({ error: "Invalid document type" });
      }

      // Find captain record for the user
      const [captain] = await db
        .select()
        .from(captainsTable)
        .where(eq(captainsTable.userId, req.session.userId));

      if (!captain) {
        return res.status(404).json({ error: "Captain profile not found" });
      }

      // Normalize the object path
      const objectStorageService = new ObjectStorageService();
      let normalizedPath: string;
      try {
        normalizedPath = objectStorageService.normalizeObjectEntityPath(documentURL);
      } catch (error) {
        console.error("Failed to normalize document path:", error);
        return res.status(422).json({
          error: "DocumentMissing",
          message: "We couldn't find that document. Please upload it again.",
        });
      }

      // Update the captain's document field
      const updateData: any = {};
      updateData[documentType] = normalizedPath;

      try {
        await db
          .update(captainsTable)
          .set(updateData)
          .where(eq(captainsTable.id, captain.id));
      } catch (error) {
        console.error("Database error updating captain document:", error);
        if (isUniqueConstraintError(error)) {
          return res.status(409).json({
            error: "DocumentDuplicate",
            message: "This document was already uploaded.",
          });
        }
        return res.status(500).json({ error: "Failed to update captain document" });
      }

      return res.json({
        message: "Document updated successfully",
        documentType,
        documentPath: normalizedPath
      });
    } catch (error) {
      console.error("Error updating captain document:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // ----------------------------------------------------
  // Captain Onboarding Endpoints
  // ----------------------------------------------------


  // PATCH /api/captain/me → actualizar perfil del capitán
  app.patch("/api/captain/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, req.session.userId),
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await db
      .update(schema.captains)
      .set(req.body)
      .where(eq(schema.captains.userId, req.session.userId));

    res.json({ success: true });
  });

  // PUT /api/captain/documents → subir documento (funciona durante onboarding)
  app.put("/api/captain/documents", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { documentType, documentURL } = req.body;
    if (!documentType || !documentURL) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    try {
      // Verificar si existe captain
      const [existingCaptain] = await db
        .select({ id: schema.captains.id })
        .from(schema.captains)
        .where(eq(schema.captains.userId, req.session.userId));

      if (existingCaptain) {
        // Captain existe → UPDATE
        await db
          .update(schema.captains)
          .set({ [documentType]: documentURL })
          .where(eq(schema.captains.userId, req.session.userId));
      } else {
        // Captain NO existe → INSERT (onboarding)
        const user = await db.query.users.findFirst({
          where: eq(schema.users.id, req.session.userId),
        });
        
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        await db.insert(schema.captains).values({
          userId: req.session.userId,
          name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || "Captain",
          bio: "",
          experience: "",
          licenseNumber: "",
          location: "",
          avatar: null,
          verified: false,
          rating: "0.0",
          reviewCount: 0,
          onboardingCompleted: false,
          [documentType]: documentURL,
          // Otros campos de documentos como null
          licenseDocument: documentType === 'licenseDocument' ? documentURL : null,
          boatDocumentation: documentType === 'boatDocumentation' ? documentURL : null,
          insuranceDocument: documentType === 'insuranceDocument' ? documentURL : null,
          identificationPhoto: documentType === 'identificationPhoto' ? documentURL : null,
          localPermit: documentType === 'localPermit' ? documentURL : null,
          cprCertification: documentType === 'cprCertification' ? documentURL : null,
          drugTestingResults: documentType === 'drugTestingResults' ? documentURL : null,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Failed to save document" });
    }
  });

  // POST /api/email/send-verification → enviar email de verificación
  app.post("/api/email/send-verification", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, req.session.userId),
    });

    if (!user || !user.email) {
      return res.status(404).json({ error: "User not found or missing email" });
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    await db.insert(schema.emailVerificationTokens).values({
      email: user.email,
      token,
      expiresAt: expires,
    });

    const link = `${process.env.APP_URL}/verify-email?token=${token}`;

    // ✅ user.email comprobado antes → ya es string
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<p>Click here to verify your email: <a href="${link}">${link}</a></p>`,
    });

    return res.json({ success: true });
  });




    // ==============================
    // HTTP SERVER
    // ==============================
    const httpServer = createServer(app);
    return httpServer;
  }
