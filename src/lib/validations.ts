import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const startSessionSchema = z.object({
  notes: z.string().optional(),
});

export const endSessionSchema = z.object({
  notes: z.string().optional(),
});

export const startBreakSchema = z.object({
  breakType: z.enum(["LUNCH", "SHORT_BREAK", "PERSONAL", "MEETING", "OTHER"]),
  notes: z.string().optional(),
});

export const endBreakSchema = z.object({
  notes: z.string().optional(),
});

export const createWorkLogSchema = z.object({
  projectId: z.string().min(1, "Project is required"),
  taskId: z.string().optional().nullable(),
  category: z.enum([
    "DEVELOPMENT",
    "BUG_FIX",
    "DEBUGGING",
    "TESTING",
    "CODE_REVIEW",
    "DOCUMENTATION",
    "DEPLOYMENT",
    "RESEARCH",
    "MEETING",
    "MAINTENANCE",
    "ARCHITECTURE",
    "LEARNING",
    "OTHER",
  ]),
  description: z.string().min(3, "Description must be at least 3 characters"),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  durationSec: z.number().int().min(0).optional(),
  status: z.enum(["COMPLETED", "IN_PROGRESS"]).default("COMPLETED"),
  notes: z.string().optional(),
  externalRef: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(2, "Task title is required"),
  description: z.string().optional(),
  projectId: z.string().min(1, "Project is required"),
  assigneeId: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "COMPLETED", "CANCELLED"]).default("TODO"),
  estimatedHours: z.number().min(0).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  gitBranch: z.string().optional().nullable(),
  externalRef: z.string().optional().nullable(),
});

export const createProjectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  projectKey: z.string().min(2, "Project key is required").max(10),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  startDate: z.string().optional().nullable(),
  targetEndDate: z.string().optional().nullable(),
});

export const createMeetingSchema = z.object({
  title: z.string().min(2, "Meeting title is required"),
  description: z.string().optional(),
  projectId: z.string().optional().nullable(),
  startedAt: z.string(),
  endedAt: z.string(),
  meetingType: z.enum([
    "STANDUP",
    "PLANNING",
    "CODE_REVIEW",
    "ARCHITECTURE",
    "CLIENT",
    "TEAM",
    "ONE_ON_ONE",
    "OTHER",
  ]).default("TEAM"),
  notes: z.string().optional(),
  externalUrl: z.string().optional(),
});

export const createBlockerSchema = z.object({
  title: z.string().min(2, "Blocker title is required"),
  description: z.string().min(5, "Please describe the blocker"),
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  waitingFor: z.string().optional(),
  impact: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
});

export const resolveBlockerSchema = z.object({
  resolutionNotes: z.string().min(2, "Resolution notes required"),
});

export const createAchievementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(5, "Description is required"),
  projectId: z.string().optional().nullable(),
  category: z.string().default("General"),
  notes: z.string().optional(),
});

export const updateDailyReportSchema = z.object({
  notes: z.string().optional(),
  recommendedNextSteps: z.string().optional(),
  completedWorkJson: z.string().optional(),
  inProgressJson: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED"]).default("SUBMITTED"),
});
