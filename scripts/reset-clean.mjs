import { PrismaClient, Role, WorkLocation, ProjectStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning all dummy data from AECS TRACKER database...");

  // 1. Delete all transactional records in dependency order
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

  console.log("All dummy data deleted successfully.");

  // 2. Hash passwords
  const samshadPasswordHash = await bcrypt.hash("SamshadPassword123!", 10);
  const managerPasswordHash = await bcrypt.hash("ManagerPassword123!", 10);

  // 3. Create Engineering Team
  const team = await prisma.team.create({
    data: {
      name: "Engineering Team",
      description: "Product development, architecture, and engineering delivery.",
    },
  });

  // 4. Create Manager User
  const manager = await prisma.user.create({
    data: {
      name: "Manager",
      email: "manager@aecstracker.internal",
      passwordHash: managerPasswordHash,
      employeeId: "AECS-MGR-001",
      jobTitle: "Engineering Manager",
      department: "Engineering",
      workLocation: WorkLocation.REMOTE,
      role: Role.MANAGER,
      timezone: "America/New_York",
      workingHoursPerDay: 8.0,
      teamId: team.id,
    },
  });

  // 5. Create Samshad User (Lead Engineer & Admin access)
  const samshad = await prisma.user.create({
    data: {
      name: "Samshad",
      email: "samshad@aecstracker.internal",
      passwordHash: samshadPasswordHash,
      employeeId: "AECS-ENG-001",
      jobTitle: "Software Engineer",
      department: "Engineering",
      workLocation: WorkLocation.REMOTE,
      role: Role.ADMIN, // Admin so Samshad has full superpowers across the entire platform
      timezone: "America/New_York",
      workingHoursPerDay: 8.0,
      managerId: manager.id,
      teamId: team.id,
    },
  });

  // 6. Create clean initial Project
  const project = await prisma.project.create({
    data: {
      name: "AECS Platform",
      projectKey: "AECS",
      description: "Core software engineering and feature delivery.",
      status: ProjectStatus.ACTIVE,
    },
  });

  // 7. Add Samshad and Manager to the Project
  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: samshad.id, role: "LEAD" },
      { projectId: project.id, userId: manager.id, role: "MANAGER" },
    ],
  });

  console.log("Database initialized with clean slate:");
  console.log("- User: Samshad (samshad@aecstracker.internal / SamshadPassword123!)");
  console.log("- User: Manager (manager@aecstracker.internal / ManagerPassword123!)");
  console.log("- Team: Engineering Team");
  console.log("- Project: AECS Platform (AECS)");
  console.log("- Work Sessions: 0");
  console.log("- Work Logs: 0");
  console.log("- Tasks: 0");
  console.log("- Blockers: 0");
  console.log("- Reports: 0");
}

main()
  .catch((e) => {
    console.error("Error executing clean script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
