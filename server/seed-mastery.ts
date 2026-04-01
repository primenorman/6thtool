import { db } from "./db";
import { moduleMasteryRequirements } from "@shared/schema";

async function seedMasteryRequirements() {
  console.log("Seeding mastery requirements...");

  const existing = await db.select().from(moduleMasteryRequirements);
  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing requirements, skipping seed.`);
    return;
  }

  const requirements = [
    // Module 1: The Bio-Computer Foundation
    {
      moduleId: 1,
      requirementType: "lessons_complete",
      title: "Complete All Module 1 Lessons",
      description: "Watch all videos and complete the reading materials in Module 1.",
      verificationCriteria: "All lessons in module 1 marked as complete",
      isRequired: true,
      autoVerify: true,
      orderIndex: 0,
      estimatedMinutes: 60,
    },
    {
      moduleId: 1,
      requirementType: "self_assessment",
      title: "Bio-Computer Self-Assessment",
      description: "Reflect on your current mental performance habits and identify areas for growth. Write a brief assessment of your strengths and weaknesses.",
      verificationCriteria: "Minimum 100 words describing current mental game approach",
      isRequired: true,
      autoVerify: false,
      orderIndex: 1,
      estimatedMinutes: 15,
    },

    // Module 2: Writing Code for the Unconscious
    {
      moduleId: 2,
      requirementType: "lessons_complete",
      title: "Complete All Module 2 Lessons",
      description: "Complete all lessons in the Writing Code module.",
      verificationCriteria: "All lessons in module 2 marked as complete",
      isRequired: true,
      autoVerify: true,
      orderIndex: 0,
      estimatedMinutes: 60,
    },
    {
      moduleId: 2,
      requirementType: "template_verified",
      title: "Submit SA Objective",
      description: "Create and submit your SA Objective using the template. Must be verified by your coach.",
      verificationCriteria: "SA Objective template submitted and verified",
      isRequired: true,
      autoVerify: true,
      targetTemplateSlug: "sa-objective",
      orderIndex: 1,
      estimatedMinutes: 30,
    },

    // Module 3: The Inner Anchor Point
    {
      moduleId: 3,
      requirementType: "lessons_complete",
      title: "Complete All Module 3 Lessons",
      description: "Complete all lessons in the Inner Anchor Point module.",
      verificationCriteria: "All lessons in module 3 marked as complete",
      isRequired: true,
      autoVerify: true,
      orderIndex: 0,
      estimatedMinutes: 60,
    },
    {
      moduleId: 3,
      requirementType: "template_verified",
      title: "Submit Metastory",
      description: "Construct and submit your Metastory using the template. Must be verified by your coach.",
      verificationCriteria: "Metastory template submitted and verified",
      isRequired: true,
      autoVerify: true,
      targetTemplateSlug: "metastory",
      orderIndex: 1,
      estimatedMinutes: 45,
    },
    {
      moduleId: 3,
      requirementType: "practice_streak",
      title: "3-Day Practice Streak",
      description: "Complete your daily practice routine for 3 consecutive days to build the habit.",
      verificationCriteria: "Current practice streak >= 3 days",
      isRequired: true,
      autoVerify: true,
      minValue: 3,
      orderIndex: 2,
      estimatedMinutes: 45,
    },

    // Module 4: Debugging the System
    {
      moduleId: 4,
      requirementType: "lessons_complete",
      title: "Complete All Module 4 Lessons",
      description: "Complete all lessons in the Debugging module.",
      verificationCriteria: "All lessons in module 4 marked as complete",
      isRequired: true,
      autoVerify: true,
      orderIndex: 0,
      estimatedMinutes: 60,
    },
    {
      moduleId: 4,
      requirementType: "template_verified",
      title: "Submit EPSI",
      description: "Create and submit your Endpoint Success Image. Must be verified by your coach.",
      verificationCriteria: "EPSI template submitted and verified",
      isRequired: true,
      autoVerify: true,
      targetTemplateSlug: "epsi",
      orderIndex: 1,
      estimatedMinutes: 30,
    },
    {
      moduleId: 4,
      requirementType: "practice_streak",
      title: "5-Day Practice Streak",
      description: "Maintain your daily practice routine for 5 consecutive days.",
      verificationCriteria: "Current practice streak >= 5 days",
      isRequired: true,
      autoVerify: true,
      minValue: 5,
      orderIndex: 2,
      estimatedMinutes: 75,
    },

    // Module 5: Architecting the Impossible
    {
      moduleId: 5,
      requirementType: "lessons_complete",
      title: "Complete All Module 5 Lessons",
      description: "Complete all lessons in the Architecting module.",
      verificationCriteria: "All lessons in module 5 marked as complete",
      isRequired: true,
      autoVerify: true,
      orderIndex: 0,
      estimatedMinutes: 60,
    },
    {
      moduleId: 5,
      requirementType: "template_verified",
      title: "Submit RNBR Worksheet",
      description: "Complete and submit your RNBR (Recognize, Negate, Block, Replace) worksheet. Must be verified.",
      verificationCriteria: "RNBR template submitted and verified",
      isRequired: true,
      autoVerify: true,
      targetTemplateSlug: "rnbr",
      orderIndex: 1,
      estimatedMinutes: 30,
    },
    {
      moduleId: 5,
      requirementType: "practice_streak",
      title: "7-Day Practice Streak",
      description: "Maintain your daily practice routine for 7 consecutive days to demonstrate commitment.",
      verificationCriteria: "Current practice streak >= 7 days",
      isRequired: true,
      autoVerify: true,
      minValue: 7,
      orderIndex: 2,
      estimatedMinutes: 105,
    },
    {
      moduleId: 5,
      requirementType: "grid_score",
      title: "Concentration Grid: Score 25+",
      description: "Achieve a score of 25 or higher on the concentration grid exercise.",
      verificationCriteria: "Best grid score >= 25",
      isRequired: false,
      autoVerify: true,
      minValue: 25,
      orderIndex: 3,
      estimatedMinutes: 10,
    },

    // Module 6: Translating Words into Experiences
    {
      moduleId: 6,
      requirementType: "lessons_complete",
      title: "Complete All Module 6 Lessons",
      description: "Complete all lessons in the Translation module.",
      verificationCriteria: "All lessons in module 6 marked as complete",
      isRequired: true,
      autoVerify: true,
      orderIndex: 0,
      estimatedMinutes: 60,
    },
    {
      moduleId: 6,
      requirementType: "self_assessment",
      title: "Integration Reflection",
      description: "Write a reflection on how you've integrated the mental training tools into your daily routine and game performance.",
      verificationCriteria: "Detailed reflection on integration of tools (minimum 150 words)",
      isRequired: true,
      autoVerify: false,
      orderIndex: 1,
      estimatedMinutes: 20,
    },
    {
      moduleId: 6,
      requirementType: "practice_streak",
      title: "10-Day Practice Streak",
      description: "Demonstrate consistent commitment with 10 consecutive days of practice.",
      verificationCriteria: "Current practice streak >= 10 days",
      isRequired: true,
      autoVerify: true,
      minValue: 10,
      orderIndex: 2,
      estimatedMinutes: 150,
    },

    // Module 7: Daily Reps and System Maintenance
    {
      moduleId: 7,
      requirementType: "lessons_complete",
      title: "Complete All Module 7 Lessons",
      description: "Complete all final module lessons.",
      verificationCriteria: "All lessons in module 7 marked as complete",
      isRequired: true,
      autoVerify: true,
      orderIndex: 0,
      estimatedMinutes: 60,
    },
    {
      moduleId: 7,
      requirementType: "practice_streak",
      title: "14-Day Practice Streak",
      description: "Prove your system is locked in with 14 consecutive days of daily practice.",
      verificationCriteria: "Current practice streak >= 14 days",
      isRequired: true,
      autoVerify: true,
      minValue: 14,
      orderIndex: 1,
      estimatedMinutes: 210,
    },
    {
      moduleId: 7,
      requirementType: "self_assessment",
      title: "Program Completion Assessment",
      description: "Write your final assessment reflecting on your mental performance transformation throughout the entire program.",
      verificationCriteria: "Comprehensive reflection (minimum 200 words) covering growth, tools mastered, and future plan",
      isRequired: true,
      autoVerify: false,
      orderIndex: 2,
      estimatedMinutes: 30,
    },
  ];

  await db.insert(moduleMasteryRequirements).values(requirements);
  console.log(`Seeded ${requirements.length} mastery requirements.`);
}

seedMasteryRequirements()
  .then(() => {
    console.log("Done seeding mastery requirements.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding mastery requirements:", error);
    process.exit(1);
  });
