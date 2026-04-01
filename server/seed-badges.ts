import { db } from "./db";
import { badges } from "@shared/schema";

const BADGE_DATA = [
  { id: 'system_activated', name: 'System Activated', description: 'Completed Day 0 Fast Track', iconEmoji: '⚡', xpRequired: 0, eventTrigger: 'day0_complete' },
  { id: 'first_practice', name: 'First Rep', description: 'Logged your first daily practice', iconEmoji: '🎯', xpRequired: 0, eventTrigger: 'first_practice' },
  { id: 'neural_pathways', name: 'Neural Pathways Forming', description: '3-day practice streak', iconEmoji: '🧠', xpRequired: 0, eventTrigger: 'streak_3' },
  { id: 'first_tool', name: 'First Tool Installed', description: 'Created your first Metastory', iconEmoji: '🔧', xpRequired: 0, eventTrigger: 'metastory_created' },
  { id: 'anchored', name: 'Anchored & Activated', description: 'Discovered your Inner Anchor Point', iconEmoji: '⚓', xpRequired: 0, eventTrigger: 'iap_discovered' },
  { id: 'seven_day_warrior', name: '7-Day Warrior', description: '7-day practice streak', iconEmoji: '🔥', xpRequired: 0, eventTrigger: 'streak_7' },
  { id: 'debugger', name: 'System Debugger', description: 'Completed your first RNBR session', iconEmoji: '🛠️', xpRequired: 0, eventTrigger: 'rnbr_complete' },
  { id: 'prospect', name: 'Rising Prospect', description: 'Reached Prospect level', iconEmoji: '⬆️', xpRequired: 0, eventTrigger: 'level_prospect' },
  { id: 'draft_pick', name: 'Draft Pick', description: 'Reached Draft Pick level', iconEmoji: '📋', xpRequired: 0, eventTrigger: 'level_draft_pick' },
  { id: 'twenty_one_day', name: '21-Day System', description: '21-day practice streak', iconEmoji: '💎', xpRequired: 0, eventTrigger: 'streak_21' },
  { id: 'pro_level', name: 'Gone Pro', description: 'Reached Pro level', iconEmoji: '🏆', xpRequired: 0, eventTrigger: 'level_pro' },
  { id: 'thirty_day', name: 'Iron Will', description: '30-day perfect streak', iconEmoji: '🦾', xpRequired: 0, eventTrigger: 'streak_30' },
  { id: 'course_complete', name: 'Full System Install', description: 'Completed all 7 modules', iconEmoji: '🎖️', xpRequired: 0, eventTrigger: 'course_complete' },
  { id: 'all_star', name: 'All-Star', description: 'Reached All-Star level', iconEmoji: '⭐', xpRequired: 0, eventTrigger: 'level_all_star' },
  { id: 'sixty_day', name: 'Elite Operator', description: '60-day practice streak', iconEmoji: '🚀', xpRequired: 0, eventTrigger: 'streak_60' },
  { id: 'hall_of_fame', name: 'Hall of Fame', description: 'Reached Hall of Fame status', iconEmoji: '🏅', xpRequired: 0, eventTrigger: 'level_hall_of_fame' },
  { id: 'ninety_day', name: 'Legend', description: '90-day practice streak', iconEmoji: '👑', xpRequired: 0, eventTrigger: 'streak_90' },
];

export async function seedBadges() {
  const existing = await db.select({ id: badges.id }).from(badges);
  if (existing.length > 0) {
    console.log("Badges already seeded, skipping...");
    return;
  }
  console.log("Seeding badges...");
  for (const badge of BADGE_DATA) {
    await db.insert(badges).values(badge).onConflictDoNothing();
  }
  console.log(`Seeded ${BADGE_DATA.length} badges.`);
}
