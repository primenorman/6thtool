import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./middleware/supabase-auth";
import { isAdmin as isAdminMiddleware } from "./middleware/supabase-auth";
import { insertDailyPracticeLogSchema, insertCertaintyRatingSchema, insertUserEpsiSchema, insertUserMetastorySchema, insertSavedTargetSchema, insertGridScoreSchema, insertPerformanceOutcomeSchema, insertUserTestimonialSchema } from "@shared/schema";
import { z } from "zod";
import webpush from "web-push";
import { processEmailQueue } from "./email-sender";

const vapidPublicKey = process.env.VITE_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails("mailto:coach@the6thtool.com", vapidPublicKey, vapidPrivateKey);
}

const adminUpdateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
}).strict();

const adminModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  estimatedMinutes: z.number().positive().optional(),
  isPublished: z.boolean().optional(),
});

const adminLessonSchema = z.object({
  moduleId: z.number().positive().optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().nullable(),
  transcript: z.string().optional().nullable(),
  keyConcepts: z.array(z.string()).optional(),
  estimatedMinutes: z.number().positive().optional(),
  isPublished: z.boolean().optional(),
});

const adminExerciseSchema = z.object({
  lessonId: z.number().positive().optional(),
  title: z.string().min(1).optional(),
  instructions: z.string().optional(),
  exerciseType: z.string().optional(),
  template: z.string().optional().nullable(),
  config: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
});

const neuralLabSessionSchema = z.object({
  sessionId: z.string().min(1),
  totalPitches: z.number().int().min(1),
  correctPitches: z.number().int().min(0),
  averageReactionMs: z.number().int().min(0),
  fastestReactionMs: z.number().int().min(0),
  accuracy: z.number().min(0).max(100),
  results: z.array(z.object({
    pitchType: z.enum(["fastball", "curveball", "slider", "changeup"]),
    selectedType: z.enum(["fastball", "curveball", "slider", "changeup"]).optional(),
    reactionTimeMs: z.number().int().min(0),
    wasCorrect: z.boolean(),
  })).optional(),
});

const strikeZoneUpdateSchema = z.object({
  zone: z.number().int().min(1).max(9),
  action: z.enum(["swing", "take", "hit"]),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      let user = await storage.getUser(userId);
      if (!user) {
        // Fallback: auto-create the user record if middleware missed it
        console.warn(`[Auth] User ${userId} not in local DB — auto-creating`);
        user = await storage.upsertUser({
          id: userId,
          email: req.userEmail || undefined,
        });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/admin-login", async (req: any, res) => {
    const { email, password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL || "primenorman@gmail.com";
    if (!adminPassword || !password || password !== adminPassword || !email || email.toLowerCase() !== adminEmail.toLowerCase()) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    try {
      let adminUser = await storage.getUser("admin-password-user");
      if (!adminUser) {
        adminUser = await storage.upsertUser({
          id: "admin-password-user",
          email: adminEmail,
          firstName: "Admin",
          lastName: "Coach",
          isAdmin: true,
        });
      }
      (req.session as any).adminUserId = adminUser.id;
      req.session.save((err: any) => {
        if (err) return res.status(500).json({ message: "Session error" });
        res.json(adminUser);
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/update-profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { displayName, position, levelOfPlay, quizResults, onboardingCompleted } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (displayName !== undefined) updates.displayName = displayName;
      if (position !== undefined) updates.position = position;
      if (levelOfPlay !== undefined) updates.levelOfPlay = levelOfPlay;
      if (quizResults !== undefined) updates.quizResults = quizResults;
      if (onboardingCompleted !== undefined) updates.onboardingCompleted = onboardingCompleted;
      await storage.updateUser(userId, updates);
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // XP endpoints
  app.get("/api/xp/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const levels = [
        { name: "Rookie", min: 0, max: 500 },
        { name: "Prospect", min: 501, max: 1500 },
        { name: "Draft Pick", min: 1501, max: 3500 },
        { name: "Pro", min: 3501, max: 7000 },
        { name: "All-Star", min: 7001, max: 15000 },
        { name: "Hall of Fame", min: 15001, max: Infinity },
      ];
      const currentLevel = levels.find(
        (l) => user.currentXp >= l.min && user.currentXp <= l.max
      ) || levels[0];
      const nextLevel = levels[levels.indexOf(currentLevel) + 1];
      res.json({
        currentXp: user.currentXp,
        currentLevel: currentLevel.name,
        nextLevel: nextLevel?.name || null,
        xpToNext: nextLevel ? nextLevel.min - user.currentXp : 0,
        xpInLevel: user.currentXp - currentLevel.min,
        levelMax: currentLevel.max === Infinity ? 99999 : currentLevel.max - currentLevel.min,
      });
    } catch (error) {
      console.error("Error fetching XP status:", error);
      res.status(500).json({ message: "Failed to fetch XP status" });
    }
  });

  app.post("/api/xp/award", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { eventType, xpAmount, description } = req.body;
      if (!eventType || !xpAmount) {
        return res.status(400).json({ message: "eventType and xpAmount required" });
      }
      const { newBadges } = await storage.awardXp(userId, eventType, xpAmount, description);
      const user = await storage.getUser(userId);
      res.json({ success: true, currentXp: user?.currentXp, newBadges });
    } catch (error) {
      console.error("Error awarding XP:", error);
      res.status(500).json({ message: "Failed to award XP" });
    }
  });

  app.get("/api/badges", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const badgeList = await storage.getUserBadges(userId);
      res.json(badgeList);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ message: "Failed to fetch badges" });
    }
  });

  app.get("/api/badges/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const recent = await storage.getRecentBadge(userId);
      res.json(recent);
    } catch (error) {
      console.error("Error fetching recent badge:", error);
      res.status(500).json({ message: "Failed to fetch recent badge" });
    }
  });

  app.get("/api/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const level = req.query.level as string | undefined;
      const leaderboard = await storage.getWeeklyLeaderboard(level);
      const userRank = leaderboard.findIndex(e => e.userId === userId);
      res.json({
        entries: leaderboard.slice(0, 20),
        userEntry: userRank >= 0 ? { ...leaderboard[userRank], rank: userRank + 1 } : null,
        totalParticipants: leaderboard.length,
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // User Stats
  app.get("/api/user/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Modules
  app.get("/api/modules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const allModules = await storage.getModules();
      const progress = await storage.getUserModuleProgress(userId);
      
      // BETA: All modules unlocked for testing
      // TODO: Re-enable mastery-based unlock after beta
      const modulesWithProgress = await Promise.all(allModules.map(async (module, index) => {
        const moduleProgress = progress.find(p => p.moduleId === module.id);
        
        const isUnlocked = true; // Beta: all modules unlocked

        return {
          ...module,
          isUnlocked,
          isCompleted: moduleProgress?.isCompleted || false,
          startedAt: moduleProgress?.startedAt,
          completedAt: moduleProgress?.completedAt,
        };
      }));
      
      res.json(modulesWithProgress);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.get("/api/modules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const moduleId = parseInt(req.params.id);
      const module = await storage.getModuleById(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(module);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });

  // Lessons
  app.get("/api/modules/:moduleId/lessons", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const moduleId = parseInt(req.params.moduleId);
      const lessons = await storage.getLessonsByModuleId(moduleId);
      const progress = await storage.getUserLessonProgress(userId);
      
      const lessonsWithProgress = lessons.map(lesson => {
        const lessonProgress = progress.find(p => p.lessonId === lesson.id);
        return {
          ...lesson,
          isCompleted: lessonProgress?.isCompleted || false,
          completedAt: lessonProgress?.completedAt,
        };
      });
      
      res.json(lessonsWithProgress);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  // Get single lesson by ID
  app.get("/api/lessons/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLessonById(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      // Get user's progress for all lessons, then find this one
      const allProgress = await storage.getUserLessonProgress(userId);
      const lessonProgress = allProgress.find(p => p.lessonId === lessonId);
      res.json({
        ...lesson,
        isCompleted: !!lessonProgress?.completedAt,
      });
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  app.post("/api/lessons/:id/complete", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const lessonId = parseInt(req.params.id);
      await storage.markLessonComplete(userId, lessonId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error completing lesson:", error);
      res.status(500).json({ message: "Failed to complete lesson" });
    }
  });

  // Exercises
  app.get("/api/lessons/:lessonId/exercises", isAuthenticated, async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const exercises = await storage.getExercisesByLessonId(lessonId);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.post("/api/exercises/:id/response", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const exerciseId = parseInt(req.params.id);
      const { response } = req.body;
      
      await storage.saveExerciseResponse(userId, exerciseId, response);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving exercise response:", error);
      res.status(500).json({ message: "Failed to save exercise response" });
    }
  });

  // Resources
  app.get("/api/resources", isAuthenticated, async (req: any, res) => {
    try {
      const resources = await storage.getResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ message: "Failed to fetch resources" });
    }
  });

  // Daily Practice
  app.get("/api/daily-practice", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 30;
      const logs = await storage.getDailyPracticeLogs(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching practice logs:", error);
      res.status(500).json({ message: "Failed to fetch practice logs" });
    }
  });

  app.get("/api/daily-practice/today", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const log = await storage.getTodayPracticeLog(userId);
      res.json(log || null);
    } catch (error) {
      console.error("Error fetching today's practice:", error);
      res.status(500).json({ message: "Failed to fetch today's practice" });
    }
  });

  app.post("/api/daily-practice", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const body = { ...req.body, userId };
      
      const timestampFields = [
        'gutGoalRecordedAt', 'breathingCompletedAt', 'gridCompletedAt', 
        'epsiCompletedAt', 'successFailureCompletedAt', 'sessionCompletedAt'
      ];
      for (const field of timestampFields) {
        if (typeof body[field] === 'string') {
          body[field] = new Date(body[field]);
        }
      }
      
      const parsed = insertDailyPracticeLogSchema.parse(body);
      const log = await storage.saveDailyPracticeLog(parsed);

      const streakInfo = await storage.getStreakInfo(userId);
      const streakBadges = await storage.checkStreakBadges(userId, streakInfo.currentStreak);
      await storage.incrementWeeklyPractice(userId, streakInfo.currentStreak);

      res.json({ ...log, newBadges: streakBadges });
    } catch (error) {
      console.error("Error saving practice log:", error);
      res.status(500).json({ message: "Failed to save practice log" });
    }
  });

  // Streak Info
  app.get("/api/streak", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const streakInfo = await storage.getStreakInfo(userId);
      res.json(streakInfo);
    } catch (error) {
      console.error("Error fetching streak info:", error);
      res.status(500).json({ message: "Failed to fetch streak info" });
    }
  });

  // Practice Calendar (heatmap data)
  app.get("/api/practice-calendar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const days = parseInt(req.query.days as string) || 90;
      const calendar = await storage.getPracticeCalendar(userId, days);
      res.json(calendar);
    } catch (error) {
      console.error("Error fetching practice calendar:", error);
      res.status(500).json({ message: "Failed to fetch practice calendar" });
    }
  });

  // Certainty Ratings
  app.get("/api/certainty-ratings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 30;
      const ratings = await storage.getCertaintyRatings(userId, limit);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching certainty ratings:", error);
      res.status(500).json({ message: "Failed to fetch certainty ratings" });
    }
  });

  app.post("/api/certainty-ratings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      // Default ratingDate to today if not provided
      const ratingDate = req.body.ratingDate || new Date().toISOString().split('T')[0];
      const parsed = insertCertaintyRatingSchema.parse({
        ...req.body,
        userId,
        ratingDate,
      });
      
      const rating = await storage.saveCertaintyRating(parsed);
      res.json(rating);
    } catch (error) {
      console.error("Error saving certainty rating:", error);
      res.status(500).json({ message: "Failed to save certainty rating" });
    }
  });

  // Certainty Rating Trends
  app.get("/api/certainty-ratings/trends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const trends = await storage.getCertaintyRatingTrends(userId);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching certainty trends:", error);
      res.status(500).json({ message: "Failed to fetch certainty trends" });
    }
  });

  // User EPSI
  app.get("/api/user/epsi", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const epsi = await storage.getUserEpsi(userId);
      res.json(epsi || null);
    } catch (error) {
      console.error("Error fetching EPSI:", error);
      res.status(500).json({ message: "Failed to fetch EPSI" });
    }
  });

  app.post("/api/user/epsi", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const parsed = insertUserEpsiSchema.parse({
        ...req.body,
        userId,
      });
      
      const epsi = await storage.saveUserEpsi(parsed);
      res.json(epsi);
    } catch (error) {
      console.error("Error saving EPSI:", error);
      res.status(500).json({ message: "Failed to save EPSI" });
    }
  });

  // User Metastories
  app.get("/api/user/metastories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const metastories = await storage.getUserMetastories(userId);
      res.json(metastories);
    } catch (error) {
      console.error("Error fetching metastories:", error);
      res.status(500).json({ message: "Failed to fetch metastories" });
    }
  });

  app.post("/api/user/metastories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const parsed = insertUserMetastorySchema.parse({
        ...req.body,
        userId,
      });
      
      const metastory = await storage.saveUserMetastory(parsed);
      res.json(metastory);
    } catch (error) {
      console.error("Error saving metastory:", error);
      res.status(500).json({ message: "Failed to save metastory" });
    }
  });

  // Saved Targets (unified CRUD for EPSI, Metastories, SA objectives, subsidiary targets)
  app.get("/api/targets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const type = req.query.type as string | undefined;
      const targets = await storage.getSavedTargets(userId, type);
      res.json(targets);
    } catch (error) {
      console.error("Error fetching targets:", error);
      res.status(500).json({ message: "Failed to fetch targets" });
    }
  });

  app.get("/api/targets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const target = await storage.getSavedTargetById(req.params.id);
      if (!target) {
        return res.status(404).json({ message: "Target not found" });
      }
      // Verify ownership
      if (target.userId !== req.userId!) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(target);
    } catch (error) {
      console.error("Error fetching target:", error);
      res.status(500).json({ message: "Failed to fetch target" });
    }
  });

  app.post("/api/targets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      
      // Validate allowed types
      const allowedTypes = ['metastory', 'epsi', 'sa_objective', 'subsidiary_target'];
      if (!req.body.type || !allowedTypes.includes(req.body.type)) {
        return res.status(400).json({ message: "Invalid target type. Must be one of: metastory, epsi, sa_objective, subsidiary_target" });
      }
      
      const parsed = insertSavedTargetSchema.parse({
        ...req.body,
        userId,
      });
      
      const target = await storage.createSavedTarget(parsed);
      res.json(target);
    } catch (error) {
      console.error("Error creating target:", error);
      res.status(500).json({ message: "Failed to create target" });
    }
  });

  app.put("/api/targets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const target = await storage.getSavedTargetById(req.params.id);
      if (!target) {
        return res.status(404).json({ message: "Target not found" });
      }
      // Verify ownership
      if (target.userId !== req.userId!) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate allowed types
      const allowedTypes = ['metastory', 'epsi', 'sa_objective', 'subsidiary_target'];
      if (req.body.type && !allowedTypes.includes(req.body.type)) {
        return res.status(400).json({ message: "Invalid target type" });
      }
      
      // Validate with partial schema (allow partial updates)
      const updateData: { title?: string; content?: string; type?: string; isActive?: boolean } = {};
      if (req.body.title) updateData.title = String(req.body.title);
      if (req.body.content) updateData.content = String(req.body.content);
      if (req.body.type) updateData.type = String(req.body.type);
      if (typeof req.body.isActive === 'boolean') updateData.isActive = req.body.isActive;
      
      const updated = await storage.updateSavedTarget(req.params.id, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Error updating target:", error);
      res.status(500).json({ message: "Failed to update target" });
    }
  });

  app.delete("/api/targets/:id", isAuthenticated, async (req: any, res) => {
    try {
      const target = await storage.getSavedTargetById(req.params.id);
      if (!target) {
        return res.status(404).json({ message: "Target not found" });
      }
      // Verify ownership
      if (target.userId !== req.userId!) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteSavedTarget(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting target:", error);
      res.status(500).json({ message: "Failed to delete target" });
    }
  });

  // Exercise Validation
  app.post("/api/exercises/:id/validate", isAuthenticated, async (req: any, res) => {
    try {
      const { exerciseType, response } = req.body;
      const validation = storage.validateExerciseResponse(exerciseType, response);
      res.json(validation);
    } catch (error) {
      console.error("Error validating exercise:", error);
      res.status(500).json({ message: "Failed to validate exercise" });
    }
  });

  // Enhanced exercise response with validation
  app.post("/api/exercises/:id/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const exerciseId = parseInt(req.params.id);
      const { response, exerciseType } = req.body;
      
      // Validate the response
      const validation = storage.validateExerciseResponse(exerciseType || 'default', response);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.errors 
        });
      }
      
      await storage.saveExerciseResponse(userId, exerciseId, response);
      res.json({ success: true, validation });
    } catch (error) {
      console.error("Error submitting exercise:", error);
      res.status(500).json({ message: "Failed to submit exercise" });
    }
  });

  // Streak with grace period details
  app.get("/api/daily-practice/streak", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const stats = await storage.getUserStats(userId);
      res.json({ 
        streak: stats.streak,
        todayPracticeComplete: stats.todayPracticeComplete
      });
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  // Concentration Grid Scores
  app.get("/api/grid-scores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 30;
      const scores = await storage.getGridScores(userId, limit);
      res.json(scores);
    } catch (error) {
      console.error("Error fetching grid scores:", error);
      res.status(500).json({ message: "Failed to fetch grid scores" });
    }
  });

  app.get("/api/grid-scores/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const stats = await storage.getGridScoreStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching grid score stats:", error);
      res.status(500).json({ message: "Failed to fetch grid score stats" });
    }
  });

  app.post("/api/grid-scores", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const parsed = insertGridScoreSchema.parse({
        ...req.body,
        userId,
      });
      
      const score = await storage.saveGridScore(parsed);
      res.json(score);
    } catch (error) {
      console.error("Error saving grid score:", error);
      res.status(500).json({ message: "Failed to save grid score" });
    }
  });

  const isAdmin = isAdminMiddleware;

  // ========== ADMIN ROUTES ==========

  // Admin: Check admin status
  app.get("/api/admin/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const isUserAdmin = await storage.isUserAdmin(userId);
      res.json({ isAdmin: isUserAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).json({ message: "Failed to check admin status" });
    }
  });

  // Admin: Analytics
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin: Users
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const details = await storage.getUserProgressDetails(req.params.id);
      res.json(details);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Failed to fetch user details" });
    }
  });

  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedData = adminUpdateUserSchema.parse(req.body);
      const updated = await storage.updateUser(req.params.id, validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin: Modules
  app.get("/api/admin/modules", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const allModules = await storage.getModules();
      res.json(allModules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });

  app.post("/api/admin/modules", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedData = adminModuleSchema.parse(req.body);
      const created = await storage.createModule(validatedData);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating module:", error);
      res.status(500).json({ message: "Failed to create module" });
    }
  });

  app.patch("/api/admin/modules/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedData = adminModuleSchema.parse(req.body);
      const updated = await storage.updateModule(parseInt(req.params.id), validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating module:", error);
      res.status(500).json({ message: "Failed to update module" });
    }
  });

  app.delete("/api/admin/modules/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.deleteModule(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ message: "Failed to delete module" });
    }
  });

  app.post("/api/admin/modules/reorder", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.reorderModules(req.body.orderings);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering modules:", error);
      res.status(500).json({ message: "Failed to reorder modules" });
    }
  });

  // Admin: Lessons
  app.get("/api/admin/modules/:moduleId/lessons", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const moduleLessons = await storage.getLessonsByModuleId(parseInt(req.params.moduleId));
      res.json(moduleLessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.post("/api/admin/lessons", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedData = adminLessonSchema.parse(req.body);
      const created = await storage.createLesson(validatedData);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating lesson:", error);
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  app.patch("/api/admin/lessons/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedData = adminLessonSchema.parse(req.body);
      const updated = await storage.updateLesson(parseInt(req.params.id), validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating lesson:", error);
      res.status(500).json({ message: "Failed to update lesson" });
    }
  });

  app.delete("/api/admin/lessons/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.deleteLesson(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting lesson:", error);
      res.status(500).json({ message: "Failed to delete lesson" });
    }
  });

  app.post("/api/admin/lessons/reorder", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.reorderLessons(req.body.orderings);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering lessons:", error);
      res.status(500).json({ message: "Failed to reorder lessons" });
    }
  });

  // Admin: Exercises
  app.get("/api/admin/lessons/:lessonId/exercises", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const lessonExercises = await storage.getExercisesByLessonId(parseInt(req.params.lessonId));
      res.json(lessonExercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.post("/api/admin/exercises", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedData = adminExerciseSchema.parse(req.body);
      const created = await storage.createExercise(validatedData);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error creating exercise:", error);
      res.status(500).json({ message: "Failed to create exercise" });
    }
  });

  app.patch("/api/admin/exercises/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const validatedData = adminExerciseSchema.parse(req.body);
      const updated = await storage.updateExercise(parseInt(req.params.id), validatedData);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      console.error("Error updating exercise:", error);
      res.status(500).json({ message: "Failed to update exercise" });
    }
  });

  app.delete("/api/admin/exercises/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.deleteExercise(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      res.status(500).json({ message: "Failed to delete exercise" });
    }
  });

  app.post("/api/admin/exercises/reorder", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.reorderExercises(req.body.orderings);
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering exercises:", error);
      res.status(500).json({ message: "Failed to reorder exercises" });
    }
  });

  // ===== NEURAL LAB ENDPOINTS =====

  // Save Neural Lab session
  app.post("/api/neural-lab/session", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      
      const parseResult = neuralLabSessionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid session data", errors: parseResult.error.errors });
      }
      
      const { sessionId, totalPitches, correctPitches, averageReactionMs, fastestReactionMs, accuracy, results } = parseResult.data;
      
      // Save session
      const session = await storage.saveNeuralLabSession({
        userId,
        sessionId,
        totalPitches,
        correctPitches,
        averageReactionMs,
        fastestReactionMs,
        accuracy,
      });

      // Save individual results
      if (results && Array.isArray(results)) {
        for (const result of results) {
          await storage.saveNeuralLabResult({
            userId,
            sessionId,
            pitchType: result.pitchType,
            reactionTimeMs: result.reactionTimeMs,
            wasCorrect: result.wasCorrect,
          });
        }
      }

      res.json(session);
    } catch (error) {
      console.error("Error saving neural lab session:", error);
      res.status(500).json({ message: "Failed to save session" });
    }
  });

  // Get user's best session
  app.get("/api/neural-lab/best", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const best = await storage.getUserBestNeuralLabSession(userId);
      res.json(best || null);
    } catch (error) {
      console.error("Error fetching best session:", error);
      res.status(500).json({ message: "Failed to fetch best session" });
    }
  });

  // Get user's Neural Lab stats
  app.get("/api/neural-lab/my-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const stats = await storage.getUserNeuralLabStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching neural lab stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get global leaderboard (top 50)
  app.get("/api/neural-lab/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const leaderboard = await storage.getNeuralLabLeaderboard(50);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ===== STRIKE ZONE ENDPOINTS =====

  // Get user's strike zone data
  app.get("/api/strike-zone/data", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const data = await storage.getStrikeZoneData(userId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching strike zone data:", error);
      res.status(500).json({ message: "Failed to fetch strike zone data" });
    }
  });

  // Update strike zone data
  app.post("/api/strike-zone/update", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      
      const parseResult = strikeZoneUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid strike zone data", errors: parseResult.error.errors });
      }
      
      const { zone, action } = parseResult.data;
      await storage.updateStrikeZoneData(userId, zone, action);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating strike zone data:", error);
      res.status(500).json({ message: "Failed to update strike zone data" });
    }
  });

  // ===== COACH ANALYSIS ENDPOINT =====

  app.get("/api/coach/analysis", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const analysis = await storage.getCoachAnalysis(userId);
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching coach analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // ===== LIVESTREAM ENDPOINTS =====

  const livestreamSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    embedUrl: z.string().optional(),
    recordingUrl: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    status: z.enum(["scheduled", "live", "ended"]).optional(),
    scheduledAt: z.string().optional(),
    startedAt: z.string().optional(),
    endedAt: z.string().optional(),
  });

  app.get("/api/livestreams", isAuthenticated, async (req: any, res) => {
    try {
      const streams = await storage.getLivestreams();
      res.json(streams);
    } catch (error) {
      console.error("Error fetching livestreams:", error);
      res.status(500).json({ message: "Failed to fetch livestreams" });
    }
  });

  app.get("/api/livestreams/current", isAuthenticated, async (req: any, res) => {
    try {
      const stream = await storage.getCurrentLivestream();
      res.json(stream || null);
    } catch (error) {
      console.error("Error fetching current livestream:", error);
      res.status(500).json({ message: "Failed to fetch current livestream" });
    }
  });

  app.get("/api/livestreams/:id", isAuthenticated, async (req: any, res) => {
    try {
      const stream = await storage.getLivestreamById(req.params.id);
      if (!stream) return res.status(404).json({ message: "Livestream not found" });
      res.json(stream);
    } catch (error) {
      console.error("Error fetching livestream:", error);
      res.status(500).json({ message: "Failed to fetch livestream" });
    }
  });

  app.post("/api/admin/livestreams", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parseResult = livestreamSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid data", errors: parseResult.error.errors });
      }
      const data = parseResult.data;
      const stream = await storage.createLivestream({
        ...data,
        embedUrl: data.embedUrl || null,
        recordingUrl: data.recordingUrl || null,
        thumbnailUrl: data.thumbnailUrl || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        startedAt: data.startedAt ? new Date(data.startedAt) : null,
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
        createdBy: req.userId!,
      });
      res.json(stream);
    } catch (error) {
      console.error("Error creating livestream:", error);
      res.status(500).json({ message: "Failed to create livestream" });
    }
  });

  app.patch("/api/admin/livestreams/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const parseResult = livestreamSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid data", errors: parseResult.error.errors });
      }
      const data = parseResult.data;
      const updateData: any = { ...data };
      if (data.embedUrl !== undefined) updateData.embedUrl = data.embedUrl || null;
      if (data.recordingUrl !== undefined) updateData.recordingUrl = data.recordingUrl || null;
      if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl || null;
      if (data.scheduledAt !== undefined) updateData.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
      if (data.startedAt !== undefined) updateData.startedAt = data.startedAt ? new Date(data.startedAt) : null;
      if (data.endedAt !== undefined) updateData.endedAt = data.endedAt ? new Date(data.endedAt) : null;
      
      if (data.status === "live" && !data.startedAt) {
        updateData.startedAt = new Date();
      }
      if (data.status === "ended" && !data.endedAt) {
        updateData.endedAt = new Date();
      }
      
      const stream = await storage.updateLivestream(req.params.id, updateData);
      if (!stream) return res.status(404).json({ message: "Livestream not found" });
      res.json(stream);
    } catch (error) {
      console.error("Error updating livestream:", error);
      res.status(500).json({ message: "Failed to update livestream" });
    }
  });

  app.delete("/api/admin/livestreams/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.deleteLivestream(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting livestream:", error);
      res.status(500).json({ message: "Failed to delete livestream" });
    }
  });

  // ===== TEMPLATE ROUTES =====

  app.get("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const type = req.query.type as string | undefined;
      const results = await storage.getTemplates(type);
      res.json(results);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const template = await storage.getTemplateById(req.params.id);
      if (!template) return res.status(404).json({ message: "Template not found" });
      res.json(template);
    } catch (error) {
      console.error("Error fetching template:", error);
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.get("/api/templates/:templateId/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const submissions = await storage.getUserSubmissions(userId, req.params.templateId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get("/api/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const submissions = await storage.getUserSubmissions(userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/templates/:templateId/save", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { responses, lastStep, progress, generatedOutput } = req.body;
      if (!responses || lastStep === undefined || progress === undefined) {
        return res.status(400).json({ message: "responses, lastStep, and progress are required" });
      }
      const submission = await storage.upsertDraftSubmission(userId, req.params.templateId, {
        responses: typeof responses === "string" ? responses : JSON.stringify(responses),
        lastStep,
        progress,
        generatedOutput,
      });
      res.json(submission);
    } catch (error) {
      console.error("Error saving submission:", error);
      res.status(500).json({ message: "Failed to save submission" });
    }
  });

  app.post("/api/submissions/:id/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const existing = await storage.getSubmissionById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Submission not found" });
      if (existing.userId !== userId) return res.status(403).json({ message: "Not authorized" });
      const submission = await storage.submitSubmission(req.params.id);
      if (!submission) return res.status(404).json({ message: "Submission not found" });
      res.json(submission);
    } catch (error) {
      console.error("Error submitting:", error);
      res.status(500).json({ message: "Failed to submit" });
    }
  });

  app.post("/api/admin/submissions/:id/verify", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { notes, approved, revisionGuidance } = req.body;
      const submission = await storage.verifySubmission(
        req.params.id,
        req.userId!,
        notes || "",
        approved,
        revisionGuidance
      );
      if (!submission) return res.status(404).json({ message: "Submission not found" });
      res.json(submission);
    } catch (error) {
      console.error("Error verifying submission:", error);
      res.status(500).json({ message: "Failed to verify submission" });
    }
  });

  // Performance Journal (Protocol System)
  app.get("/api/performance-journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const mode = req.query.mode as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const entries = await storage.getPerformanceJournalEntries(userId, mode, limit);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching performance journal:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/performance-journal/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const stats = await storage.getPerformanceJournalStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching journal stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/performance-journal/in-progress", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const mode = req.query.mode as string | undefined;
      const entry = await storage.getInProgressSession(userId, mode);
      res.json(entry || null);
    } catch (error) {
      console.error("Error fetching in-progress session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.get("/api/performance-journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const entry = await storage.getPerformanceJournalById(req.params.id, userId);
      if (!entry) return res.status(404).json({ message: "Session not found" });
      res.json(entry);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.post("/api/performance-journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { mode, gameDate, opponent, gameType, position } = req.body;
      const validModes = ['pre_game', 'post_game', 'slump_protocol', 'value_audit', 'nightly_myelination'];
      if (!mode || !validModes.includes(mode)) {
        return res.status(400).json({ message: "Valid mode is required" });
      }
      const entry = await storage.createPerformanceJournal({
        userId,
        mode,
        status: "in_progress",
        currentSection: 0,
        gameDate: gameDate || null,
        opponent: opponent || null,
        gameType: gameType || null,
        position: position || null,
        responses: {},
        dominantEmotion: null,
        valueAlignment: null,
        signalQuality: null,
        amygdalaScore: null,
        executivePercent: null,
        playerSummary: null,
        flaggedForReview: false,
        completedAt: null,
      });
      res.json(entry);
    } catch (error) {
      console.error("Error creating journal session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.patch("/api/performance-journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { responses, currentSection, status, dominantEmotion, valueAlignment, signalQuality, amygdalaScore, executivePercent, playerSummary, flaggedForReview } = req.body;
      const updateData: any = {};
      if (responses !== undefined) updateData.responses = responses;
      if (currentSection !== undefined) updateData.currentSection = currentSection;
      if (status !== undefined) {
        updateData.status = status;
        if (status === "completed") updateData.completedAt = new Date();
      }
      if (dominantEmotion !== undefined) updateData.dominantEmotion = dominantEmotion;
      if (valueAlignment !== undefined) updateData.valueAlignment = valueAlignment;
      if (signalQuality !== undefined) updateData.signalQuality = signalQuality;
      if (amygdalaScore !== undefined) updateData.amygdalaScore = amygdalaScore;
      if (executivePercent !== undefined) updateData.executivePercent = executivePercent;
      if (playerSummary !== undefined) updateData.playerSummary = playerSummary;
      if (flaggedForReview !== undefined) updateData.flaggedForReview = flaggedForReview;

      const entry = await storage.updatePerformanceJournal(req.params.id, userId, updateData);
      if (!entry) return res.status(404).json({ message: "Session not found" });
      res.json(entry);
    } catch (error) {
      console.error("Error updating journal session:", error);
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete("/api/performance-journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const deleted = await storage.deletePerformanceJournal(req.params.id, userId);
      if (!deleted) return res.status(404).json({ message: "Session not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting journal session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Legacy Journal Entries
  app.get("/api/journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const entries = await storage.getJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const entry = await storage.getJournalEntryById(req.params.id, userId);
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      res.json(entry);
    } catch (error) {
      console.error("Error fetching journal entry:", error);
      res.status(500).json({ message: "Failed to fetch journal entry" });
    }
  });

  app.post("/api/journal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { title, content, mood, tags } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      const entry = await storage.createJournalEntry({
        userId,
        title,
        content,
        mood: mood || null,
        tags: tags || null,
      });
      res.json(entry);
    } catch (error) {
      console.error("Error creating journal entry:", error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  app.put("/api/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { title, content, mood, tags } = req.body;
      const entry = await storage.updateJournalEntry(req.params.id, userId, {
        title,
        content,
        mood,
        tags,
      });
      if (!entry) return res.status(404).json({ message: "Entry not found" });
      res.json(entry);
    } catch (error) {
      console.error("Error updating journal entry:", error);
      res.status(500).json({ message: "Failed to update journal entry" });
    }
  });

  app.delete("/api/journal/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const deleted = await storage.deleteJournalEntry(req.params.id, userId);
      if (!deleted) return res.status(404).json({ message: "Entry not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting journal entry:", error);
      res.status(500).json({ message: "Failed to delete journal entry" });
    }
  });

  app.post("/api/admin/templates", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const template = await storage.createTemplate(req.body);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.patch("/api/admin/templates/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const template = await storage.updateTemplate(req.params.id, req.body);
      if (!template) return res.status(404).json({ message: "Template not found" });
      res.json(template);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/admin/templates/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.deleteTemplate(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // ============ MASTERY REQUIREMENTS & SUBMISSIONS ============

  // Get mastery requirements for a module (or all if no moduleId)
  app.get("/api/mastery/requirements", isAuthenticated, async (req: any, res) => {
    try {
      const moduleId = req.query.moduleId ? parseInt(req.query.moduleId) : undefined;
      const requirements = await storage.getMasteryRequirements(moduleId);
      res.json(requirements);
    } catch (error) {
      console.error("Error fetching mastery requirements:", error);
      res.status(500).json({ message: "Failed to fetch mastery requirements" });
    }
  });

  // Get mastery status for a specific module (requirements + user progress)
  app.get("/api/mastery/module/:moduleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const moduleId = parseInt(req.params.moduleId);
      const result = await storage.checkModuleMastery(userId, moduleId);
      res.json(result);
    } catch (error) {
      console.error("Error checking module mastery:", error);
      res.status(500).json({ message: "Failed to check module mastery" });
    }
  });

  // Get all user mastery submissions
  app.get("/api/mastery/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const submissions = await storage.getMasterySubmissions(userId);
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching mastery submissions:", error);
      res.status(500).json({ message: "Failed to fetch mastery submissions" });
    }
  });

  // Submit mastery evidence
  app.post("/api/mastery/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { requirementId, evidence, fileUrl } = req.body;

      if (!requirementId) {
        return res.status(400).json({ message: "requirementId is required" });
      }

      const requirement = await storage.getMasteryRequirementById(requirementId);
      if (!requirement) {
        return res.status(404).json({ message: "Requirement not found" });
      }

      // Check if there's already a verified submission
      const existing = await storage.getMasterySubmissions(userId, requirementId);
      const alreadyVerified = existing.find(s => s.status === 'verified' || s.status === 'auto_verified');
      if (alreadyVerified) {
        return res.status(400).json({ message: "Requirement already fulfilled" });
      }

      const submission = await storage.createMasterySubmission({
        userId,
        requirementId,
        status: "pending",
        evidence: evidence || null,
        fileUrl: fileUrl || null,
      });

      // Auto-verify if requirement supports it
      if (requirement.autoVerify) {
        let autoVerified = false;

        if (requirement.requirementType === 'practice_streak') {
          const streakInfo = await storage.getStreakInfo(userId);
          autoVerified = streakInfo.currentStreak >= (requirement.minValue || 0);
        } else if (requirement.requirementType === 'template_verified') {
          // Check if user has a verified template submission for the target slug
          if (requirement.targetTemplateSlug) {
            const template = await storage.getTemplateBySlug(requirement.targetTemplateSlug);
            if (template) {
              const templateSubs = await storage.getUserSubmissions(userId, template.id);
              autoVerified = templateSubs.some(s => s.isVerified);
            }
          }
        } else if (requirement.requirementType === 'lessons_complete') {
          // Check if all lessons in the module are complete
          const lessonsList = await storage.getLessonsByModuleId(requirement.moduleId);
          const lessonProgress = await storage.getUserLessonProgress(userId);
          const moduleCompletedLessons = lessonProgress.filter(
            lp => lp.isCompleted && lessonsList.some(l => l.id === lp.lessonId)
          );
          autoVerified = moduleCompletedLessons.length >= lessonsList.length && lessonsList.length > 0;
        } else if (requirement.requirementType === 'grid_score') {
          const gridStats = await storage.getGridScoreStats(userId);
          autoVerified = (gridStats.bestScore || 0) >= (requirement.minValue || 0);
        }

        if (autoVerified) {
          const verified = await storage.updateMasterySubmission(submission.id, {
            status: 'auto_verified',
            verifiedAt: new Date(),
            verificationFeedback: 'Automatically verified based on your progress data.',
          });
          return res.json(verified);
        }
      }

      res.json(submission);
    } catch (error) {
      console.error("Error submitting mastery evidence:", error);
      res.status(500).json({ message: "Failed to submit mastery evidence" });
    }
  });

  // Admin: Get all mastery submissions for review
  app.get("/api/admin/mastery/submissions", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const submissions = await storage.getAllMasterySubmissions(status);
      
      // Enrich with user info
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u]));
      
      const enriched = submissions.map(s => ({
        ...s,
        userName: userMap.get(s.userId)?.firstName
          ? `${userMap.get(s.userId)?.firstName} ${userMap.get(s.userId)?.lastName || ''}`
          : userMap.get(s.userId)?.email || 'Unknown',
      }));
      
      res.json(enriched);
    } catch (error) {
      console.error("Error fetching admin mastery submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Admin: Verify/reject mastery submission
  app.patch("/api/admin/mastery/submissions/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status, verificationFeedback } = req.body;
      const adminId = req.userId!;

      if (!['verified', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Status must be 'verified' or 'rejected'" });
      }

      const submission = await storage.getMasterySubmissionById(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }

      const updated = await storage.updateMasterySubmission(req.params.id, {
        status,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        verificationFeedback: verificationFeedback || null,
        revisionCount: status === 'rejected' ? submission.revisionCount + 1 : submission.revisionCount,
      });

      res.json(updated);
    } catch (error) {
      console.error("Error verifying mastery submission:", error);
      res.status(500).json({ message: "Failed to verify submission" });
    }
  });

  // Admin: CRUD mastery requirements
  app.get("/api/admin/mastery/requirements", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const moduleId = req.query.moduleId ? parseInt(req.query.moduleId) : undefined;
      const requirements = await storage.getMasteryRequirements(moduleId);
      res.json(requirements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requirements" });
    }
  });

  app.post("/api/admin/mastery/requirements", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const requirement = await storage.createMasteryRequirement(req.body);
      res.json(requirement);
    } catch (error) {
      console.error("Error creating mastery requirement:", error);
      res.status(500).json({ message: "Failed to create requirement" });
    }
  });

  app.patch("/api/admin/mastery/requirements/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const requirement = await storage.updateMasteryRequirement(req.params.id, req.body);
      if (!requirement) return res.status(404).json({ message: "Requirement not found" });
      res.json(requirement);
    } catch (error) {
      res.status(500).json({ message: "Failed to update requirement" });
    }
  });

  app.delete("/api/admin/mastery/requirements/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.deleteMasteryRequirement(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete requirement" });
    }
  });

  // ============================================
  // Transformation Analytics Routes
  // ============================================

  // User transformation summary
  app.get("/api/transformation/summary", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const summary = await storage.getTransformationSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching transformation summary:", error);
      res.status(500).json({ message: "Failed to fetch transformation summary" });
    }
  });

  // Performance Outcomes CRUD
  app.get("/api/outcomes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const outcomes = await storage.getPerformanceOutcomes(userId);
      res.json(outcomes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch outcomes" });
    }
  });

  app.post("/api/outcomes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const data = { ...req.body, userId };
      if (data.baselineValue && data.currentValue && data.baselineValue > 0) {
        data.improvementPercentage = ((data.currentValue - data.baselineValue) / Math.abs(data.baselineValue)) * 100;
      }
      const outcome = await storage.createPerformanceOutcome(data);
      res.json(outcome);
    } catch (error) {
      console.error("Error creating outcome:", error);
      res.status(500).json({ message: "Failed to create outcome" });
    }
  });

  app.put("/api/outcomes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const data = { ...req.body };
      if (data.baselineValue && data.currentValue && data.baselineValue > 0) {
        data.improvementPercentage = ((data.currentValue - data.baselineValue) / Math.abs(data.baselineValue)) * 100;
      }
      const outcome = await storage.updatePerformanceOutcome(req.params.id, userId, data);
      if (!outcome) return res.status(404).json({ message: "Outcome not found" });
      res.json(outcome);
    } catch (error) {
      res.status(500).json({ message: "Failed to update outcome" });
    }
  });

  app.delete("/api/outcomes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const deleted = await storage.deletePerformanceOutcome(req.params.id, userId);
      if (!deleted) return res.status(404).json({ message: "Outcome not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete outcome" });
    }
  });

  // User Testimonials
  app.get("/api/testimonials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const testimonials = await storage.getUserTestimonials(userId);
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/testimonials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const testimonial = await storage.createUserTestimonial({ ...req.body, userId });
      res.json(testimonial);
    } catch (error) {
      console.error("Error creating testimonial:", error);
      res.status(500).json({ message: "Failed to create testimonial" });
    }
  });

  // Public featured testimonials
  app.get("/api/testimonials/featured", async (req, res) => {
    try {
      const testimonials = await storage.getFeaturedTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured testimonials" });
    }
  });

  // Admin: Transformation Analytics
  app.get("/api/admin/transformation-analytics", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const analytics = await storage.getTransformationAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching transformation analytics:", error);
      res.status(500).json({ message: "Failed to fetch transformation analytics" });
    }
  });

  // Admin: Testimonials management
  app.get("/api/admin/testimonials", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const verified = req.query.verified !== undefined ? req.query.verified === 'true' : undefined;
      const testimonials = await storage.getAllTestimonials(verified);
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  app.patch("/api/admin/testimonials/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { verified, featured } = req.body;
      const adminId = req.userId!;
      const testimonial = await storage.updateTestimonialStatus(req.params.id, verified, featured, adminId);
      if (!testimonial) return res.status(404).json({ message: "Testimonial not found" });
      res.json(testimonial);
    } catch (error) {
      res.status(500).json({ message: "Failed to update testimonial" });
    }
  });

  // Interactive Video - User routes
  app.get("/api/lessons/:lessonId/interactions", isAuthenticated, async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const points = await storage.getInteractionPoints(lessonId);
      const published = points.filter(p => p.isPublished);
      res.json(published);
    } catch (error) {
      console.error("Error fetching interaction points:", error);
      res.status(500).json({ message: "Failed to fetch interaction points" });
    }
  });

  app.get("/api/lessons/:lessonId/interaction-responses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const lessonId = parseInt(req.params.lessonId);
      const responses = await storage.getInteractionResponses(userId, lessonId);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching interaction responses:", error);
      res.status(500).json({ message: "Failed to fetch interaction responses" });
    }
  });

  app.post("/api/interactions/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const interactionPointId = req.params.id;
      const { selectedOptionId, responseText, isCorrect, lessonId } = req.body;
      const response = await storage.saveInteractionResponse({
        userId,
        interactionPointId,
        lessonId,
        selectedOptionId: selectedOptionId || null,
        responseText: responseText || null,
        isCorrect: isCorrect ?? null,
      });
      res.json(response);
    } catch (error) {
      console.error("Error saving interaction response:", error);
      res.status(500).json({ message: "Failed to save response" });
    }
  });

  // Interactive Video - Admin routes
  app.get("/api/admin/lessons/:lessonId/interactions", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const points = await storage.getInteractionPoints(lessonId);
      res.json(points);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interaction points" });
    }
  });

  app.post("/api/admin/interactions", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const point = await storage.createInteractionPoint(req.body);
      res.json(point);
    } catch (error) {
      console.error("Error creating interaction point:", error);
      res.status(500).json({ message: "Failed to create interaction point" });
    }
  });

  app.patch("/api/admin/interactions/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const point = await storage.updateInteractionPoint(req.params.id, req.body);
      if (!point) return res.status(404).json({ message: "Interaction point not found" });
      res.json(point);
    } catch (error) {
      console.error("Error updating interaction point:", error);
      res.status(500).json({ message: "Failed to update interaction point" });
    }
  });

  app.delete("/api/admin/interactions/:id", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const deleted = await storage.deleteInteractionPoint(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Interaction point not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete interaction point" });
    }
  });

  app.post("/api/admin/interactions/reorder", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      await storage.reorderInteractionPoints(req.body.orderings);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder interaction points" });
    }
  });

  app.get("/api/admin/email-queue", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const queue = await storage.getEmailQueue();
      res.json(queue);
    } catch (error) {
      console.error("Error fetching email queue:", error);
      res.status(500).json({ message: "Failed to fetch email queue" });
    }
  });

  app.post("/api/admin/process-email-queue", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const result = await processEmailQueue();
      res.json(result);
    } catch (error) {
      console.error("Error processing email queue:", error);
      res.status(500).json({ message: "Failed to process email queue" });
    }
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { subscription } = req.body;
      if (!subscription) return res.status(400).json({ message: "subscription required" });
      await storage.savePushSubscription(userId, subscription);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving push subscription:", error);
      res.status(500).json({ message: "Failed to save subscription" });
    }
  });

  app.post("/api/push/send", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId, title, body, url } = req.body;
      if (!userId || !title || !body) return res.status(400).json({ message: "userId, title, body required" });
      const subs = await storage.getUserPushSubscriptions(userId);
      let sent = 0;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(sub.subscription as any, JSON.stringify({ title, body, url: url || "/dashboard" }));
          sent++;
        } catch (err: any) {
          console.error("Push send error:", err.statusCode || err.message);
        }
      }
      await storage.logPushSend(userId, "admin_send", sent > 0);
      res.json({ success: true, sent });
    } catch (error) {
      console.error("Error sending push:", error);
      res.status(500).json({ message: "Failed to send push" });
    }
  });

  app.get("/api/forum/posts", isAuthenticated, async (req: any, res) => {
    try {
      const context = req.query.context as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const posts = await storage.getForumPosts(context, limit, offset);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/forum/posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const result = await storage.getForumPost(req.params.id);
      if (!result) return res.status(404).json({ message: "Post not found" });
      const reactions = await storage.getForumReactions(req.params.id, userId);
      res.json({ ...result, reactions });
    } catch (error) {
      console.error("Error fetching forum post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/forum/posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { title, content, moduleContext } = req.body;
      if (!title || !content) return res.status(400).json({ message: "title and content required" });
      const post = await storage.createForumPost({
        userId,
        title,
        content,
        moduleContext: moduleContext || "general",
      });
      res.json(post);
    } catch (error) {
      console.error("Error creating forum post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post("/api/forum/posts/:id/replies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "content required" });
      const reply = await storage.createForumReply({
        postId: req.params.id,
        userId,
        content,
      });
      res.json(reply);
    } catch (error) {
      console.error("Error creating reply:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  app.post("/api/forum/reactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId!;
      const { postId, replyId, type } = req.body;
      if (!type || (!postId && !replyId)) return res.status(400).json({ message: "type and postId or replyId required" });
      const result = await storage.toggleForumReaction({ postId, replyId, userId, type });
      res.json(result);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      res.status(500).json({ message: "Failed to toggle reaction" });
    }
  });

  return httpServer;
}
