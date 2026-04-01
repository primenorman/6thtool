# The 6th Tool - Cybernetic Baseball Performance Training

## Overview
A comprehensive mental performance training platform for baseball players. The system delivers a 6-week mental training program (mapped from 7 modules) with daily practice routines, progress tracking, full gamification (XP/streaks/17 badges/leaderboard), interactive exercises, and celebratory badge notifications.

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM (local)
- **Authentication**: Supabase Auth (email/password + magic link)
- **Auth Storage**: All user data in local PostgreSQL; Supabase handles JWT auth only

### Key Features
- User authentication via Supabase (email/password, magic link)
- Admin password login (ADMIN_PASSWORD env var, key icon on landing page)
- Bio-Computer Diagnostic quiz (pre-registration, no auth required)
- Day 0 Fast Track (3 onboarding lessons)
- XP engine with level progression (Rookie → Hall of Fame)
- Streak tracking with evening countdown warning
- 6-week course structure (mapped from 7 modules)
- 50/30/20 lesson layout (Essentials/Put to Work/Science)
- 17-badge system with full-screen celebratory notifications
- Weekly leaderboard (grouped by level)
- Certainty rating trend chart on dashboard
- Email queue with Resend integration (7 automated email templates)
- Daily 15-minute practice routine
- Certainty rating tracking (1-10 scale)
- Neural Lab (pitch recognition training)
- Springer Protocol (7-section interactive training)
- Templates system with progressive reveal forms
- Downloadable resources (PDFs, audio, grids)
- Stripe payment processing (lifetime, annual, monthly plans)
- Interactive video player with fullscreen support
- PWA with offline practice support (service worker + Dexie/IndexedDB)
- Push notification system (VAPID keys, streak reminders)
- Community forum with tabs by week, reactions, weekly win threads
- Install prompt (Android + iOS guide) after first practice

### Authentication Flow
1. **New Users**: Landing → Diagnostic Quiz → Profile Results → Auth Page (signup) → Dashboard → Day 0 Fast Track
2. **Returning Users**: Auth Page (login) → Dashboard
3. **Admin**: Key icon on landing → password form → Admin panel
4. **Session**: Supabase JWT in Authorization header; admin sessions via express-session

### Project Structure
```
client/
  src/
    components/
      ui/                # shadcn/ui components
      theme-provider.tsx
      theme-toggle.tsx
      module-sidebar.tsx
      app-layout.tsx
      mobile-bottom-nav.tsx
      interactive-video-player.tsx
      install-prompt.tsx   # PWA install prompt (Android + iOS)
      push-prompt.tsx      # Push notification permission prompt
      badge-notification.tsx
    pages/
      landing.tsx        # Public landing page
      auth.tsx           # Supabase email/password + magic link login/signup
      diagnostic.tsx     # Bio-Computer Diagnostic quiz (no auth)
      fast-track.tsx     # Day 0 Fast Track (3 lessons)
      dashboard.tsx      # Main dashboard (mobile-first, XP/streak/missions)
      practice.tsx       # Daily practice routine
      progress.tsx       # Progress tracking
      resources.tsx
      module.tsx
      modules.tsx
      lesson.tsx
      neural-lab.tsx
      springer-protocol.tsx
      templates.tsx
      template-form.tsx
      leaderboard.tsx     # Weekly leaderboard by level
      community.tsx       # Community forum (posts/replies/reactions)
      journal.tsx
      admin/
        dashboard.tsx
        modules.tsx
        exercises.tsx
        users.tsx
        analytics.tsx
        livestreams.tsx
        mastery.tsx
        transformation.tsx
        interactions.tsx
    hooks/
      use-auth.ts        # Supabase auth hook (useState-based)
      use-admin.ts
      use-toast.ts
    lib/
      supabase.ts        # Supabase browser client
      queryClient.ts     # React Query with auth header injection
      auth-utils.ts
      course-config.ts   # 6-week course structure mapping
      offline-db.ts      # Dexie/IndexedDB for offline practice queue
      sync-manager.ts    # Online sync for offline-queued data

server/
  index.ts               # Express setup with session middleware
  routes.ts              # API endpoints (req.userId pattern)
  storage.ts             # Database operations
  db.ts                  # Database connection
  supabase.ts            # Supabase admin/service client
  middleware/
    supabase-auth.ts     # JWT verification middleware (isAuthenticated, isAdmin)
  email-sender.ts          # Resend email processing + 7 templates
  seed.ts
  seed-badges.ts           # 17 badge definitions
  seed-templates.ts
  seed-mastery.ts

shared/
  schema.ts              # Drizzle schema + types
  models/
    auth.ts              # Users table (with XP, streak, quiz fields) + userXpEvents table
```

### Database Schema (Updated)
- **users**: id (varchar UUID), email, firstName, lastName, displayName, profileImageUrl, isAdmin, position, levelOfPlay, currentXp (int, default 0), currentLevel (varchar, default 'Rookie'), currentStreak (int), lastPracticeDate, onboardingCompleted (bool), quizResults (jsonb), stripeCustomerId, stripeSubscriptionId, subscriptionStatus, subscriptionPlan, createdAt, updatedAt
- **user_xp_events**: id, userId, eventType, xpAmount, description, createdAt
- **sessions**: Express session storage (for admin password login)
- **modules**: Course modules (1-7)
- **lessons**: Lessons within modules
- **exercises**: Interactive exercises
- **resources**: Downloadable files
- **daily_practice_logs**: Daily practice session records
- **certainty_ratings**: Daily certainty ratings (1-10)
- **badges**: id (text PK), name, description, iconEmoji, xpRequired, eventTrigger, createdAt
- **user_badges**: id (serial PK), userId (FK), badgeId (FK), earnedAt
- **leaderboard_weekly**: id (serial PK), userId (FK), weekStart (date), xpEarnedThisWeek, streakThisWeek, practicesThisWeek
- **email_queue**: id (serial PK), userId (FK), emailType, scheduledFor, sentAt, createdAt
- **push_subscriptions**: id (varchar UUID PK), userId (FK), subscription (jsonb), createdAt
- **push_log**: id (varchar UUID PK), userId, notificationType, sentAt, success
- **forum_posts**: id (varchar UUID PK), userId (FK), moduleContext, title, content, createdAt, updatedAt
- **forum_replies**: id (varchar UUID PK), postId (FK), userId (FK), content, createdAt
- **forum_reactions**: id (varchar UUID PK), postId, replyId, userId (FK), type
- Plus: user_module_progress, user_lesson_progress, user_exercise_progress, practice_streaks, saved_targets, neural_lab_sessions, neural_lab_results, strike_zone_data, concentration_grid_scores, templates, user_template_submissions, module_mastery_requirements, mastery_submissions, livestreams, etc.

### XP System
- **Levels**: Rookie (0-500), Prospect (501-1500), Draft Pick (1501-3500), Pro (3501-7000), All-Star (7001-15000), Hall of Fame (15001+)
- **XP Events**: Day 0 complete (100 XP), first practice (50 XP), daily practice (25 XP)
- **API**: `GET /api/xp/status`, `POST /api/xp/award`

### API Endpoints (Key Changes)
- Auth: `GET /api/auth/user`, `POST /api/auth/admin-login`, `POST /api/auth/update-profile`
- XP: `GET /api/xp/status`, `POST /api/xp/award`
- Badges: `GET /api/badges`, `GET /api/badges/recent`
- Leaderboard: `GET /api/leaderboard`
- Email Queue: `GET /api/admin/email-queue`
- Push: `POST /api/push/subscribe`, `POST /api/push/send`
- Forum: `GET /api/forum/posts`, `GET /api/forum/posts/:id`, `POST /api/forum/posts`, `POST /api/forum/posts/:id/replies`, `POST /api/forum/reactions`
- All routes use `req.userId` (set by Supabase JWT middleware)
- Admin routes use `isAdmin` middleware from `server/middleware/supabase-auth.ts`

### Environment Variables
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase public/anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (secret)
- `VITE_SUPABASE_URL`: Frontend Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Frontend Supabase anon key
- `DATABASE_URL`: Local PostgreSQL connection
- `SESSION_SECRET`: Express session secret
- `ADMIN_PASSWORD`: Admin password login (coach2026)
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`: Object storage for videos
- `VITE_VAPID_PUBLIC_KEY`: VAPID public key for push notifications
- `VAPID_PRIVATE_KEY`: VAPID private key (secret)

### Design System
- Athletic/performance aesthetic
- Mobile-first dashboard design
- Dark mode support (system preference)
- Color scheme: Deep blues for primary, warm orange for accents/achievements

## Development
```bash
npm run dev          # Start dev server
npm run db:push      # Push schema changes
npx tsx server/seed.ts    # Seed course content
```

## User Preferences
- Focus on clean, performance-tool aesthetic
- Minimize distractions
- Fast loading times essential for athletes between practice sessions
- 10-second autosave non-negotiable
- Respect theme toggle (not dark-mode-only)
