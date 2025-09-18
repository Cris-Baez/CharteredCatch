// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes, stripeWebhookRouter } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";

const app = express();

// Stripe webhooks require the raw body to validate signatures.
// Register the webhook router before the JSON/body-parser middleware runs.
app.use(stripeWebhookRouter);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    // Solo logear requests que no sean HEAD health checks
    if (path.startsWith("/api") && !(req.method === "HEAD" && path === "/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Deshabilitar ETag para APIs (evita 304 sin body)
  app.set('etag', false);
  
  // No-cache para todas las rutas API
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  const server = await registerRoutes(app);

  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    // Vite dev middleware
    await setupVite(app, server);
  } else {
    // Sirve estáticos en producción
    serveStatic(app);

    // 👇 History API fallback para SPA
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      if (req.path.startsWith("/attached_assets")) return next();
      res.sendFile(path.join(process.cwd(), "dist/public/index.html"));
    });
  }

  // Servidor en puerto 5000 (API + cliente)
  const port = 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
