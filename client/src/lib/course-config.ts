export interface WeekLesson {
  id: string;
  title: string;
  originalLessonIds: number[];
  estimatedMinutes: number;
}

export interface WeekAction {
  title: string;
  templateSlug?: string;
}

export interface WeekConfig {
  weekNumber: number;
  title: string;
  subtitle: string;
  originalModuleIds: number[];
  lessons: WeekLesson[];
  action?: WeekAction;
  completionXp: number;
  unlockMessage?: string;
}

export const COURSE_WEEKS: WeekConfig[] = [
  {
    weekNumber: 1,
    title: "Foundation Essentials",
    subtitle: "Understanding your mental operating system",
    originalModuleIds: [1],
    lessons: [
      { id: "1.1", title: "The Bio-Computer Paradigm", originalLessonIds: [1, 2, 3], estimatedMinutes: 25 },
      { id: "1.2", title: "The Four-Brain Model", originalLessonIds: [4, 5], estimatedMinutes: 20 },
      { id: "1.3", title: "The Performance Gap", originalLessonIds: [6], estimatedMinutes: 15 },
    ],
    action: { title: "Complete Brain Mapping Worksheet", templateSlug: "brain-mapping" },
    completionXp: 200,
  },
  {
    weekNumber: 2,
    title: "Your First Metastory",
    subtitle: "Programming your unconscious for success",
    originalModuleIds: [2],
    lessons: [
      { id: "2.1", title: "The Coordinate Problem", originalLessonIds: [7, 8, 9], estimatedMinutes: 25 },
      { id: "2.2", title: "Metastory Architecture & Construction", originalLessonIds: [10, 11, 12], estimatedMinutes: 30 },
    ],
    action: { title: "Create first Metastory using template", templateSlug: "metastory" },
    completionXp: 150,
    unlockMessage: "Springer Protocol now unlocked!",
  },
  {
    weekNumber: 3,
    title: "Finding Your Anchor",
    subtitle: "Discovering your Inner Anchor Point",
    originalModuleIds: [3],
    lessons: [
      { id: "3.1", title: "The Inner Anchor Point — Discovery + Calibration", originalLessonIds: [13, 14, 15], estimatedMinutes: 25 },
      { id: "3.2", title: "IAP Activation", originalLessonIds: [16, 17, 18], estimatedMinutes: 20 },
    ],
    action: { title: "Identify and calibrate personal IAP" },
    completionXp: 150,
  },
  {
    weekNumber: 4,
    title: "Debugging & Blockers",
    subtitle: "Removing what's holding you back",
    originalModuleIds: [4],
    lessons: [
      { id: "4.1", title: "Understanding Blockers", originalLessonIds: [19, 20, 21], estimatedMinutes: 25 },
      { id: "4.2", title: "The RNBR Protocol", originalLessonIds: [22, 23, 24], estimatedMinutes: 30 },
    ],
    action: { title: "Complete RNBR worksheet for one blocker", templateSlug: "rnbr" },
    completionXp: 400,
  },
  {
    weekNumber: 5,
    title: "Elite Objectives",
    subtitle: "Setting impossible goals and achieving them",
    originalModuleIds: [5, 6],
    lessons: [
      { id: "5.1", title: "The UPL Concept + 120% Buffer", originalLessonIds: [25, 26, 27, 28, 29, 30], estimatedMinutes: 35 },
      { id: "5.2", title: "Creating Your EPSI", originalLessonIds: [31, 32, 33, 34, 35, 36], estimatedMinutes: 35 },
    ],
    action: { title: "Create SA Objective + EPSI", templateSlug: "epsi" },
    completionXp: 400,
  },
  {
    weekNumber: 6,
    title: "Mastery & Maintenance",
    subtitle: "Building your permanent mental system",
    originalModuleIds: [7],
    lessons: [
      { id: "6.1", title: "Full Daily Routine Deep Dive", originalLessonIds: [37, 38], estimatedMinutes: 20 },
      { id: "6.2", title: "Success/Failure Process Mastery", originalLessonIds: [39, 40], estimatedMinutes: 20 },
      { id: "6.3", title: "System Health Monitoring", originalLessonIds: [41, 42], estimatedMinutes: 15 },
    ],
    action: { title: "7-day perfect practice streak" },
    completionXp: 500,
  },
];

export function getWeekForModule(moduleId: number): WeekConfig | undefined {
  return COURSE_WEEKS.find(w => w.originalModuleIds.includes(moduleId));
}

export function getWeekForLesson(lessonId: number): { week: WeekConfig; weekLesson: WeekLesson } | undefined {
  for (const week of COURSE_WEEKS) {
    for (const wl of week.lessons) {
      if (wl.originalLessonIds.includes(lessonId)) {
        return { week, weekLesson: wl };
      }
    }
  }
  return undefined;
}
