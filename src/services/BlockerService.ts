import { prisma } from "@/lib/prisma";
import { BlockerStatus, Priority, TaskStatus } from "@prisma/client";
import { AuditLogService } from "./AuditLogService";

export interface CreateBlockerInput {
  userId: string;
  title: string;
  description: string;
  projectId?: string | null;
  taskId?: string | null;
  waitingFor?: string | null;
  impact?: string | null;
  priority?: Priority;
}

export class BlockerService {
  static async createBlocker(input: CreateBlockerInput) {
    const blocker = await prisma.blocker.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        taskId: input.taskId,
        waitingFor: input.waitingFor,
        impact: input.impact,
        priority: input.priority || Priority.HIGH,
        status: BlockerStatus.OPEN,
      },
      include: {
        project: true,
        task: true,
      },
    });

    // If associated with a task, mark task as BLOCKED if currently in progress or todo
    if (input.taskId) {
      const task = await prisma.task.findUnique({ where: { id: input.taskId } });
      if (task && task.status !== TaskStatus.COMPLETED) {
        await prisma.task.update({
          where: { id: input.taskId },
          data: { status: TaskStatus.BLOCKED },
        });
      }
    }

    await AuditLogService.log({
      userId: input.userId,
      action: "BLOCKER_CREATE",
      entity: "Blocker",
      entityId: blocker.id,
      metadata: { title: blocker.title, priority: blocker.priority },
    });

    return blocker;
  }

  static async resolveBlocker(blockerId: string, userId: string, resolutionNotes: string) {
    const blocker = await prisma.blocker.findUnique({ where: { id: blockerId } });
    if (!blocker) throw new Error("Blocker not found");

    const resolved = await prisma.blocker.update({
      where: { id: blockerId },
      data: {
        status: BlockerStatus.RESOLVED,
        resolvedAt: new Date(),
        resolutionNotes,
      },
      include: {
        task: true,
      },
    });

    // If the task was blocked and has no other open blockers, set it back to IN_PROGRESS
    if (resolved.taskId) {
      const otherOpenBlockers = await prisma.blocker.findFirst({
        where: {
          taskId: resolved.taskId,
          status: { in: [BlockerStatus.OPEN, BlockerStatus.IN_PROGRESS] },
          id: { not: blockerId },
        },
      });

      if (!otherOpenBlockers) {
        await prisma.task.update({
          where: { id: resolved.taskId },
          data: { status: TaskStatus.IN_PROGRESS },
        });
      }
    }

    await AuditLogService.log({
      userId,
      action: "BLOCKER_RESOLVE",
      entity: "Blocker",
      entityId: blockerId,
      metadata: { resolvedAt: resolved.resolvedAt },
    });

    return resolved;
  }

  static async listOpenBlockers(userId?: string) {
    return prisma.blocker.findMany({
      where: {
        status: { in: [BlockerStatus.OPEN, BlockerStatus.IN_PROGRESS] },
        ...(userId ? { userId } : {}),
      },
      orderBy: { startedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true, projectKey: true } },
        task: { select: { id: true, title: true } },
      },
    });
  }
}
