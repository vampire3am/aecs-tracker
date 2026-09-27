import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocalDateString } from "@/lib/time";
import { Role, SessionStatus, TaskStatus, BlockerStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await requireAuth();

    // Check if user is Manager or Admin
    if (session.role !== Role.MANAGER && session.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Forbidden: Manager or Admin access required" }, { status: 403 });
    }

    // Determine authorized employees:
    // If Admin, all employees or managed teams
    // If Manager, subordinates or team members where leadId is this manager
    const managerUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        managedTeams: { select: { id: true, name: true } },
      },
    });

    const teamIds = managerUser?.managedTeams.map((t) => t.id) || [];

    const memberWhere = session.role === Role.ADMIN
      ? { id: { not: session.userId } }
      : {
          OR: [
            { managerId: session.userId },
            { teamId: { in: teamIds } },
          ],
        };

    const teamMembers = await prisma.user.findMany({
      where: memberWhere,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        jobTitle: true,
        department: true,
        workLocation: true,
        role: true,
        timezone: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    });

    const todayStr = getLocalDateString(new Date(), session.timezone);

    // Fetch live status, sessions, tasks, and blockers for each member
    const teamStatusList = await Promise.all(
      teamMembers.map(async (member) => {
        // Active session
        const activeSession = await prisma.workSession.findFirst({
          where: { userId: member.id, status: SessionStatus.ACTIVE },
          include: { breaks: true },
        });

        // Completed sessions today
        const todaySessions = await prisma.workSession.findMany({
          where: { userId: member.id, workDate: todayStr },
        });

        const todayNetSec = todaySessions.reduce((sum, s) => sum + s.netWorkDurationSec, 0);

        // Open blockers
        const blockers = await prisma.blocker.findMany({
          where: { userId: member.id, status: { in: [BlockerStatus.OPEN, BlockerStatus.IN_PROGRESS] } },
          select: { id: true, title: true, priority: true, waitingFor: true },
        });

        // Tasks assigned
        const pendingTasks = await prisma.task.count({
          where: { assigneeId: member.id, status: { not: TaskStatus.COMPLETED } },
        });

        const completedTasksToday = await prisma.task.count({
          where: {
            assigneeId: member.id,
            status: TaskStatus.COMPLETED,
            completedAt: { gte: new Date(`${todayStr}T00:00:00.000Z`) },
          },
        });

        // Current active task/project from running workLog
        const activeLog = await prisma.workLog.findFirst({
          where: { userId: member.id, isTimerRunning: true },
          include: { project: true, task: true },
        });

        let statusText: "NOT_STARTED" | "WORKING" | "ON_BREAK" | "COMPLETED" = "NOT_STARTED";
        if (activeSession) {
          const hasActiveBreak = activeSession.breaks.some((b) => !b.endedAt);
          statusText = hasActiveBreak ? "ON_BREAK" : "WORKING";
        } else if (todaySessions.length > 0) {
          statusText = "COMPLETED";
        }

        return {
          member,
          status: statusText,
          sessionStartedAt: activeSession?.startedAt || null,
          todayHours: Math.round((todayNetSec / 3600) * 10) / 10,
          pendingTasks,
          completedTasksToday,
          currentProject: activeLog?.project.name || null,
          currentTask: activeLog?.task?.title || null,
          openBlockers: blockers,
        };
      })
    );

    return NextResponse.json({ teamStatusList, managedTeams: managerUser?.managedTeams || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load team data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
