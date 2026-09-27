import { prisma } from "@/lib/prisma";
import { ProjectStatus, Priority } from "@prisma/client";
import { AuditLogService } from "./AuditLogService";

export interface CreateProjectInput {
  name: string;
  projectKey: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  ownerId?: string | null;
  startDate?: Date | null;
  targetEndDate?: Date | null;
}

export class ProjectService {
  static async createProject(input: CreateProjectInput, actorId?: string) {
    const existing = await prisma.project.findUnique({
      where: { projectKey: input.projectKey.toUpperCase() },
    });
    if (existing) {
      throw new Error(`Project key '${input.projectKey.toUpperCase()}' is already in use.`);
    }

    const project = await prisma.project.create({
      data: {
        name: input.name,
        projectKey: input.projectKey.toUpperCase(),
        description: input.description,
        status: input.status || ProjectStatus.ACTIVE,
        priority: input.priority || Priority.MEDIUM,
        ownerId: input.ownerId,
        startDate: input.startDate,
        targetEndDate: input.targetEndDate,
      },
      include: {
        owner: true,
      },
    });

    if (input.ownerId) {
      await prisma.projectMember.create({
        data: {
          projectId: project.id,
          userId: input.ownerId,
          role: "Lead",
        },
      });
    }

    await AuditLogService.log({
      userId: actorId || input.ownerId,
      action: "PROJECT_CREATE",
      entity: "Project",
      entityId: project.id,
      metadata: { name: project.name, key: project.projectKey },
    });

    return project;
  }

  static async listProjects() {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        _count: {
          select: {
            tasks: true,
            workLogs: true,
          },
        },
      },
    });
  }

  static async getProjectDetails(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: true,
        members: {
          include: { user: true },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
          include: {
            assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        workLogs: {
          take: 20,
          orderBy: { startedAt: "desc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        blockers: {
          orderBy: { startedAt: "desc" },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!project) throw new Error("Project not found");
    return project;
  }
}
