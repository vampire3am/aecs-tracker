import { PrismaClient, Role, WorkLocation, SessionStatus, BreakType, ProjectStatus, TaskStatus, Priority, WorkCategory, MeetingType, BlockerStatus, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AECS TRACKER database...");

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.notificationPreference.deleteMany({});
  await prisma.dailyReport.deleteMany({});
  await prisma.weeklyReport.deleteMany({});
  await prisma.monthlyReport.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.blocker.deleteMany({});
  await prisma.meeting.deleteMany({});
  await prisma.workLog.deleteMany({});
  await prisma.break.deleteMany({});
  await prisma.workSession.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.team.deleteMany({});

  const hashedAdminPw = await bcrypt.hash("AdminPassword123!", 10);
  const hashedMgrPw = await bcrypt.hash("ManagerPassword123!", 10);
  const hashedDevPw = await bcrypt.hash("DevPassword123!", 10);

  // 1. Teams
  const engineeringTeam = await prisma.team.create({
    data: {
      name: "Core Engineering",
      description: "Platform core backend, infrastructure, and frontend architecture team.",
    },
  });

  const securityTeam = await prisma.team.create({
    data: {
      name: "Security & Governance",
      description: "Information security, compliance, audit systems, and identity management.",
    },
  });

  // 2. Users
  const admin = await prisma.user.create({
    data: {
      name: "Sarah Jenkins",
      email: "admin@aecstracker.internal",
      passwordHash: hashedAdminPw,
      employeeId: "AECS-ADM-001",
      jobTitle: "VP of Engineering & Systems",
      department: "Engineering",
      workLocation: WorkLocation.OFFICE,
      role: Role.ADMIN,
      timezone: "America/New_York",
      workingHoursPerDay: 8.0,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "David Chen",
      email: "manager@aecstracker.internal",
      passwordHash: hashedMgrPw,
      employeeId: "AECS-MGR-001",
      jobTitle: "Engineering Manager",
      department: "Engineering",
      workLocation: WorkLocation.HYBRID,
      role: Role.MANAGER,
      timezone: "America/New_York",
      workingHoursPerDay: 8.0,
      teamId: engineeringTeam.id,
      managerId: admin.id,
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
  });

  // Set manager as lead of engineering team
  await prisma.team.update({
    where: { id: engineeringTeam.id },
    data: { leadId: manager.id },
  });

  const devAlex = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "dev@aecstracker.internal",
      passwordHash: hashedDevPw,
      employeeId: "AECS-DEV-001",
      jobTitle: "Senior Full-Stack Engineer",
      department: "Engineering",
      workLocation: WorkLocation.REMOTE,
      role: Role.EMPLOYEE,
      timezone: "America/New_York",
      workingHoursPerDay: 8.0,
      teamId: engineeringTeam.id,
      managerId: manager.id,
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    },
  });

  const devPriya = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "priya@aecstracker.internal",
      passwordHash: hashedDevPw,
      employeeId: "AECS-DEV-002",
      jobTitle: "Senior Systems Engineer",
      department: "Engineering",
      workLocation: WorkLocation.REMOTE,
      role: Role.EMPLOYEE,
      timezone: "Asia/Kolkata",
      workingHoursPerDay: 8.0,
      teamId: engineeringTeam.id,
      managerId: manager.id,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });

  // Notification preferences
  for (const u of [admin, manager, devAlex, devPriya]) {
    await prisma.notificationPreference.create({
      data: {
        userId: u.id,
        emailAlerts: true,
        sessionReminders: true,
        blockerAlerts: true,
        deadlineAlerts: true,
        weeklyReportReminders: true,
      },
    });
  }

  // 3. Projects
  const projCore = await prisma.project.create({
    data: {
      name: "AECS Core Platform",
      projectKey: "AECS",
      description: "Enterprise work-tracking, task lifecycle, and deterministic reporting backend and UI.",
      status: ProjectStatus.ACTIVE,
      priority: Priority.CRITICAL,
      ownerId: manager.id,
      startDate: new Date("2026-08-01"),
      targetEndDate: new Date("2026-12-31"),
    },
  });

  const projSec = await prisma.project.create({
    data: {
      name: "Security & Compliance Engine",
      projectKey: "SEC",
      description: "JWT session handling, role-based access control, cryptographic verification, and audit logs.",
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      ownerId: admin.id,
      startDate: new Date("2026-08-15"),
      targetEndDate: new Date("2026-11-30"),
    },
  });

  const projMetrics = await prisma.project.create({
    data: {
      name: "Realtime Telemetry & Metrics",
      projectKey: "RTM",
      description: "Server-side statistical aggregation, category breakdown, and team analytics.",
      status: ProjectStatus.PLANNING,
      priority: Priority.MEDIUM,
      ownerId: manager.id,
      startDate: new Date("2026-10-01"),
      targetEndDate: new Date("2027-01-31"),
    },
  });

  // Project Members
  for (const p of [projCore, projSec, projMetrics]) {
    await prisma.projectMember.createMany({
      data: [
        { projectId: p.id, userId: manager.id, role: "Manager" },
        { projectId: p.id, userId: devAlex.id, role: "Lead Developer" },
        { projectId: p.id, userId: devPriya.id, role: "Developer" },
      ],
    });
  }

  // 4. Tasks
  const task1 = await prisma.task.create({
    data: {
      title: "Implement JWT refresh-token rotation and auth middleware",
      description: "Secure cookie-based authentication with role validation across API route handlers.",
      projectId: projSec.id,
      assigneeId: devAlex.id,
      creatorId: manager.id,
      status: TaskStatus.COMPLETED,
      priority: Priority.CRITICAL,
      estimatedHours: 6.0,
      actualHours: 5.5,
      completedAt: new Date("2026-09-26T15:00:00Z"),
      gitBranch: "feature/sec-jwt-rotation",
      externalRef: "JIRA-SEC-104",
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Build deterministic daily report aggregation engine",
      description: "Compile work sessions, breaks, work logs, meetings, and blockers into structured reports.",
      projectId: projCore.id,
      assigneeId: devAlex.id,
      creatorId: manager.id,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      estimatedHours: 8.0,
      actualHours: 4.0,
      dueDate: new Date("2026-09-30"),
      gitBranch: "feature/report-aggregation",
      externalRef: "JIRA-AECS-212",
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Resolve database indexing and query latency on audit logs",
      description: "Add compound index on auditLog(userId, entity, createdAt) to speed up team analytics.",
      projectId: projSec.id,
      assigneeId: devAlex.id,
      creatorId: admin.id,
      status: TaskStatus.BLOCKED,
      priority: Priority.HIGH,
      estimatedHours: 4.0,
      actualHours: 1.5,
      dueDate: new Date("2026-09-29"),
      gitBranch: "fix/audit-indexing",
      externalRef: "JIRA-SEC-108",
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Setup PostgreSQL connection pooling and health check route",
      description: "Configure Prisma singleton and Docker/native postgres service scripts.",
      projectId: projCore.id,
      assigneeId: devPriya.id,
      creatorId: manager.id,
      status: TaskStatus.COMPLETED,
      priority: Priority.MEDIUM,
      estimatedHours: 4.0,
      actualHours: 3.5,
      completedAt: new Date("2026-09-26T18:00:00Z"),
      gitBranch: "chore/pg-connection-pooling",
    },
  });

  // 5. Work Sessions & Breaks for Alex (yesterday and today)
  const yesterdaySession = await prisma.workSession.create({
    data: {
      userId: devAlex.id,
      workDate: "2026-09-26",
      startedAt: new Date("2026-09-26T09:00:00Z"),
      endedAt: new Date("2026-09-26T17:30:00Z"),
      status: SessionStatus.COMPLETED,
      totalDurationSec: 30600, // 8.5 hours
      breakDurationSec: 3600,  // 1 hour
      netWorkDurationSec: 27000, // 7.5 hours
      notes: "Sprint work on authentication middleware and security audits.",
    },
  });

  await prisma.break.create({
    data: {
      workSessionId: yesterdaySession.id,
      userId: devAlex.id,
      breakType: BreakType.LUNCH,
      startedAt: new Date("2026-09-26T12:30:00Z"),
      endedAt: new Date("2026-09-26T13:30:00Z"),
      durationSec: 3600,
      notes: "Lunch break",
    },
  });

  // Work logs for yesterday
  await prisma.workLog.createMany({
    data: [
      {
        userId: devAlex.id,
        projectId: projSec.id,
        taskId: task1.id,
        workSessionId: yesterdaySession.id,
        category: WorkCategory.DEVELOPMENT,
        description: "Implemented JWT refresh-token rotation and updated authentication middleware.",
        startedAt: new Date("2026-09-26T09:15:00Z"),
        endedAt: new Date("2026-09-26T12:30:00Z"),
        durationSec: 11700,
        status: "COMPLETED",
      },
      {
        userId: devAlex.id,
        projectId: projSec.id,
        taskId: task1.id,
        workSessionId: yesterdaySession.id,
        category: WorkCategory.TESTING,
        description: "Wrote unit tests for token expiration, role guard validations, and invalid signatures.",
        startedAt: new Date("2026-09-26T13:30:00Z"),
        endedAt: new Date("2026-09-26T16:00:00Z"),
        durationSec: 9000,
        status: "COMPLETED",
      },
      {
        userId: devAlex.id,
        projectId: projCore.id,
        taskId: task2.id,
        workSessionId: yesterdaySession.id,
        category: WorkCategory.ARCHITECTURE,
        description: "Designed DeterministicReportService schema and aggregation flow.",
        startedAt: new Date("2026-09-26T16:00:00Z"),
        endedAt: new Date("2026-09-26T17:30:00Z"),
        durationSec: 5400,
        status: "COMPLETED",
      },
    ],
  });

  // Work Session for Today (ACTIVE session)
  const todaySession = await prisma.workSession.create({
    data: {
      userId: devAlex.id,
      workDate: "2026-09-27",
      startedAt: new Date("2026-09-27T09:15:00Z"),
      status: SessionStatus.ACTIVE,
      totalDurationSec: 14400, // 4h
      breakDurationSec: 1800,  // 30m
      netWorkDurationSec: 12600, // 3.5h
      notes: "Building report aggregation models and resolving database blockers.",
    },
  });

  await prisma.break.create({
    data: {
      workSessionId: todaySession.id,
      userId: devAlex.id,
      breakType: BreakType.SHORT_BREAK,
      startedAt: new Date("2026-09-27T11:00:00Z"),
      endedAt: new Date("2026-09-27T11:30:00Z"),
      durationSec: 1800,
      notes: "Coffee and stretch",
    },
  });

  // Today's work logs
  await prisma.workLog.createMany({
    data: [
      {
        userId: devAlex.id,
        projectId: projCore.id,
        taskId: task2.id,
        workSessionId: todaySession.id,
        category: WorkCategory.DEVELOPMENT,
        description: "Implemented DeterministicReportService methods for daily, weekly, and monthly calculations.",
        startedAt: new Date("2026-09-27T09:30:00Z"),
        endedAt: new Date("2026-09-27T11:00:00Z"),
        durationSec: 5400,
        status: "COMPLETED",
      },
      {
        userId: devAlex.id,
        projectId: projSec.id,
        taskId: task3.id,
        workSessionId: todaySession.id,
        category: WorkCategory.DEBUGGING,
        description: "Investigated database connection pool latency during high concurrency spikes.",
        startedAt: new Date("2026-09-27T11:30:00Z"),
        endedAt: new Date("2026-09-27T13:30:00Z"),
        durationSec: 7200,
        status: "COMPLETED",
      },
    ],
  });

  // 6. Meetings
  await prisma.meeting.create({
    data: {
      userId: devAlex.id,
      projectId: projCore.id,
      title: "Daily Engineering Standup",
      description: "Synchronized on sprint deliverables, reviewed PR #284, and highlighted staging credential block.",
      startedAt: new Date("2026-09-27T10:00:00Z"),
      endedAt: new Date("2026-09-27T10:30:00Z"),
      durationSec: 1800,
      meetingType: MeetingType.STANDUP,
      notes: "Action item: David Chen to follow up with DevOps for AWS staging IAM credentials.",
    },
  });

  await prisma.meeting.create({
    data: {
      userId: devAlex.id,
      projectId: projSec.id,
      title: "Backend Architecture Review",
      description: "Reviewed database indexing strategy and deterministic reporting architecture.",
      startedAt: new Date("2026-09-27T14:00:00Z"),
      endedAt: new Date("2026-09-27T14:45:00Z"),
      durationSec: 2700,
      meetingType: MeetingType.ARCHITECTURE,
      notes: "Unanimous sign-off on deterministic reporting design.",
    },
  });

  // 7. Blocker
  await prisma.blocker.create({
    data: {
      userId: devAlex.id,
      projectId: projSec.id,
      taskId: task3.id,
      title: "Waiting for staging database credentials & VPC peering access",
      description: "DevOps team must provision staging PostgreSQL credentials and grant security group access for integration test suite.",
      waitingFor: "DevOps Infrastructure Team",
      impact: "Integration tests cannot execute against staging PostgreSQL replica.",
      priority: Priority.HIGH,
      status: BlockerStatus.OPEN,
      startedAt: new Date("2026-09-27T11:45:00Z"),
    },
  });

  // 8. Achievements
  await prisma.achievement.create({
    data: {
      userId: devAlex.id,
      projectId: projSec.id,
      title: "Fixed authentication latency & optimized token verification",
      description: "Reduced average auth overhead from 180ms to 8ms by introducing stateless cryptographically signed tokens.",
      category: "Performance",
      date: new Date("2026-09-26"),
      notes: "Presented findings during backend architecture review.",
    },
  });

  // 9. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: devAlex.id,
        title: "Sprint Standup in 15 minutes",
        message: "Engineering Standup starting at 10:00 AM.",
        type: "MEETING",
        read: true,
      },
      {
        userId: devAlex.id,
        title: "Blocker Flagged on SEC-108",
        message: "Staging database credentials blocker has been escalated to DevOps.",
        type: "BLOCKER",
        read: false,
      },
    ],
  });

  // 10. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "SYSTEM_INITIALIZED",
        entity: "System",
        metadata: JSON.stringify({ version: "1.0.0", platform: "AECS TRACKER" }),
      },
      {
        userId: manager.id,
        action: "PROJECT_CREATE",
        entity: "Project",
        entityId: projCore.id,
        metadata: JSON.stringify({ key: "AECS", name: "AECS Core Platform" }),
      },
      {
        userId: devAlex.id,
        action: "SESSION_START",
        entity: "WorkSession",
        entityId: todaySession.id,
        metadata: JSON.stringify({ workDate: "2026-09-27" }),
      },
    ],
  });

  console.log("Database seeded successfully with demo accounts:");
  console.log("- Admin:    admin@aecstracker.internal    / AdminPassword123!");
  console.log("- Manager:  manager@aecstracker.internal  / ManagerPassword123!");
  console.log("- Employee: dev@aecstracker.internal      / DevPassword123!");
  console.log("- Employee: priya@aecstracker.internal    / DevPassword123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
