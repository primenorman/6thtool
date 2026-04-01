import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean, integer, date } from "drizzle-orm/pg-core";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").notNull().default(false),
  position: varchar("position"),
  levelOfPlay: varchar("level_of_play"),
  currentXp: integer("current_xp").notNull().default(0),
  currentLevel: varchar("current_level").notNull().default("Rookie"),
  currentStreak: integer("current_streak").notNull().default(0),
  lastPracticeDate: date("last_practice_date"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  quizResults: jsonb("quiz_results"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("none"),
  subscriptionPlan: varchar("subscription_plan"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userXpEvents = pgTable("user_xp_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  eventType: varchar("event_type").notNull(),
  xpAmount: integer("xp_amount").notNull(),
  description: varchar("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type UserXpEvent = typeof userXpEvents.$inferSelect;
export type InsertUserXpEvent = typeof userXpEvents.$inferInsert;
