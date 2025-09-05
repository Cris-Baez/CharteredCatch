// server/auth.ts
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express } from "express";

const PgStore = connectPg(session);

export function setupSession(app: Express) {
  app.use(
    session({
      store: new PgStore({
        conString: process.env.DATABASE_URL,
        tableName: "sessions", // usar el nombre correcto de la tabla existente
        createTableIfMissing: false, // no crear tabla porque ya existe en el schema
      }),
      secret: process.env.SESSION_SECRET || "dev_secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // cámbialo a true si usas HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 semana
      },
    })
  );
}
