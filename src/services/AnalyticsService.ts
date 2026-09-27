import { prisma } from "@/lib/prisma";
import { formatDurationHuman } from "@/lib/time";
import { subDays, format } from "date-fns";

export class AnalyticsService {
  /**
   * Get analytics aggregated on server for a user or team
   */
  static async getUserAnalytics(userId: string, days: number = 14) {
    const startDate = subDays(new Date(), days);
    const startDateStr = format(startDate, "yyyy-MM-dd");

    // 1. Working hours by day (from work sessions)
    const sessions = await prisma.workSession.findMany({
      where: {
        userId,
        workDate: { gte: startDateStr },
      },
      select: {
        workDate: true,
        totalDurationSec: true,
        breakDurationSec: true,
        netWorkDurationSec: true,
      },
      orderBy: { workDate: "asc" },
    });

    const dayMap = new Map<string, { date: string; netHours: number; breakHours: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const dStr = format(subDays(new Date(), i), "yyyy-MM-dd");
      dayMap.set(dStr, { date: dStr, netHours: 0, breakHours: 0 });
    }

    for (const s of sessions) {
      const entry = dayMap.get(s.workDate) || { date: s.workDate, netHours: 0, breakHours: 0 };
      entry.netHours += Math.round((s.netWorkDurationSec / 3600) * 10) / 10;
      entry.breakHours += Math.round((s.breakDurationSec / 3600) * 10) / 10;
      dayMap.set(s.workDate, entry);
    }

    const hoursByDay = Array.from(dayMap.values());

    // 2. Category distribution (from work logs)
    const workLogs = await prisma.workLog.findMany({
      where: {
        userId,
        startedAt: { gte: startDate },
      },
      select: {
        category: true,
        durationSec: true,
        projectId: true,
        project: { select: { name: true } },
      },
    });

    const categoryHoursMap: Record<string, number> = {};
    const projectHoursMap = new Map<string, { projectName: string; hours: number }>();

    let totalWorkSec = 0;
    for (const l of workLogs) {
      totalWorkSec += l.durationSec;
      const hours = Math.round((l.durationSec / 3600) * 10) / 10;
      categoryHoursMap[l.category] = (categoryHoursMap[l.category] || 0) + hours;

      const pEntry = projectHoursMap.get(l.projectId) || { projectName: l.project.name, hours: 0 };
      pEntry.hours += hours;
      projectHoursMap.set(l.projectId, pEntry);
    }

    // 3. Task Status distribution
    const taskCounts = await prisma.task.groupBy({
      by: ["status"],
      where: { assigneeId: userId },
      _count: { status: true },
    });

    // 4. Blocker stats
    const totalBlockers = await prisma.blocker.count({
      where: { userId, startedAt: { gte: startDate } },
    });
    const resolvedBlockers = await prisma.blocker.count({
      where: { userId, status: "RESOLVED", startedAt: { gte: startDate } },
    });

    // 5. Total meetings duration
    const meetings = await prisma.meeting.findMany({
      where: { userId, startedAt: { gte: startDate } },
      select: { durationSec: true },
    });
    const totalMeetingSec = meetings.reduce((sum, m) => sum + m.durationSec, 0);

    return {
      days,
      hoursByDay,
      categoryDistribution: Object.entries(categoryHoursMap).map(([category, hours]) => ({
        category,
        hours,
      })),
      projectTime: Array.from(projectHoursMap.values()),
      taskStatusDistribution: taskCounts.map((t) => ({
        status: t.status,
        count: t._count.status,
      })),
      totalWorkHours: Math.round((totalWorkSec / 3600) * 10) / 10,
      totalMeetingHours: Math.round((totalMeetingSec / 3600) * 10) / 10,
      blockerStats: {
        total: totalBlockers,
        resolved: resolvedBlockers,
        unresolved: totalBlockers - resolvedBlockers,
      },
    };
  }
}
