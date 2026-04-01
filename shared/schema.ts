import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date, real, serial, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Course Modules
export const modules = pgTable("modules", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  objectives: text("objectives").array().notNull(),
  orderIndex: integer("order_index").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(60),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lessons within modules
export const lessons = pgTable("lessons", {
  id: integer("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => modules.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content"), // Rich text content (HTML/JSON)
  videoUrl: text("video_url"),
  transcript: text("transcript"),
  keyConcepts: text("key_concepts").array(),
  orderIndex: integer("order_index").notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exercise templates for different types
export type ExerciseTemplate = 
  | 'metastory'        // Guided prompts for memory recall and editing
  | 'iap_discovery'    // Meditation script with sections
  | 'rnbr_process'     // Multi-step memory reframing
  | 'sa_objective'     // 11-criteria form builder
  | 'epsi_creation'    // Multi-sensory experience builder
  | 'success_failure_log' // Daily structured journal
  | 'journal'          // General journal entry
  | 'form'             // Custom form
  | 'meditation'       // Guided meditation
  | 'grid'             // Concentration grid
  | 'breathing';       // Breathing exercise

// Interactive exercises
export const exercises = pgTable("exercises", {
  id: integer("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  title: text("title").notNull(),
  instructions: text("instructions").notNull(),
  exerciseType: text("exercise_type").notNull(), // ExerciseTemplate type
  template: text("template"), // Template name for structured exercises
  config: text("config"), // JSON config for exercise specifics
  orderIndex: integer("order_index").notNull(),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User module progress
export const userModuleProgress = pgTable("user_module_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  moduleId: integer("module_id").notNull().references(() => modules.id),
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// User lesson progress
export const userLessonProgress = pgTable("user_lesson_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

// User exercise completions
export const userExerciseProgress = pgTable("user_exercise_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  exerciseId: integer("exercise_id").notNull().references(() => exercises.id),
  response: text("response"), // JSON for form responses, text for journals
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily practice logs
export const dailyPracticeLogs = pgTable("daily_practice_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  practiceDate: date("practice_date").notNull(),
  gutGoal: text("gut_goal"),
  gutGoalRecordedAt: timestamp("gut_goal_recorded_at"),
  breathingCompleted: boolean("breathing_completed").notNull().default(false),
  breathingCompletedAt: timestamp("breathing_completed_at"),
  gridScore: integer("grid_score"),
  gridTimeSeconds: integer("grid_time_seconds"),
  gridCompletedAt: timestamp("grid_completed_at"),
  epsiCompleted: boolean("epsi_completed").notNull().default(false),
  epsiTimeSeconds: integer("epsi_time_seconds"),
  epsiCompletedAt: timestamp("epsi_completed_at"),
  successLog: text("success_log"),
  failureLog: text("failure_log"),
  successFailureCompletedAt: timestamp("success_failure_completed_at"),
  isFullyCompleted: boolean("is_fully_completed").notNull().default(false),
  sessionCompletedAt: timestamp("session_completed_at"),
  totalTimeMinutes: integer("total_time_minutes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Practice streak history
export const practiceStreaks = pgTable("practice_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  streakStartDate: date("streak_start_date").notNull(),
  streakEndDate: date("streak_end_date"),
  streakDays: integer("streak_days").notNull().default(0),
  isCurrent: boolean("is_current").notNull().default(true),
  brokenAt: timestamp("broken_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily certainty ratings
export const certaintyRatings = pgTable("certainty_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  ratingDate: date("rating_date").notNull(),
  rating: real("rating").notNull(), // 1-10 scale
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User EPSI (Endpoint Success Image) storage
export const userEpsi = pgTable("user_epsi", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Metastories
export const userMetastories = pgTable("user_metastories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Downloadable resources
export const resources = pgTable("resources", {
  id: integer("id").primaryKey(),
  moduleId: integer("module_id").references(() => modules.id),
  title: text("title").notNull(),
  description: text("description"),
  resourceType: text("resource_type").notNull(), // 'pdf', 'audio', 'grid'
  fileUrl: text("file_url").notNull(),
});

// Saved Targets (unified storage for EPSI, Metastories, SA objectives, subsidiary targets)
export const savedTargets = pgTable("saved_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // 'metastory', 'epsi', 'sa_objective', 'subsidiary_target'
  title: text("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Livestreams
export const livestreams = pgTable("livestreams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'live', 'ended'
  embedUrl: text("embed_url"), // YouTube/Vimeo/custom embed URL for live stream
  recordingUrl: text("recording_url"), // URL to saved recording after stream ends
  thumbnailUrl: text("thumbnail_url"),
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Concentration Grid Scores
export const concentrationGridScores = pgTable("concentration_grid_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  score: integer("score").notNull(), // Highest number reached (0-99)
  timeSeconds: integer("time_seconds").notNull(), // Time taken in seconds
  completedAt: timestamp("completed_at").defaultNow(),
});

// Neural Lab - Pitch Recognition Drill Results
export const neuralLabResults = pgTable("neural_lab_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  pitchType: text("pitch_type").notNull(), // 'fastball', 'curveball', 'slider', 'changeup'
  reactionTimeMs: integer("reaction_time_ms").notNull(), // Reaction time in milliseconds
  wasCorrect: boolean("was_correct").notNull(),
  sessionId: varchar("session_id").notNull(), // Group drills into sessions
  completedAt: timestamp("completed_at").defaultNow(),
});

// Neural Lab Sessions - Aggregate session stats
export const neuralLabSessions = pgTable("neural_lab_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  totalPitches: integer("total_pitches").notNull(),
  correctPitches: integer("correct_pitches").notNull(),
  averageReactionMs: integer("average_reaction_ms").notNull(),
  fastestReactionMs: integer("fastest_reaction_ms").notNull(),
  accuracy: real("accuracy").notNull(), // Percentage 0-100
  completedAt: timestamp("completed_at").defaultNow(),
});

// Strike Zone Heatmap Data
export const strikeZoneData = pgTable("strike_zone_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  zone: integer("zone").notNull(), // 1-9 for 3x3 grid
  swingCount: integer("swing_count").notNull().default(0),
  takeCount: integer("take_count").notNull().default(0),
  hitCount: integer("hit_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const modulesRelations = relations(modules, ({ many }) => ({
  lessons: many(lessons),
  resources: many(resources),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  lesson: one(lessons, {
    fields: [exercises.lessonId],
    references: [lessons.id],
  }),
}));

// Insert schemas
export const insertModuleSchema = createInsertSchema(modules);
export const insertLessonSchema = createInsertSchema(lessons);
export const insertExerciseSchema = createInsertSchema(exercises);
export const insertDailyPracticeLogSchema = createInsertSchema(dailyPracticeLogs).omit({ id: true, createdAt: true });
export const insertCertaintyRatingSchema = createInsertSchema(certaintyRatings).omit({ id: true, createdAt: true });
export const insertUserEpsiSchema = createInsertSchema(userEpsi).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserMetastorySchema = createInsertSchema(userMetastories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSavedTargetSchema = createInsertSchema(savedTargets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGridScoreSchema = createInsertSchema(concentrationGridScores).omit({ id: true, completedAt: true });
export const insertNeuralLabResultSchema = createInsertSchema(neuralLabResults).omit({ id: true, completedAt: true });
export const insertNeuralLabSessionSchema = createInsertSchema(neuralLabSessions).omit({ id: true, completedAt: true });
export const insertStrikeZoneDataSchema = createInsertSchema(strikeZoneData).omit({ id: true, updatedAt: true });
export const insertLivestreamSchema = createInsertSchema(livestreams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPracticeStreakSchema = createInsertSchema(practiceStreaks).omit({ id: true, createdAt: true });

// Templates
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateType: varchar("template_type", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  moduleId: integer("module_id"),
  instructions: text("instructions"),
  exampleCompleted: text("example_completed"),
  templateConfig: text("template_config"),
  isPublished: boolean("is_published").notNull().default(true),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userTemplateSubmissions = pgTable("user_template_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  templateId: varchar("template_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  responses: text("responses"),
  lastStep: integer("last_step").notNull().default(0),
  progress: integer("progress").notNull().default(0),
  generatedOutput: text("generated_output"),
  autoSavedAt: timestamp("auto_saved_at"),
  submittedAt: timestamp("submitted_at"),
  isVerified: boolean("is_verified").notNull().default(false),
  verifiedBy: varchar("verified_by"),
  verifiedAt: timestamp("verified_at"),
  verificationNotes: text("verification_notes"),
  needsRevision: boolean("needs_revision").notNull().default(false),
  revisionGuidance: text("revision_guidance"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTemplateSubmissionSchema = createInsertSchema(userTemplateSubmissions).omit({ id: true, createdAt: true, updatedAt: true });

// Module Mastery Requirements
export const moduleMasteryRequirements = pgTable("module_mastery_requirements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: integer("module_id").notNull(),
  requirementType: varchar("requirement_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  verificationCriteria: text("verification_criteria"),
  isRequired: boolean("is_required").notNull().default(true),
  autoVerify: boolean("auto_verify").notNull().default(false),
  targetTemplateSlug: varchar("target_template_slug", { length: 100 }),
  minValue: integer("min_value"),
  orderIndex: integer("order_index").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Mastery Submissions
export const masterySubmissions = pgTable("mastery_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  requirementId: varchar("requirement_id").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  evidence: text("evidence"),
  fileUrl: text("file_url"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  verifiedBy: varchar("verified_by"),
  verifiedAt: timestamp("verified_at"),
  verificationFeedback: text("verification_feedback"),
  revisionCount: integer("revision_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMasteryRequirementSchema = createInsertSchema(moduleMasteryRequirements).omit({ id: true, createdAt: true });
export const insertMasterySubmissionSchema = createInsertSchema(masterySubmissions).omit({ id: true, createdAt: true, updatedAt: true });

// Performance Outcomes - user-reported stats tracking
export const performanceOutcomes = pgTable("performance_outcomes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  outcomeType: varchar("outcome_type", { length: 50 }).notNull(), // 'statistical', 'psychological', 'behavioral', 'competitive'
  metricName: varchar("metric_name", { length: 100 }).notNull(), // 'batting_average', 'strikeout_rate', 'pressure_performance', etc.
  baselineValue: real("baseline_value"),
  currentValue: real("current_value"),
  improvementPercentage: real("improvement_percentage"),
  notes: text("notes"),
  seasonContext: varchar("season_context", { length: 100 }),
  reportedAt: timestamp("reported_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Testimonials
export const userTestimonials = pgTable("user_testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  testimonialText: text("testimonial_text").notNull(),
  specificImprovement: varchar("specific_improvement", { length: 500 }),
  quantifiableResult: varchar("quantifiable_result", { length: 500 }),
  isVerified: boolean("is_verified").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  submittedAt: timestamp("submitted_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPerformanceOutcomeSchema = createInsertSchema(performanceOutcomes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserTestimonialSchema = createInsertSchema(userTestimonials).omit({ id: true, createdAt: true });

// Types
export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type DailyPracticeLog = typeof dailyPracticeLogs.$inferSelect;
export type InsertDailyPracticeLog = z.infer<typeof insertDailyPracticeLogSchema>;
export type CertaintyRating = typeof certaintyRatings.$inferSelect;
export type InsertCertaintyRating = z.infer<typeof insertCertaintyRatingSchema>;
export type UserEpsi = typeof userEpsi.$inferSelect;
export type InsertUserEpsi = z.infer<typeof insertUserEpsiSchema>;
export type UserMetastory = typeof userMetastories.$inferSelect;
export type InsertUserMetastory = z.infer<typeof insertUserMetastorySchema>;
export type UserModuleProgress = typeof userModuleProgress.$inferSelect;
export type UserLessonProgress = typeof userLessonProgress.$inferSelect;
export type UserExerciseProgress = typeof userExerciseProgress.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type SavedTarget = typeof savedTargets.$inferSelect;
export type InsertSavedTarget = z.infer<typeof insertSavedTargetSchema>;
export type GridScore = typeof concentrationGridScores.$inferSelect;
export type InsertGridScore = z.infer<typeof insertGridScoreSchema>;
export type NeuralLabResult = typeof neuralLabResults.$inferSelect;
export type InsertNeuralLabResult = z.infer<typeof insertNeuralLabResultSchema>;
export type NeuralLabSession = typeof neuralLabSessions.$inferSelect;
export type InsertNeuralLabSession = z.infer<typeof insertNeuralLabSessionSchema>;
export type StrikeZoneData = typeof strikeZoneData.$inferSelect;
export type InsertStrikeZoneData = z.infer<typeof insertStrikeZoneDataSchema>;
export type Livestream = typeof livestreams.$inferSelect;
export type InsertLivestream = z.infer<typeof insertLivestreamSchema>;
export type PracticeStreak = typeof practiceStreaks.$inferSelect;
export type InsertPracticeStreak = z.infer<typeof insertPracticeStreakSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type TemplateSubmission = typeof userTemplateSubmissions.$inferSelect;
export type InsertTemplateSubmission = z.infer<typeof insertTemplateSubmissionSchema>;
export type MasteryRequirement = typeof moduleMasteryRequirements.$inferSelect;
export type InsertMasteryRequirement = z.infer<typeof insertMasteryRequirementSchema>;
export type MasterySubmission = typeof masterySubmissions.$inferSelect;
export type InsertMasterySubmission = z.infer<typeof insertMasterySubmissionSchema>;
export type PerformanceOutcome = typeof performanceOutcomes.$inferSelect;
export type InsertPerformanceOutcome = z.infer<typeof insertPerformanceOutcomeSchema>;
export type UserTestimonial = typeof userTestimonials.$inferSelect;
export type InsertUserTestimonial = z.infer<typeof insertUserTestimonialSchema>;

// Interactive Video - Interaction Points
export const interactionPoints = pgTable("interaction_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  timestampSec: real("timestamp_sec").notNull(),
  promptType: varchar("prompt_type", { length: 30 }).notNull(), // 'multiple_choice', 'reflection', 'scenario', 'knowledge_check'
  promptText: text("prompt_text").notNull(),
  promptSubtext: text("prompt_subtext"),
  options: jsonb("options").notNull().default([]), // Array of { id, label, isCorrect?, followUpContent?, branchToSec? }
  followUpContent: text("follow_up_content"),
  isPausePoint: boolean("is_pause_point").notNull().default(true),
  orderIndex: integer("order_index").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interactive Video - User Responses
export const interactionResponses = pgTable("interaction_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  interactionPointId: varchar("interaction_point_id").notNull().references(() => interactionPoints.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  selectedOptionId: varchar("selected_option_id"),
  responseText: text("response_text"),
  isCorrect: boolean("is_correct"),
  respondedAt: timestamp("responded_at").defaultNow(),
});

export const insertInteractionPointSchema = createInsertSchema(interactionPoints).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInteractionResponseSchema = createInsertSchema(interactionResponses).omit({ id: true, respondedAt: true });

export type InteractionPoint = typeof interactionPoints.$inferSelect;
export type InsertInteractionPoint = z.infer<typeof insertInteractionPointSchema>;
export type InteractionResponse = typeof interactionResponses.$inferSelect;
export type InsertInteractionResponse = z.infer<typeof insertInteractionResponseSchema>;

// Performance Journal (structured protocol system)
export const performanceJournal = pgTable("performance_journal", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  mode: varchar("mode", { length: 30 }).notNull(), // 'pre_game', 'post_game', 'slump_protocol', 'value_audit', 'nightly_myelination'
  status: varchar("status", { length: 20 }).notNull().default("in_progress"), // 'in_progress', 'completed'
  currentSection: integer("current_section").notNull().default(0),
  gameDate: date("game_date"),
  opponent: varchar("opponent", { length: 100 }),
  gameType: varchar("game_type", { length: 30 }), // 'practice', 'scrimmage', 'regular_season', 'playoff', 'showcase'
  position: varchar("position", { length: 50 }),
  responses: jsonb("responses").notNull().default({}), // { [promptId]: value }
  dominantEmotion: varchar("dominant_emotion", { length: 50 }),
  valueAlignment: real("value_alignment"), // 1-10
  signalQuality: real("signal_quality"), // 1-10
  amygdalaScore: real("amygdala_score"), // 1-10 from command check
  executivePercent: real("executive_percent"), // 0-100 from post-game
  playerSummary: text("player_summary"),
  flaggedForReview: boolean("flagged_for_review").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPerformanceJournalSchema = createInsertSchema(performanceJournal).omit({ id: true, createdAt: true, updatedAt: true });
export type PerformanceJournalEntry = typeof performanceJournal.$inferSelect;
export type InsertPerformanceJournalEntry = z.infer<typeof insertPerformanceJournalSchema>;

// Journal Entries (legacy simple journal)
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  mood: varchar("mood", { length: 30 }),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true, updatedAt: true });
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export const badges = pgTable("badges", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconEmoji: text("icon_emoji").notNull(),
  xpRequired: integer("xp_required").notNull().default(0),
  eventTrigger: text("event_trigger").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBadgeSchema = createInsertSchema(badges).omit({ createdAt: true });
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  badgeId: text("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").defaultNow(),
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({ id: true, earnedAt: true });
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

export const leaderboardWeekly = pgTable("leaderboard_weekly", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  weekStart: date("week_start").notNull(),
  xpEarnedThisWeek: integer("xp_earned_this_week").notNull().default(0),
  streakThisWeek: integer("streak_this_week").notNull().default(0),
  practicesThisWeek: integer("practices_this_week").notNull().default(0),
});

export const insertLeaderboardWeeklySchema = createInsertSchema(leaderboardWeekly).omit({ id: true });
export type LeaderboardWeekly = typeof leaderboardWeekly.$inferSelect;
export type InsertLeaderboardWeekly = z.infer<typeof insertLeaderboardWeeklySchema>;

export const emailQueue = pgTable("email_queue", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  emailType: text("email_type").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailQueueSchema = createInsertSchema(emailQueue).omit({ id: true, sentAt: true, createdAt: true });
export type EmailQueueEntry = typeof emailQueue.$inferSelect;
export type InsertEmailQueueEntry = z.infer<typeof insertEmailQueueSchema>;

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subscription: jsonb("subscription").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

export const pushLog = pgTable("push_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  notificationType: text("notification_type").notNull(),
  sentAt: timestamp("sent_at").defaultNow(),
  success: boolean("success").notNull().default(true),
});

export const insertPushLogSchema = createInsertSchema(pushLog).omit({ id: true, sentAt: true });
export type PushLogEntry = typeof pushLog.$inferSelect;
export type InsertPushLogEntry = z.infer<typeof insertPushLogSchema>;

export const forumPosts = pgTable("forum_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  moduleContext: text("module_context").notNull().default("general"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertForumPostSchema = createInsertSchema(forumPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type ForumPost = typeof forumPosts.$inferSelect;
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;

export const forumReplies = pgTable("forum_replies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForumReplySchema = createInsertSchema(forumReplies).omit({ id: true, createdAt: true });
export type ForumReply = typeof forumReplies.$inferSelect;
export type InsertForumReply = z.infer<typeof insertForumReplySchema>;

export const forumReactions = pgTable("forum_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id"),
  replyId: varchar("reply_id"),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
});
