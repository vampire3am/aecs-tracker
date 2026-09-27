import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { WorkSessionService } from "../src/services/WorkSessionService";
import { WorkLogService } from "../src/services/WorkLogService";
import { TaskService } from "../src/services/TaskService";
import { DeterministicReportService } from "../src/services/DeterministicReportService";
import { calculateNetWorkDuration, diffInSeconds } from "../src/lib/time";
import { BreakType, TaskStatus, Priority, WorkCategory, SessionStatus } from "@prisma/client";

describe("AECS TRACKER Core Business Rules", () => {
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Clean up or find a test user
    const user = await prisma.user.findFirst({
      where: { email: "dev@aecstracker.internal" },
    });
    if (!user) throw new Error("Seed user not found for tests");
    testUserId = user.id;

    const project = await prisma.project.findFirst({
      where: { projectKey: "AECS" },
    });
    if (!project) throw new Error("Seed project not found for tests");
    testProjectId = project.id;
  });

  describe("Time & Duration Calculations", () => {
    it("calculates net work duration as Total Work - Total Breaks", () => {
      const totalSessionSec = 28800; // 8 hours
      const breakSec = 3600;         // 1 hour
      const netSec = calculateNetWorkDuration(totalSessionSec, breakSec);
      expect(netSec).toBe(25200);    // 7 hours
    });

    it("prevents negative net work duration if breaks exceed session", () => {
      const totalSessionSec = 1800; // 30 mins
      const breakSec = 3600;        // 60 mins
      const netSec = calculateNetWorkDuration(totalSessionSec, breakSec);
      expect(netSec).toBe(0);
    });

    it("calculates diffInSeconds accurately", () => {
      const start = new Date("2026-09-27T09:00:00Z");
      const end = new Date("2026-09-27T10:30:00Z");
      expect(diffInSeconds(start, end)).toBe(5400); // 90 mins
    });
  });

  describe("Work Session Constraints", () => {
    it("prevents multiple active sessions for the same employee", async () => {
      // dev@aecstracker.internal currently has an active session from seed
      await expect(WorkSessionService.startSession(testUserId)).rejects.toThrow(
        /Active work session already in progress/
      );
    });

    it("prevents starting a break when another break is already active", async () => {
      const currentState = await WorkSessionService.getCurrentState(testUserId);
      expect(currentState.activeSession).toBeDefined();

      // If no break is active, start one
      if (!currentState.activeBreak) {
        await WorkSessionService.startBreak(testUserId, BreakType.SHORT_BREAK, "Test Break");
      }

      // Trying to start a second break without ending the first should throw
      await expect(
        WorkSessionService.startBreak(testUserId, BreakType.LUNCH, "Duplicate Break")
      ).rejects.toThrow(/already active/);

      // Clean up break
      await WorkSessionService.endBreak(testUserId);
    });

    it("prevents ending a work session before its start time", async () => {
      const invalidEndTime = new Date("2020-01-01T00:00:00Z");
      await expect(
        WorkSessionService.endSession(testUserId, "Invalid end time", invalidEndTime)
      ).rejects.toThrow(/Work session end time cannot be before start time/);
    });
  });

  describe("Task Lifecycle & Completed Timestamp", () => {
    let createdTaskId: string;

    it("creates a task belonging to a valid project", async () => {
      const task = await TaskService.createTask({
        title: "Test Task for Integration Testing",
        projectId: testProjectId,
        assigneeId: testUserId,
        priority: Priority.HIGH,
        status: TaskStatus.TODO,
      });

      expect(task.id).toBeDefined();
      expect(task.completedAt).toBeNull();
      createdTaskId = task.id;
    });

    it("sets completedAt timestamp when task status transitions to COMPLETED", async () => {
      const updated = await TaskService.updateTask(createdTaskId, testUserId, {
        status: TaskStatus.COMPLETED,
      });

      expect(updated.status).toBe(TaskStatus.COMPLETED);
      expect(updated.completedAt).toBeInstanceOf(Date);
    });

    it("clears completedAt timestamp if task is reopened to IN_PROGRESS", async () => {
      const reopened = await TaskService.updateTask(createdTaskId, testUserId, {
        status: TaskStatus.IN_PROGRESS,
      });

      expect(reopened.status).toBe(TaskStatus.IN_PROGRESS);
      expect(reopened.completedAt).toBeNull();
    });

    it("fails when creating a task with a non-existent project", async () => {
      await expect(
        TaskService.createTask({
          title: "Orphan Task",
          projectId: "non-existent-uuid-12345",
          assigneeId: testUserId,
        })
      ).rejects.toThrow(/Project does not exist/);
    });
  });

  describe("Work Log Business Logic", () => {
    it("fails when work log end time is before start time", async () => {
      const start = new Date("2026-09-27T14:00:00Z");
      const end = new Date("2026-09-27T13:00:00Z");

      await expect(
        WorkLogService.createLog({
          userId: testUserId,
          projectId: testProjectId,
          category: WorkCategory.DEVELOPMENT,
          description: "Invalid time interval",
          startedAt: start,
          endedAt: end,
        })
      ).rejects.toThrow(/Work log end time cannot be before start time/);
    });

    it("supports start and stop timer backed by database", async () => {
      // Find a task
      const task = await prisma.task.findFirst({
        where: { projectId: testProjectId },
      });
      if (!task) throw new Error("No task found");

      const timerLog = await WorkLogService.startTaskTimer(testUserId, task.id, WorkCategory.DEVELOPMENT);
      expect(timerLog.isTimerRunning).toBe(true);
      expect(timerLog.status).toBe("IN_PROGRESS");

      // Verify active timer is fetchable
      const active = await WorkLogService.getActiveTimer(testUserId);
      expect(active?.id).toBe(timerLog.id);

      // Stop timer
      const stopped = await WorkLogService.stopTaskTimer(timerLog.id, "Finished sprint chunk");
      expect(stopped.isTimerRunning).toBe(false);
      expect(stopped.status).toBe("COMPLETED");
      expect(stopped.endedAt).toBeInstanceOf(Date);
    });

    it("prevents unauthorized employee from modifying another employee's work log", async () => {
      const priya = await prisma.user.findFirst({
        where: { email: "priya@aecstracker.internal" },
      });
      if (!priya) throw new Error("Priya not found");

      const alexLog = await prisma.workLog.findFirst({
        where: { userId: testUserId },
      });
      if (!alexLog) throw new Error("Alex log not found");

      // Priya attempts to edit Alex's log
      await expect(
        WorkLogService.updateLog(alexLog.id, priya.id, { description: "Tampered by Priya" })
      ).rejects.toThrow(/Unauthorized to edit another employee's work log/);
    });
  });

  describe("Deterministic Report Aggregation", () => {
    it("deterministically generates daily report from database records for 2026-09-26", async () => {
      const report = await DeterministicReportService.generateDailyReport(testUserId, "2026-09-26");

      expect(report.workDate).toBe("2026-09-26");
      expect(report.startedAt).toBeInstanceOf(Date);
      expect(report.endedAt).toBeInstanceOf(Date);
      expect(report.totalSessionSec).toBe(30600);
      expect(report.totalBreakSec).toBe(3600);
      expect(report.netWorkSec).toBe(27000);
      expect(report.completedWork.length).toBeGreaterThan(0);
      expect(report.recommendedNextSteps).toBeDefined();
    });

    it("aggregates weekly report totals accurately", async () => {
      const weekly = await DeterministicReportService.generateWeeklyReport(testUserId, "2026-09-21");

      expect(weekly.userId).toBe(testUserId);
      expect(weekly.workingDaysCount).toBeGreaterThanOrEqual(1);
      expect(weekly.totalWorkingSec).toBeGreaterThan(0);
      expect(weekly.netWorkSec).toBeGreaterThan(0);
      expect(weekly.categoryDistributionJson).toBeDefined();
    });

    it("aggregates monthly report statistics accurately", async () => {
      const monthly = await DeterministicReportService.generateMonthlyReport(testUserId, 2026, 9);

      expect(monthly.userId).toBe(testUserId);
      expect(monthly.month).toBe(9);
      expect(monthly.year).toBe(2026);
      expect(monthly.workingDaysCount).toBeGreaterThan(0);
      expect(monthly.avgDailyHours).toBeGreaterThan(0);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
