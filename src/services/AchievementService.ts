import { prisma } from "@/lib/prisma";
import { AuditLogService } from "./AuditLogService";

export interface CreateAchievementInput {
  userId: string;
  projectId?: string | null;
  title: string;
  description: string;
  category?: string;
  date?: Date;
  notes?: string;
}

export class AchievementService {
  static async createAchievement(input: CreateAchievementInput) {
    const achievement = await prisma.achievement.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        category: input.category || "General",
        date: input.date || new Date(),
        notes: input.notes,
      },
      include: {
        project: true,
      },
    });

    await AuditLogService.log({
      userId: input.userId,
      action: "ACHIEVEMENT_CREATE",
      entity: "Achievement",
      entityId: achievement.id,
      metadata: { title: achievement.title },
    });

    return achievement;
  }

  static async listUserAchievements(userId: string) {
    return prisma.achievement.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      include: { project: true },
    });
  }
}
