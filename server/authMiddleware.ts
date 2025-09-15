import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users as usersTable, captains as captainsTable } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Middleware para verificar que el usuario esté autenticado
 */
export function requireAuthentication(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized - Please log in" });
  }
  next();
}

/**
 * Middleware para verificar que el usuario tenga el email verificado
 */
export async function requireEmailVerification(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized - Please log in" });
    }

    const [user] = await db
      .select({
        id: usersTable.id,
        emailVerified: usersTable.emailVerified,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId));

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: "Email verification required",
        message: "You must verify your email address before accessing this resource",
        requiresEmailVerification: true
      });
    }

    next();
  } catch (error) {
    console.error("Email verification middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Middleware combinado para autenticación + verificación de email
 */
export async function requireAuthenticatedAndVerified(req: Request, res: Response, next: NextFunction) {
  // Primero verificar autenticación
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized - Please log in" });
  }

  // Luego verificar email
  await requireEmailVerification(req, res, next);
}

/**
 * Middleware para verificar que el usuario sea un capitán verificado
 */
export async function requireVerifiedCaptain(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized - Please log in" });
    }

    // Verificar que el email esté verificado primero
    const [user] = await db
      .select({
        id: usersTable.id,
        emailVerified: usersTable.emailVerified,
        email: usersTable.email,
      })
      .from(usersTable)
      .where(eq(usersTable.id, req.session.userId));

    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: "Email verification required",
        message: "You must verify your email address before accessing captain features",
        requiresEmailVerification: true
      });
    }

    // Verificar que tenga perfil de capitán
    const [captain] = await db
      .select({ id: captainsTable.id, verified: captainsTable.verified })
      .from(captainsTable)
      .where(eq(captainsTable.userId, req.session.userId));

    if (!captain) {
      return res.status(403).json({ 
        error: "Captain profile required",
        message: "You need to complete your captain profile first",
        requiresCaptainProfile: true
      });
    }

    next();
  } catch (error) {
    console.error("Captain verification middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}