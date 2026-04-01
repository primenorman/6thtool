import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { db } from './db';

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const pgStore = connectPg(session);
app.use(
  session({
    store: new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: "sessions",
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

const isProduction = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === '1';

const corsMiddleware = cors({
  origin: isProduction 
    ? [
        ...(process.env.REPLIT_DOMAINS?.split(',').map(d => `https://${d}`) || []),
        'https://hithacking.com',
        'https://www.hithacking.com',
      ]
    : true,
  credentials: true,
  optionsSuccessStatus: 200,
});
// Only apply CORS to API routes, not static/video files
app.use('/api', corsMiddleware);

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authRateLimiter);

// Video URL endpoint - returns signed CDN URL for direct mobile-friendly playback
const SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';
const VIDEO_BUCKET = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID || '';
if (!VIDEO_BUCKET) {
  console.warn('[Video] DEFAULT_OBJECT_STORAGE_BUCKET_ID not set - module videos will be unavailable');
}

app.get('/api/video-url/:moduleId', async (req, res) => {
  const moduleId = parseInt(req.params.moduleId, 10);
  if (isNaN(moduleId) || moduleId < 1 || moduleId > 7) {
    return res.status(400).json({ error: 'Invalid module ID' });
  }

  if (!VIDEO_BUCKET) {
    console.error('[Video] No bucket configured');
    return res.status(500).json({ error: 'Video storage not configured' });
  }

  try {
    const bucketName = VIDEO_BUCKET.startsWith('/') ? VIDEO_BUCKET.slice(1) : VIDEO_BUCKET;
    const objectName = `public/videos/module-${moduleId}-overview.mp4`;

    console.log(`[Video] Requesting signed URL for bucket=${bucketName}, object=${objectName}`);

    const sidecarResponse = await fetch(`${SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectName,
        method: 'GET',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      }),
    });

    if (!sidecarResponse.ok) {
      const errText = await sidecarResponse.text();
      console.error(`[Video] Sidecar error ${sidecarResponse.status}: ${errText}`);
      throw new Error(`Sidecar error: ${sidecarResponse.status}`);
    }

    const { signed_url } = await sidecarResponse.json() as { signed_url: string };
    console.log(`[Video] Signed URL generated successfully for module ${moduleId}`);
    res.json({ url: signed_url });
  } catch (err: any) {
    console.error('[Video] Error generating video URL:', err?.message || err);
    res.status(500).json({ error: 'Failed to generate video URL' });
  }
});

app.get('/api/lesson-video-url/:lessonId', async (req, res) => {
  const lessonId = parseInt(req.params.lessonId, 10);
  if (isNaN(lessonId)) {
    return res.status(400).json({ error: 'Invalid lesson ID' });
  }

  if (!VIDEO_BUCKET) {
    return res.status(500).json({ error: 'Video storage not configured' });
  }

  try {
    const bucketName = VIDEO_BUCKET.startsWith('/') ? VIDEO_BUCKET.slice(1) : VIDEO_BUCKET;
    const objectName = `public/videos/lesson-${lessonId}-video.mp4`;

    const sidecarResponse = await fetch(`${SIDECAR_ENDPOINT}/object-storage/signed-object-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectName,
        method: 'GET',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
      }),
    });

    if (!sidecarResponse.ok) {
      const errText = await sidecarResponse.text();
      console.error(`[Video] Lesson sidecar error ${sidecarResponse.status}: ${errText}`);
      throw new Error(`Sidecar error: ${sidecarResponse.status}`);
    }

    const { signed_url } = await sidecarResponse.json() as { signed_url: string };
    res.json({ url: signed_url });
  } catch (err: any) {
    console.error('[Video] Error generating lesson video URL:', err?.message || err);
    res.status(500).json({ error: 'Failed to generate video URL' });
  }
});

app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  const health: {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    database: { status: string; latency?: number; error?: string };
    version: string;
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: isProduction ? 'production' : 'development',
    database: { status: 'unknown' },
    version: '1.0.0',
  };

  try {
    const dbStart = Date.now();
    await db.execute('SELECT 1');
    health.database = { status: 'connected', latency: Date.now() - dbStart };
  } catch (error: any) {
    health.database = { status: 'error', error: error.message };
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Auto-seed database if empty (ensures production has course content)
  try {
    const { seed } = await import("./seed");
    await seed();
  } catch (e: any) {
    console.error("Auto-seed error:", e.message);
  }

  try {
    const { seedBadges } = await import("./seed-badges");
    await seedBadges();
  } catch (e: any) {
    console.error("Badge auto-seed error:", e.message);
  }

  try {
    const { templates } = await import("@shared/schema");
    const existingTemplates = await db.select().from(templates).limit(1);
    if (existingTemplates.length === 0) {
      console.log("No templates found, seeding templates...");
      const { seedTemplates } = await import("./seed-templates");
      await seedTemplates();
    }
  } catch (e: any) {
    console.error("Template auto-seed error:", e.message);
  }

  try {
    const { storage } = await import("./storage");
    const thread = await storage.createWeeklyWinThread();
    if (thread) console.log("Created weekly win thread:", thread.title);
  } catch (e: any) {
    console.error("Weekly win thread error:", e.message);
  }

  try {
    const { processEmailQueue } = await import("./email-sender");
    setInterval(() => {
      processEmailQueue().catch(e => console.error("Email queue error:", e));
    }, 60 * 60 * 1000);
  } catch (e: any) {
    console.error("Email queue setup error:", e.message);
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
