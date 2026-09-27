import { prisma } from "@/lib/prisma";
import { diffInSeconds } from "@/lib/time";
import { WorkCategory, SessionStatus } from "@prisma/client";
import { AuditLogService } from "./AuditLogService";

export interface CreateWorkLogInput {
  userId: string;
  projectId: string;
  taskId?: string | null;
  category: WorkCategory;
  description: string;
  startedAt?: Date;
  endedAt?: Date;
  durationSec?: number;
  status?: string;
  notes?: string;
  externalRef?: string;
}

export class WorkLogService {
  /**
   * Create a manual work log or completed work log entry
   */
  static async createLog(input: CreateWorkLogInput) {
    // Find if user currently has an active work session to link it with
    const activeSession = await prisma.workSession.findFirst({
      where: {
        userId: input.userId,
        status: SessionStatus.ACTIVE,
      },
    });

    const startedAt = input.startedAt || new Date();
    const endedAt = input.endedAt || new Date();

    if (endedAt < startedAt) {
      throw new Error("Work log end time cannot be before start time.");
    }

    const calculatedDuration = input.durationSec ?? diffInSeconds(startedAt, endedAt);

    const log = await prisma.workLog.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        taskId: input.taskId,
        workSessionId: activeSession ? activeSession.id : null,
        category: input.category,
        description: input.description,
        startedAt,
        endedAt,
        durationSec: calculatedDuration,
        status: input.status || "COMPLETED",
        notes: input.notes,
        externalRef: input.externalRef,
        isTimerRunning: false,
      },
      include: {
        project: true,
        task: true,
      },
    });

    // Update actualHours on task if taskId is provided
    if (input.taskId) {
      await this.recalculateTaskHours(input.taskId);
    }

    await AuditLogService.log({
      userId: input.userId,
      action: "WORK_LOG_CREATE",
      entity: "WorkLog",
      entityId: log.id,
      metadata: { durationSec: log.durationSec, category: log.category },
    });

    return log;
  }

  /**
   * Start a task-based timer backed by database.
   * If an existing running timer exists for the user, stop it or reject.
   */
  static async startTaskTimer(userId: string, taskId: string, category: WorkCategory = WorkCategory.DEVELOPMENT) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, projectId: true, title: true },
    });
    if (!task) throw new Error("Task not found");

    // Check if user already has a running timer
    const existingRunning = await prisma.workLog.findFirst({
      where: {
        userId,
        isTimerRunning: true,
      },
    });

    if (existingRunning) {
      // Automatically stop the previous timer cleanly
      await this.stopTaskTimer(existingRunning.id);
    }

    const activeSession = await prisma.workSession.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
    });

    const newTimerLog = await prisma.workLog.create({
      data: {
        userId,
        projectId: task.projectId,
        taskId: task.id,
        workSessionId: activeSession?.id ?? null,
        category,
        description: `Working on: ${task.title}`,
        startedAt: new Date(),
        isTimerRunning: true,
        status: "IN_PROGRESS",
        durationSec: 0,
      },
      include: {
        task: true,
        project: true,
      },
    });

    await AuditLogService.log({
      userId,
      action: "TASK_TIMER_START",
      entity: "WorkLog",
      entityId: newTimerLog.id,
      metadata: { taskId, startedAt: newTimerLog.startedAt },
    });

    return newTimerLog;
  }

  /**
   * Stop an active task timer and finalize its duration
   */
  static async stopTaskTimer(workLogId: string, notes?: string) {
    const runningLog = await prisma.workLog.findUnique({
      where: { id: workLogId },
    });

    if (!runningLog || !runningLog.isTimerRunning) {
      throw new Error("No active timer found for this work log.");
    }

    const endTime = new Date();
    const durationSec = diffInSeconds(runningLog.startedAt, endTime);

    const updated = await prisma.workLog.update({
      where: { id: workLogId },
      data: {
        endedAt: endTime,
        durationSec,
        isTimerRunning: false,
        status: "COMPLETED",
        notes: notes ?? runningLog.notes,
      },
      include: {
        task: true,
        project: true,
      },
    });

    if (updated.taskId) {
      await this.recalculateTaskHours(updated.taskId);
    }

    await AuditLogService.log({
      userId: updated.userId,
      action: "TASK_TIMER_STOP",
      entity: "WorkLog",
      entityId: updated.id,
      metadata: { durationSec },
    });

    return updated;
  }

  /**
   * Get active running timer for user if any
   */
  static async getActiveTimer(userId: string) {
    return prisma.workLog.findFirst({
      where: {
        userId,
        isTimerRunning: true,
      },
      include: {
        task: true,
        project: true,
      },
    });
  }

  /**
   * Update work log duration or details (user editable)
   */
  static async updateLog(
    logId: string,
    userId: string,
    data: {
      durationSec?: number;
      description?: string;
      category?: WorkCategory;
      notes?: string;
      status?: string;
    }
  ) {
    const existing = await prisma.workLog.findUnique({
      where: { id: logId },
    });
    if (!existing) throw new Error("Work log not found");
    if (existing.userId !== userId) throw new Error("Unauthorized to edit another employee's work log.");

    const updated = await prisma.workLog.update({
      where: { id: logId },
      data,
    });

    if (updated.taskId) {
      await this.recalculateTaskHours(updated.taskId);
    }

    await AuditLogService.log({
      userId,
      action: "WORK_LOG_UPDATE",
      entity: "WorkLog",
      entityId: updated.id,
      metadata: { updatedFields: Object.keys(data) },
    });

    return updated;
  }

  /**
   * Delete work log
   */
  static async deleteLog(logId: string, userId: string) {
    const existing = await prisma.workLog.findUnique({
      where: { id: logId },
    });
    if (!existing) throw new Error("Work log not found");
    if (existing.userId !== userId) throw new Error("Unauthorized");

    await prisma.workLog.delete({ where: { id: logId } });

    if (existing.taskId) {
      await this.recalculateTaskHours(existing.taskId);
    }

    return true;
  }

  /**
   * Recalculate total actual hours for a task
   */
  static async recalculateTaskHours(taskId: string) {
    const logs = await prisma.workLog.findMany({
      where: { taskId, isTimerRunning: false },
      select: { durationSec: true },
    });
    const totalSec = logs.reduce((sum, l) => sum + (l.durationSec || 0), 0);
    const actualHours = Math.round((totalSec / 3600) * 10) / 10;

    await prisma.task.update({
      where: { id: taskId },
      data: { actualHours },
    });
  }
}
