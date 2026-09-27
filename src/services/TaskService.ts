import { prisma } from "@/lib/prisma";
import { TaskStatus, Priority } from "@prisma/client";
import { AuditLogService } from "./AuditLogService";

export interface CreateTaskInput {
  title: string;
  description?: string;
  projectId: string;
  assigneeId?: string | null;
  creatorId?: string | null;
  priority?: Priority;
  status?: TaskStatus;
  estimatedHours?: number | null;
  dueDate?: Date | null;
  gitBranch?: string | null;
  externalRef?: string | null;
}

export class TaskService {
  static async createTask(input: CreateTaskInput) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
    });
    if (!project) {
      throw new Error("Cannot create task: Project does not exist.");
    }

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        projectId: input.projectId,
        assigneeId: input.assigneeId,
        creatorId: input.creatorId,
        priority: input.priority || Priority.MEDIUM,
        status: input.status || TaskStatus.TODO,
        estimatedHours: input.estimatedHours,
        dueDate: input.dueDate,
        gitBranch: input.gitBranch,
        externalRef: input.externalRef,
        completedAt: input.status === TaskStatus.COMPLETED ? new Date() : null,
      },
      include: {
        project: true,
        assignee: true,
      },
    });

    await AuditLogService.log({
      userId: input.creatorId || input.assigneeId,
      action: "TASK_CREATE",
      entity: "Task",
      entityId: task.id,
      metadata: { title: task.title, projectId: task.projectId },
    });

    return task;
  }

  static async updateTask(
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: Priority;
      assigneeId?: string | null;
      estimatedHours?: number | null;
      dueDate?: Date | null;
      gitBranch?: string | null;
      externalRef?: string | null;
    }
  ) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) throw new Error("Task not found");

    const updatePayload: Record<string, unknown> = { ...data };

    // Handle completedAt timestamp business rule: Completed tasks should have a completion timestamp
    if (data.status) {
      if (data.status === TaskStatus.COMPLETED && existing.status !== TaskStatus.COMPLETED) {
        updatePayload.completedAt = new Date();
      } else if (data.status !== TaskStatus.COMPLETED && existing.status === TaskStatus.COMPLETED) {
        updatePayload.completedAt = null;
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updatePayload,
      include: {
        project: true,
        assignee: true,
      },
    });

    await AuditLogService.log({
      userId,
      action: "TASK_UPDATE",
      entity: "Task",
      entityId: updated.id,
      metadata: { changed: Object.keys(data), newStatus: updated.status },
    });

    return updated;
  }

  static async getTaskDetails(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        assignee: {
          select: { id: true, name: true, email: true, jobTitle: true, avatarUrl: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        workLogs: {
          orderBy: { startedAt: "desc" },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        blockers: {
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!task) throw new Error("Task not found");
    return task;
  }

  static async deleteTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");

    await prisma.task.delete({ where: { id: taskId } });

    await AuditLogService.log({
      userId,
      action: "TASK_DELETE",
      entity: "Task",
      entityId: taskId,
      metadata: { title: task.title },
    });

    return true;
  }
}
