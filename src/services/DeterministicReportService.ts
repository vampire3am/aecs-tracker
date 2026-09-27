import { prisma } from "@/lib/prisma";
import { TaskStatus, BlockerStatus } from "@prisma/client";
import { formatDurationHuman, getLocalDateString } from "@/lib/time";
import { startOfWeek, endOfWeek, parseISO, format } from "date-fns";

export interface DailyReportData {
  workDate: string;
  startedAt: Date | null;
  endedAt: Date | null;
  totalSessionSec: number;
  totalBreakSec: number;
  netWorkSec: number;
  completedWork: Array<{ id: string; description: string; durationSec: number; category: string; projectName?: string }>;
  inProgress: Array<{ id: string; description: string; durationSec: number; category: string; projectName?: string }>;
  pendingTasks: Array<{ id: string; title: string; priority: string; projectName: string }>;
  meetings: Array<{ id: string; title: string; durationSec: number; meetingType: string }>;
  blockers: Array<{ id: string; title: string; priority: string; status: string; waitingFor?: string | null }>;
  achievements: Array<{ id: string; title: string; description: string; category: string }>;
  recommendedNextSteps: string;
}

export class DeterministicReportService {
  /**
   * Deterministically assemble all database entities for a specific user and date
   */
  static async generateDailyReport(userId: string, workDate: string): Promise<DailyReportData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    const tz = user?.timezone || "UTC";

    // 1. Fetch work sessions on this workDate
    const sessions = await prisma.workSession.findMany({
      where: { userId, workDate },
      include: { breaks: true },
      orderBy: { startedAt: "asc" },
    });

    let startedAt: Date | null = null;
    let endedAt: Date | null = null;
    let totalSessionSec = 0;
    let totalBreakSec = 0;
    let netWorkSec = 0;

    if (sessions.length > 0) {
      startedAt = sessions[0].startedAt;
      const lastSession = sessions[sessions.length - 1];
      endedAt = lastSession.endedAt;

      for (const s of sessions) {
        totalSessionSec += s.totalDurationSec;
        totalBreakSec += s.breakDurationSec;
        netWorkSec += s.netWorkDurationSec;
      }
    }

    // 2. Fetch work logs created/executed on this day
    // Query by session ID or date range
    const startOfDayUtc = new Date(`${workDate}T00:00:00.000Z`);
    const endOfDayUtc = new Date(`${workDate}T23:59:59.999Z`);

    const workLogs = await prisma.workLog.findMany({
      where: {
        userId,
        OR: [
          { workSessionId: { in: sessions.map((s) => s.id) } },
          { startedAt: { gte: startOfDayUtc, lte: endOfDayUtc } },
        ],
      },
      include: {
        project: { select: { name: true } },
      },
      orderBy: { startedAt: "asc" },
    });

    const completedWork = workLogs
      .filter((l) => l.status === "COMPLETED")
      .map((l) => ({
        id: l.id,
        description: l.description,
        durationSec: l.durationSec,
        category: l.category,
        projectName: l.project.name,
      }));

    const inProgress = workLogs
      .filter((l) => l.status === "IN_PROGRESS" || l.isTimerRunning)
      .map((l) => ({
        id: l.id,
        description: l.description,
        durationSec: l.durationSec,
        category: l.category,
        projectName: l.project.name,
      }));

    // 3. Fetch pending tasks assigned to user
    const pendingTasksList = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.REVIEW] },
      },
      include: {
        project: { select: { name: true } },
      },
      orderBy: { priority: "desc" },
    });

    const pendingTasks = pendingTasksList.map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      projectName: t.project.name,
    }));

    // 4. Fetch meetings on this date
    const meetingsList = await prisma.meeting.findMany({
      where: {
        userId,
        startedAt: { gte: startOfDayUtc, lte: endOfDayUtc },
      },
      orderBy: { startedAt: "asc" },
    });

    const meetings = meetingsList.map((m) => ({
      id: m.id,
      title: m.title,
      durationSec: m.durationSec,
      meetingType: m.meetingType,
    }));

    // 5. Fetch blockers active or created on this date
    const blockersList = await prisma.blocker.findMany({
      where: {
        userId,
        OR: [
          { status: { in: [BlockerStatus.OPEN, BlockerStatus.IN_PROGRESS] } },
          { startedAt: { gte: startOfDayUtc, lte: endOfDayUtc } },
        ],
      },
      orderBy: { startedAt: "desc" },
    });

    const blockers = blockersList.map((b) => ({
      id: b.id,
      title: b.title,
      priority: b.priority,
      status: b.status,
      waitingFor: b.waitingFor,
    }));

    // 6. Fetch achievements on this date
    const achievementsList = await prisma.achievement.findMany({
      where: {
        userId,
        date: { gte: startOfDayUtc, lte: endOfDayUtc },
      },
      orderBy: { date: "desc" },
    });

    const achievements = achievementsList.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      category: a.category,
    }));

    // 7. Deterministically calculate recommended next steps based on actual pending work
    const nextStepsList: string[] = [];
    if (inProgress.length > 0) {
      nextStepsList.push(`Continue work on: ${inProgress.map((ip) => ip.description).join(", ")}`);
    }
    const criticalPending = pendingTasksList.filter((t) => t.priority === "CRITICAL" || t.priority === "HIGH");
    if (criticalPending.length > 0) {
      nextStepsList.push(`Prioritize high-priority tasks: ${criticalPending.map((t) => t.title).join(", ")}`);
    } else if (pendingTasksList.length > 0) {
      nextStepsList.push(`Pick up next pending item: ${pendingTasksList[0].title}`);
    }
    const openBlockers = blockersList.filter((b) => b.status === BlockerStatus.OPEN);
    if (openBlockers.length > 0) {
      nextStepsList.push(`Follow up on unresolved blocker: ${openBlockers[0].title} (${openBlockers[0].waitingFor || "external dependency"})`);
    }

    const recommendedNextSteps = nextStepsList.length > 0 ? nextStepsList.join("\n") : "Plan tomorrow's sprint items and review backlog.";

    return {
      workDate,
      startedAt,
      endedAt,
      totalSessionSec,
      totalBreakSec,
      netWorkSec,
      completedWork,
      inProgress,
      pendingTasks,
      meetings,
      blockers,
      achievements,
      recommendedNextSteps,
    };
  }

  /**
   * Deterministically aggregate a weekly report
   */
  static async generateWeeklyReport(userId: string, weekStartDate: string) {
    const start = parseISO(weekStartDate);
    const end = endOfWeek(start, { weekStartsOn: 1 });
    const weekEndDate = format(end, "yyyy-MM-dd");

    const dailySessions = await prisma.workSession.findMany({
      where: {
        userId,
        workDate: { gte: weekStartDate, lte: weekEndDate },
      },
      include: { breaks: true },
    });

    const uniqueDays = new Set(dailySessions.map((s) => s.workDate));
    const workingDaysCount = uniqueDays.size;

    const totalWorkingSec = dailySessions.reduce((sum, s) => sum + s.totalDurationSec, 0);
    const totalBreakSec = dailySessions.reduce((sum, s) => sum + s.breakDurationSec, 0);
    const netWorkSec = dailySessions.reduce((sum, s) => sum + s.netWorkDurationSec, 0);

    // Completed tasks in this week
    const completedTasks = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: TaskStatus.COMPLETED,
        completedAt: { gte: start, lte: end },
      },
    });

    const pendingTasksCount = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED, TaskStatus.REVIEW] },
      },
    });

    // Work logs in this week
    const logs = await prisma.workLog.findMany({
      where: {
        userId,
        startedAt: { gte: start, lte: end },
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    // Category distribution
    const categoryDistribution: Record<string, number> = {};
    const projectsMap = new Map<string, { id: string; name: string; seconds: number }>();

    for (const log of logs) {
      categoryDistribution[log.category] = (categoryDistribution[log.category] || 0) + log.durationSec;
      const proj = projectsMap.get(log.projectId) || { id: log.projectId, name: log.project.name, seconds: 0 };
      proj.seconds += log.durationSec;
      projectsMap.set(log.projectId, proj);
    }

    // Meetings
    const meetings = await prisma.meeting.findMany({
      where: {
        userId,
        startedAt: { gte: start, lte: end },
      },
    });

    // Blockers
    const blockers = await prisma.blocker.findMany({
      where: {
        userId,
        startedAt: { gte: start, lte: end },
      },
    });

    return {
      userId,
      weekStartDate,
      weekEndDate,
      totalWorkingSec,
      totalBreakSec,
      netWorkSec,
      workingDaysCount,
      completedTasksCount: completedTasks,
      pendingTasksCount,
      projectsJson: JSON.stringify(Array.from(projectsMap.values())),
      meetingsJson: JSON.stringify(meetings.map((m) => ({ title: m.title, durationSec: m.durationSec }))),
      blockersJson: JSON.stringify(blockers.map((b) => ({ title: b.title, status: b.status }))),
      categoryDistributionJson: JSON.stringify(categoryDistribution),
      accomplishments: `Logged ${formatDurationHuman(netWorkSec)} of net work across ${workingDaysCount} working days. Completed ${completedTasks} tasks.`,
      plannedNextWeek: `Address ${pendingTasksCount} pending tasks and ongoing sprint priorities.`,
    };
  }

  /**
   * Deterministically aggregate a monthly report
   */
  static async generateMonthlyReport(userId: string, year: number, month: number) {
    const startDateStr = `${year}-${month.toString().padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDateStr = `${year}-${month.toString().padStart(2, "0")}-${lastDay.toString().padStart(2, "0")}`;

    const start = new Date(`${startDateStr}T00:00:00.000Z`);
    const end = new Date(`${endDateStr}T23:59:59.999Z`);

    const sessions = await prisma.workSession.findMany({
      where: {
        userId,
        workDate: { gte: startDateStr, lte: endDateStr },
      },
    });

    const uniqueDays = new Set(sessions.map((s) => s.workDate));
    const workingDaysCount = uniqueDays.size;
    const totalWorkingSec = sessions.reduce((sum, s) => sum + s.netWorkDurationSec, 0);
    const avgDailyHours = workingDaysCount > 0 ? Math.round((totalWorkingSec / 3600 / workingDaysCount) * 10) / 10 : 0;

    const completedTasksCount = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: TaskStatus.COMPLETED,
        completedAt: { gte: start, lte: end },
      },
    });

    const carriedOverCount = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED] },
      },
    });

    const logs = await prisma.workLog.findMany({
      where: {
        userId,
        startedAt: { gte: start, lte: end },
      },
      include: { project: true },
    });

    const categoryDistribution: Record<string, number> = {};
    const projectsMap = new Map<string, { id: string; name: string; seconds: number }>();
    for (const log of logs) {
      categoryDistribution[log.category] = (categoryDistribution[log.category] || 0) + log.durationSec;
      const proj = projectsMap.get(log.projectId) || { id: log.projectId, name: log.project.name, seconds: 0 };
      proj.seconds += log.durationSec;
      projectsMap.set(log.projectId, proj);
    }

    const meetings = await prisma.meeting.findMany({
      where: { userId, startedAt: { gte: start, lte: end } },
    });
    const meetingSec = meetings.reduce((sum, m) => sum + m.durationSec, 0);

    const blockerCount = await prisma.blocker.count({
      where: { userId, startedAt: { gte: start, lte: end } },
    });

    return {
      userId,
      year,
      month,
      totalWorkingSec,
      avgDailyHours,
      workingDaysCount,
      completedTasksCount,
      carriedOverCount,
      projectsJson: JSON.stringify(Array.from(projectsMap.values())),
      categoryDistributionJson: JSON.stringify(categoryDistribution),
      meetingSec,
      blockerCount,
      accomplishments: `Total work: ${formatDurationHuman(totalWorkingSec)} across ${workingDaysCount} active days with ${completedTasksCount} tasks closed.`,
      trendsNotes: `Averaged ${avgDailyHours} hours per active working day.`,
    };
  }
}
