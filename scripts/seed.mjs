import { PrismaClient, Role, WorkLocation, ProjectStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking AECS TRACKER database initialization...");

  // Check if Samshad user already exists
  const existingUser = await prisma.user.findFirst({
    where: { email: "samshad@aecstracker.internal" },
  });

  if (existingUser) {
    console.log("Database already initialized with Samshad account. Skipping seed.");
    return;
  }

  console.log("Initializing database with clean Samshad and Manager accounts...");

  // Hash passwords
  const samshadPasswordHash = await bcrypt.hash("SamshadPassword123!", 10);
  const managerPasswordHash = await bcrypt.hash("ManagerPassword123!", 10);

  // 1. Create Engineering Team
  let team = await prisma.team.findFirst({ where: { name: "Engineering Team" } });
  if (!team) {
    team = await prisma.team.create({
      data: {
        name: "Engineering Team",
        description: "Product development, architecture, and engineering delivery.",
      },
    });
  }

  // 2. Create Manager User
  let manager = await prisma.user.findFirst({ where: { email: "manager@aecstracker.internal" } });
  if (!manager) {
    manager = await prisma.user.create({
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
  }

  // 3. Create Samshad User (Lead Engineer & Admin access)
  const samshad = await prisma.user.create({
    data: {
      name: "Samshad",
      email: "samshad@aecstracker.internal",
      passwordHash: samshadPasswordHash,
      employeeId: "AECS-ENG-001",
      jobTitle: "Software Engineer",
      department: "Engineering",
      workLocation: WorkLocation.REMOTE,
      role: Role.ADMIN, // Admin so Samshad has full access across all platform modules
      timezone: "America/New_York",
      workingHoursPerDay: 8.0,
      managerId: manager.id,
      teamId: team.id,
    },
  });

  // 4. Create clean initial Project
  let project = await prisma.project.findFirst({ where: { projectKey: "AECS" } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: "AECS Platform",
        projectKey: "AECS",
        description: "Core software engineering and feature delivery.",
        status: ProjectStatus.ACTIVE,
      },
    });

    await prisma.projectMember.createMany({
      data: [
        { projectId: project.id, userId: samshad.id, role: "LEAD" },
        { projectId: project.id, userId: manager.id, role: "MANAGER" },
      ],
    });
  }

  console.log("Database initialized successfully:");
  console.log("- User: Samshad (samshad@aecstracker.internal / SamshadPassword123!)");
  console.log("- User: Manager (manager@aecstracker.internal / ManagerPassword123!)");
  console.log("- Team: Engineering Team");
  console.log("- Project: AECS Platform (AECS)");
}

main()
  .catch((e) => {
    console.error("Error executing seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
