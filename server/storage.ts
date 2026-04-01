import { 
  modules, lessons, exercises, resources, savedTargets, concentrationGridScores,
  userModuleProgress, userLessonProgress, userExerciseProgress,
  dailyPracticeLogs, certaintyRatings, userEpsi, userMetastories,
  users, userXpEvents, neuralLabResults, neuralLabSessions, strikeZoneData, livestreams,
  practiceStreaks, templates, userTemplateSubmissions,
  moduleMasteryRequirements, masterySubmissions,
  performanceOutcomes, userTestimonials, journalEntries, performanceJournal,
  interactionPoints, interactionResponses,
  type Module, type Lesson, type Exercise, type Resource,
  type UserModuleProgress, type UserLessonProgress, type UserExerciseProgress,
  type DailyPracticeLog, type InsertDailyPracticeLog,
  type CertaintyRating, type InsertCertaintyRating,
  type UserEpsi, type InsertUserEpsi,
  type UserMetastory, type InsertUserMetastory,
  type SavedTarget, type InsertSavedTarget,
  type GridScore, type InsertGridScore,
  type NeuralLabResult, type InsertNeuralLabResult,
  type NeuralLabSession, type InsertNeuralLabSession,
  type StrikeZoneData, type InsertStrikeZoneData,
  type Livestream, type InsertLivestream,
  type PracticeStreak,
  type Template, type InsertTemplate,
  type TemplateSubmission, type InsertTemplateSubmission,
  type MasteryRequirement, type InsertMasteryRequirement,
  type MasterySubmission, type InsertMasterySubmission,
  type PerformanceOutcome, type InsertPerformanceOutcome,
  type UserTestimonial, type InsertUserTestimonial,
  type JournalEntry, type InsertJournalEntry,
  type PerformanceJournalEntry, type InsertPerformanceJournalEntry,
  type InteractionPoint, type InsertInteractionPoint,
  type InteractionResponse, type InsertInteractionResponse,
  type User, type InsertModule, type InsertLesson, type InsertExercise,
  badges, userBadges, leaderboardWeekly, emailQueue,
  type Badge, type UserBadge, type LeaderboardWeekly, type EmailQueueEntry,
  pushSubscriptions, pushLog, forumPosts, forumReplies, forumReactions,
  type PushSubscription, type PushLogEntry,
  type ForumPost, type ForumReply,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, sql, asc, count } from "drizzle-orm";

export interface IStorage {
  // Modules
  getModules(): Promise<Module[]>;
  getModuleById(id: number): Promise<Module | undefined>;
  
  // Lessons
  getLessonsByModuleId(moduleId: number): Promise<Lesson[]>;
  getLessonById(id: number): Promise<Lesson | undefined>;
  
  // Exercises
  getExercisesByLessonId(lessonId: number): Promise<Exercise[]>;
  
  // Resources
  getResources(): Promise<Resource[]>;
  getResourcesByModuleId(moduleId: number): Promise<Resource[]>;
  
  // User Module Progress
  getUserModuleProgress(userId: string): Promise<UserModuleProgress[]>;
  updateUserModuleProgress(userId: string, moduleId: number, data: Partial<UserModuleProgress>): Promise<void>;
  
  // User Lesson Progress
  getUserLessonProgress(userId: string): Promise<UserLessonProgress[]>;
  markLessonComplete(userId: string, lessonId: number): Promise<void>;
  
  // User Exercise Progress
  getUserExerciseProgress(userId: string): Promise<UserExerciseProgress[]>;
  saveExerciseResponse(userId: string, exerciseId: number, response: string): Promise<void>;
  
  // Daily Practice
  getDailyPracticeLogs(userId: string, limit?: number): Promise<DailyPracticeLog[]>;
  getTodayPracticeLog(userId: string): Promise<DailyPracticeLog | undefined>;
  saveDailyPracticeLog(data: InsertDailyPracticeLog): Promise<DailyPracticeLog>;
  
  // Certainty Ratings
  getCertaintyRatings(userId: string, limit?: number): Promise<CertaintyRating[]>;
  getTodayCertaintyRating(userId: string): Promise<CertaintyRating | undefined>;
  saveCertaintyRating(data: InsertCertaintyRating): Promise<CertaintyRating>;
  
  // User EPSI
  getUserEpsi(userId: string): Promise<UserEpsi | undefined>;
  saveUserEpsi(data: InsertUserEpsi): Promise<UserEpsi>;
  
  // User Metastories
  getUserMetastories(userId: string): Promise<UserMetastory[]>;
  saveUserMetastory(data: InsertUserMetastory): Promise<UserMetastory>;
  
  // Stats
  getUserStats(userId: string): Promise<{
    streak: number;
    modulesCompleted: number;
    totalJournalEntries: number;
    todayPracticeComplete: boolean;
    lastCertaintyRating: number | null;
  }>;
  
  // Certainty Rating Trends
  getCertaintyRatingTrends(userId: string): Promise<{
    average7Day: number | null;
    average30Day: number | null;
    trend: 'improving' | 'declining' | 'stable';
    hasBlocker: boolean;
    recentRatings: CertaintyRating[];
  }>;
  
  // Saved Targets
  getSavedTargets(userId: string, type?: string): Promise<SavedTarget[]>;
  getSavedTargetById(id: string): Promise<SavedTarget | undefined>;
  createSavedTarget(data: InsertSavedTarget): Promise<SavedTarget>;
  updateSavedTarget(id: string, data: Partial<InsertSavedTarget>): Promise<SavedTarget | undefined>;
  deleteSavedTarget(id: string): Promise<boolean>;
  
  // Practice Streaks
  getPracticeStreaks(userId: string): Promise<PracticeStreak[]>;
  getCurrentStreak(userId: string): Promise<PracticeStreak | undefined>;
  getStreakInfo(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    isOnTrack: boolean;
    lastPracticeDate: string | null;
    streakHistory: PracticeStreak[];
  }>;
  
  // Practice Calendar (heatmap data)
  getPracticeCalendar(userId: string, days?: number): Promise<{
    date: string;
    completed: boolean;
    gutGoal: boolean;
    breathing: boolean;
    grid: boolean;
    epsi: boolean;
    journal: boolean;
  }[]>;

  // Exercise Validation
  validateExerciseResponse(exerciseType: string, response: string): { isValid: boolean; errors: string[] };
  
  // Concentration Grid Scores
  getGridScores(userId: string, limit?: number): Promise<GridScore[]>;
  saveGridScore(data: InsertGridScore): Promise<GridScore>;
  getGridScoreStats(userId: string): Promise<{
    bestScore: number | null;
    averageScore: number | null;
    totalAttempts: number;
    recentScores: GridScore[];
  }>;
  
  getUser(id: string): Promise<User | undefined>;
  upsertUser(data: Partial<User> & { id: string }): Promise<User>;
  awardXp(userId: string, eventType: string, xpAmount: number, description?: string): Promise<void>;

  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  isUserAdmin(userId: string): Promise<boolean>;
  
  // Admin: Modules
  createModule(data: Partial<InsertModule>): Promise<Module>;
  updateModule(id: number, data: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: number): Promise<boolean>;
  reorderModules(orderings: { id: number; orderIndex: number }[]): Promise<void>;
  
  // Admin: Lessons
  createLesson(data: Partial<InsertLesson>): Promise<Lesson>;
  updateLesson(id: number, data: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: number): Promise<boolean>;
  reorderLessons(orderings: { id: number; orderIndex: number }[]): Promise<void>;
  
  // Admin: Exercises
  createExercise(data: Partial<InsertExercise>): Promise<Exercise>;
  updateExercise(id: number, data: Partial<Exercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<boolean>;
  reorderExercises(orderings: { id: number; orderIndex: number }[]): Promise<void>;
  
  // Admin: Analytics
  getAnalytics(): Promise<{
    totalUsers: number;
    totalEnrollments: number;
    averageCompletionRate: number;
    moduleDropoff: { moduleId: number; title: string; completions: number; dropoffRate: number }[];
    averageCertaintyRating: number | null;
    topExercises: { exerciseId: number; title: string; completions: number }[];
  }>;
  
  // Admin: User Progress
  getUserProgressDetails(userId: string): Promise<{
    user: User;
    moduleProgress: UserModuleProgress[];
    lessonProgress: UserLessonProgress[];
    exerciseResponses: UserExerciseProgress[];
    practiceLogs: DailyPracticeLog[];
    certaintyRatings: CertaintyRating[];
    gridScores: GridScore[];
  }>;
  
  // Neural Lab
  saveNeuralLabResult(data: InsertNeuralLabResult): Promise<NeuralLabResult>;
  saveNeuralLabSession(data: any): Promise<NeuralLabSession>;
  getUserBestNeuralLabSession(userId: string): Promise<NeuralLabSession | undefined>;
  getUserNeuralLabStats(userId: string): Promise<{
    averageReactionMs: number | null;
    fastestReactionMs: number | null;
    accuracy: number | null;
    totalSessions: number;
  }>;
  getNeuralLabLeaderboard(limit: number): Promise<any[]>;
  
  // Strike Zone
  getStrikeZoneData(userId: string): Promise<StrikeZoneData[]>;
  updateStrikeZoneData(userId: string, zone: number, action: 'swing' | 'take' | 'hit'): Promise<void>;
  
  // Coach Analysis
  getCoachAnalysis(userId: string): Promise<any>;
  
  // Livestreams
  getLivestreams(): Promise<Livestream[]>;
  getLivestreamById(id: string): Promise<Livestream | undefined>;
  createLivestream(data: InsertLivestream): Promise<Livestream>;
  updateLivestream(id: string, data: Partial<InsertLivestream>): Promise<Livestream | undefined>;
  deleteLivestream(id: string): Promise<boolean>;
  getCurrentLivestream(): Promise<Livestream | undefined>;

  // Templates
  getTemplates(type?: string): Promise<Template[]>;
  getTemplateById(id: string): Promise<Template | undefined>;
  getTemplateBySlug(slug: string): Promise<Template | undefined>;
  createTemplate(data: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, data: Partial<InsertTemplate>): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<boolean>;

  // Template Submissions
  getUserSubmissions(userId: string, templateId?: string): Promise<TemplateSubmission[]>;
  getSubmissionById(id: string): Promise<TemplateSubmission | undefined>;
  upsertDraftSubmission(userId: string, templateId: string, data: { responses: string; lastStep: number; progress: number; generatedOutput?: string }): Promise<TemplateSubmission>;
  submitSubmission(id: string): Promise<TemplateSubmission | undefined>;
  verifySubmission(id: string, verifiedBy: string, notes: string, approved: boolean, revisionGuidance?: string): Promise<TemplateSubmission | undefined>;

  // Mastery Requirements
  getMasteryRequirements(moduleId?: number): Promise<MasteryRequirement[]>;
  getMasteryRequirementById(id: string): Promise<MasteryRequirement | undefined>;
  createMasteryRequirement(data: InsertMasteryRequirement): Promise<MasteryRequirement>;
  updateMasteryRequirement(id: string, data: Partial<InsertMasteryRequirement>): Promise<MasteryRequirement | undefined>;
  deleteMasteryRequirement(id: string): Promise<boolean>;

  // Mastery Submissions
  getMasterySubmissions(userId: string, requirementId?: string): Promise<MasterySubmission[]>;
  getMasterySubmissionById(id: string): Promise<MasterySubmission | undefined>;
  createMasterySubmission(data: InsertMasterySubmission): Promise<MasterySubmission>;
  updateMasterySubmission(id: string, data: Partial<MasterySubmission>): Promise<MasterySubmission | undefined>;
  getAllMasterySubmissions(status?: string): Promise<(MasterySubmission & { requirementTitle?: string; moduleId?: number })[]>;
  checkModuleMastery(userId: string, moduleId: number): Promise<{ unlocked: boolean; requirements: { requirement: MasteryRequirement; submission: MasterySubmission | null; met: boolean }[] }>;

  // Performance Outcomes
  getPerformanceOutcomes(userId: string): Promise<PerformanceOutcome[]>;
  createPerformanceOutcome(data: InsertPerformanceOutcome): Promise<PerformanceOutcome>;
  updatePerformanceOutcome(id: string, userId: string, data: Partial<InsertPerformanceOutcome>): Promise<PerformanceOutcome | undefined>;
  deletePerformanceOutcome(id: string, userId: string): Promise<boolean>;

  // User Testimonials
  getUserTestimonials(userId: string): Promise<UserTestimonial[]>;
  createUserTestimonial(data: InsertUserTestimonial): Promise<UserTestimonial>;
  getFeaturedTestimonials(): Promise<(UserTestimonial & { userName?: string })[]>;
  getAllTestimonials(verified?: boolean): Promise<(UserTestimonial & { userName?: string })[]>;
  updateTestimonialStatus(id: string, verified: boolean, featured: boolean, approvedBy: string): Promise<UserTestimonial | undefined>;

  // Journal Entries (legacy)
  getJournalEntries(userId: string): Promise<JournalEntry[]>;
  getJournalEntryById(id: string, userId: string): Promise<JournalEntry | undefined>;
  createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry>;
  updateJournalEntry(id: string, userId: string, data: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: string, userId: string): Promise<boolean>;
  getJournalEntryCount(userId: string): Promise<number>;

  // Performance Journal (protocol system)
  getPerformanceJournalEntries(userId: string, mode?: string, limit?: number): Promise<PerformanceJournalEntry[]>;
  getPerformanceJournalById(id: string, userId: string): Promise<PerformanceJournalEntry | undefined>;
  getInProgressSession(userId: string, mode?: string): Promise<PerformanceJournalEntry | undefined>;
  createPerformanceJournal(data: InsertPerformanceJournalEntry): Promise<PerformanceJournalEntry>;
  updatePerformanceJournal(id: string, userId: string, data: Partial<InsertPerformanceJournalEntry>): Promise<PerformanceJournalEntry | undefined>;
  deletePerformanceJournal(id: string, userId: string): Promise<boolean>;
  getPerformanceJournalStats(userId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    streak: number;
    lastSessionDate: string | null;
    modeBreakdown: Record<string, number>;
    avgSignalQuality: number | null;
    avgValueAlignment: number | null;
    signalQualityTrend: { date: string; value: number }[];
    emotionFrequency: Record<string, number>;
    executiveAvg: number | null;
  }>;

  // Interactive Video
  getInteractionPoints(lessonId: number): Promise<InteractionPoint[]>;
  getInteractionPointById(id: string): Promise<InteractionPoint | undefined>;
  createInteractionPoint(data: InsertInteractionPoint): Promise<InteractionPoint>;
  updateInteractionPoint(id: string, data: Partial<InsertInteractionPoint>): Promise<InteractionPoint | undefined>;
  deleteInteractionPoint(id: string): Promise<boolean>;
  reorderInteractionPoints(orderings: { id: string; orderIndex: number }[]): Promise<void>;
  getInteractionResponses(userId: string, lessonId: number): Promise<InteractionResponse[]>;
  saveInteractionResponse(data: InsertInteractionResponse): Promise<InteractionResponse>;

  // Transformation Analytics
  getTransformationSummary(userId: string): Promise<{
    practiceConsistency: { currentStreak: number; longestStreak: number; totalPracticeDays: number; last30DaysRate: number };
    capabilityDevelopment: { modulesCompleted: number; totalModules: number; capabilitiesVerified: string[]; templateSubmissions: number };
    certaintyTrend: { current: number | null; avg7Day: number | null; avg30Day: number | null; trend: string };
    transformationScore: { rawScore: number; level: string; };
    milestones: { id: string; title: string; description: string; earned: boolean; earnedAt?: string }[];
    outcomes: PerformanceOutcome[];
  }>;

  // Admin Transformation Analytics
  getTransformationAnalytics(): Promise<{
    cohortMetrics: { avgStreak: number; avgCertainty: number | null; masteryCompletionRate: number; activeUsers30Days: number; totalPracticeDays: number };
    streakDistribution: { range: string; count: number }[];
    masteryBottlenecks: { requirementId: string; title: string; moduleId: number; pendingCount: number; avgReviewDays: number }[];
    templateUsage: { templateName: string; submissions: number; verified: number }[];
    riskIndicators: { userId: string; userName: string; issue: string; detail: string }[];
    outcomesSummary: { totalOutcomes: number; avgImprovement: number | null; topMetric: string | null };
  }>;
}

export class DatabaseStorage implements IStorage {
  // Modules
  async getModules(): Promise<Module[]> {
    return db.select().from(modules).orderBy(modules.orderIndex);
  }

  async getModuleById(id: number): Promise<Module | undefined> {
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    return module;
  }

  // Lessons
  async getLessonsByModuleId(moduleId: number): Promise<Lesson[]> {
    return db.select().from(lessons).where(eq(lessons.moduleId, moduleId)).orderBy(lessons.orderIndex);
  }

  async getLessonById(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  // Exercises
  async getExercisesByLessonId(lessonId: number): Promise<Exercise[]> {
    return db.select().from(exercises).where(eq(exercises.lessonId, lessonId)).orderBy(exercises.orderIndex);
  }

  // Resources
  async getResources(): Promise<Resource[]> {
    return db.select().from(resources);
  }

  async getResourcesByModuleId(moduleId: number): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.moduleId, moduleId));
  }

  // User Module Progress
  async getUserModuleProgress(userId: string): Promise<UserModuleProgress[]> {
    return db.select().from(userModuleProgress).where(eq(userModuleProgress.userId, userId));
  }

  async updateUserModuleProgress(userId: string, moduleId: number, data: Partial<UserModuleProgress>): Promise<void> {
    const existing = await db.select().from(userModuleProgress)
      .where(and(eq(userModuleProgress.userId, userId), eq(userModuleProgress.moduleId, moduleId)));
    
    if (existing.length > 0) {
      await db.update(userModuleProgress)
        .set(data)
        .where(and(eq(userModuleProgress.userId, userId), eq(userModuleProgress.moduleId, moduleId)));
    } else {
      await db.insert(userModuleProgress).values({
        userId,
        moduleId,
        ...data,
      });
    }
  }

  // User Lesson Progress
  async getUserLessonProgress(userId: string): Promise<UserLessonProgress[]> {
    return db.select().from(userLessonProgress).where(eq(userLessonProgress.userId, userId));
  }

  async markLessonComplete(userId: string, lessonId: number): Promise<void> {
    const existing = await db.select().from(userLessonProgress)
      .where(and(eq(userLessonProgress.userId, userId), eq(userLessonProgress.lessonId, lessonId)));
    
    if (existing.length === 0) {
      await db.insert(userLessonProgress).values({
        userId,
        lessonId,
        isCompleted: true,
        completedAt: new Date(),
      });
    } else {
      await db.update(userLessonProgress)
        .set({ isCompleted: true, completedAt: new Date() })
        .where(and(eq(userLessonProgress.userId, userId), eq(userLessonProgress.lessonId, lessonId)));
    }
  }

  // User Exercise Progress
  async getUserExerciseProgress(userId: string): Promise<UserExerciseProgress[]> {
    return db.select().from(userExerciseProgress).where(eq(userExerciseProgress.userId, userId));
  }

  async saveExerciseResponse(userId: string, exerciseId: number, response: string): Promise<void> {
    const existing = await db.select().from(userExerciseProgress)
      .where(and(eq(userExerciseProgress.userId, userId), eq(userExerciseProgress.exerciseId, exerciseId)));
    
    if (existing.length === 0) {
      await db.insert(userExerciseProgress).values({
        userId,
        exerciseId,
        response,
        isCompleted: true,
        completedAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      await db.update(userExerciseProgress)
        .set({ response, updatedAt: new Date() })
        .where(and(eq(userExerciseProgress.userId, userId), eq(userExerciseProgress.exerciseId, exerciseId)));
    }
  }

  // Daily Practice
  async getDailyPracticeLogs(userId: string, limit = 30): Promise<DailyPracticeLog[]> {
    return db.select().from(dailyPracticeLogs)
      .where(eq(dailyPracticeLogs.userId, userId))
      .orderBy(desc(dailyPracticeLogs.practiceDate))
      .limit(limit);
  }

  async getTodayPracticeLog(userId: string): Promise<DailyPracticeLog | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [log] = await db.select().from(dailyPracticeLogs)
      .where(and(
        eq(dailyPracticeLogs.userId, userId),
        eq(dailyPracticeLogs.practiceDate, today)
      ));
    return log;
  }

  async saveDailyPracticeLog(data: InsertDailyPracticeLog): Promise<DailyPracticeLog> {
    const existing = await db.select().from(dailyPracticeLogs)
      .where(and(
        eq(dailyPracticeLogs.userId, data.userId),
        eq(dailyPracticeLogs.practiceDate, data.practiceDate)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(dailyPracticeLogs)
        .set(data)
        .where(and(
          eq(dailyPracticeLogs.userId, data.userId),
          eq(dailyPracticeLogs.practiceDate, data.practiceDate)
        ))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(dailyPracticeLogs).values(data).returning();
      return inserted;
    }
  }

  // Certainty Ratings
  async getCertaintyRatings(userId: string, limit = 30): Promise<CertaintyRating[]> {
    return db.select().from(certaintyRatings)
      .where(eq(certaintyRatings.userId, userId))
      .orderBy(desc(certaintyRatings.ratingDate))
      .limit(limit);
  }

  async getTodayCertaintyRating(userId: string): Promise<CertaintyRating | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [rating] = await db.select().from(certaintyRatings)
      .where(and(
        eq(certaintyRatings.userId, userId),
        eq(certaintyRatings.ratingDate, today)
      ));
    return rating;
  }

  async saveCertaintyRating(data: InsertCertaintyRating): Promise<CertaintyRating> {
    const existing = await db.select().from(certaintyRatings)
      .where(and(
        eq(certaintyRatings.userId, data.userId),
        eq(certaintyRatings.ratingDate, data.ratingDate)
      ));

    if (existing.length > 0) {
      const [updated] = await db.update(certaintyRatings)
        .set(data)
        .where(and(
          eq(certaintyRatings.userId, data.userId),
          eq(certaintyRatings.ratingDate, data.ratingDate)
        ))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(certaintyRatings).values(data).returning();
      return inserted;
    }
  }

  // User EPSI
  async getUserEpsi(userId: string): Promise<UserEpsi | undefined> {
    const [epsi] = await db.select().from(userEpsi)
      .where(eq(userEpsi.userId, userId))
      .orderBy(desc(userEpsi.updatedAt))
      .limit(1);
    return epsi;
  }

  async saveUserEpsi(data: InsertUserEpsi): Promise<UserEpsi> {
    const existing = await this.getUserEpsi(data.userId);
    
    if (existing) {
      const [updated] = await db.update(userEpsi)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(userEpsi.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await db.insert(userEpsi).values(data).returning();
      return inserted;
    }
  }

  // User Metastories
  async getUserMetastories(userId: string): Promise<UserMetastory[]> {
    return db.select().from(userMetastories)
      .where(eq(userMetastories.userId, userId))
      .orderBy(desc(userMetastories.createdAt));
  }

  async saveUserMetastory(data: InsertUserMetastory): Promise<UserMetastory> {
    const [inserted] = await db.insert(userMetastories).values(data).returning();
    return inserted;
  }

  // Stats
  async getUserStats(userId: string): Promise<{
    streak: number;
    modulesCompleted: number;
    totalJournalEntries: number;
    todayPracticeComplete: boolean;
    lastCertaintyRating: number | null;
  }> {
    const logs = await this.getDailyPracticeLogs(userId, 365);
    const streak = this.calculateStreak(logs);

    // Count completed modules
    const moduleProgress = await this.getUserModuleProgress(userId);
    const modulesCompleted = moduleProgress.filter(m => m.isCompleted).length;

    // Count journal entries from dedicated journal table
    const journalCount = await this.getJournalEntryCount(userId);
    const totalJournalEntries = journalCount;

    // Today's practice status
    const todayLog = await this.getTodayPracticeLog(userId);
    const todayPracticeComplete = todayLog?.isFullyCompleted ?? false;

    // Last certainty rating
    const recentRatings = await this.getCertaintyRatings(userId, 1);
    const lastCertaintyRating = recentRatings.length > 0 ? recentRatings[0].rating : null;

    return {
      streak,
      modulesCompleted,
      totalJournalEntries,
      todayPracticeComplete,
      lastCertaintyRating,
    };
  }

  private calculateStreak(logs: DailyPracticeLog[]): number {
    if (logs.length === 0) return 0;
    
    const completedLogs = logs.filter(l => l.isFullyCompleted);
    if (completedLogs.length === 0) return 0;

    const sortedLogs = completedLogs.sort((a, b) => 
      new Date(b.practiceDate).getTime() - new Date(a.practiceDate).getTime()
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const mostRecentPracticeDate = new Date(sortedLogs[0].practiceDate + 'T00:00:00');
    
    const isToday = mostRecentPracticeDate.getTime() === today.getTime();
    
    if (!isToday) {
      return 0;
    }
    
    let streak = 1;
    let expectedDate = new Date(mostRecentPracticeDate);
    
    for (let i = 1; i < sortedLogs.length; i++) {
      expectedDate.setDate(expectedDate.getDate() - 1);
      const logDate = new Date(sortedLogs[i].practiceDate + 'T00:00:00');
      
      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  async getPracticeStreaks(userId: string): Promise<PracticeStreak[]> {
    return db.select().from(practiceStreaks)
      .where(eq(practiceStreaks.userId, userId))
      .orderBy(desc(practiceStreaks.createdAt));
  }

  async getCurrentStreak(userId: string): Promise<PracticeStreak | undefined> {
    const [streak] = await db.select().from(practiceStreaks)
      .where(and(
        eq(practiceStreaks.userId, userId),
        eq(practiceStreaks.isCurrent, true)
      ))
      .limit(1);
    return streak;
  }

  async getStreakInfo(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    isOnTrack: boolean;
    lastPracticeDate: string | null;
    streakHistory: PracticeStreak[];
  }> {
    const logs = await this.getDailyPracticeLogs(userId, 365);
    const currentStreak = this.calculateStreak(logs);
    
    const completedLogs = logs.filter(l => l.isFullyCompleted);
    const lastPracticeDate = completedLogs.length > 0 
      ? completedLogs.sort((a, b) => new Date(b.practiceDate).getTime() - new Date(a.practiceDate).getTime())[0].practiceDate 
      : null;
    
    const today = new Date().toISOString().split('T')[0];
    const isOnTrack = lastPracticeDate === today;
    
    const allStreaks = await this.getPracticeStreaks(userId);
    const longestStreak = allStreaks.reduce((max, s) => Math.max(max, s.streakDays), currentStreak);
    
    return {
      currentStreak,
      longestStreak,
      isOnTrack,
      lastPracticeDate,
      streakHistory: allStreaks,
    };
  }

  async getPracticeCalendar(userId: string, days = 90): Promise<{
    date: string;
    completed: boolean;
    gutGoal: boolean;
    breathing: boolean;
    grid: boolean;
    epsi: boolean;
    journal: boolean;
  }[]> {
    const logs = await this.getDailyPracticeLogs(userId, days);
    
    const result: {
      date: string;
      completed: boolean;
      gutGoal: boolean;
      breathing: boolean;
      grid: boolean;
      epsi: boolean;
      journal: boolean;
    }[] = [];
    
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const log = logs.find(l => l.practiceDate === dateStr);
      
      result.push({
        date: dateStr,
        completed: log?.isFullyCompleted ?? false,
        gutGoal: !!log?.gutGoal,
        breathing: log?.breathingCompleted ?? false,
        grid: log?.gridScore !== null && log?.gridScore !== undefined,
        epsi: log?.epsiCompleted ?? false,
        journal: !!(log?.successLog || log?.failureLog),
      });
    }
    
    return result;
  }

  // Certainty Rating Trends
  async getCertaintyRatingTrends(userId: string): Promise<{
    average7Day: number | null;
    average30Day: number | null;
    trend: 'improving' | 'declining' | 'stable';
    hasBlocker: boolean;
    recentRatings: CertaintyRating[];
  }> {
    const ratings = await this.getCertaintyRatings(userId, 30);
    
    if (ratings.length === 0) {
      return {
        average7Day: null,
        average30Day: null,
        trend: 'stable',
        hasBlocker: false,
        recentRatings: [],
      };
    }

    // Calculate 7-day average
    const last7Days = ratings.slice(0, 7);
    const average7Day = last7Days.length > 0 
      ? last7Days.reduce((sum, r) => sum + r.rating, 0) / last7Days.length 
      : null;

    // Calculate 30-day average
    const average30Day = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    // Determine trend by comparing first half vs second half
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (ratings.length >= 4) {
      const midpoint = Math.floor(ratings.length / 2);
      const recentHalf = ratings.slice(0, midpoint);
      const olderHalf = ratings.slice(midpoint);
      
      const recentAvg = recentHalf.reduce((sum, r) => sum + r.rating, 0) / recentHalf.length;
      const olderAvg = olderHalf.reduce((sum, r) => sum + r.rating, 0) / olderHalf.length;
      
      const diff = recentAvg - olderAvg;
      if (diff > 0.5) trend = 'improving';
      else if (diff < -0.5) trend = 'declining';
    }

    // Check for blocker (rating drops below 7)
    const hasBlocker = ratings.some(r => r.rating < 7);

    return {
      average7Day,
      average30Day,
      trend,
      hasBlocker,
      recentRatings: ratings,
    };
  }

  // Saved Targets CRUD
  async getSavedTargets(userId: string, type?: string): Promise<SavedTarget[]> {
    if (type) {
      return db.select().from(savedTargets)
        .where(and(eq(savedTargets.userId, userId), eq(savedTargets.type, type)))
        .orderBy(desc(savedTargets.updatedAt));
    }
    return db.select().from(savedTargets)
      .where(eq(savedTargets.userId, userId))
      .orderBy(desc(savedTargets.updatedAt));
  }

  async getSavedTargetById(id: string): Promise<SavedTarget | undefined> {
    const [target] = await db.select().from(savedTargets).where(eq(savedTargets.id, id));
    return target;
  }

  async createSavedTarget(data: InsertSavedTarget): Promise<SavedTarget> {
    const [inserted] = await db.insert(savedTargets).values(data).returning();
    return inserted;
  }

  async updateSavedTarget(id: string, data: Partial<InsertSavedTarget>): Promise<SavedTarget | undefined> {
    const [updated] = await db.update(savedTargets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(savedTargets.id, id))
      .returning();
    return updated;
  }

  async deleteSavedTarget(id: string): Promise<boolean> {
    const result = await db.delete(savedTargets).where(eq(savedTargets.id, id));
    return true;
  }

  // Exercise Validation
  validateExerciseResponse(exerciseType: string, response: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    switch (exerciseType) {
      case 'epsi':
      case 'EPSI':
        // EPSI requires minimum 300-500 words
        const wordCount = response.trim().split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 300) {
          errors.push(`EPSI requires at least 300 words. Current count: ${wordCount}`);
        }
        break;
        
      case 'metastory':
        // Metastory requires minimum content
        if (response.trim().length < 100) {
          errors.push('Metastory requires at least 100 characters');
        }
        break;
        
      case 'sa_objective':
        // SA Objective has 11 criteria (checking for basic structure)
        const lines = response.trim().split('\n').filter(l => l.trim().length > 0);
        if (lines.length < 3) {
          errors.push('SA Objective should include specific, measurable goals with timeline');
        }
        break;
        
      case 'success_failure':
      case 'journal':
        // Journal entries require at least some content
        if (response.trim().length < 10) {
          errors.push('Please provide more detail in your journal entry');
        }
        break;
        
      case 'time_trip':
        // Time trip visualization requires descriptive content
        if (response.trim().length < 50) {
          errors.push('Please describe your visualization in more detail');
        }
        break;
        
      case 'IAP':
      case 'iap':
        // Inner Anchor Point requires description
        if (response.trim().length < 50) {
          errors.push('Please describe your inner anchor point in more detail');
        }
        break;
        
      case 'RNBR':
      case 'rnbr':
        // RNBR protocol requires structured response
        if (response.trim().length < 30) {
          errors.push('Please complete the RNBR protocol');
        }
        break;
        
      default:
        // Default: require at least some content
        if (response.trim().length === 0) {
          errors.push('Response cannot be empty');
        }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Concentration Grid Scores
  async getGridScores(userId: string, limit = 30): Promise<GridScore[]> {
    return db.select().from(concentrationGridScores)
      .where(eq(concentrationGridScores.userId, userId))
      .orderBy(desc(concentrationGridScores.completedAt))
      .limit(limit);
  }

  async saveGridScore(data: InsertGridScore): Promise<GridScore> {
    const [inserted] = await db.insert(concentrationGridScores).values(data).returning();
    return inserted;
  }

  async getGridScoreStats(userId: string): Promise<{
    bestScore: number | null;
    averageScore: number | null;
    totalAttempts: number;
    recentScores: GridScore[];
  }> {
    const scores = await this.getGridScores(userId, 30);
    
    if (scores.length === 0) {
      return {
        bestScore: null,
        averageScore: null,
        totalAttempts: 0,
        recentScores: [],
      };
    }

    const bestScore = Math.max(...scores.map(s => s.score));
    const averageScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

    return {
      bestScore,
      averageScore: Math.round(averageScore * 10) / 10,
      totalAttempts: scores.length,
      recentScores: scores,
    };
  }

  // Admin: Users
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user?.isAdmin === true;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.getUserById(id);
  }

  async upsertUser(data: Partial<User> & { id: string }): Promise<User> {
    const existing = await this.getUserById(data.id);
    if (existing) {
      const updated = await this.updateUser(data.id, data);
      return updated!;
    }
    const [inserted] = await db.insert(users).values(data as any).returning();
    return inserted;
  }

  async awardXp(userId: string, eventType: string, xpAmount: number, description?: string): Promise<{ newBadges: Array<typeof badges.$inferSelect> }> {
    await db.insert(userXpEvents).values({
      userId,
      eventType,
      xpAmount,
      description,
    });

    const user = await this.getUserById(userId);
    if (!user) return { newBadges: [] };
    
    const oldLevel = user.currentLevel || "Rookie";
    const newXp = (user.currentXp || 0) + xpAmount;
    const levels = [
      { name: "Rookie", min: 0, max: 500 },
      { name: "Prospect", min: 501, max: 1500 },
      { name: "Draft Pick", min: 1501, max: 3500 },
      { name: "Pro", min: 3501, max: 7000 },
      { name: "All-Star", min: 7001, max: 15000 },
      { name: "Hall of Fame", min: 15001, max: Infinity },
    ];
    const newLevel = levels.find(l => newXp >= l.min && newXp <= l.max)?.name || "Rookie";
    
    await this.updateUser(userId, {
      currentXp: newXp,
      currentLevel: newLevel,
    } as any);

    const earnedBadges: Array<typeof badges.$inferSelect> = [];

    const eventBadges = await this.checkAndAwardBadges(userId, eventType);
    earnedBadges.push(...eventBadges);

    if (oldLevel !== newLevel) {
      const levelTriggerMap: Record<string, string> = {
        "Prospect": "level_prospect",
        "Draft Pick": "level_draft_pick",
        "Pro": "level_pro",
        "All-Star": "level_all_star",
        "Hall of Fame": "level_hall_of_fame",
      };
      const levelTrigger = levelTriggerMap[newLevel];
      if (levelTrigger) {
        const levelBadges = await this.checkAndAwardBadges(userId, levelTrigger);
        earnedBadges.push(...levelBadges);
      }
    }

    await this.updateWeeklyLeaderboard(userId, xpAmount);

    return { newBadges: earnedBadges };
  }

  async checkAndAwardBadges(userId: string, eventType: string): Promise<Array<typeof badges.$inferSelect>> {
    const matchingBadges = await db
      .select()
      .from(badges)
      .where(eq(badges.eventTrigger, eventType));

    if (matchingBadges.length === 0) return [];

    const earnedBadgeIds = await db
      .select({ badgeId: userBadges.badgeId })
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    const earnedSet = new Set(earnedBadgeIds.map(b => b.badgeId));
    const newBadges: Array<typeof badges.$inferSelect> = [];

    for (const badge of matchingBadges) {
      if (!earnedSet.has(badge.id)) {
        await db.insert(userBadges).values({ userId, badgeId: badge.id });
        newBadges.push(badge);
      }
    }

    return newBadges;
  }

  async checkStreakBadges(userId: string, streakCount: number): Promise<Array<typeof badges.$inferSelect>> {
    const streakMilestones = [
      { count: 3, trigger: "streak_3" },
      { count: 7, trigger: "streak_7" },
      { count: 21, trigger: "streak_21" },
      { count: 30, trigger: "streak_30" },
      { count: 60, trigger: "streak_60" },
      { count: 90, trigger: "streak_90" },
    ];
    const allNew: Array<typeof badges.$inferSelect> = [];
    for (const m of streakMilestones) {
      if (streakCount >= m.count) {
        const awarded = await this.checkAndAwardBadges(userId, m.trigger);
        allNew.push(...awarded);
        if (m.count === 7 && awarded.length > 0) {
          try {
            await this.scheduleEmail(userId, "day_7_badge", new Date());
          } catch (e) {}
        }
      }
    }
    return allNew;
  }

  async getUserBadges(userId: string): Promise<Array<typeof badges.$inferSelect & { earnedAt: Date | null }>> {
    const allBadges = await db.select().from(badges);
    const earned = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    const earnedMap = new Map(earned.map(e => [e.badgeId, e.earnedAt]));

    return allBadges.map(b => ({
      ...b,
      earnedAt: earnedMap.get(b.id) || null,
    }));
  }

  async getRecentBadge(userId: string): Promise<(typeof badges.$inferSelect & { earnedAt: Date | null }) | null> {
    const recent = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId))
      .orderBy(sql`earned_at DESC`)
      .limit(1);

    if (recent.length === 0) return null;

    const badge = await db
      .select()
      .from(badges)
      .where(eq(badges.id, recent[0].badgeId))
      .limit(1);

    if (badge.length === 0) return null;

    return { ...badge[0], earnedAt: recent[0].earnedAt };
  }

  async updateWeeklyLeaderboard(userId: string, xpAmount: number): Promise<void> {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - mondayOffset);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const existing = await db
      .select()
      .from(leaderboardWeekly)
      .where(and(
        eq(leaderboardWeekly.userId, userId),
        eq(leaderboardWeekly.weekStart, weekStartStr),
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(leaderboardWeekly)
        .set({
          xpEarnedThisWeek: sql`${leaderboardWeekly.xpEarnedThisWeek} + ${xpAmount}`,
        })
        .where(eq(leaderboardWeekly.id, existing[0].id));
    } else {
      await db.insert(leaderboardWeekly).values({
        userId,
        weekStart: weekStartStr,
        xpEarnedThisWeek: xpAmount,
        streakThisWeek: 0,
        practicesThisWeek: 0,
      });
    }
  }

  async incrementWeeklyPractice(userId: string, streakCount: number): Promise<void> {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - mondayOffset);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const existing = await db
      .select()
      .from(leaderboardWeekly)
      .where(and(
        eq(leaderboardWeekly.userId, userId),
        eq(leaderboardWeekly.weekStart, weekStartStr),
      ))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(leaderboardWeekly)
        .set({
          practicesThisWeek: sql`${leaderboardWeekly.practicesThisWeek} + 1`,
          streakThisWeek: streakCount,
        })
        .where(eq(leaderboardWeekly.id, existing[0].id));
    } else {
      await db.insert(leaderboardWeekly).values({
        userId,
        weekStart: weekStartStr,
        xpEarnedThisWeek: 0,
        streakThisWeek: streakCount,
        practicesThisWeek: 1,
      });
    }
  }

  async getWeeklyLeaderboard(level?: string): Promise<Array<{ userId: string; displayName: string | null; currentLevel: string | null; xpEarnedThisWeek: number; streakThisWeek: number; practicesThisWeek: number; rank: number }>> {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - mondayOffset);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    let query = db
      .select({
        userId: leaderboardWeekly.userId,
        displayName: users.displayName,
        currentLevel: users.currentLevel,
        xpEarnedThisWeek: leaderboardWeekly.xpEarnedThisWeek,
        streakThisWeek: leaderboardWeekly.streakThisWeek,
        practicesThisWeek: leaderboardWeekly.practicesThisWeek,
      })
      .from(leaderboardWeekly)
      .innerJoin(users, eq(leaderboardWeekly.userId, users.id))
      .where(eq(leaderboardWeekly.weekStart, weekStartStr))
      .orderBy(sql`${leaderboardWeekly.xpEarnedThisWeek} DESC`)
      .limit(50);

    const results = await query;

    let filtered = results;
    if (level) {
      filtered = results.filter(r => r.currentLevel === level);
    }

    return filtered.map((r, i) => ({ ...r, rank: i + 1 }));
  }

  async scheduleEmail(userId: string, emailType: string, scheduledFor: Date): Promise<void> {
    const existing = await db
      .select({ id: emailQueue.id })
      .from(emailQueue)
      .where(and(
        eq(emailQueue.userId, userId),
        eq(emailQueue.emailType, emailType),
      ))
      .limit(1);

    if (existing.length > 0) return;

    await db.insert(emailQueue).values({
      userId,
      emailType,
      scheduledFor,
    });
  }

  async getEmailQueue(): Promise<Array<typeof emailQueue.$inferSelect>> {
    return db.select().from(emailQueue).orderBy(sql`scheduled_for ASC`);
  }

  // Admin: Modules
  async createModule(data: Partial<InsertModule>): Promise<Module> {
    const allModules = await this.getModules();
    const nextId = allModules.length > 0 ? Math.max(...allModules.map(m => m.id)) + 1 : 1;
    const nextOrderIndex = allModules.length;
    
    const [inserted] = await db.insert(modules).values({
      id: nextId,
      title: data.title || 'New Module',
      description: data.description || '',
      objectives: data.objectives || [],
      orderIndex: nextOrderIndex,
      estimatedMinutes: data.estimatedMinutes || 60,
      isPublished: data.isPublished ?? false,
    }).returning();
    return inserted;
  }

  async updateModule(id: number, data: Partial<Module>): Promise<Module | undefined> {
    const [updated] = await db.update(modules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(modules.id, id))
      .returning();
    return updated;
  }

  async deleteModule(id: number): Promise<boolean> {
    const result = await db.delete(modules).where(eq(modules.id, id));
    return true;
  }

  async reorderModules(orderings: { id: number; orderIndex: number }[]): Promise<void> {
    for (const { id, orderIndex } of orderings) {
      await db.update(modules).set({ orderIndex }).where(eq(modules.id, id));
    }
  }

  // Admin: Lessons
  async createLesson(data: Partial<InsertLesson>): Promise<Lesson> {
    if (!data.moduleId) throw new Error('moduleId is required');
    
    const existingLessons = await this.getLessonsByModuleId(data.moduleId);
    const nextId = existingLessons.length > 0 ? Math.max(...existingLessons.map(l => l.id)) + 1 : 1;
    const allLessons = await db.select().from(lessons);
    const maxGlobalId = allLessons.length > 0 ? Math.max(...allLessons.map(l => l.id)) : 0;
    const nextOrderIndex = existingLessons.length;
    
    const [inserted] = await db.insert(lessons).values({
      id: maxGlobalId + 1,
      moduleId: data.moduleId,
      title: data.title || 'New Lesson',
      description: data.description || '',
      content: data.content || '',
      videoUrl: data.videoUrl,
      transcript: data.transcript,
      keyConcepts: data.keyConcepts || [],
      orderIndex: nextOrderIndex,
      estimatedMinutes: data.estimatedMinutes || 15,
      isPublished: data.isPublished ?? false,
    }).returning();
    return inserted;
  }

  async updateLesson(id: number, data: Partial<Lesson>): Promise<Lesson | undefined> {
    const [updated] = await db.update(lessons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return updated;
  }

  async deleteLesson(id: number): Promise<boolean> {
    await db.delete(lessons).where(eq(lessons.id, id));
    return true;
  }

  async reorderLessons(orderings: { id: number; orderIndex: number }[]): Promise<void> {
    for (const { id, orderIndex } of orderings) {
      await db.update(lessons).set({ orderIndex }).where(eq(lessons.id, id));
    }
  }

  // Admin: Exercises
  async createExercise(data: Partial<InsertExercise>): Promise<Exercise> {
    if (!data.lessonId) throw new Error('lessonId is required');
    
    const existingExercises = await this.getExercisesByLessonId(data.lessonId);
    const allExercises = await db.select().from(exercises);
    const maxGlobalId = allExercises.length > 0 ? Math.max(...allExercises.map(e => e.id)) : 0;
    const nextOrderIndex = existingExercises.length;
    
    const [inserted] = await db.insert(exercises).values({
      id: maxGlobalId + 1,
      lessonId: data.lessonId,
      title: data.title || 'New Exercise',
      instructions: data.instructions || '',
      exerciseType: data.exerciseType || 'journal',
      template: data.template,
      config: data.config,
      orderIndex: nextOrderIndex,
      isPublished: data.isPublished ?? false,
    }).returning();
    return inserted;
  }

  async updateExercise(id: number, data: Partial<Exercise>): Promise<Exercise | undefined> {
    const [updated] = await db.update(exercises)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(exercises.id, id))
      .returning();
    return updated;
  }

  async deleteExercise(id: number): Promise<boolean> {
    await db.delete(exercises).where(eq(exercises.id, id));
    return true;
  }

  async reorderExercises(orderings: { id: number; orderIndex: number }[]): Promise<void> {
    for (const { id, orderIndex } of orderings) {
      await db.update(exercises).set({ orderIndex }).where(eq(exercises.id, id));
    }
  }

  // Admin: Analytics
  async getAnalytics(): Promise<{
    totalUsers: number;
    totalEnrollments: number;
    averageCompletionRate: number;
    moduleDropoff: { moduleId: number; title: string; completions: number; dropoffRate: number }[];
    averageCertaintyRating: number | null;
    topExercises: { exerciseId: number; title: string; completions: number }[];
  }> {
    const allUsers = await this.getAllUsers();
    const totalUsers = allUsers.length;
    
    const allModuleProgress = await db.select().from(userModuleProgress);
    const totalEnrollments = allModuleProgress.length;
    
    const completedModules = allModuleProgress.filter(p => p.isCompleted).length;
    const averageCompletionRate = totalEnrollments > 0 ? (completedModules / totalEnrollments) * 100 : 0;
    
    const allModules = await this.getModules();
    const moduleDropoff = await Promise.all(allModules.map(async (mod) => {
      const progress = allModuleProgress.filter(p => p.moduleId === mod.id);
      const completions = progress.filter(p => p.isCompleted).length;
      const started = progress.length;
      const dropoffRate = started > 0 ? ((started - completions) / started) * 100 : 0;
      return {
        moduleId: mod.id,
        title: mod.title,
        completions,
        dropoffRate: Math.round(dropoffRate * 10) / 10,
      };
    }));
    
    const allRatings = await db.select().from(certaintyRatings);
    const averageCertaintyRating = allRatings.length > 0
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 10) / 10
      : null;
    
    const allExerciseProgress = await db.select().from(userExerciseProgress).where(eq(userExerciseProgress.isCompleted, true));
    const exerciseCounts: Record<number, number> = {};
    allExerciseProgress.forEach(p => {
      exerciseCounts[p.exerciseId] = (exerciseCounts[p.exerciseId] || 0) + 1;
    });
    
    const allExercises = await db.select().from(exercises);
    const topExercises = Object.entries(exerciseCounts)
      .map(([id, completions]) => {
        const exercise = allExercises.find(e => e.id === parseInt(id));
        return { exerciseId: parseInt(id), title: exercise?.title || 'Unknown', completions };
      })
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 10);
    
    return {
      totalUsers,
      totalEnrollments,
      averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
      moduleDropoff,
      averageCertaintyRating,
      topExercises,
    };
  }

  // Admin: User Progress Details
  async getUserProgressDetails(userId: string): Promise<{
    user: User;
    moduleProgress: UserModuleProgress[];
    lessonProgress: UserLessonProgress[];
    exerciseResponses: UserExerciseProgress[];
    practiceLogs: DailyPracticeLog[];
    certaintyRatings: CertaintyRating[];
    gridScores: GridScore[];
  }> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    const [moduleProgress, lessonProgress, exerciseResponses, practiceLogs, ratings, gridScores] = await Promise.all([
      this.getUserModuleProgress(userId),
      this.getUserLessonProgress(userId),
      this.getUserExerciseProgress(userId),
      this.getDailyPracticeLogs(userId, 100),
      this.getCertaintyRatings(userId, 100),
      this.getGridScores(userId, 100),
    ]);
    
    return {
      user,
      moduleProgress,
      lessonProgress,
      exerciseResponses,
      practiceLogs,
      certaintyRatings: ratings,
      gridScores,
    };
  }

  // ===== NEURAL LAB METHODS =====
  
  async saveNeuralLabResult(data: InsertNeuralLabResult): Promise<NeuralLabResult> {
    const [result] = await db.insert(neuralLabResults).values(data).returning();
    return result;
  }

  async saveNeuralLabSession(data: any): Promise<NeuralLabSession> {
    const [session] = await db.insert(neuralLabSessions).values({
      userId: data.userId,
      totalPitches: data.totalPitches,
      correctPitches: data.correctPitches,
      averageReactionMs: data.averageReactionMs,
      fastestReactionMs: data.fastestReactionMs,
      accuracy: data.accuracy,
    }).returning();
    return session;
  }

  async getUserBestNeuralLabSession(userId: string): Promise<NeuralLabSession | undefined> {
    const [best] = await db.select()
      .from(neuralLabSessions)
      .where(eq(neuralLabSessions.userId, userId))
      .orderBy(asc(neuralLabSessions.averageReactionMs))
      .limit(1);
    return best;
  }

  async getUserNeuralLabStats(userId: string): Promise<{
    averageReactionMs: number | null;
    fastestReactionMs: number | null;
    accuracy: number | null;
    totalSessions: number;
  }> {
    const sessions = await db.select()
      .from(neuralLabSessions)
      .where(eq(neuralLabSessions.userId, userId));
    
    if (sessions.length === 0) {
      return {
        averageReactionMs: null,
        fastestReactionMs: null,
        accuracy: null,
        totalSessions: 0,
      };
    }

    const totalReaction = sessions.reduce((sum, s) => sum + s.averageReactionMs, 0);
    const fastestReaction = Math.min(...sessions.map(s => s.fastestReactionMs));
    const totalAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0);

    return {
      averageReactionMs: Math.round(totalReaction / sessions.length),
      fastestReactionMs: fastestReaction,
      accuracy: Math.round((totalAccuracy / sessions.length) * 10) / 10,
      totalSessions: sessions.length,
    };
  }

  async getNeuralLabLeaderboard(limit: number): Promise<any[]> {
    const result = await db.execute(sql`
      WITH user_best AS (
        SELECT 
          user_id,
          MIN(average_reaction_ms) as best_avg_reaction,
          MIN(fastest_reaction_ms) as best_fastest_reaction,
          AVG(accuracy) as avg_accuracy,
          COUNT(*) as total_sessions
        FROM neural_lab_sessions
        GROUP BY user_id
      )
      SELECT 
        ub.user_id,
        ub.best_avg_reaction as average_reaction_ms,
        ub.best_fastest_reaction as fastest_reaction_ms,
        ub.avg_accuracy as accuracy,
        ub.total_sessions,
        u.first_name,
        u.last_name,
        u.profile_image_url
      FROM user_best ub
      LEFT JOIN users u ON ub.user_id = u.id
      ORDER BY ub.best_avg_reaction ASC
      LIMIT ${limit}
    `);

    return result.rows.map((row: any, index: number) => ({
      rank: index + 1,
      userId: row.user_id,
      userName: row.first_name && row.last_name 
        ? `${row.first_name} ${row.last_name}`
        : row.first_name || 'Anonymous Player',
      userImage: row.profile_image_url,
      averageReactionMs: Math.round(row.average_reaction_ms),
      fastestReactionMs: row.fastest_reaction_ms,
      accuracy: Math.round(row.avg_accuracy * 10) / 10,
      totalSessions: Number(row.total_sessions),
    }));
  }

  // ===== STRIKE ZONE METHODS =====

  async getStrikeZoneData(userId: string): Promise<StrikeZoneData[]> {
    return db.select()
      .from(strikeZoneData)
      .where(eq(strikeZoneData.userId, userId))
      .orderBy(strikeZoneData.zone);
  }

  async updateStrikeZoneData(userId: string, zone: number, action: 'swing' | 'take' | 'hit'): Promise<void> {
    const [existing] = await db.select()
      .from(strikeZoneData)
      .where(and(
        eq(strikeZoneData.userId, userId),
        eq(strikeZoneData.zone, zone)
      ));

    if (existing) {
      const updates: any = { updatedAt: new Date() };
      if (action === 'swing') updates.swingCount = existing.swingCount + 1;
      if (action === 'take') updates.takeCount = existing.takeCount + 1;
      if (action === 'hit') updates.hitCount = existing.hitCount + 1;

      await db.update(strikeZoneData)
        .set(updates)
        .where(eq(strikeZoneData.id, existing.id));
    } else {
      await db.insert(strikeZoneData).values({
        userId,
        zone,
        swingCount: action === 'swing' ? 1 : 0,
        takeCount: action === 'take' ? 1 : 0,
        hitCount: action === 'hit' ? 1 : 0,
      });
    }
  }

  // ===== COACH ANALYSIS METHODS =====

  async getCoachAnalysis(userId: string): Promise<any> {
    const [stats, neuralStats, certaintyData, recentSessions] = await Promise.all([
      this.getUserStats(userId),
      this.getUserNeuralLabStats(userId),
      this.getCertaintyRatingTrends(userId),
      db.select()
        .from(neuralLabSessions)
        .where(eq(neuralLabSessions.userId, userId))
        .orderBy(desc(neuralLabSessions.completedAt))
        .limit(10),
    ]);

    // Get user's rank
    const leaderboard = await this.getNeuralLabLeaderboard(100);
    const userRank = leaderboard.findIndex(e => e.userId === userId) + 1;

    // Build reaction trend data
    const reactionTrend = recentSessions.reverse().map((s, i) => ({
      date: `Day ${i + 1}`,
      avgMs: s.averageReactionMs,
    }));

    // Build certainty trend data
    const certaintyHistory = certaintyData.recentRatings.map((r, i) => ({
      date: `Day ${i + 1}`,
      rating: r.rating,
    }));

    return {
      streak: stats.streak,
      neuralLabStats: neuralStats,
      certaintyTrend: certaintyData.trend,
      certaintyHistory,
      reactionTrend,
      rank: userRank > 0 ? userRank : null,
    };
  }

  // ===== LIVESTREAM METHODS =====

  async getLivestreams(): Promise<Livestream[]> {
    return db.select().from(livestreams).orderBy(desc(livestreams.createdAt));
  }

  async getLivestreamById(id: string): Promise<Livestream | undefined> {
    const [stream] = await db.select().from(livestreams).where(eq(livestreams.id, id));
    return stream;
  }

  async createLivestream(data: InsertLivestream): Promise<Livestream> {
    const [stream] = await db.insert(livestreams).values(data).returning();
    return stream;
  }

  async updateLivestream(id: string, data: Partial<InsertLivestream>): Promise<Livestream | undefined> {
    const [stream] = await db.update(livestreams)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(livestreams.id, id))
      .returning();
    return stream;
  }

  async deleteLivestream(id: string): Promise<boolean> {
    const result = await db.delete(livestreams).where(eq(livestreams.id, id));
    return true;
  }

  async getCurrentLivestream(): Promise<Livestream | undefined> {
    const [stream] = await db.select().from(livestreams)
      .where(eq(livestreams.status, "live"))
      .orderBy(desc(livestreams.startedAt))
      .limit(1);
    return stream;
  }

  // ===== TEMPLATE METHODS =====

  async getTemplates(type?: string): Promise<Template[]> {
    if (type) {
      return db.select().from(templates)
        .where(and(eq(templates.isPublished, true), eq(templates.templateType, type)))
        .orderBy(templates.name);
    }
    return db.select().from(templates)
      .where(eq(templates.isPublished, true))
      .orderBy(templates.name);
  }

  async getTemplateById(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template;
  }

  async getTemplateBySlug(slug: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.slug, slug));
    return template;
  }

  async createTemplate(data: InsertTemplate): Promise<Template> {
    const [template] = await db.insert(templates).values(data).returning();
    return template;
  }

  async updateTemplate(id: string, data: Partial<InsertTemplate>): Promise<Template | undefined> {
    const [template] = await db.update(templates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    return template;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    await db.delete(templates).where(eq(templates.id, id));
    return true;
  }

  // ===== TEMPLATE SUBMISSION METHODS =====

  async getUserSubmissions(userId: string, templateId?: string): Promise<TemplateSubmission[]> {
    if (templateId) {
      return db.select().from(userTemplateSubmissions)
        .where(and(eq(userTemplateSubmissions.userId, userId), eq(userTemplateSubmissions.templateId, templateId)))
        .orderBy(desc(userTemplateSubmissions.updatedAt));
    }
    return db.select().from(userTemplateSubmissions)
      .where(eq(userTemplateSubmissions.userId, userId))
      .orderBy(desc(userTemplateSubmissions.updatedAt));
  }

  async getSubmissionById(id: string): Promise<TemplateSubmission | undefined> {
    const [submission] = await db.select().from(userTemplateSubmissions)
      .where(eq(userTemplateSubmissions.id, id));
    return submission;
  }

  async upsertDraftSubmission(userId: string, templateId: string, data: { responses: string; lastStep: number; progress: number; generatedOutput?: string }): Promise<TemplateSubmission> {
    const [existing] = await db.select().from(userTemplateSubmissions)
      .where(and(
        eq(userTemplateSubmissions.userId, userId),
        eq(userTemplateSubmissions.templateId, templateId),
        eq(userTemplateSubmissions.status, "draft")
      ))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(userTemplateSubmissions)
        .set({
          responses: data.responses,
          lastStep: data.lastStep,
          progress: data.progress,
          generatedOutput: data.generatedOutput || existing.generatedOutput,
          autoSavedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userTemplateSubmissions.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(userTemplateSubmissions).values({
      userId,
      templateId,
      status: "draft",
      responses: data.responses,
      lastStep: data.lastStep,
      progress: data.progress,
      generatedOutput: data.generatedOutput,
      autoSavedAt: new Date(),
    }).returning();
    return created;
  }

  async submitSubmission(id: string): Promise<TemplateSubmission | undefined> {
    const [submission] = await db.update(userTemplateSubmissions)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userTemplateSubmissions.id, id))
      .returning();
    return submission;
  }

  async verifySubmission(id: string, verifiedBy: string, notes: string, approved: boolean, revisionGuidance?: string): Promise<TemplateSubmission | undefined> {
    const [submission] = await db.update(userTemplateSubmissions)
      .set({
        status: approved ? "verified" : "rejected",
        isVerified: approved,
        verifiedBy,
        verifiedAt: new Date(),
        verificationNotes: notes,
        needsRevision: !approved,
        revisionGuidance: revisionGuidance || null,
        updatedAt: new Date(),
      })
      .where(eq(userTemplateSubmissions.id, id))
      .returning();
    return submission;
  }

  // Mastery Requirements
  async getMasteryRequirements(moduleId?: number): Promise<MasteryRequirement[]> {
    if (moduleId !== undefined) {
      return db.select().from(moduleMasteryRequirements)
        .where(eq(moduleMasteryRequirements.moduleId, moduleId))
        .orderBy(moduleMasteryRequirements.orderIndex);
    }
    return db.select().from(moduleMasteryRequirements).orderBy(moduleMasteryRequirements.moduleId, moduleMasteryRequirements.orderIndex);
  }

  async getMasteryRequirementById(id: string): Promise<MasteryRequirement | undefined> {
    const [req] = await db.select().from(moduleMasteryRequirements).where(eq(moduleMasteryRequirements.id, id));
    return req;
  }

  async createMasteryRequirement(data: InsertMasteryRequirement): Promise<MasteryRequirement> {
    const [req] = await db.insert(moduleMasteryRequirements).values(data).returning();
    return req;
  }

  async updateMasteryRequirement(id: string, data: Partial<InsertMasteryRequirement>): Promise<MasteryRequirement | undefined> {
    const [req] = await db.update(moduleMasteryRequirements).set(data).where(eq(moduleMasteryRequirements.id, id)).returning();
    return req;
  }

  async deleteMasteryRequirement(id: string): Promise<boolean> {
    const result = await db.delete(moduleMasteryRequirements).where(eq(moduleMasteryRequirements.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Mastery Submissions
  async getMasterySubmissions(userId: string, requirementId?: string): Promise<MasterySubmission[]> {
    if (requirementId) {
      return db.select().from(masterySubmissions)
        .where(and(eq(masterySubmissions.userId, userId), eq(masterySubmissions.requirementId, requirementId)))
        .orderBy(desc(masterySubmissions.createdAt));
    }
    return db.select().from(masterySubmissions)
      .where(eq(masterySubmissions.userId, userId))
      .orderBy(desc(masterySubmissions.createdAt));
  }

  async getMasterySubmissionById(id: string): Promise<MasterySubmission | undefined> {
    const [sub] = await db.select().from(masterySubmissions).where(eq(masterySubmissions.id, id));
    return sub;
  }

  async createMasterySubmission(data: InsertMasterySubmission): Promise<MasterySubmission> {
    const [sub] = await db.insert(masterySubmissions).values(data).returning();
    return sub;
  }

  async updateMasterySubmission(id: string, data: Partial<MasterySubmission>): Promise<MasterySubmission | undefined> {
    const [sub] = await db.update(masterySubmissions).set({ ...data, updatedAt: new Date() }).where(eq(masterySubmissions.id, id)).returning();
    return sub;
  }

  async getAllMasterySubmissions(status?: string): Promise<(MasterySubmission & { requirementTitle?: string; moduleId?: number })[]> {
    const allSubs = await db.select().from(masterySubmissions).orderBy(desc(masterySubmissions.submittedAt));
    const allReqs = await db.select().from(moduleMasteryRequirements);
    const reqMap = new Map(allReqs.map(r => [r.id, r]));
    
    const enriched = allSubs
      .filter(s => !status || s.status === status)
      .map(s => {
        const req = reqMap.get(s.requirementId);
        return { ...s, requirementTitle: req?.title, moduleId: req?.moduleId };
      });
    return enriched;
  }

  async checkModuleMastery(userId: string, moduleId: number): Promise<{ unlocked: boolean; requirements: { requirement: MasteryRequirement; submission: MasterySubmission | null; met: boolean }[] }> {
    const requirements = await this.getMasteryRequirements(moduleId);
    const userSubs = await this.getMasterySubmissions(userId);

    const results = requirements.map(req => {
      const matchingSubs = userSubs.filter(s => s.requirementId === req.id);
      const verifiedSub = matchingSubs.find(s => s.status === 'verified' || s.status === 'auto_verified');
      return {
        requirement: req,
        submission: verifiedSub || matchingSubs[0] || null,
        met: !!verifiedSub,
      };
    });

    const requiredMet = results
      .filter(r => r.requirement.isRequired)
      .every(r => r.met);

    return { unlocked: requiredMet, requirements: results };
  }

  // Performance Outcomes
  async getPerformanceOutcomes(userId: string): Promise<PerformanceOutcome[]> {
    return db.select().from(performanceOutcomes).where(eq(performanceOutcomes.userId, userId)).orderBy(desc(performanceOutcomes.reportedAt));
  }

  async createPerformanceOutcome(data: InsertPerformanceOutcome): Promise<PerformanceOutcome> {
    const [outcome] = await db.insert(performanceOutcomes).values(data).returning();
    return outcome;
  }

  async updatePerformanceOutcome(id: string, userId: string, data: Partial<InsertPerformanceOutcome>): Promise<PerformanceOutcome | undefined> {
    const [outcome] = await db.update(performanceOutcomes)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(performanceOutcomes.id, id), eq(performanceOutcomes.userId, userId)))
      .returning();
    return outcome;
  }

  async deletePerformanceOutcome(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(performanceOutcomes).where(and(eq(performanceOutcomes.id, id), eq(performanceOutcomes.userId, userId))).returning();
    return result.length > 0;
  }

  // User Testimonials
  async getUserTestimonials(userId: string): Promise<UserTestimonial[]> {
    return db.select().from(userTestimonials).where(eq(userTestimonials.userId, userId)).orderBy(desc(userTestimonials.submittedAt));
  }

  async createUserTestimonial(data: InsertUserTestimonial): Promise<UserTestimonial> {
    const [testimonial] = await db.insert(userTestimonials).values(data).returning();
    return testimonial;
  }

  async getFeaturedTestimonials(): Promise<(UserTestimonial & { userName?: string })[]> {
    const testimonials = await db.select().from(userTestimonials)
      .where(and(eq(userTestimonials.isVerified, true), eq(userTestimonials.isFeatured, true)))
      .orderBy(desc(userTestimonials.approvedAt));
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    return testimonials.map(t => ({ ...t, userName: userMap.get(t.userId)?.firstName ? `${userMap.get(t.userId)!.firstName} ${userMap.get(t.userId)!.lastName || ''}`.trim() : 'Anonymous' }));
  }

  async getAllTestimonials(verified?: boolean): Promise<(UserTestimonial & { userName?: string })[]> {
    let query = db.select().from(userTestimonials).orderBy(desc(userTestimonials.submittedAt));
    const testimonials = await query;
    const filtered = verified !== undefined ? testimonials.filter(t => t.isVerified === verified) : testimonials;
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    return filtered.map(t => ({ ...t, userName: userMap.get(t.userId)?.firstName ? `${userMap.get(t.userId)!.firstName} ${userMap.get(t.userId)!.lastName || ''}`.trim() : 'Anonymous' }));
  }

  async updateTestimonialStatus(id: string, verified: boolean, featured: boolean, approvedBy: string): Promise<UserTestimonial | undefined> {
    const [testimonial] = await db.update(userTestimonials)
      .set({ isVerified: verified, isFeatured: featured, approvedBy, approvedAt: verified ? new Date() : null })
      .where(eq(userTestimonials.id, id))
      .returning();
    return testimonial;
  }

  // Transformation Summary (individual user)
  async getTransformationSummary(userId: string): Promise<{
    practiceConsistency: { currentStreak: number; longestStreak: number; totalPracticeDays: number; last30DaysRate: number };
    capabilityDevelopment: { modulesCompleted: number; totalModules: number; capabilitiesVerified: string[]; templateSubmissions: number };
    certaintyTrend: { current: number | null; avg7Day: number | null; avg30Day: number | null; trend: string };
    transformationScore: { rawScore: number; level: string };
    milestones: { id: string; title: string; description: string; earned: boolean; earnedAt?: string }[];
    outcomes: PerformanceOutcome[];
  }> {
    const [practiceLogs, allRatings, moduleProgress, allModules, templateSubs, masterySubs, masteryReqs, outcomes] = await Promise.all([
      this.getDailyPracticeLogs(userId, 365),
      this.getCertaintyRatings(userId, 365),
      this.getUserModuleProgress(userId),
      this.getModules(),
      this.getUserSubmissions(userId),
      this.getMasterySubmissions(userId),
      this.getMasteryRequirements(),
      this.getPerformanceOutcomes(userId),
    ]);

    // Practice consistency
    const completedLogs = practiceLogs.filter(l => l.isFullyCompleted);
    const totalPracticeDays = completedLogs.length;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30Logs = completedLogs.filter(l => new Date(l.practiceDate) >= thirtyDaysAgo);
    const last30DaysRate = Math.round((last30Logs.length / 30) * 100);

    // Streak calculation
    let currentStreak = 0;
    let longestStreak = 0;
    if (completedLogs.length > 0) {
      const sortedDates = completedLogs.map(l => l.practiceDate).sort().reverse();
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prev = new Date(sortedDates[i - 1]);
          const curr = new Date(sortedDates[i]);
          const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
          if (diffDays === 1) currentStreak++;
          else break;
        }
      }
      let tempStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
        if (diffDays === 1) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak); }
        else tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak, tempStreak);
    }

    // Capability development
    const modulesCompleted = moduleProgress.filter(p => p.isCompleted).length;
    const verifiedSubs = masterySubs.filter(s => s.status === 'verified' || s.status === 'auto_verified');
    const capabilitiesVerified = verifiedSubs.map(s => {
      const req = masteryReqs.find(r => r.id === s.requirementId);
      return req?.title || 'Unknown';
    });
    const templateSubmissions = templateSubs.filter(s => s.status === 'submitted' || s.isVerified).length;

    // Certainty trend
    const sortedRatings = [...allRatings].sort((a, b) => new Date(b.ratingDate).getTime() - new Date(a.ratingDate).getTime());
    const current = sortedRatings[0]?.rating ?? null;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent7 = sortedRatings.filter(r => new Date(r.ratingDate) >= sevenDaysAgo);
    const avg7Day = recent7.length > 0 ? Math.round((recent7.reduce((s, r) => s + r.rating, 0) / recent7.length) * 10) / 10 : null;
    const recent30 = sortedRatings.filter(r => new Date(r.ratingDate) >= thirtyDaysAgo);
    const avg30Day = recent30.length > 0 ? Math.round((recent30.reduce((s, r) => s + r.rating, 0) / recent30.length) * 10) / 10 : null;
    let trend = 'stable';
    if (avg7Day !== null && avg30Day !== null) {
      if (avg7Day > avg30Day + 0.5) trend = 'improving';
      else if (avg7Day < avg30Day - 0.5) trend = 'declining';
    }

    // Transformation score
    const rawScore = (currentStreak * 2) + (modulesCompleted * 10) + ((avg7Day ?? 0) * 5) + (templateSubmissions * 1) + (capabilitiesVerified.length * 3);
    let level = 'Beginner';
    if (rawScore >= 100) level = 'Master';
    else if (rawScore >= 60) level = 'Advanced';
    else if (rawScore >= 30) level = 'Practitioner';

    // Milestones
    const milestones = [
      { id: 'first_practice', title: 'First Practice', description: 'Complete your first daily practice session', earned: totalPracticeDays >= 1 },
      { id: 'streak_7', title: 'Week Warrior', description: '7-day practice streak — building momentum', earned: longestStreak >= 7 },
      { id: 'streak_30', title: 'Month Strong', description: '30-day streak — transformation accelerates', earned: longestStreak >= 30 },
      { id: 'streak_90', title: 'Quarter Master', description: '90-day streak — permanent habit installed', earned: longestStreak >= 90 },
      { id: 'module_1', title: 'First Module Mastered', description: 'Complete your first training module', earned: modulesCompleted >= 1 },
      { id: 'module_all', title: 'System Integration', description: 'Complete all 7 modules — certified practitioner', earned: modulesCompleted >= 7 },
      { id: 'certainty_9', title: 'Peak Certainty', description: 'Reach a certainty rating of 9 or higher', earned: (current ?? 0) >= 9 },
      { id: 'first_outcome', title: 'Results Tracker', description: 'Report your first performance outcome', earned: outcomes.length >= 1 },
      { id: 'template_5', title: 'Template Builder', description: 'Submit 5 completed templates', earned: templateSubmissions >= 5 },
      { id: 'capability_10', title: 'Capability Master', description: 'Verify 10 mastery capabilities', earned: capabilitiesVerified.length >= 10 },
    ];

    return {
      practiceConsistency: { currentStreak, longestStreak, totalPracticeDays, last30DaysRate },
      capabilityDevelopment: { modulesCompleted, totalModules: allModules.length, capabilitiesVerified, templateSubmissions },
      certaintyTrend: { current, avg7Day, avg30Day, trend },
      transformationScore: { rawScore: Math.round(rawScore), level },
      milestones,
      outcomes,
    };
  }

  // Admin Transformation Analytics
  async getTransformationAnalytics(): Promise<{
    cohortMetrics: { avgStreak: number; avgCertainty: number | null; masteryCompletionRate: number; activeUsers30Days: number; totalPracticeDays: number };
    streakDistribution: { range: string; count: number }[];
    masteryBottlenecks: { requirementId: string; title: string; moduleId: number; pendingCount: number; avgReviewDays: number }[];
    templateUsage: { templateName: string; submissions: number; verified: number }[];
    riskIndicators: { userId: string; userName: string; issue: string; detail: string }[];
    outcomesSummary: { totalOutcomes: number; avgImprovement: number | null; topMetric: string | null };
  }> {
    const [allUsers, allPracticeLogs, allRatings, allMasterySubs, allMasteryReqs, allTemplateSubs, allTemplates, allOutcomes] = await Promise.all([
      this.getAllUsers(),
      db.select().from(dailyPracticeLogs),
      db.select().from(certaintyRatings),
      db.select().from(masterySubmissions),
      db.select().from(moduleMasteryRequirements),
      db.select().from(userTemplateSubmissions),
      db.select().from(templates),
      db.select().from(performanceOutcomes),
    ]);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Per-user streak calculation
    const userStreaks: Record<string, number> = {};
    const usersByPractice = new Map<string, string[]>();
    allPracticeLogs.filter(l => l.isFullyCompleted).forEach(l => {
      if (!usersByPractice.has(l.userId)) usersByPractice.set(l.userId, []);
      usersByPractice.get(l.userId)!.push(l.practiceDate);
    });

    usersByPractice.forEach((dates, uId) => {
      const sorted = [...dates].sort().reverse();
      if (sorted[0] !== today && sorted[0] !== yesterday) { userStreaks[uId] = 0; return; }
      let streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) streak++;
        else break;
      }
      userStreaks[uId] = streak;
    });

    const streakValues = Object.values(userStreaks);
    const avgStreak = streakValues.length > 0 ? Math.round((streakValues.reduce((s, v) => s + v, 0) / streakValues.length) * 10) / 10 : 0;

    // Avg certainty
    const avgCertainty = allRatings.length > 0
      ? Math.round((allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length) * 10) / 10
      : null;

    // Mastery completion rate
    const verifiedMastery = allMasterySubs.filter(s => s.status === 'verified' || s.status === 'auto_verified');
    const masteryCompletionRate = allMasteryReqs.length > 0
      ? Math.round((verifiedMastery.length / (allMasteryReqs.length * Math.max(allUsers.length, 1))) * 100 * 10) / 10
      : 0;

    // Active users (practiced in last 30 days)
    const recentPracticeUsers = new Set(allPracticeLogs.filter(l => l.isFullyCompleted && new Date(l.practiceDate) >= thirtyDaysAgo).map(l => l.userId));
    const activeUsers30Days = recentPracticeUsers.size;

    const totalPracticeDays = allPracticeLogs.filter(l => l.isFullyCompleted).length;

    // Streak distribution
    const ranges = [
      { range: '0 days', min: 0, max: 0 },
      { range: '1-7 days', min: 1, max: 7 },
      { range: '8-14 days', min: 8, max: 14 },
      { range: '15-30 days', min: 15, max: 30 },
      { range: '31-60 days', min: 31, max: 60 },
      { range: '60+ days', min: 61, max: Infinity },
    ];
    const streakDistribution = ranges.map(r => ({
      range: r.range,
      count: streakValues.filter(v => v >= r.min && v <= r.max).length,
    }));

    // Mastery bottlenecks
    const pendingByReq = new Map<string, MasterySubmission[]>();
    allMasterySubs.filter(s => s.status === 'pending').forEach(s => {
      if (!pendingByReq.has(s.requirementId)) pendingByReq.set(s.requirementId, []);
      pendingByReq.get(s.requirementId)!.push(s);
    });
    const masteryBottlenecks = Array.from(pendingByReq.entries()).map(([reqId, subs]) => {
      const req = allMasteryReqs.find(r => r.id === reqId);
      const avgDays = subs.reduce((s, sub) => {
        const daysSince = (Date.now() - new Date(sub.submittedAt!).getTime()) / 86400000;
        return s + daysSince;
      }, 0) / subs.length;
      return {
        requirementId: reqId,
        title: req?.title || 'Unknown',
        moduleId: req?.moduleId || 0,
        pendingCount: subs.length,
        avgReviewDays: Math.round(avgDays * 10) / 10,
      };
    }).sort((a, b) => b.pendingCount - a.pendingCount);

    // Template usage
    const templateMap = new Map(allTemplates.map(t => [t.id, t.name]));
    const templateCounts = new Map<string, { submissions: number; verified: number }>();
    allTemplateSubs.forEach(s => {
      const name = templateMap.get(s.templateId) || 'Unknown';
      if (!templateCounts.has(name)) templateCounts.set(name, { submissions: 0, verified: 0 });
      const entry = templateCounts.get(name)!;
      entry.submissions++;
      if (s.isVerified) entry.verified++;
    });
    const templateUsage = Array.from(templateCounts.entries()).map(([templateName, data]) => ({
      templateName, ...data,
    })).sort((a, b) => b.submissions - a.submissions);

    // Risk indicators
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    const riskIndicators: { userId: string; userName: string; issue: string; detail: string }[] = [];

    // Declining certainty
    allUsers.forEach(u => {
      const userRatings = allRatings.filter(r => r.userId === u.id).sort((a, b) => new Date(b.ratingDate).getTime() - new Date(a.ratingDate).getTime());
      if (userRatings.length >= 3) {
        const recent3 = userRatings.slice(0, 3);
        const avg = recent3.reduce((s, r) => s + r.rating, 0) / 3;
        if (avg < 5) {
          riskIndicators.push({
            userId: u.id,
            userName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
            issue: 'Low certainty',
            detail: `Average certainty ${avg.toFixed(1)}/10 (last 3 ratings)`,
          });
        }
      }
    });

    // Broken streaks (had streak > 7, now 0)
    allUsers.forEach(u => {
      const streak = userStreaks[u.id] ?? 0;
      const userLogs = allPracticeLogs.filter(l => l.userId === u.id && l.isFullyCompleted);
      if (streak === 0 && userLogs.length >= 7) {
        const lastPractice = userLogs.sort((a, b) => new Date(b.practiceDate).getTime() - new Date(a.practiceDate).getTime())[0];
        if (lastPractice) {
          const daysSince = Math.round((Date.now() - new Date(lastPractice.practiceDate).getTime()) / 86400000);
          if (daysSince > 2 && daysSince < 30) {
            riskIndicators.push({
              userId: u.id,
              userName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
              issue: 'Broken streak',
              detail: `No practice for ${daysSince} days (had ${userLogs.length} total sessions)`,
            });
          }
        }
      }
    });

    // Outcomes summary
    const totalOutcomes = allOutcomes.length;
    const improvements = allOutcomes.filter(o => o.improvementPercentage !== null).map(o => o.improvementPercentage!);
    const avgImprovement = improvements.length > 0 ? Math.round((improvements.reduce((s, v) => s + v, 0) / improvements.length) * 10) / 10 : null;
    const metricCounts = new Map<string, number>();
    allOutcomes.forEach(o => { metricCounts.set(o.metricName, (metricCounts.get(o.metricName) || 0) + 1); });
    let topMetric: string | null = null;
    let topCount = 0;
    metricCounts.forEach((c, m) => { if (c > topCount) { topCount = c; topMetric = m; } });

    return {
      cohortMetrics: { avgStreak, avgCertainty, masteryCompletionRate, activeUsers30Days, totalPracticeDays },
      streakDistribution,
      masteryBottlenecks,
      templateUsage,
      riskIndicators,
      outcomesSummary: { totalOutcomes, avgImprovement, topMetric },
    };
  }

  // Journal Entries
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    return db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }

  async getJournalEntryById(id: string, userId: string): Promise<JournalEntry | undefined> {
    const [entry] = await db.select().from(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
    return entry;
  }

  async createJournalEntry(data: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await db.insert(journalEntries).values(data).returning();
    return entry;
  }

  async updateJournalEntry(id: string, userId: string, data: Partial<InsertJournalEntry>): Promise<JournalEntry | undefined> {
    const [entry] = await db.update(journalEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)))
      .returning();
    return entry;
  }

  async deleteJournalEntry(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(journalEntries)
      .where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getJournalEntryCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(journalEntries)
      .where(eq(journalEntries.userId, userId));
    return result?.count ?? 0;
  }

  // Performance Journal
  async getPerformanceJournalEntries(userId: string, mode?: string, limit?: number): Promise<PerformanceJournalEntry[]> {
    let query = db.select().from(performanceJournal)
      .where(mode 
        ? and(eq(performanceJournal.userId, userId), eq(performanceJournal.mode, mode))
        : eq(performanceJournal.userId, userId)
      )
      .orderBy(desc(performanceJournal.createdAt));
    if (limit) {
      query = query.limit(limit) as any;
    }
    return query;
  }

  async getPerformanceJournalById(id: string, userId: string): Promise<PerformanceJournalEntry | undefined> {
    const [entry] = await db.select().from(performanceJournal)
      .where(and(eq(performanceJournal.id, id), eq(performanceJournal.userId, userId)));
    return entry;
  }

  async getInProgressSession(userId: string, mode?: string): Promise<PerformanceJournalEntry | undefined> {
    const conditions = [eq(performanceJournal.userId, userId), eq(performanceJournal.status, "in_progress")];
    if (mode) conditions.push(eq(performanceJournal.mode, mode));
    const [entry] = await db.select().from(performanceJournal)
      .where(and(...conditions))
      .orderBy(desc(performanceJournal.updatedAt))
      .limit(1);
    return entry;
  }

  async createPerformanceJournal(data: InsertPerformanceJournalEntry): Promise<PerformanceJournalEntry> {
    const [entry] = await db.insert(performanceJournal).values(data).returning();
    return entry;
  }

  async updatePerformanceJournal(id: string, userId: string, data: Partial<InsertPerformanceJournalEntry>): Promise<PerformanceJournalEntry | undefined> {
    const [entry] = await db.update(performanceJournal)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(performanceJournal.id, id), eq(performanceJournal.userId, userId)))
      .returning();
    return entry;
  }

  async deletePerformanceJournal(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(performanceJournal)
      .where(and(eq(performanceJournal.id, id), eq(performanceJournal.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getPerformanceJournalStats(userId: string): Promise<{
    totalSessions: number;
    completedSessions: number;
    streak: number;
    lastSessionDate: string | null;
    modeBreakdown: Record<string, number>;
    avgSignalQuality: number | null;
    avgValueAlignment: number | null;
    signalQualityTrend: { date: string; value: number }[];
    emotionFrequency: Record<string, number>;
    executiveAvg: number | null;
  }> {
    const allEntries = await db.select().from(performanceJournal)
      .where(eq(performanceJournal.userId, userId))
      .orderBy(desc(performanceJournal.createdAt));

    const completed = allEntries.filter(e => e.status === "completed");
    
    // Streak calculation
    let streak = 0;
    if (completed.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dates = Array.from(new Set(completed.map(e => {
        const d = new Date(e.createdAt!);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }))).sort((a, b) => b - a);

      const todayTime = today.getTime();
      const dayMs = 86400000;
      if (dates[0] >= todayTime - dayMs) {
        streak = 1;
        for (let i = 1; i < dates.length; i++) {
          if (dates[i - 1] - dates[i] <= dayMs) {
            streak++;
          } else break;
        }
      }
    }

    // Mode breakdown
    const modeBreakdown: Record<string, number> = {};
    completed.forEach(e => {
      modeBreakdown[e.mode] = (modeBreakdown[e.mode] || 0) + 1;
    });

    // Signal quality stats
    const withSignal = completed.filter(e => e.signalQuality != null);
    const avgSignalQuality = withSignal.length > 0
      ? withSignal.reduce((sum, e) => sum + e.signalQuality!, 0) / withSignal.length
      : null;

    // Signal quality trend (last 30 entries)
    const signalQualityTrend = withSignal.slice(0, 30).map(e => ({
      date: new Date(e.createdAt!).toISOString().split('T')[0],
      value: e.signalQuality!,
    })).reverse();

    // Value alignment
    const withAlignment = completed.filter(e => e.valueAlignment != null);
    const avgValueAlignment = withAlignment.length > 0
      ? withAlignment.reduce((sum, e) => sum + e.valueAlignment!, 0) / withAlignment.length
      : null;

    // Emotion frequency
    const emotionFrequency: Record<string, number> = {};
    completed.forEach(e => {
      if (e.dominantEmotion) {
        emotionFrequency[e.dominantEmotion] = (emotionFrequency[e.dominantEmotion] || 0) + 1;
      }
    });

    // Executive average
    const withExec = completed.filter(e => e.executivePercent != null);
    const executiveAvg = withExec.length > 0
      ? withExec.reduce((sum, e) => sum + e.executivePercent!, 0) / withExec.length
      : null;

    return {
      totalSessions: allEntries.length,
      completedSessions: completed.length,
      streak,
      lastSessionDate: completed.length > 0 ? new Date(completed[0].createdAt!).toISOString().split('T')[0] : null,
      modeBreakdown,
      avgSignalQuality,
      avgValueAlignment,
      signalQualityTrend,
      emotionFrequency,
      executiveAvg,
    };
  }
  // Interactive Video
  async getInteractionPoints(lessonId: number): Promise<InteractionPoint[]> {
    return db.select().from(interactionPoints)
      .where(eq(interactionPoints.lessonId, lessonId))
      .orderBy(asc(interactionPoints.timestampSec));
  }

  async getInteractionPointById(id: string): Promise<InteractionPoint | undefined> {
    const [point] = await db.select().from(interactionPoints).where(eq(interactionPoints.id, id));
    return point;
  }

  async createInteractionPoint(data: InsertInteractionPoint): Promise<InteractionPoint> {
    const [point] = await db.insert(interactionPoints).values(data).returning();
    return point;
  }

  async updateInteractionPoint(id: string, data: Partial<InsertInteractionPoint>): Promise<InteractionPoint | undefined> {
    const [point] = await db.update(interactionPoints)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(interactionPoints.id, id))
      .returning();
    return point;
  }

  async deleteInteractionPoint(id: string): Promise<boolean> {
    const result = await db.delete(interactionPoints).where(eq(interactionPoints.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async reorderInteractionPoints(orderings: { id: string; orderIndex: number }[]): Promise<void> {
    for (const { id, orderIndex } of orderings) {
      await db.update(interactionPoints).set({ orderIndex }).where(eq(interactionPoints.id, id));
    }
  }

  async getInteractionResponses(userId: string, lessonId: number): Promise<InteractionResponse[]> {
    return db.select().from(interactionResponses)
      .where(and(eq(interactionResponses.userId, userId), eq(interactionResponses.lessonId, lessonId)))
      .orderBy(desc(interactionResponses.respondedAt));
  }

  async saveInteractionResponse(data: InsertInteractionResponse): Promise<InteractionResponse> {
    const [response] = await db.insert(interactionResponses).values(data).returning();
    return response;
  }
  async savePushSubscription(userId: string, subscription: any): Promise<void> {
    const existing = await db.select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
    
    if (existing.length > 0) {
      await db.update(pushSubscriptions)
        .set({ subscription })
        .where(eq(pushSubscriptions.userId, userId));
    } else {
      await db.insert(pushSubscriptions).values({ userId, subscription });
    }
  }

  async getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  async logPushSend(userId: string, notificationType: string, success: boolean): Promise<void> {
    await db.insert(pushLog).values({ userId, notificationType, success });
  }

  async markEmailSent(id: number): Promise<void> {
    await db.update(emailQueue).set({ sentAt: new Date() }).where(eq(emailQueue.id, id));
  }

  async getPendingEmails(): Promise<EmailQueueEntry[]> {
    return db.select().from(emailQueue)
      .where(and(
        sql`${emailQueue.sentAt} IS NULL`,
        sql`${emailQueue.scheduledFor} <= NOW()`
      ))
      .orderBy(asc(emailQueue.scheduledFor))
      .limit(50);
  }

  async createForumPost(data: { userId: string; moduleContext: string; title: string; content: string }): Promise<ForumPost> {
    const [post] = await db.insert(forumPosts).values(data).returning();
    return post;
  }

  async getForumPosts(moduleContext?: string, limit = 50, offset = 0): Promise<Array<ForumPost & { replyCount: number; displayName: string | null; currentLevel: string | null }>> {
    let whereClause = moduleContext && moduleContext !== "all"
      ? eq(forumPosts.moduleContext, moduleContext)
      : undefined;

    const posts = await db.select({
      id: forumPosts.id,
      userId: forumPosts.userId,
      moduleContext: forumPosts.moduleContext,
      title: forumPosts.title,
      content: forumPosts.content,
      createdAt: forumPosts.createdAt,
      updatedAt: forumPosts.updatedAt,
      displayName: users.displayName,
      currentLevel: users.currentLevel,
    })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.userId, users.id))
      .where(whereClause as any)
      .orderBy(desc(forumPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const postIds = posts.map(p => p.id);
    if (postIds.length === 0) return [];

    const replyCounts = await db.select({
      postId: forumReplies.postId,
      count: count(),
    })
      .from(forumReplies)
      .where(sql`${forumReplies.postId} IN (${sql.join(postIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(forumReplies.postId);

    const countMap = new Map(replyCounts.map(r => [r.postId, Number(r.count)]));

    return posts.map(p => ({
      ...p,
      replyCount: countMap.get(p.id) || 0,
    }));
  }

  async getForumPost(postId: string): Promise<{
    post: ForumPost & { displayName: string | null; currentLevel: string | null };
    replies: Array<ForumReply & { displayName: string | null; currentLevel: string | null }>;
    reactions: Array<{ postId: string | null; replyId: string | null; type: string; count: number; userReacted: boolean }>;
  } | null> {
    const [post] = await db.select({
      id: forumPosts.id,
      userId: forumPosts.userId,
      moduleContext: forumPosts.moduleContext,
      title: forumPosts.title,
      content: forumPosts.content,
      createdAt: forumPosts.createdAt,
      updatedAt: forumPosts.updatedAt,
      displayName: users.displayName,
      currentLevel: users.currentLevel,
    })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.userId, users.id))
      .where(eq(forumPosts.id, postId));

    if (!post) return null;

    const replies = await db.select({
      id: forumReplies.id,
      postId: forumReplies.postId,
      userId: forumReplies.userId,
      content: forumReplies.content,
      createdAt: forumReplies.createdAt,
      displayName: users.displayName,
      currentLevel: users.currentLevel,
    })
      .from(forumReplies)
      .leftJoin(users, eq(forumReplies.userId, users.id))
      .where(eq(forumReplies.postId, postId))
      .orderBy(asc(forumReplies.createdAt));

    return { post, replies, reactions: [] };
  }

  async createForumReply(data: { postId: string; userId: string; content: string }): Promise<ForumReply> {
    const [reply] = await db.insert(forumReplies).values(data).returning();
    return reply;
  }

  async toggleForumReaction(data: { postId?: string; replyId?: string; userId: string; type: string }): Promise<{ added: boolean }> {
    const conditions = [eq(forumReactions.userId, data.userId), eq(forumReactions.type, data.type)];
    if (data.postId) conditions.push(eq(forumReactions.postId, data.postId));
    if (data.replyId) conditions.push(eq(forumReactions.replyId, data.replyId));

    const existing = await db.select({ id: forumReactions.id })
      .from(forumReactions)
      .where(and(...conditions))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(forumReactions).where(eq(forumReactions.id, existing[0].id));
      return { added: false };
    } else {
      await db.insert(forumReactions).values({
        postId: data.postId || null,
        replyId: data.replyId || null,
        userId: data.userId,
        type: data.type,
      });
      return { added: true };
    }
  }

  async getForumReactions(postId: string, userId: string): Promise<Array<{ targetId: string; targetType: string; type: string; count: number; userReacted: boolean }>> {
    const allReactions = await db.select()
      .from(forumReactions)
      .where(sql`${forumReactions.postId} = ${postId} OR ${forumReactions.replyId} IN (SELECT id FROM forum_replies WHERE post_id = ${postId})`);

    const grouped = new Map<string, { type: string; count: number; userReacted: boolean; targetId: string; targetType: string }>();
    for (const r of allReactions) {
      const targetId = r.postId || r.replyId || '';
      const targetType = r.postId ? 'post' : 'reply';
      const key = `${targetId}:${r.type}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.count++;
        if (r.userId === userId) existing.userReacted = true;
      } else {
        grouped.set(key, { type: r.type, count: 1, userReacted: r.userId === userId, targetId, targetType });
      }
    }
    return Array.from(grouped.values());
  }

  async createWeeklyWinThread(): Promise<ForumPost | null> {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);
    const weekStr = monday.toISOString().split('T')[0];

    const titlePattern = `Weekly Wins — Week of ${monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

    const existing = await db.select({ id: forumPosts.id })
      .from(forumPosts)
      .where(and(
        eq(forumPosts.userId, 'system_user'),
        sql`${forumPosts.title} LIKE ${'%Weekly Wins — Week of%'}`,
        sql`${forumPosts.createdAt} >= ${monday}`
      ))
      .limit(1);

    if (existing.length > 0) return null;

    return this.createForumPost({
      userId: 'system_user',
      moduleContext: 'general',
      title: `🏆 ${titlePattern}`,
      content: "What mental rep are you most proud of from this week? Drop your win below.\nDoesn't matter how small — every rep counts.",
    });
  }
}

export const storage = new DatabaseStorage();
