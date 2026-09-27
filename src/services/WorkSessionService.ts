import { prisma } from "@/lib/prisma";
import { getLocalDateString, diffInSeconds, calculateNetWorkDuration } from "@/lib/time";
import { SessionStatus, BreakType } from "@prisma/client";
import { AuditLogService } from "./AuditLogService";

export class WorkSessionService {
  /**
   * Start a new work session for an employee.
   * Throws error if there is already an ACTIVE session.
   */
  static async startSession(userId: string, notes?: string, customStartTime?: Date) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    if (!user) throw new Error("User not found");

    const activeSession = await prisma.workSession.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
    });

    if (activeSession) {
      throw new Error("Active work session already in progress. End the current session before starting a new one.");
    }

    const startTime = customStartTime || new Date();
    const workDate = getLocalDateString(startTime, user.timezone);

    const session = await prisma.workSession.create({
      data: {
        userId,
        workDate,
        startedAt: startTime,
        status: SessionStatus.ACTIVE,
        notes,
      },
      include: {
        breaks: true,
      },
    });

    await AuditLogService.log({
      userId,
      action: "SESSION_START",
      entity: "WorkSession",
      entityId: session.id,
      metadata: { workDate, startedAt: session.startedAt },
    });

    return session;
  }

  /**
   * End an active work session.
   * Closes any open break, calculates total duration, total breaks, and net work duration.
   */
  static async endSession(userId: string, notes?: string, customEndTime?: Date) {
    const activeSession = await prisma.workSession.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      include: {
        breaks: true,
      },
    });

    if (!activeSession) {
      throw new Error("No active work session found to end.");
    }

    const endTime = customEndTime || new Date();
    if (endTime < activeSession.startedAt) {
      throw new Error("Work session end time cannot be before start time.");
    }

    // If there is an active break currently running, close it first
    const activeBreak = activeSession.breaks.find((b) => !b.endedAt);
    if (activeBreak) {
      const breakDuration = diffInSeconds(activeBreak.startedAt, endTime);
      await prisma.break.update({
        where: { id: activeBreak.id },
        data: {
          endedAt: endTime,
          durationSec: breakDuration,
        },
      });
    }

    // Refresh breaks list
    const updatedBreaks = await prisma.break.findMany({
      where: { workSessionId: activeSession.id },
    });

    const totalDurationSec = diffInSeconds(activeSession.startedAt, endTime);
    const breakDurationSec = updatedBreaks.reduce((sum, b) => sum + (b.durationSec || 0), 0);
    const netWorkDurationSec = calculateNetWorkDuration(totalDurationSec, breakDurationSec);

    const completedSession = await prisma.workSession.update({
      where: { id: activeSession.id },
      data: {
        endedAt: endTime,
        status: SessionStatus.COMPLETED,
        totalDurationSec,
        breakDurationSec,
        netWorkDurationSec,
        notes: notes ?? activeSession.notes,
      },
      include: {
        breaks: true,
      },
    });

    await AuditLogService.log({
      userId,
      action: "SESSION_END",
      entity: "WorkSession",
      entityId: completedSession.id,
      metadata: {
        totalDurationSec,
        breakDurationSec,
        netWorkDurationSec,
      },
    });

    return completedSession;
  }

  /**
   * Start a break inside the active session
   */
  static async startBreak(userId: string, breakType: BreakType = BreakType.SHORT_BREAK, notes?: string) {
    const activeSession = await prisma.workSession.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      include: {
        breaks: true,
      },
    });

    if (!activeSession) {
      throw new Error("Cannot start a break without an active work session.");
    }

    const activeBreak = activeSession.breaks.find((b) => !b.endedAt);
    if (activeBreak) {
      throw new Error("A break is already active. Please end the current break first.");
    }

    const newBreak = await prisma.break.create({
      data: {
        workSessionId: activeSession.id,
        userId,
        breakType,
        startedAt: new Date(),
        notes,
      },
    });

    await AuditLogService.log({
      userId,
      action: "BREAK_START",
      entity: "Break",
      entityId: newBreak.id,
      metadata: { breakType, startedAt: newBreak.startedAt },
    });

    return newBreak;
  }

  /**
   * End the current active break
   */
  static async endBreak(userId: string, notes?: string) {
    const activeBreak = await prisma.break.findFirst({
      where: {
        userId,
        endedAt: null,
      },
      include: {
        workSession: true,
      },
    });

    if (!activeBreak) {
      throw new Error("No active break found to end.");
    }

    const endTime = new Date();
    if (endTime < activeBreak.startedAt) {
      throw new Error("Break end time cannot be before start time.");
    }

    const durationSec = diffInSeconds(activeBreak.startedAt, endTime);

    const endedBreak = await prisma.break.update({
      where: { id: activeBreak.id },
      data: {
        endedAt: endTime,
        durationSec,
        notes: notes ?? activeBreak.notes,
      },
    });

    // Update parent workSession break totals
    const allBreaks = await prisma.break.findMany({
      where: { workSessionId: activeBreak.workSessionId },
    });
    const totalBreakSec = allBreaks.reduce((sum, b) => sum + (b.durationSec || 0), 0);
    const sessionDurationSoFar = diffInSeconds(activeBreak.workSession.startedAt, endTime);

    await prisma.workSession.update({
      where: { id: activeBreak.workSessionId },
      data: {
        breakDurationSec: totalBreakSec,
        netWorkDurationSec: calculateNetWorkDuration(sessionDurationSoFar, totalBreakSec),
      },
    });

    await AuditLogService.log({
      userId,
      action: "BREAK_END",
      entity: "Break",
      entityId: endedBreak.id,
      metadata: { durationSec },
    });

    return endedBreak;
  }

  /**
   * Get current state of employee work session (Not Started, Working, On Break, Completed)
   */
  static async getCurrentState(userId: string) {
    const activeSession = await prisma.workSession.findFirst({
      where: {
        userId,
        status: SessionStatus.ACTIVE,
      },
      include: {
        breaks: {
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!activeSession) {
      // Check if user had a completed session today
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timezone: true },
      });
      const today = getLocalDateString(new Date(), user?.timezone || "UTC");

      const todaySessions = await prisma.workSession.findMany({
        where: {
          userId,
          workDate: today,
        },
        orderBy: { startedAt: "desc" },
        include: { breaks: true },
      });

      return {
        status: todaySessions.length > 0 ? ("COMPLETED" as const) : ("NOT_STARTED" as const),
        activeSession: null,
        activeBreak: null,
        todaySessions,
      };
    }

    const activeBreak = activeSession.breaks.find((b) => !b.endedAt) || null;

    return {
      status: activeBreak ? ("ON_BREAK" as const) : ("WORKING" as const),
      activeSession,
      activeBreak,
      todaySessions: [activeSession],
    };
  }
}
