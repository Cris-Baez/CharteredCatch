// types/express-session.d.ts
import "express-session";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    user?: {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      role: string | null;
      profileImageUrl: string | null;
      password?: string | null; // 👈 necesario para login local
    };
  }
}
