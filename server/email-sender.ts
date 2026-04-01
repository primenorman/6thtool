import { Resend } from "resend";
import { storage } from "./storage";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = "The 6th Tool <onboarding@resend.dev>";

interface EmailTemplate {
  subject: string;
  html: (name: string, data?: Record<string, any>) => string;
}

const templates: Record<string, EmailTemplate> = {
  day_1_checkin: {
    subject: "Did you get your first mental rep in? ⚾",
    html: (name) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">Hey ${name},</h2>
        <p>Yesterday you installed <strong>The 6th Tool</strong>. Did you complete your first 15-minute practice?</p>
        <p>Your streak starts the moment you log that first rep.</p>
        <a href="https://the6thtool.replit.app/practice" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">→ LOG MY PRACTICE</a>
        <p style="color: #666; margin-top: 24px; font-size: 13px;">The 6th Tool — Mental Performance Training</p>
      </div>
    `,
  },
  day_3_progress: {
    subject: "3 reps in — your neural pathways are forming 🧠",
    html: (name, data) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">${name},</h2>
        <p>You've practiced <strong>${data?.practiceCount || 3} times</strong>. Elite hitters don't just have talent — they have systems. You're building one.</p>
        <a href="https://the6thtool.replit.app/modules" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">→ CONTINUE TRAINING</a>
        <p style="color: #666; margin-top: 24px; font-size: 13px;">The 6th Tool — Mental Performance Training</p>
      </div>
    `,
  },
  day_7_badge: {
    subject: "🔥 7-Day Warrior Badge Unlocked",
    html: (name) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">${name},</h2>
        <p style="font-size: 48px; text-align: center;">🔥</p>
        <p>Seven days. Seven mental reps. You just earned the <strong>7-Day Warrior</strong> badge.</p>
        <p>Most players never make it this far. You're not most players.</p>
        <a href="https://the6thtool.replit.app/dashboard" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">→ SEE YOUR BADGE</a>
        <p style="color: #666; margin-top: 24px; font-size: 13px;">The 6th Tool — Mental Performance Training</p>
      </div>
    `,
  },
  streak_at_risk: {
    subject: "Your streak is on the line tonight ⚠️",
    html: (name, data) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">${name},</h2>
        <p>You've built a <strong>${data?.streak || ''}-day streak</strong>. Don't let it break tonight.</p>
        <p>15 minutes. That's it.</p>
        <a href="https://the6thtool.replit.app/practice" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">→ START PRACTICE NOW</a>
        <p style="color: #666; margin-top: 24px; font-size: 13px;">The 6th Tool — Mental Performance Training</p>
      </div>
    `,
  },
  day_14_halfway: {
    subject: "Halfway through your foundation — here's your progress",
    html: (name) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">${name},</h2>
        <p>2 weeks in. Your bio-computer is installing new mental software with every practice.</p>
        <p>Keep the momentum going. You're building something real.</p>
        <a href="https://the6thtool.replit.app/modules" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">→ KEEP GOING</a>
        <p style="color: #666; margin-top: 24px; font-size: 13px;">The 6th Tool — Mental Performance Training</p>
      </div>
    `,
  },
  day_21_habit: {
    subject: "21 days. It's a habit now. 🔒",
    html: (name) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">${name},</h2>
        <p>Science says 21 days creates a habit. You just crossed that line.</p>
        <p>Mental training isn't something you're trying anymore — it's something you <strong>do</strong>.</p>
        <a href="https://the6thtool.replit.app/dashboard" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">→ DASHBOARD</a>
        <p style="color: #666; margin-top: 24px; font-size: 13px;">The 6th Tool — Mental Performance Training</p>
      </div>
    `,
  },
  day_30_milestone: {
    subject: "30 days of mental reps. Here's your data. 📊",
    html: (name) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">${name},</h2>
        <p>One month of mental training. That's your bio-computer improving, rep by rep.</p>
        <p>Check your dashboard to see how your Certainty Rating has evolved.</p>
        <a href="https://the6thtool.replit.app/dashboard" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">→ SEE YOUR CHART</a>
        <p style="color: #666; margin-top: 24px; font-size: 13px;">The 6th Tool — Mental Performance Training</p>
      </div>
    `,
  },
};

export async function processEmailQueue(): Promise<{ processed: number; errors: number }> {
  if (!resend) {
    console.log("Resend not configured (no RESEND_API_KEY), skipping email processing");
    return { processed: 0, errors: 0 };
  }

  const pending = await storage.getPendingEmails();
  let processed = 0;
  let errors = 0;

  for (const email of pending) {
    const template = templates[email.emailType];
    if (!template) {
      console.error(`No template for email type: ${email.emailType}`);
      await storage.markEmailSent(email.id);
      processed++;
      continue;
    }

    try {
      const user = await storage.getUserById(email.userId);
      const name = user?.firstName || user?.displayName || user?.email?.split("@")[0] || "Athlete";
      const userEmail = user?.email;

      if (!userEmail) {
        console.error(`No email for user ${email.userId}`);
        await storage.markEmailSent(email.id);
        continue;
      }

      await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject: template.subject,
        html: template.html(name),
      });

      await storage.markEmailSent(email.id);
      processed++;
    } catch (err) {
      console.error(`Failed to send email ${email.id}:`, err);
      errors++;
    }
  }

  return { processed, errors };
}
