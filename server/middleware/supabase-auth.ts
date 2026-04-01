import type { Request, Response, NextFunction, RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { db } from "../db";
import { users, emailQueue } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

export const isAuthenticated: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if ((req.session as any)?.adminUserId) {
    req.userId = (req.session as any).adminUserId;
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.substring(7);

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.userId = data.user.id;
    req.userEmail = data.user.email;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, data.user.id))
      .limit(1);

    if (existing.length === 0) {
      try {
        await db.insert(users).values({
          id: data.user.id,
          email: data.user.email,
        }).onConflictDoNothing();
        console.log(`[Auth] Created local user record for ${data.user.email}`);

        try {
          const day1 = new Date(Date.now() + 24 * 60 * 60 * 1000);
          const day3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
          const day14 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          const day21 = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
          const day30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await db.insert(emailQueue).values([
            { userId: data.user.id, emailType: "day_1_checkin", scheduledFor: day1 },
            { userId: data.user.id, emailType: "day_3_progress", scheduledFor: day3 },
            { userId: data.user.id, emailType: "day_14_halfway", scheduledFor: day14 },
            { userId: data.user.id, emailType: "day_21_habit", scheduledFor: day21 },
            { userId: data.user.id, emailType: "day_30_milestone", scheduledFor: day30 },
          ]);
        } catch (emailErr) {
          console.error("Failed to schedule emails:", emailErr);
        }
      } catch (insertErr) {
        console.error(`[Auth] Failed to create user record for ${data.user.id}:`, insertErr);
        // Don't block access — user can still be auto-created in /api/auth/user
      }
    }

    return next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Authentication failed" });
  }
};

export const isAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const result = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, req.userId))
      .limit(1);

    if (!result[0]?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    return next();
  } catch (err) {
    console.error("Admin check error:", err);
    return res.status(500).json({ message: "Authorization check failed" });
  }
};
